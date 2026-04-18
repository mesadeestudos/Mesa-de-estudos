'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Clock, Target,
  TrendingUp, ChevronRight, Info, CheckCircle2
} from 'lucide-react';

export default function PainelEstudante() {
  const router = useRouter();
  const [temCiclo, setTemCiclo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('Dashboard');

  const handleLogout = () => {
    deleteCookie('authorization');
    router.push('/login');
  };

  // Correção de Hydration: Garante que o cliente só renderize após a montagem
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen w-full bg-[#F0F2F5]" />;
  }

  const navegarPara = (tela: string) => {
    setAbaAtiva(tela);
  };

  const concluirPassoCiclo = () => {
    router.push('/ciclos');
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F0F2F5] text-[#475569] font-sans">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="p-0 flex flex-col items-center flex-grow overflow-y-auto min-h-0">
          <div className="w-40 h-40 flex items-center justify-center mb-0 flex-shrink-0">
            <img src="/logo_azul.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <nav className="space-y-1 w-full px-2">
            <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={abaAtiva === 'Dashboard'} onClick={() => navegarPara('Dashboard')} />
            <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" active={abaAtiva === 'Minha Mesa'} onClick={() => navegarPara('Minha Mesa')} />
            <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" active={abaAtiva === 'Ciclos'} onClick={() => router.push('/ciclos')} />
            <MenuItem icon={<LineChart size={18} />} label="Desempenho" active={abaAtiva === 'Desempenho'} onClick={() => navegarPara('Desempenho')} />
            <MenuItem icon={<Calendar size={18} />} label="Revisões" active={abaAtiva === 'Revisões'} onClick={() => navegarPara('Revisões')} />
            <MenuItem icon={<Settings size={18} />} label="Configurações" active={abaAtiva === 'Config'} onClick={() => navegarPara('Config')} />
            <MenuItem icon={<User size={18} />} label="Perfil de usuario" active={abaAtiva === 'Perfil'} onClick={() => navegarPara('Perfil')} />
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
        
        <header className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-sky-500/80">Painel do Estudante</h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />} label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" onClick={() => navegarPara('Config')} />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Olá, João!</p>
                <div className="flex items-center gap-1 justify-end">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                   <span className="text-[10px] text-slate-400 font-medium italic">Ativo</span>
                </div>
              </div>
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer" onClick={() => navegarPara('Perfil')}>
                <img src="https://github.com/shadcn.png" alt="User" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Alerta Condicional Superior */}
        {!temCiclo && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex items-center justify-between shadow-sm border-l-4 border-l-sky-500 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <Info size={16} className="text-sky-500" />
              <p className="text-xs text-slate-600 font-medium">Crie seu plano de estudos para desbloquear as funções.</p>
            </div>
            <button onClick={concluirPassoCiclo} className="bg-[#3b82f6] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95">
              Criar agora
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 pb-8">
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-3xl leading-none">👋</span> Bem-vindo de volta, João!
                </h2>
                <p className="text-slate-400 text-xs italic ml-1">
                  {temCiclo ? "Seu desempenho atualizado hoje." : "Seu painel ainda está se preparando para mostrar seus resultados."}
                </p>
            </div>

            {/* Banner Central - Textos Originais */}
            <div className="bg-white rounded-2xl py-10 px-8 shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center transition-all duration-700">
               <div className="mb-6">
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Para começar, crie o seu ciclo de estudos.</h3>
                 <p className="text-slate-400 text-sm italic">É rápido, fácil e personalizado para o seu edital.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                 <FeatureItem icon={<Clock size={20} />} title="Organize seu tempo" description="Defina quantas horas por dia você pode estudar." />
                 <FeatureItem icon={<Target size={20} />} title="Foque no que importa" description="Disciplinas e pesos automáticos baseados no edital." />
                 <FeatureItem icon={<TrendingUp size={20} />} title="Acompanhe sua evolução" description="Dashboard, metas e revisões inteligentes." />
               </div>

               <button 
                onClick={concluirPassoCiclo} 
                className={`px-8 py-3 rounded-xl font-bold text-base shadow-md transition-all flex items-center gap-2 mb-3 transform hover:scale-105 active:scale-95 ${temCiclo ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-[#3b82f6] text-white shadow-blue-200'}`}
               >
                 {temCiclo ? <><CheckCircle2 size={18}/> Ciclo Criado!</> : <>Criar meu ciclo de estudos <ChevronRight size={18}/></>}
               </button>
               <button className="text-sky-600 font-semibold text-xs hover:underline">Explorar primeiro</button>
            </div>

            <h3 className="font-bold text-base mt-4 text-slate-800">O que você encontra aqui</h3>
            
            {/* Aumentei o gap de 4 para 6 e garanti o w-full */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
  <VisualCard 
    title="Tempo de estudo" 
    type="bars" 
    info="Acompanhe suas horas semanais e mantenha a consciência." 
    active={true} 
  />
  <VisualCard 
    title="Desempenho" 
    type="donut" 
    info="Visualize sua taxa de acerto por matéria estudada." 
    active={true} 
  />
  <VisualCard 
    title="Revisões" 
    type="calendar" 
    info="Não perca o tempo certo de revisar cada conteúdo." 
    active={true} 
  />
  <VisualCard 
    title="Minha Mesa" 
    type="list" 
    info="Seus materiais e anotações organizados em um só lugar." 
    active={true} 
  />
</div>
</div>

          {/* Barra de Progresso Lateral - Textos Originais */}
          <div className="hidden lg:flex col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col w-full h-fit sticky top-6">
               <h3 className="font-bold text-slate-800 mb-1 text-sm">Seu progresso de ativação</h3>
               <p className="text-slate-400 mb-6 text-xs italic">Complete os passos para aproveitar tudo que a Mesa de Estudos oferece.</p>
               <div className="space-y-5">
                  <CheckStep label="Conta criada" done />
                  <CheckStep label="Criar ciclo" active={!temCiclo} done={temCiclo} onClick={concluirPassoCiclo} />
                  <CheckStep label="Primeiro estudo" />
                  <CheckStep label="Primeira revisão" />
               </div>
               <div className="mt-8 pt-6 border-t border-slate-50">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                    <div className={`h-full bg-emerald-400 transition-all duration-1000 ${temCiclo ? 'w-[50%]' : 'w-[20%]'}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {temCiclo ? "50% concluído" : "20% concluído"}
                  </span>
               </div>
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

function FeatureItem({ icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
      <div className="text-sky-500 mb-2">{icon}</div>
      <h4 className="text-[11px] lg:text-[12px] font-bold text-slate-700 leading-tight">{title}</h4>
      <p className="text-[10px] text-slate-400 italic mt-1 leading-tight">{description}</p>
    </div>
  );
}

function CheckStep({ label, done = false, active = false, onClick }: any) {
  return (
    <div className={`flex items-center gap-3 ${onClick && !done ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={onClick}>
      {done ? <div className="bg-emerald-100 text-emerald-500 rounded-full p-0.5"><CheckCircle2 size={14} /></div> : <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${active ? 'border-sky-500 bg-sky-50 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-slate-200'}`} />}
      <span className={`text-[11px] font-bold transition-colors ${done || active ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function VisualCard({ title, type, info, active }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col shadow-sm h-full transition-all duration-500">
      <h4 className="text-[10px] lg:text-[11px] font-bold text-slate-700 mb-3 truncate uppercase tracking-wider">{title}</h4>
      <div className={`flex-1 min-h-[60px] flex items-center justify-center transition-all duration-1000 mb-4 ${active ? 'opacity-100 scale-110' : 'opacity-10 grayscale'}`}>
        {type === 'bars' && (
          <div className="flex items-end gap-1.5 h-10">
            {[40, 70, 50, 90, 60].map((h, i) => <div key={i} className={`w-2 rounded-t-sm ${active ? 'bg-sky-400' : 'bg-slate-500'}`} style={{ height: `${h}%` }} />)}
          </div>
        )}
        {type === 'donut' && <div className={`w-8 h-8 border-[5px] rounded-full border-r-transparent animate-spin-slow ${active ? 'border-orange-400' : 'border-slate-500'}`} />}
        {type === 'calendar' && <div className="grid grid-cols-3 gap-1">{[...Array(6)].map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${active ? 'bg-emerald-400' : 'bg-slate-500'}`} />)}</div>}
        {type === 'list' && <div className="flex flex-col gap-1.5 w-10"><div className={`h-1.5 w-full rounded-full ${active ? 'bg-sky-400' : 'bg-slate-500'}`} /><div className={`h-1.5 w-2/3 rounded-full ${active ? 'bg-sky-300' : 'bg-slate-500'}`} /></div>}
      </div>
      <p className="text-slate-400 text-[9px] italic leading-snug mb-4 line-clamp-2">{info}</p>
      <div className={`flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-tighter p-2 rounded-lg border transition-all ${active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
        <Info size={10} className="flex-shrink-0" /> 
        {active ? "Dados atualizados" : "Disponível após ciclo"}
      </div>
    </div>
  );
}