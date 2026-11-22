import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

const ALLOWED_CATEGORIES = ["student_id", "concession_proof", "other"] as const;
const ALLOWED_MIME = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to view your documents." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("travel_documents")
    .select("id, document_name, category, file_path, file_size_bytes, mime_type, status, uploaded_at")
    .eq("user_id", authData.user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load documents." }, { status: 500 });
  }

  const documents = [];
  for (const document of data ?? []) {
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from("travel-documents")
      .createSignedUrl(document.file_path, 60 * 60);

    if (signedUrlError) {
      console.error("Travel document preview URL error:", signedUrlError.message);
      return NextResponse.json({ error: "Could not prepare document previews." }, { status: 500 });
    }

    documents.push({ ...document, file_url: signedUrl.signedUrl });
  }

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to upload documents." }, { status: 401 });
  }

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const documentName = (formData.get("documentName") as string | null)?.trim() ?? "";
  const category = (formData.get("category") as string | null)?.trim() ?? "";
  const file = formData.get("file") as File | null;

  if (!documentName || documentName.length > 120) {
    return NextResponse.json({ error: "Document name must be 1–120 characters." }, { status: 400 });
  }
  if (!ALLOWED_CATEGORIES.includes(category as typeof ALLOWED_CATEGORIES[number])) {
    return NextResponse.json({ error: "Invalid document category." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or PDF files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 5 MB." }, { status: 400 });
  }

  // Check document count limit (max 10 per user)
  const { count } = await supabase
    .from("travel_documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id);
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "You can store up to 10 documents." }, { status: 400 });
  }

  // Upload to private Supabase Storage bucket "travel-documents"
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `${authData.user.id}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("travel-documents")
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    // Storage bucket may not be configured — explain limitation
    if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
      return NextResponse.json(
        { error: "Secure file storage is not configured. Create a private Supabase Storage bucket named 'travel-documents' to enable uploads." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "File upload failed. Please try again." }, { status: 500 });
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from("travel-documents")
    .createSignedUrl(filePath, 60 * 60);

  if (signedUrlError) {
    console.error("Travel document preview URL error:", signedUrlError.message);
    const { error: cleanupError } = await supabase.storage
      .from("travel-documents")
      .remove([filePath]);
    if (cleanupError) {
      console.error("Travel document cleanup error:", cleanupError.message);
    }
    return NextResponse.json({ error: "Could not prepare a preview for the uploaded document." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("travel_documents")
    .insert({
      user_id: authData.user.id,
      document_name: documentName,
      category,
      file_path: filePath,
      file_size_bytes: file.size,
      mime_type: file.type,
      status: "uploaded",
    })
    .select("id, document_name, category, file_path, file_size_bytes, mime_type, status, uploaded_at")
    .single();

  if (error) {
    // Clean up orphaned file
    await supabase.storage.from("travel-documents").remove([filePath]);
    return NextResponse.json({ error: "Could not save document record." }, { status: 500 });
  }

  return NextResponse.json(
    { document: { ...data, file_url: signedUrl.signedUrl } },
    { status: 201 }
  );
}
