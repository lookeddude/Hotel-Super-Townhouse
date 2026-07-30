import { DashboardSidebar } from '@/features/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white border-r border-outline-variant"
        aria-label="Dashboard navigation"
      >
        <DashboardSidebar />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main
          id="dashboard-main"
          className="flex-1 p-6 lg:p-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
