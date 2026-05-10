'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CreditCard, RefreshCw, BookOpen, PlayCircle, ChevronRight } from 'lucide-react';

interface OnboardingStatus {
  assinatura: { ativa: boolean; configuracaoPendente: boolean; motivo: string };
  temCiclo: boolean;
  ciclo: { hojeSlots?: Array<{ nome: string; minutosAlocados: number }> } | null;
  assistente: { titulo: string; mensagem: string; destino: string };
  diagnostico: { completo: boolean; estrategia: string };
  passos: { assinatura: boolean; diagnostico: boolean; ciclo: boolean; primeiraSessao: boolean };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [dados, setDados] = useState<OnboardingStatus | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
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

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_42%,#ecfdf5_100%)] px-4 py-8 text-slate-800">
      <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Primeiros passos</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Vamos colocar sua mesa para funcionar.</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Complete estes passos para sair do cadastro e chegar na primeira sessão de estudo sem precisar adivinhar o caminho.
          </p>

          {carregando ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-sky-50 p-4 text-sm font-bold text-sky-700">
              <RefreshCw className="animate-spin" size={18} /> Preparando seu fluxo...
            </div>
          ) : erro ? (
            <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{erro}</div>
          ) : dados ? (
            <div className="mt-8 space-y-3">
              <StepCard
                icon={<CreditCard size={18} />}
                title="Assinatura ativa"
                detail={dados.assinatura.ativa ? 'Seu acesso está liberado.' : dados.assinatura.motivo}
                done={dados.passos.assinatura}
                action={() => router.push('/assinatura')}
                actionLabel="Ver planos"
              />
              <StepCard
                icon={<BookOpen size={18} />}
                title="Diagnóstico inicial"
                detail={dados.passos.diagnostico ? dados.diagnostico.estrategia : 'Conte seu nível, prazo e maior dificuldade.'}
                done={dados.passos.diagnostico}
                action={() => router.push('/diagnostico')}
                actionLabel="Responder"
              />
              <StepCard
                icon={<BookOpen size={18} />}
                title="Criar ciclo"
                detail={dados.temCiclo ? 'Seu ciclo já está pronto.' : 'Escolha edital, cargo e horas por dia.'}
                done={dados.passos.ciclo}
                action={() => router.push('/ciclos')}
                actionLabel="Criar ciclo"
              />
              <StepCard
                icon={<PlayCircle size={18} />}
                title="Primeira sessão"
                detail={dados.ciclo?.hojeSlots?.[0] ? `Comece por ${dados.ciclo.hojeSlots[0].nome}.` : 'A sessão aparece assim que o ciclo estiver criado.'}
                done={dados.passos.primeiraSessao}
                action={() => router.push('/minha-mesa')}
                actionLabel="Abrir mesa"
              />
            </div>
          ) : null}
        </div>

        <aside className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-sky-200/40">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">Faça isso agora</p>
          <h2 className="mt-2 text-2xl font-black">{dados?.assistente.titulo ?? 'Carregando orientação'}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-300">{dados?.assistente.mensagem ?? 'Estou analisando seu próximo passo.'}</p>
          <button
            onClick={() => dados?.passos.primeiraSessao ? concluir() : router.push(proximaRota)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
          >
            {dados?.passos.primeiraSessao ? 'Começar estudo' : 'Continuar configuração'} <ChevronRight size={16} />
          </button>
        </aside>
      </section>
    </main>
  );
}

function StepCard({
  icon,
  title,
  detail,
  done,
  action,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  done: boolean;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2 ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
          {done ? <CheckCircle2 size={18} /> : icon}
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
        </div>
      </div>
      {!done && (
        <button onClick={action} className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
