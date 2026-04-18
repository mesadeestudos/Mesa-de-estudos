'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, ChevronRight, Plus,
  Clock, Target, CheckCircle2, BookMarked, AlertCircle, Play
} from 'lucide-react';

export default function CiclosEstudo() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen w-full bg-[#F0F2F5]" />;
  }

  const handleLogout = () => {
    deleteCookie('authorization');
    router.push('/login');
  };

  const navegarPara = (rota: string) => {
    router.push(rota);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F0F2F5] text-[#475569] font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="p-0 flex flex-col items-center flex-grow overflow-y-auto min-h-0">
          <div className="w-40 h-40 flex items-center justify-center mb-0 flex-shrink-0">
            <img src="/logo_azul.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <nav className="space-y-1 w-full px-2">
            <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={false} onClick={() => navegarPara('/dashboard')} />
            <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" active={false} onClick={() => navegarPara('/dashboard')} />
            <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" active={true} onClick={() => {}} />
            <MenuItem icon={<LineChart size={18} />} label="Desempenho" active={false} onClick={() => navegarPara('/dashboard')} />
            <MenuItem icon={<Calendar size={18} />} label="Revisões" active={false} onClick={() => navegarPara('/dashboard')} />
            <MenuItem icon={<Settings size={18} />} label="Configurações" active={false} onClick={() => navegarPara('/dashboard')} />
            <MenuItem icon={<User size={18} />} label="Perfil de usuario" active={false} onClick={() => navegarPara('/dashboard')} />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 flex-shrink-0 bg-white">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full font-bold text-sm group">
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-red-100 transition-colors">
              <LogOut size={18} />
            </div>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto bg-[#F0F2F5]">

        {/* Header */}
        <header className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-sky-500/80">Ciclos de Estudo</h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />} label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Olá, João!</p>
                <div className="flex items-center gap-1 justify-end">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-medium italic">Ativo</span>
                </div>
              </div>
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer">
                <img src="https://github.com/shadcn.png" alt="User" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Estado vazio — nenhum ciclo criado */}
        <div className="flex flex-col gap-6">

          {/* Banner de boas-vindas ao módulo */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mb-4">
              <RefreshCw size={28} className="text-sky-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhum ciclo de estudos criado</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Um ciclo organiza suas disciplinas com base no peso de cada matéria no edital e nas suas horas disponíveis por dia.
            </p>
            <button
              onClick={() => navegarPara('/editais')}
              className="px-6 py-3 bg-[#3b82f6] hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              Criar meu ciclo de estudos
            </button>
          </div>

          {/* Como funciona */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Como funciona</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <EtapaCard
                numero="01"
                icon={<BookMarked size={20} />}
                titulo="Selecione o edital"
                descricao="Escolha o concurso que está estudando e informe suas horas diárias disponíveis."
              />
              <EtapaCard
                numero="02"
                icon={<Target size={20} />}
                titulo="Defina os pesos"
                descricao="Indique seu nível em cada disciplina. O sistema distribui o tempo automaticamente."
              />
              <EtapaCard
                numero="03"
                icon={<Play size={20} />}
                titulo="Estude com foco"
                descricao="O dashboard mostra qual disciplina estudar agora e acompanha seu progresso."
              />
            </div>
          </div>

          {/* O que você poderá ver aqui */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">O que você verá aqui após criar um ciclo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PreviewCard icon={<Clock size={18} />} titulo="Disciplina atual" descricao="Qual matéria está na vez do ciclo." />
              <PreviewCard icon={<CheckCircle2 size={18} />} titulo="Progresso" descricao="% de tópicos concluídos por disciplina." />
              <PreviewCard icon={<RefreshCw size={18} />} titulo="Rotação do ciclo" descricao="Ordem e tempo planejado de cada matéria." />
              <PreviewCard icon={<AlertCircle size={18} />} titulo="Alertas" descricao="Disciplinas com pouco tempo dedicado." />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* COMPONENTES DE SUPORTE */

function MenuItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group ${active ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
      <div className={`p-1.5 rounded-lg flex-shrink-0 transition-all ${active ? 'bg-sky-100' : 'bg-slate-50 group-hover:bg-white group-hover:text-sky-500'}`}>{icon}</div>
      <span className="text-[13px] truncate">{label}</span>
    </div>
  );
}

function HeaderIcon({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 group flex-shrink-0">
      <div className="text-slate-400 group-hover:text-sky-500 transition-colors">{icon}</div>
      <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function EtapaCard({ numero, icon, titulo, descricao }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-sky-400 tracking-widest">{numero}</span>
        <div className="text-sky-500">{icon}</div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">{titulo}</h4>
        <p className="text-xs text-slate-400 leading-snug">{descricao}</p>
      </div>
      <ChevronRight size={14} className="text-slate-200 self-end" />
    </div>
  );
}

function PreviewCard({ icon, titulo, descricao }: any) {
  return (
    <div className="bg-white rounded-xl p-4 border border-dashed border-slate-200 shadow-sm flex flex-col gap-2 opacity-60">
      <div className="text-slate-300">{icon}</div>
      <p className="text-xs font-bold text-slate-500">{titulo}</p>
      <p className="text-[10px] text-slate-400 italic">{descricao}</p>
    </div>
  );
}
