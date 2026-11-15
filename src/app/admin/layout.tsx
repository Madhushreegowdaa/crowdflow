
import AdminHeader from "@/components/admin/Adminheader";
import AdminNavigation from "@/components/admin/AdminNavigation";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <AdminHeader />

      <AdminNavigation />

      <main className="min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:ml-[250px]">
        <div className="mx-auto w-full max-w-[1500px]">
          {children}
        </div>
      </main>
    </div>
  );
}
