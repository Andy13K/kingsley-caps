import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';

export default function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-charcoal-950 md:h-screen md:overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40">
        <VendorSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col z-10">
            <VendorSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col min-w-0 md:h-screen md:min-h-0 md:pl-64">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-charcoal-900 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-300 hover:text-white"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gold flex items-center justify-center font-black text-white text-[10px]">KC</div>
            <span className="font-bold text-white text-sm">Vendor Panel</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
