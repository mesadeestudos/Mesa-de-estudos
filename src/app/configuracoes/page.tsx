'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import { AlertTriangle, BookOpen, Calendar, CalendarDays, CheckCircle2, ClipboardCheck, KeyRound, LayoutDashboard, LineChart, LogOut, Menu, RefreshCw, Save, Settings, Shield, User } from 'lucide-react';

interface ConfigData {
  email: string;
  emailVerificado: boolean;
  dataCriacao: string | null;
  sessoesAtivas: number;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dados, setDados] = useState<ConfigData>({ email: '', emailVerificado: false, dataCriacao: null, sessoesAtivas: 0 });
  const [senha, setSenha] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });

  useEffect(() => {
    fetch('/api/configuracoes')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Não foi possível carregar as configurações.');
        setDados(data);
      })
      .catch((error) => setErro(error instanceof Error ? error.message : 'Não foi possível carregar as configurações.'))
      .finally(() => setCarregando(false));
  }, []);

  const alterarSenha = async () => {
    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(senha),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível alterar sua senha.');
      setSenha({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setMensagem(data.message || 'Senha alterada com sucesso.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível alterar sua senha.');
    } finally {
      setSalvando(false);
    }
  };

  const encerrarSessoes = async () => {
    setEncerrando(true);
    setErro('');
    try {
      const res = await fetch('/api/configuracoes', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível encerrar as sessões.');
      deleteCookie('authorization');
      router.push('/login');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível encerrar as sessões.');
      setEncerrando(false);
    }
  };

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  return (
    <Shell router={router} sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} active="Configurações" onLogout={handleLogout}>
      <header className="mb-6 rounded-[28px] border border-white/70 bg-white/75 px-5 py-4 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Preferências e segurança</p>
        <h1 className="mt-1 text-xl font-black text-slate-800">Configurações</h1>
      </header>

      {carregando ? (
        <EmptyState text="Carregando configurações..." />
      ) : (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-500"><KeyRound size={22} /></div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Alterar senha</h2>
                <p className="text-sm font-semibold text-slate-400">Use uma senha forte para proteger seu histórico de estudos.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <PasswordField label="Senha atual" value={senha.senhaAtual} onChange={(value) => setSenha({ ...senha, senhaAtual: value })} />
              <PasswordField label="Nova senha" value={senha.novaSenha} onChange={(value) => setSenha({ ...senha, novaSenha: value })} />
              <PasswordField label="Confirmar nova senha" value={senha.confirmarSenha} onChange={(value) => setSenha({ ...senha, confirmarSenha: value })} />
            </div>

            {erro && <Alert tone="error" text={erro} />}
            {mensagem && <Alert tone="success" text={mensagem} />}

            <button onClick={alterarSenha} disabled={salvando} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-sky-600 disabled:opacity-60">
              {salvando ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Alterar senha
            </button>
          </section>

          <aside className="col-span-12 space-y-5 lg:col-span-5">
            <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-sky-200/50">
              <div className="mb-5 flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-3 text-emerald-300"><Shield size={22} /></div><div><h2 className="text-lg font-black">Segurança da conta</h2><p className="text-sm font-semibold text-slate-300">Resumo rápido da sua conta.</p></div></div>
              <InfoLine label="E-mail" value={dados.email} />
              <InfoLine label="Verificação" value={dados.emailVerificado ? 'Verificado' : 'Pendente'} />
              <InfoLine label="Sessões ativas" value={String(dados.sessoesAtivas)} />
              <InfoLine label="Conta criada" value={dados.dataCriacao ? new Date(dados.dataCriacao).toLocaleDateString('pt-BR') : 'Não informado'} />
            </div>

            <div className="rounded-[32px] border border-red-100 bg-red-50/80 p-6 shadow-xl shadow-red-100/40">
              <div className="mb-4 flex items-center gap-3 text-red-600"><AlertTriangle size={22} /><h2 className="text-lg font-black">Sessões</h2></div>
              <p className="text-sm font-semibold leading-relaxed text-red-500">Se notar algo estranho, encerre todas as sessões. Você será enviado para o login.</p>
              <button onClick={encerrarSessoes} disabled={encerrando} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-60">
                {encerrando ? <RefreshCw className="animate-spin" size={16} /> : <LogOut size={16} />}
                Encerrar sessões e sair
              </button>
            </div>
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
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span><input type="password" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-300" /></label>; }
function Alert({ tone, text }: { tone: 'error' | 'success'; text: string }) { return <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${tone === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{text}</p>; }
function InfoLine({ label, value }: { label: string; value: string }) { return <div className="mb-3 rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-sky-200">{label}</p><p className="mt-1 break-words text-sm font-black text-white">{value}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="flex h-[60vh] items-center justify-center rounded-[32px] border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60"><RefreshCw className="mr-3 animate-spin text-sky-500" size={20} /><p className="text-sm font-black text-slate-500">{text}</p></div>; }
