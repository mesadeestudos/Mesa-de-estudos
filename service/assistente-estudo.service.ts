import { buscarCicloService } from '@/service/ciclo.service';
import { calcularPrioridadesDisciplinas } from '@/service/prioridade.service';
import { buscarResumoQuestoes } from '@/service/questoes.service';
import { buscarAjustesPlano } from '@/service/ajuste-plano.service';
import { listarRevisoesInteligentes } from '@/service/revisoes-inteligentes.service';

type TipoAcao = 'REVISAO' | 'CICLO' | 'REFORCO' | 'QUESTOES' | 'DESCANSO' | 'CRIAR_CICLO' | 'AJUSTAR_PLANO';

interface ExplicacaoAssistente {
  principal: string;
  sinaisUsados: string[];
  alternativas: string[];
  consequencia: string;
}

function criarExplicacao(
  principal: string,
  sinaisUsados: string[],
  alternativas: string[],
  consequencia: string,
): ExplicacaoAssistente {
  return { principal, sinaisUsados, alternativas, consequencia };
}

export async function gerarAssistenteEstudo(idUsuario: bigint) {
  const [ciclo, prioridades, questoes, revisoes, ajustes] = await Promise.all([
    buscarCicloService(idUsuario),
    calcularPrioridadesDisciplinas(idUsuario),
    buscarResumoQuestoes(idUsuario),
    listarRevisoesInteligentes(idUsuario, 14),
    buscarAjustesPlano(idUsuario),
  ]);

  const revisoesPendentes = revisoes.filter(item => new Date(item.vencimento) <= new Date());
  const revisoesAtrasadas = revisoes.filter(item => item.atrasada);
  const piorQuestao = questoes.disciplinas.find(item => item.total >= 10 && item.percentual < 70) ?? null;
  const piorTopicoQuestao = questoes.diagnostico?.piorTopico ?? null;
  const quedaRecente = questoes.diagnostico?.quedaRecente ?? [];
  const prioridade = prioridades[0] ?? null;
  const precisaRebalancear = Boolean(
    prioridade && prioridade.score >= 62 && (
      prioridade.diasSemEstudar === null ||
      prioridade.diasSemEstudar >= 7 ||
      prioridade.percentual < 30
    ),
  );

  let tipo: TipoAcao = 'DESCANSO';
  let titulo = 'Tudo em ordem por enquanto';
  let mensagem = 'Quando houver ciclo, revisoes ou questoes registradas, eu organizo a proxima acao.';
  let destino = '/dashboard';
  let payload: unknown = {};
  let prioridadeScore = 0;
  let explicacao = criarExplicacao(
    'Ainda nao ha sinais suficientes para priorizar uma tarefa.',
    [],
    ['criar ciclo', 'registrar questoes', 'concluir uma sessao'],
    'Com mais registros, o sistema passa a decidir com mais precisao.',
  );

  if (!ciclo) {
    tipo = 'CRIAR_CICLO';
    titulo = 'Crie seu ciclo de estudos';
    mensagem = 'O ciclo e a base para eu organizar sua rotina automaticamente.';
    destino = '/ciclos';
    prioridadeScore = 100;
    explicacao = criarExplicacao(
      'Sem ciclo ativo, nao existe uma fila de estudo para organizar.',
      ['nenhum ciclo ativo encontrado'],
      ['escolher edital e cargo', 'definir horas por dia'],
      'Depois do ciclo criado, o sistema passa a sugerir estudo, revisao e questoes em ordem.',
    );
  } else if (ajustes.pausaAtiva) {
    tipo = 'DESCANSO';
    titulo = 'Plano pausado';
    mensagem = `Voce pausou o plano ate ${new Date(ajustes.pausaAtiva.dataFim).toLocaleDateString('pt-BR')}. Vou proteger revisoes e evitar conteudo novo.`;
    destino = '/agenda';
    payload = ajustes.pausaAtiva;
    prioridadeScore = 96;
    explicacao = criarExplicacao(
      'A pausa ativa indica impossibilidade de estudo no periodo informado.',
      ['pausa ativa na Agenda', `${revisoesAtrasadas.length} revisao(oes) atrasada(s)`],
      ['retomar apos a pausa', 'trocar pausa por meta temporaria se conseguir estudar pouco'],
      'Conteudo novo perde prioridade enquanto a pausa estiver ativa.',
    );
  } else if (revisoesAtrasadas.length > 0) {
    const revisao = revisoesAtrasadas[0];
    tipo = 'REVISAO';
    titulo = `Revisar ${revisao.disciplina}`;
    mensagem = `${revisoesAtrasadas.length} revisao(oes) atrasada(s). Vou priorizar memoria antes de avancar conteudo novo.`;
    destino = '/revisoes';
    payload = revisao;
    prioridadeScore = 92;
    explicacao = criarExplicacao(
      revisao.explicacao,
      [
        `${revisoesAtrasadas.length} revisao(oes) atrasada(s)`,
        `${revisoesPendentes.length} revisao(oes) pendente(s)`,
        revisao.motivo,
      ],
      ['fazer a revisao agora', 'marcar como dificil se estiver inseguro', 'remarcar o estudo novo'],
      'Ignorar revisoes atrasadas aumenta a chance de esquecer topicos ja estudados.',
    );
  } else if (piorQuestao && piorQuestao.percentual < 65) {
    tipo = 'QUESTOES';
    titulo = piorTopicoQuestao ? `Revisar teoria de ${piorTopicoQuestao.topico}` : `Treinar questoes de ${piorQuestao.disciplina}`;
    mensagem = piorTopicoQuestao
      ? `Seu aproveitamento em ${piorTopicoQuestao.topico} esta em ${piorTopicoQuestao.percentual}%. Revise a teoria antes da proxima bateria.`
      : `Seu aproveitamento em ${piorQuestao.disciplina} esta em ${piorQuestao.percentual}%. Uma bateria curta ajuda a calibrar o estudo.`;
    destino = '/questoes';
    payload = piorTopicoQuestao ?? piorQuestao;
    prioridadeScore = 84;
    explicacao = criarExplicacao(
      'Questoes indicam um ponto fraco com dados suficientes para mudar a prioridade.',
      [
        `${piorQuestao.percentual}% de aproveitamento`,
        `${piorQuestao.erros} erro(s) registrado(s)`,
        `${piorQuestao.total} questao(oes) feita(s)`,
        quedaRecente.length > 0 ? `${quedaRecente.length} bateria(s) recente(s) abaixo de 65%` : 'sem queda recente critica',
      ],
      ['registrar nova bateria', 'revisar topicos fracos', 'refazer questoes erradas'],
      'Avancar no ciclo sem corrigir esse ponto tende a repetir erros.',
    );
  } else if (prioridade && prioridade.score >= 45) {
    tipo = precisaRebalancear ? 'AJUSTAR_PLANO' : 'REFORCO';
    titulo = precisaRebalancear ? `Rebalancear ${prioridade.nome}` : `Reforcar ${prioridade.nome}`;
    mensagem = `Motivo: ${prioridade.motivos.slice(0, 2).join(' e ')}.`;
    destino = precisaRebalancear ? '/ciclos' : '/minha-mesa';
    payload = prioridade;
    prioridadeScore = Math.min(82, Math.round(prioridade.score));
    explicacao = criarExplicacao(
      'Essa disciplina acumulou sinais de atencao no historico recente.',
      prioridade.motivos,
      ['fazer sessao de reforco', 'rebalancear ciclo', 'reduzir meta temporaria se o ritmo caiu'],
      precisaRebalancear
        ? 'Sem rebalancear, uma disciplina critica pode ficar pouco frequente no ciclo.'
        : 'Um reforco agora reduz o risco de acumular atraso nessa disciplina.',
    );
  } else if (ajustes.metaTemporaria) {
    tipo = 'AJUSTAR_PLANO';
    titulo = 'Seguir meta temporaria';
    mensagem = `Sua meta esta reduzida para ${ajustes.metaTemporaria.horasPorDia}h/dia. Vou preservar revisoes e a sessao mais importante.`;
    destino = '/agenda';
    payload = ajustes.metaTemporaria;
    prioridadeScore = 70;
    explicacao = criarExplicacao(
      'A meta temporaria muda a capacidade diaria de estudo.',
      ['meta temporaria ativa', `${ajustes.metaTemporaria.horasPorDia}h por dia`],
      ['seguir plano reduzido', 'encerrar meta temporaria', 'pausar se nao puder estudar'],
      'O plano fica mais realista e evita acumular tarefas impossiveis.',
    );
  } else if (ciclo.hojeSlots[0]) {
    tipo = 'CICLO';
    titulo = `Estudar ${ciclo.hojeSlots[0].nome}`;
    mensagem = `${ciclo.metodoDetalhe?.titulo ?? 'Ciclo Inteligente'} ativo: a proxima sessao esta adequada para agora.`;
    destino = '/minha-mesa';
    payload = ciclo.hojeSlots[0];
    prioridadeScore = 58;
    explicacao = criarExplicacao(
      ciclo.metodoDetalhe?.explicacao ?? 'Nao ha revisao ou alerta critico acima do ciclo, entao a proxima sessao planejada e a melhor acao.',
      ['ciclo ativo', ciclo.metodoDetalhe?.titulo ?? 'Ciclo Inteligente', 'fila de hoje disponivel', 'sem alerta critico prioritario'],
      ['concluir sessao', 'pular com registro', 'remarcar se hoje nao der'],
      'Concluir a sessao atual avanca o ciclo e atualiza progresso automaticamente.',
    );
  }

  return {
    tipo,
    titulo,
    mensagem,
    destino,
    payload,
    prioridadeScore,
    explicacao,
    sinais: {
      revisoesPendentes: revisoesPendentes.length,
      revisoesAtrasadas: revisoesAtrasadas.length,
      disciplinasCriticas: prioridades.slice(0, 4),
      piorDesempenhoQuestoes: piorQuestao,
      piorTopicoQuestoes: piorTopicoQuestao,
      precisaRebalancear,
      metaTemporariaAtiva: Boolean(ajustes.metaTemporaria),
      pausaAtiva: Boolean(ajustes.pausaAtiva),
      metodoEstudo: ciclo?.metodo ?? null,
      metodoDetalhe: ciclo?.metodoDetalhe ?? null,
    },
    recomendacoes: [
      revisoesPendentes.length > 0 ? 'Resolva revisoes antes de avancar muitos conteudos novos.' : null,
      piorTopicoQuestao ? `Revise teoria de ${piorTopicoQuestao.topico}.` : null,
      prioridade ? `Mantenha ${prioridade.nome} em observacao.` : null,
      precisaRebalancear ? 'Considere rebalancear o ciclo para aumentar a frequencia da disciplina critica.' : null,
    ].filter((item): item is string => Boolean(item)),
  };
}
