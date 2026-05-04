import Link from 'next/link';

const passos = [
  {
    titulo: '1. Crie sua conta',
    texto: 'Cadastre-se, entre no sistema e conclua o onboarding inicial para liberar sua mesa de estudo.',
  },
  {
    titulo: '2. Escolha seu momento',
    texto: 'Informe se esta começando, atrasado, revisando, focado em questões ou com prova marcada.',
  },
  {
    titulo: '3. Monte o ciclo',
    texto: 'Selecione as disciplinas, ajuste dificuldade quando usar o modo personalizado e deixe o sistema distribuir a rotina.',
  },
  {
    titulo: '4. Execute pela Minha Mesa',
    texto: 'Siga a tarefa do momento, use a checklist de tópicos e registre como foi a sessão ao concluir.',
  },
  {
    titulo: '5. Registre questões e revisões',
    texto: 'Os erros, acertos e revisões alimentam o assistente e ajustam as prioridades do plano.',
  },
  {
    titulo: '6. Acompanhe a Agenda',
    texto: 'Veja revisões vencidas, meta semanal, previsão de conclusão e alertas antes da prova.',
  },
];

export default function TutoriaisPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_45%,#ecfdf5_100%)] px-6 py-8 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-black text-sky-600">Mesa de Estudos</Link>
          <div className="flex gap-3">
            <Link href="/ajuda" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">Ajuda</Link>
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Entrar</Link>
          </div>
        </nav>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Tutoriais</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Como usar o sistema do jeito certo</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
            Siga este roteiro antes de começar. A ideia é sair do cadastro até a primeira sessão sem ficar procurando onde clicar.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {passos.map((passo) => (
            <article key={passo.titulo} className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-200/50">
              <h2 className="text-base font-black text-slate-900">{passo.titulo}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{passo.texto}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] border border-sky-100 bg-sky-50/80 p-5">
          <h2 className="text-lg font-black text-slate-900">Primeira ação recomendada</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Depois de entender o fluxo, entre no sistema e crie seu primeiro plano de estudo.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cadastro" className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white">Criar conta</Link>
            <Link href="/login" className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-black text-sky-700">Já tenho conta</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
