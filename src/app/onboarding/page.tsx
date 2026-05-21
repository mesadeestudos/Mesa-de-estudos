'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';

interface OnboardingStatus {
  assinatura: { ativa: boolean; configuracaoPendente: boolean; motivo: string };
  temCiclo: boolean;
  ciclo: { hojeSlots?: Array<{ nome: string; minutosAlocados: number }> } | null;
  assistente: { titulo: string; mensagem: string; destino: string };
  diagnostico: { completo: boolean; estrategia: string };
  passos: { assinatura: boolean; diagnostico: boolean; ciclo: boolean; primeiraSessao: boolean };
}

type StepId = 'assinatura' | 'diagnostico' | 'ciclo' | 'primeiraSessao';

const PREVIEW_STATUS: OnboardingStatus = {
  assinatura: { ativa: true, configuracaoPendente: false, motivo: 'Acesso liberado.' },
  temCiclo: false,
  ciclo: null,
  assistente: {
    titulo: 'Crie seu ciclo de estudos',
    mensagem: 'Escolha o edital, o cargo e sua disponibilidade diária para liberar a primeira sessão.',
    destino: '/ciclos',
  },
  diagnostico: {
    completo: true,
    estrategia: 'Diagnóstico concluído. Agora falta transformar seu edital em uma rotina de estudos.',
  },
  passos: {
    assinatura: true,
    diagnostico: true,
    ciclo: false,
    primeiraSessao: false,
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [dados, setDados] = useState<OnboardingStatus | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    const preview = new URLSearchParams(window.location.search).get('preview');
    if (preview === 'primeiro-acesso') {
      setDados(PREVIEW_STATUS);
      setCarregando(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível carregar seu início.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar seu início.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const concluir = async () => {
    await fetch('/api/onboarding/concluir', { method: 'POST' });
    router.push('/minha-mesa');
  };

  const proximaRota = !dados?.passos.assinatura
    ? '/assinatura'
    : !dados.passos.diagnostico
      ? '/diagnostico'
      : !dados.passos.ciclo
        ? '/ciclos'
        : '/minha-mesa';

  const passos = useMemo(() => {
    if (!dados) return [];
    return [
      {
        id: 'assinatura' as StepId,
        icon: <CreditCard size={18} />,
        title: 'Acesso liberado',
        detail: dados.assinatura.ativa ? 'Sua conta está pronta para usar a plataforma.' : dados.assinatura.motivo,
        done: dados.passos.assinatura,
        route: '/assinatura',
        actionLabel: 'Ver planos',
      },
      {
        id: 'diagnostico' as StepId,
        icon: <Target size={18} />,
        title: 'Diagnóstico inicial',
        detail: dados.passos.diagnostico ? dados.diagnostico.estrategia : 'Informe seu nível, prazo e maior dificuldade.',
        done: dados.passos.diagnostico,
        route: '/diagnostico',
        actionLabel: 'Responder',
      },
      {
        id: 'ciclo' as StepId,
        icon: <RefreshCw size={18} />,
        title: 'Criar ciclo de estudos',
        detail: dados.temCiclo ? 'Seu ciclo já está pronto.' : 'Escolha edital, cargo e horas por dia para montar a rotina.',
        done: dados.passos.ciclo,
        route: '/ciclos',
        actionLabel: 'Criar ciclo',
      },
      {
        id: 'primeiraSessao' as StepId,
        icon: <PlayCircle size={18} />,
        title: 'Primeira sessão',
        detail: dados.ciclo?.hojeSlots?.[0]
          ? `Comece por ${dados.ciclo.hojeSlots[0].nome}.`
          : 'A mesa libera a primeira sessão assim que o ciclo estiver criado.',
        done: dados.passos.primeiraSessao,
        route: '/minha-mesa',
        actionLabel: 'Abrir mesa',
      },
    ];
  }, [dados]);

  const totalConcluido = passos.filter(step => step.done).length;
  const progresso = passos.length ? Math.round((totalConcluido / passos.length) * 100) : 0;
  const proximoPasso = passos.find(step => !step.done);

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_42%,#ecfdf5_100%)] px-4 py-5 text-slate-800 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-32 shrink-0 items-center justify-center rounded-[20px] border border-white/80 bg-white shadow-lg shadow-sky-100/50">
              <Image src="/logo_azul.png" alt="Mesa de Estudos" width={120} height={44} className="h-11 w-auto" priority />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Primeiro acesso</p>
              <h1 className="truncate text-lg font-black text-slate-800">Configurar minha mesa</h1>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="hidden rounded-2xl px-4 py-2 text-xs font-black text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
          >
            Ir para visão geral
          </button>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <section className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur-xl lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <Sparkles size={22} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Comece pelo essencial</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 lg:text-4xl">
                  Monte a base do seu estudo em poucos passos.
                </h2>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-slate-500">
                  Complete a configuração inicial para liberar o ciclo, a Minha Mesa e a orientação automática do sistema.
                </p>
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-4 lg:w-56">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Progresso</p>
                    <p className="mt-1 text-3xl font-black text-sky-700">{progresso}%</p>
                  </div>
                  <p className="text-xs font-black text-slate-500">{totalConcluido}/{passos.length}</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-sky-500 transition-all duration-700" style={{ width: `${progresso}%` }} />
                </div>
              </div>
            </div>

            {carregando ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-bold text-sky-700">
                <Loader2 className="animate-spin" size={18} /> Preparando sua configuração...
              </div>
            ) : erro ? (
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
                <AlertCircle className="mt-0.5 shrink-0" size={18} /> {erro}
              </div>
            ) : dados ? (
              <div className="mt-8 grid gap-3">
                {passos.map((step, index) => (
                  <StepCard
                    key={step.id}
                    index={index + 1}
                    icon={step.icon}
                    title={step.title}
                    detail={step.detail}
                    done={step.done}
                    active={proximoPasso?.id === step.id}
                    action={() => router.push(step.route)}
                    actionLabel={step.actionLabel}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <aside className="flex flex-col gap-5">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 text-white shadow-2xl shadow-sky-200/40">
              <div className="bg-[linear-gradient(135deg,rgba(14,165,233,0.24),rgba(16,185,129,0.16))] p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">Faça isso agora</p>
                <h2 className="mt-2 text-2xl font-black">
                  {dados?.assistente.titulo ?? proximoPasso?.title ?? 'Carregando orientação'}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-300">
                  {dados?.assistente.mensagem ?? 'Estou analisando seu próximo passo.'}
                </p>
                <button
                  onClick={() => dados?.passos.primeiraSessao ? concluir() : router.push(proximaRota)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-300 active:scale-[0.98]"
                >
                  {dados?.passos.primeiraSessao ? 'Começar estudo' : (proximoPasso?.actionLabel ?? 'Continuar configuração')}
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/78 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Depois do ciclo</p>
              <div className="mt-4 space-y-3">
                {[
                  { icon: <BookOpen size={16} />, title: 'Minha Mesa liberada', text: 'A próxima sessão aparece automaticamente.' },
                  { icon: <CheckCircle2 size={16} />, title: 'Revisões organizadas', text: 'O sistema passa a acompanhar o que precisa voltar.' },
                  { icon: <Target size={16} />, title: 'Rotina com foco', text: 'Seu edital, cargo e tempo diário viram uma sequência objetiva.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StepCard({
  index,
  icon,
  title,
  detail,
  done,
  active,
  action,
  actionLabel,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  detail: string;
  done: boolean;
  active: boolean;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[24px] border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
        active
          ? 'border-sky-200 bg-sky-50/80 shadow-lg shadow-sky-100/50'
          : done
            ? 'border-emerald-100 bg-white'
            : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            done
              ? 'bg-emerald-50 text-emerald-600'
              : active
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-200'
                : 'bg-slate-50 text-slate-400'
          }`}
        >
          {done ? <CheckCircle2 size={19} /> : icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ring-1 ring-slate-100">
              Passo {index}
            </span>
            {active && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-sky-700">
                Atual
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{detail}</p>
        </div>
      </div>

      {done ? (
        <span className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
          Concluído
        </span>
      ) : (
        <button
          onClick={action}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all active:scale-[0.98] ${
            active
              ? 'bg-slate-950 text-white shadow-lg shadow-slate-200 hover:bg-slate-800'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
