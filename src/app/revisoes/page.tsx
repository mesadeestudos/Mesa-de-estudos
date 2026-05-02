'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  BookOpen, Calendar, CheckCircle2, LayoutDashboard, LineChart, LogOut,
  Menu, RefreshCw, Settings, User, Clock, AlertTriangle,
} from 'lucide-react';

interface RevisaoItem {
  idTopico: number;
  idDisciplina: number;
  disciplina: string;
  topico: string;
  intervaloDias: number;
  vencimento: string;
  atrasada: boolean;
  hoje: boolean;
}

interface RevisoesData {
  pendentes: RevisaoItem[];
  proximas: RevisaoItem[];
  resumo: { pendentes: number; atrasadas: number; proximas: number };
}

export default function RevisoesPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [registrando, setRegistrando] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<RevisoesData | null>(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/revisoes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível carregar suas revisões.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar suas revisões.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const concluirRevisao = async (idTopico: number) => {
    setRegistrando(idTopico);
    setErro('');
    try {
      const res = await fetch('/api/revisoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idTopico, duracaoMinutos: 20 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível registrar a revisão.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar a revisão.');
    } finally {
      setRegistrando(null);
    }
  };

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef9ff_46%,#ecfdf5_100%)] text-slate-600">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_28%)]" />
      <div className="relative flex h-full overflow-hidden">
        {sidebarAberta && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="min-h-0 grow overflow-y-auto px-3">
            <div className="px-1 pb-4 pt-5"><div className="rounded-[24px] border border-white/10 bg-white/95 px-4 py-3 shadow-xl shadow-sky-950/20"><img src="/logo_azul.png" alt="Logo" className="mx-auto h-20 w-auto" /></div></div>
            <nav className="space-y-1">
              <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral" onClick={() => router.push('/dashboard')} />
              <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" onClick={() => router.push('/minha-mesa')} />
              <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" onClick={() => router.push('/ciclos')} />
              <MenuItem icon={<LineChart size={18} />} label="Desempenho" onClick={() => router.push('/desempenho')} />
              <MenuItem icon={<Calendar size={18} />} label="Revisões" active onClick={() => setSidebarAberta(false)} />
              <MenuItem icon={<Settings size={18} />} label="Configurações" onClick={() => router.push('/configuracoes')} />
              <MenuItem icon={<User size={18} />} label="Perfil" onClick={() => router.push('/perfil')} />
            </nav>
          </div>
          <div className="p-4"><button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-red-500/15 hover:text-red-200"><div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-red-500/20"><LogOut size={18} /></div>Sair</button></div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <header className="mb-6 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setSidebarAberta(true)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
              <div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Memorização ativa</p><h1 className="truncate text-lg font-black text-slate-800">Revisões</h1></div>
            </div>
          </header>

          {carregando ? (
            <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Montando sua fila de revisões..." />
          ) : erro ? (
            <EmptyState icon={<AlertTriangle size={26} />} title={erro} />
          ) : dados ? (
            <div className="grid grid-cols-12 gap-5 pb-8">
              <Metric icon={<Calendar size={20} />} label="Pendentes" value={String(dados.resumo.pendentes)} tone="sky" />
              <Metric icon={<AlertTriangle size={20} />} label="Atrasadas" value={String(dados.resumo.atrasadas)} tone="amber" />
              <Metric icon={<Clock size={20} />} label="Próximas" value={String(dados.resumo.proximas)} tone="emerald" />

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Fila de hoje</p>
                <h2 className="mt-1 text-xl font-black">Revisões pendentes</h2>
                <div className="mt-5 space-y-3">
                  {dados.pendentes.length === 0 ? <p className="text-sm font-semibold text-slate-300">Nenhuma revisão pendente agora. Bom sinal.</p> : dados.pendentes.map(item => (
                    <RevisaoCard key={`${item.idTopico}-${item.intervaloDias}`} item={item} dark loading={registrando === item.idTopico} onConcluir={() => concluirRevisao(item.idTopico)} />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Próximos 14 dias</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">Revisões futuras</h2>
                <div className="mt-5 space-y-3">
                  {dados.proximas.length === 0 ? <p className="text-sm font-semibold text-slate-500">Conclua tópicos para gerar revisões futuras.</p> : dados.proximas.map(item => (
                    <RevisaoCard key={`${item.idTopico}-${item.intervaloDias}`} item={item} />
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${active ? 'bg-white/16 font-bold text-white ring-1 ring-white/15' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className={active ? 'rounded-xl bg-sky-400 p-1.5 text-white' : 'text-slate-400 group-hover:text-sky-200'}>{icon}</span><span className="truncate text-[13px]">{label}</span></button>;
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'sky' | 'amber' | 'emerald' }) {
  const colors = { sky: 'text-sky-500', amber: 'text-amber-500', emerald: 'text-emerald-500' }[tone];
  return <div className="col-span-4 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl"><div className={colors}>{icon}</div><p className="mt-3 text-2xl font-black text-slate-800">{value}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p></div>;
}

function RevisaoCard({ item, dark = false, loading = false, onConcluir }: { item: RevisaoItem; dark?: boolean; loading?: boolean; onConcluir?: () => void }) {
  return <div className={`rounded-2xl border p-4 ${dark ? 'border-white/10 bg-white/10' : 'border-slate-100 bg-white/80'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-800'}`}>{item.disciplina}</p><p className={`mt-1 line-clamp-2 text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{item.topico}</p><p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${item.atrasada ? 'text-amber-400' : dark ? 'text-sky-200' : 'text-sky-600'}`}>{item.intervaloDias} dias | {new Date(item.vencimento).toLocaleDateString('pt-BR')}</p></div>{onConcluir && <button onClick={onConcluir} disabled={loading} className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-[11px] font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">{loading ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Revisar</button>}</div></div>;
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/70 bg-white/75 text-center shadow-xl shadow-slate-200/60 backdrop-blur-xl"><div className="text-sky-500">{icon}</div><p className="text-sm font-black text-slate-500">{title}</p></div>;
}

