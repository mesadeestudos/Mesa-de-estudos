import Link from 'next/link';

const perguntas = [
  {
    pergunta: 'O que devo fazer primeiro?',
    resposta: 'Crie sua conta, conclua o onboarding e monte um ciclo. Depois disso, a Minha Mesa passa a indicar a próxima ação.',
  },
  {
    pergunta: 'Onde informo a dificuldade das disciplinas?',
    resposta: 'Na criação do ciclo, ao usar o modo personalizado, cada disciplina pode receber dificuldade baixa, média ou alta.',
  },
  {
    pergunta: 'Como o sistema decide o que estudar?',
    resposta: 'Ele considera ciclo ativo, revisões atrasadas, desempenho em questões, progresso por disciplina, pausas e meta semanal.',
  },
  {
    pergunta: 'Por que registrar questões?',
    resposta: 'Porque acertos e erros ajudam o sistema a identificar pontos fracos e rebalancear a frequência das disciplinas.',
  },
  {
    pergunta: 'O que acontece quando concluo uma sessão?',
    resposta: 'O sistema registra tempo, tópico estudado, qualidade percebida e atualiza progresso, revisões e próximas recomendações.',
  },
  {
    pergunta: 'Como vejo se vou terminar antes da prova?',
    resposta: 'Na Agenda, a previsão de conclusão compara seu ritmo atual com a data da prova e mostra alerta quando houver risco.',
  },
];

export default function AjudaPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_45%,#ecfdf5_100%)] px-6 py-8 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-black text-sky-600">Mesa de Estudos</Link>
          <div className="flex gap-3">
            <Link href="/tutoriais" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">Tutoriais</Link>
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Entrar</Link>
          </div>
        </nav>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Ajuda</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Entenda como tudo funciona</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
            Respostas rápidas para o usuário entender o fluxo antes de entrar no sistema e começar a estudar.
          </p>
        </section>

        <section className="mt-6 grid gap-4">
          {perguntas.map((item) => (
            <article key={item.pergunta} className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-200/50">
              <h2 className="text-base font-black text-slate-900">{item.pergunta}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{item.resposta}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-5">
          <h2 className="text-lg font-black text-slate-900">Ainda ficou em dúvida?</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Abra os tutoriais para ver o passo a passo completo ou entre para configurar seu plano.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/tutoriais" className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white">Ver tutoriais</Link>
            <Link href="/cadastro" className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700">Criar conta</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
