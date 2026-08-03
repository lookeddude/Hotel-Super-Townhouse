'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/features/admin/AdminSidebar';
import { AdminTopBar } from '@/features/admin/AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#f5f3f3]">

      {/* ── Desktop sidebar (always visible ≥1024px) ── */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-inverse-surface text-inverse-on-surface"
        aria-label="Admin navigation"
      >
        <AdminSidebar />
      </aside>

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-inverse-surface text-inverse-on-surface flex flex-col
          transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Admin navigation mobile"
        aria-hidden={!sidebarOpen}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main
          id="admin-main"
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
