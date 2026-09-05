import { buscarCicloService } from '@/service/ciclo.service';
import { calcularPrioridadesDisciplinas } from '@/service/prioridade.service';
import { buscarResumoQuestoes } from '@/service/questoes.service';
import { buscarAjustesPlano } from '@/service/ajuste-plano.service';
import { listarRevisoesInteligentes } from '@/service/revisoes-inteligentes.service';
import { buscarDiagnosticoInicial } from '@/service/diagnostico-inicial.service';
import { listarCadernoErros } from '@/service/caderno-erros.service';
import { listarSimulados } from '@/service/simulado.service';

type TipoAcao = 'REVISAO' | 'CICLO' | 'REFORCO' | 'QUESTOES' | 'ERROS' | 'SIMULADO' | 'DESCANSO' | 'CRIAR_CICLO' | 'AJUSTAR_PLANO';

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
  const [ciclo, prioridades, questoes, revisoes, ajustes, diagnosticoInicial, cadernoErros, simulados] = await Promise.all([
    buscarCicloService(idUsuario),
    calcularPrioridadesDisciplinas(idUsuario),
    buscarResumoQuestoes(idUsuario),
    listarRevisoesInteligentes(idUsuario, 14),
    buscarAjustesPlano(idUsuario),
    buscarDiagnosticoInicial(idUsuario),
    listarCadernoErros(idUsuario),
    listarSimulados(idUsuario),
  ]);

  const revisoesPendentes = revisoes.filter(item => new Date(item.vencimento) <= new Date());
  const revisoesAtrasadas = revisoes.filter(item => item.atrasada);
  const piorQuestao = questoes.disciplinas.find(item => item.total >= 10 && item.percentual < 70) ?? null;
  const piorTopicoQuestao = questoes.diagnostico?.piorTopico ?? null;
  const quedaRecente = questoes.diagnostico?.quedaRecente ?? [];
  const erroCritico = cadernoErros.resumo.topicoMaisCritico ?? null;
  const quedaSimulado = Boolean(simulados.analise?.quedaRecente);
  const metodoFoco = ciclo?.metodoDetalhe?.foco ?? null;
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
  let acaoPrimaria = 'Abrir painel';
  let narrativa = 'Estou aguardando mais dados para orientar o estudo com precisão.';
  let etapaPedagogica = 'DIAGNOSTICO';
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
    acaoPrimaria = diagnosticoInicial.completo ? 'Criar ciclo inteligente' : 'Responder diagnóstico';
    destino = diagnosticoInicial.completo ? '/ciclos' : '/diagnostico';
    narrativa = diagnosticoInicial.completo
      ? 'Seu diagnóstico já dá uma direção inicial. Agora falta criar o ciclo para transformar isso em rotina diária.'
      : 'Antes de montar a rotina, eu preciso entender seu nível, prazo, dificuldade principal e matérias mais sensíveis.';
    etapaPedagogica = 'CONFIGURACAO';
    explicacao = criarExplicacao(
      'Sem ciclo ativo, nao existe uma fila de estudo para organizar.',
      ['nenhum ciclo ativo encontrado'],
      ['escolher edital e cargo', 'definir horas por dia'],
      'Depois do ciclo criado, o sistema passa a sugerir estudo, revisao e questoes em ordem.',
    );
  } else if (!diagnosticoInicial.completo) {
    tipo = 'AJUSTAR_PLANO';
    titulo = 'Complete o diagnóstico inicial';
    mensagem = 'Com essas respostas eu ajusto ritmo, foco e recomendações para o seu momento.';
    destino = '/diagnostico';
    prioridadeScore = 98;
    acaoPrimaria = 'Responder diagnóstico';
    etapaPedagogica = 'DIAGNOSTICO';
    narrativa = 'Seu ciclo existe, mas a orientação ainda pode ficar mais pessoal. Responda o diagnóstico para eu calibrar a próxima ação.';
    explicacao = criarExplicacao(
      'Sem diagnóstico, o sistema usa apenas histórico de uso e perde contexto sobre prazo, nível e dificuldade principal.',
      ['diagnóstico inicial ausente'],
      ['informar nível atual', 'informar dificuldade principal', 'marcar matérias temidas'],
      'Depois disso, as recomendações passam a respeitar melhor seu perfil.',
    );
  } else if (ajustes.pausaAtiva) {
    tipo = 'DESCANSO';
    titulo = 'Plano pausado';
    mensagem = `Voce pausou o plano ate ${new Date(ajustes.pausaAtiva.dataFim).toLocaleDateString('pt-BR')}. Vou proteger revisoes e evitar conteudo novo.`;
    destino = '/agenda';
    payload = ajustes.pausaAtiva;
    prioridadeScore = 96;
    acaoPrimaria = 'Ver agenda';
    etapaPedagogica = 'DESCANSO';
    narrativa = `Hoje o melhor caminho é respeitar a pausa até ${new Date(ajustes.pausaAtiva.dataFim).toLocaleDateString('pt-BR')}. Quando voltar, eu priorizo revisões para recuperar memória sem empilhar conteúdo novo.`;
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
    acaoPrimaria = 'Fazer revisão';
    etapaPedagogica = 'REVISAO';
    narrativa = `Hoje o melhor caminho é revisar ${revisao.disciplina} antes de avançar conteúdo novo, porque essa revisão está atrasada e protege retenção.`;
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
  } else if (erroCritico && erroCritico.erros >= 4) {
    tipo = 'ERROS';
    titulo = `Corrigir erros de ${erroCritico.topico}`;
    mensagem = `Você acumulou ${erroCritico.erros} erro(s) nesse bloco. Corrigir agora evita repetir o mesmo padrão.`;
    destino = '/caderno-erros';
    payload = erroCritico;
    prioridadeScore = metodoFoco === 'QUESTOES' || metodoFoco === 'RETA_FINAL' ? 90 : 86;
    acaoPrimaria = 'Abrir caderno de erros';
    etapaPedagogica = 'CORRECAO_ERROS';
    narrativa = `Hoje o melhor caminho é corrigir ${erroCritico.topico} antes de fazer uma nova bateria, porque os erros se concentraram nesse tema.`;
    explicacao = criarExplicacao(
      erroCritico.recomendacao,
      [`${erroCritico.erros} erro(s)`, `${erroCritico.percentual}% de aproveitamento`, `motivo: ${erroCritico.motivoErro}`],
      ['revisar teoria do tópico', 'refazer questões erradas', 'registrar o motivo do erro'],
      'Repetir novas questões sem corrigir esse bloco tende a manter o mesmo erro.',
    );
  } else if (piorQuestao && (piorQuestao.percentual < 65 || metodoFoco === 'QUESTOES')) {
    tipo = 'QUESTOES';
    titulo = piorTopicoQuestao ? `Revisar teoria de ${piorTopicoQuestao.topico}` : `Treinar questoes de ${piorQuestao.disciplina}`;
    mensagem = piorTopicoQuestao
      ? `Seu aproveitamento em ${piorTopicoQuestao.topico} esta em ${piorTopicoQuestao.percentual}%. Revise a teoria antes da proxima bateria.`
      : `Seu aproveitamento em ${piorQuestao.disciplina} esta em ${piorQuestao.percentual}%. Uma bateria curta ajuda a calibrar o estudo.`;
    destino = '/questoes';
    payload = piorTopicoQuestao ?? piorQuestao;
    prioridadeScore = 84;
    acaoPrimaria = 'Registrar questões';
    etapaPedagogica = piorTopicoQuestao ? 'TEORIA' : 'QUESTOES';
    narrativa = piorTopicoQuestao
      ? `Hoje o melhor caminho é revisar a teoria de ${piorTopicoQuestao.topico}, porque as questões mostram aproveitamento baixo nesse ponto.`
      : `Hoje o melhor caminho é fazer uma bateria curta de ${piorQuestao.disciplina}, porque seu desempenho recente pede calibração.`;
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
  } else if (quedaSimulado) {
    tipo = 'SIMULADO';
    titulo = 'Fazer revisão pós-simulado';
    mensagem = simulados.analise.mensagem;
    destino = '/simulados';
    payload = simulados.analise;
    prioridadeScore = 83;
    acaoPrimaria = 'Analisar simulados';
    etapaPedagogica = 'SIMULADO';
    narrativa = 'Hoje o melhor caminho é revisar o último simulado antes de aumentar conteúdo novo, porque houve queda recente de desempenho.';
    explicacao = criarExplicacao(
      simulados.analise.mensagem,
      simulados.analise.sugestoes,
      ['revisar disciplinas fracas', 'refazer erros do simulado', 'rebalancear o ciclo'],
      'A revisão pós-simulado transforma nota baixa em ajuste de rota.',
    );
  } else if (prioridade && prioridade.score >= 45) {
    tipo = precisaRebalancear ? 'AJUSTAR_PLANO' : 'REFORCO';
    titulo = precisaRebalancear ? `Rebalancear ${prioridade.nome}` : `Reforcar ${prioridade.nome}`;
    mensagem = `Motivo: ${prioridade.motivos.slice(0, 2).join(' e ')}.`;
    destino = precisaRebalancear ? '/ciclos' : '/minha-mesa';
    payload = prioridade;
    prioridadeScore = Math.min(82, Math.round(prioridade.score));
    acaoPrimaria = precisaRebalancear ? 'Aplicar rebalanceamento' : 'Fazer reforço';
    etapaPedagogica = precisaRebalancear ? 'REBALANCEAMENTO' : 'REFORCO';
    narrativa = precisaRebalancear
      ? `Hoje o melhor caminho é rebalancear ${prioridade.nome}, porque essa disciplina acumulou sinais de risco no ciclo.`
      : `Hoje o melhor caminho é reforçar ${prioridade.nome}, porque ${prioridade.motivos.slice(0, 2).join(' e ')}.`;
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
    acaoPrimaria = 'Ver agenda';
    etapaPedagogica = 'AJUSTE_DE_RITMO';
    narrativa = `Hoje o melhor caminho é seguir a meta temporária de ${ajustes.metaTemporaria.horasPorDia}h/dia e escolher só o estudo de maior impacto.`;
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
    acaoPrimaria = 'Abrir Minha Mesa';
    etapaPedagogica = metodoFoco === 'REVISAO' ? 'REVISAO' : metodoFoco === 'QUESTOES' ? 'QUESTOES' : 'TEORIA';
    narrativa = `Hoje o melhor caminho é estudar ${ciclo.hojeSlots[0].nome}, porque não há revisão, erro ou simulado mais urgente acima do ciclo.`;
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
    acaoPrimaria,
    narrativa,
    etapaPedagogica,
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
      diagnosticoInicial,
      erroCritico,
      simulados: simulados.analise,
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
