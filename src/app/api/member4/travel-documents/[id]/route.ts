import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Document ID required." }, { status: 400 });

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to delete documents." }, { status: 401 });
  }

  // Fetch to confirm ownership and get file path
  const { data: doc, error: fetchError } = await supabase
    .from("travel_documents")
    .select("id, file_path, user_id")
    .eq("id", id)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: "Could not find document." }, { status: 500 });
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  // Delete from storage (best-effort)
  await supabase.storage.from("travel-documents").remove([doc.file_path]);

  const { error: deleteError } = await supabase
    .from("travel_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id);

  if (deleteError) return NextResponse.json({ error: "Could not delete document." }, { status: 500 });

  return NextResponse.json({ success: true });
}
