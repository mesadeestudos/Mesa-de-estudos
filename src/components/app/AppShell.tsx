'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar, { type AppSection } from './Sidebar';

interface AppShellProps {
  active: AppSection;
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ active, title, eyebrow, actions, children }: AppShellProps) {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_42%,#ecfdf5_100%)] text-slate-600">
      <div className="relative flex h-full overflow-hidden">
        {sidebarAberta && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />
        )}
        <Sidebar
          active={active}
          mobileOpen={sidebarAberta}
          onNavigate={() => setSidebarAberta(false)}
          onLogout={handleLogout}
        />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <Header title={title} eyebrow={eyebrow} actions={actions} onMenuClick={() => setSidebarAberta(true)} />
          {children}
        </main>
      </div>
    </div>
  );
}
