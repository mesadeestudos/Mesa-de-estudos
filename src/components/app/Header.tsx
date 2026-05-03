'use client';

import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  onMenuClick: () => void;
}

export default function Header({ title, eyebrow = 'Mesa de Estudos', actions, onMenuClick }: HeaderProps) {
  return (
    <header className="mb-6 flex shrink-0 items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuClick} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">{eyebrow}</p>
          <h1 className="truncate text-lg font-black text-slate-800">{title}</h1>
        </div>
      </div>
      {actions}
    </header>
  );
}
