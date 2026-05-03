'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import { BookOpen, Calendar, CalendarDays, CheckCircle2, ClipboardCheck, LayoutDashboard, LineChart, LogOut, Menu, RefreshCw, Save, Settings, User } from 'lucide-react';

interface PerfilData {
  nomeCompleto: string;
  nomeUsuario: string;
  email: string;
  fotoUrl: string;
  emailVerificado: boolean;
  dataCriacao: string | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [perfil, setPerfil] = useState<PerfilData>({ nomeCompleto: '', nomeUsuario: '', email: '', fotoUrl: '', emailVerificado: false, dataCriacao: null });

  useEffect(() => {
    fetch('/api/perfil')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Não foi possível carregar seu perfil.');
        setPerfil(data);
      })
      .catch((error) => setErro(error instanceof Error ? error.message : 'Não foi possível carregar seu perfil.'))
      .finally(() => setCarregando(false));
  }, []);

  const salvarPerfil = async () => {
    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfil),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível salvar seu perfil.');
      setPerfil((atual) => ({ ...atual, ...data.perfil }));
      setMensagem('Perfil atualizado com sucesso.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  return (
    <Shell router={router} sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} active="Perfil" onLogout={handleLogout}>
      <header className="mb-6 rounded-[28px] border border-white/70 bg-white/75 px-5 py-4 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Conta do estudante</p>
        <h1 className="mt-1 text-xl font-black text-slate-800">Perfil</h1>
      </header>

      {carregando ? (
        <EmptyState text="Carregando seu perfil..." />
      ) : (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-sky-100 to-emerald-100 text-sky-600 ring-1 ring-white">
                {perfil.fotoUrl ? <img src={perfil.fotoUrl} alt="Foto do perfil" className="h-full w-full object-cover" /> : <User size={30} />}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Dados principais</h2>
                <p className="text-sm font-semibold text-slate-400">Essas informações ajudam a personalizar sua experiência.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo" value={perfil.nomeCompleto} onChange={(value) => setPerfil({ ...perfil, nomeCompleto: value })} />
              <Field label="Nome de usuário" value={perfil.nomeUsuario} onChange={(value) => setPerfil({ ...perfil, nomeUsuario: value })} placeholder="ex: joao_silva" />
              <Field label="E-mail" value={perfil.email} disabled onChange={() => {}} />
              <Field label="URL da foto" value={perfil.fotoUrl} onChange={(value) => setPerfil({ ...perfil, fotoUrl: value })} placeholder="https://..." />
            </div>

            {erro && <Alert tone="error" text={erro} />}
            {mensagem && <Alert tone="success" text={mensagem} />}

            <button onClick={salvarPerfil} disabled={salvando} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-sky-600 disabled:opacity-60">
              {salvando ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Salvar perfil
            </button>
          </section>

          <aside className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-sky-200/50 lg:col-span-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Status da conta</p>
            <div className="mt-5 space-y-3">
              <InfoLine label="E-mail" value={perfil.email} />
              <InfoLine label="Verificação" value={perfil.emailVerificado ? 'Verificado' : 'Pendente'} />
              <InfoLine label="Conta criada" value={perfil.dataCriacao ? new Date(perfil.dataCriacao).toLocaleDateString('pt-BR') : 'Não informado'} />
            </div>
            <button onClick={() => router.push('/configuracoes')} className="mt-6 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-800 transition hover:bg-sky-50">
              Abrir configurações
            </button>
          </aside>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, router, sidebarAberta, setSidebarAberta, active, onLogout }: { children: React.ReactNode; router: ReturnType<typeof useRouter>; sidebarAberta: boolean; setSidebarAberta: (open: boolean) => void; active: string; onLogout: () => void }) {
  return <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_42%,#ecfdf5_100%)] text-slate-600"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%)]" /><div className="relative flex h-full overflow-hidden">{sidebarAberta && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />}<aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}><div className="min-h-0 grow overflow-y-auto px-3"><div className="px-1 pb-4 pt-5"><div className="rounded-[24px] border border-white/10 bg-white/95 px-4 py-3 shadow-xl shadow-sky-950/20"><img src="/logo_azul.png" alt="Logo" className="mx-auto h-20 w-auto" /></div></div><nav className="space-y-1"><MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral" active={active === 'Visão Geral'} onClick={() => router.push('/dashboard')} /><MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" active={active === 'Minha Mesa'} onClick={() => router.push('/minha-mesa')} /><MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" active={active === 'Ciclos'} onClick={() => router.push('/ciclos')} /><MenuItem icon={<ClipboardCheck size={18} />} label="Questões" active={active === 'Questões'} onClick={() => router.push('/questoes')} /><MenuItem icon={<CalendarDays size={18} />} label="Agenda" active={active === 'Agenda'} onClick={() => router.push('/agenda')} /><MenuItem icon={<LineChart size={18} />} label="Desempenho" active={active === 'Desempenho'} onClick={() => router.push('/desempenho')} /><MenuItem icon={<Calendar size={18} />} label="Revisões" active={active === 'Revisões'} onClick={() => router.push('/revisoes')} /><MenuItem icon={<Settings size={18} />} label="Configurações" active={active === 'Configurações'} onClick={() => router.push('/configuracoes')} /><MenuItem icon={<User size={18} />} label="Perfil" active={active === 'Perfil'} onClick={() => router.push('/perfil')} /></nav></div><div className="p-4"><button onClick={onLogout} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-red-500/15 hover:text-red-200"><div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-red-500/20"><LogOut size={18} /></div>Sair</button></div></aside><main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6"><button onClick={() => setSidebarAberta(true)} className="mb-4 rounded-xl p-2 text-slate-500 hover:bg-white/70 lg:hidden"><Menu size={20} /></button>{children}</main></div></div>;
}

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${active ? 'bg-white/16 font-bold text-white ring-1 ring-white/15' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className={active ? 'rounded-xl bg-sky-400 p-1.5 text-white' : 'text-slate-400 group-hover:text-sky-200'}>{icon}</span><span className="truncate text-[13px]">{label}</span></button>; }
function Field({ label, value, onChange, disabled = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) { return <label className="block"><span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span><input value={value} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-300 disabled:bg-slate-50 disabled:text-slate-400" /></label>; }
function Alert({ tone, text }: { tone: 'error' | 'success'; text: string }) { return <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${tone === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{text}</p>; }
function InfoLine({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-sky-200">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="flex h-[60vh] items-center justify-center rounded-[32px] border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60"><RefreshCw className="mr-3 animate-spin text-sky-500" size={20} /><p className="text-sm font-black text-slate-500">{text}</p></div>; }
