import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { getCurrentSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentSession();

  return (
    <SessionProvider initialUser={currentUser}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Navbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
