import { AdminSidebar } from '@/features/admin/AdminSidebar';
import { AdminTopBar } from '@/features/admin/AdminTopBar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f5f3f3]">
      {/* Admin Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-inverse-surface text-inverse-on-surface"
        aria-label="Admin navigation"
      >
        <AdminSidebar />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main
          id="admin-main"
          className="flex-1 p-6 lg:p-8 overflow-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
