'use client';

import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  LogOut,
  RefreshCw,
  Settings,
  User,
} from 'lucide-react';
import MenuItem from './MenuItem';

export type AppSection =
  | 'dashboard'
  | 'minha-mesa'
  | 'ciclos'
  | 'questoes'
  | 'agenda'
  | 'desempenho'
  | 'revisoes'
  | 'sugestoes'
  | 'configuracoes'
  | 'perfil';

interface SidebarProps {
  active: AppSection;
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { id: 'minha-mesa', label: 'Minha Mesa', href: '/minha-mesa', icon: BookOpen },
  { id: 'ciclos', label: 'Ciclos de estudo', href: '/ciclos', icon: RefreshCw },
  { id: 'questoes', label: 'Questões', href: '/questoes', icon: ClipboardCheck },
  { id: 'agenda', label: 'Agenda', href: '/agenda', icon: CalendarDays },
  { id: 'desempenho', label: 'Desempenho', href: '/desempenho', icon: LineChart },
  { id: 'revisoes', label: 'Revisões', href: '/revisoes', icon: Calendar },
  { id: 'sugestoes', label: 'Sugestões', href: '/sugestoes', icon: Lightbulb },
  { id: 'configuracoes', label: 'Configurações', href: '/configuracoes', icon: Settings },
  { id: 'perfil', label: 'Perfil', href: '/perfil', icon: User },
] as const;

export default function Sidebar({ active, mobileOpen = false, onNavigate, onLogout }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="no-scrollbar min-h-0 grow overflow-y-auto px-3">
        <div className="px-1 pb-3 pt-4">
          <div className="rounded-[20px] border border-white/10 bg-white/95 px-4 py-2.5 shadow-xl shadow-sky-950/20">
            <img src="/logo_azul.png" alt="Logo" className="mx-auto h-16 w-auto" />
          </div>
        </div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <MenuItem
                key={item.id}
                icon={<Icon size={18} />}
                label={item.label}
                active={active === item.id}
                onClick={() => {
                  router.push(item.href);
                  onNavigate?.();
                }}
              />
            );
          })}
        </nav>
      </div>
      <div className="p-3">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-red-500/15 hover:text-red-200"
        >
          <div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-red-500/20">
            <LogOut size={18} />
          </div>
          Sair
        </button>
      </div>
    </aside>
  );
}
