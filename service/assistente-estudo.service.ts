import { buscarCicloService } from '@/service/ciclo.service';
import { calcularPrioridadesDisciplinas } from '@/service/prioridade.service';
import { buscarResumoQuestoes } from '@/service/questoes.service';
import { buscarAjustesPlano } from '@/service/ajuste-plano.service';
import prisma from '@/lib/prisma';

type TipoAcao = 'REVISAO' | 'CICLO' | 'REFORCO' | 'QUESTOES' | 'DESCANSO' | 'CRIAR_CICLO';

interface RevisaoPendente {
  idTopico: number;
  disciplina: string;
  topico: string;
  atrasada: boolean;
}

async function buscarRevisoesPendentes(idUsuario: bigint): Promise<RevisaoPendente[]> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const topicos = await prisma.topico_progresso.findMany({
    where: { id_usuario: idUsuario, concluido: true, data_conclusao: { not: null } },
    include: { topico: { include: { disciplina: true } } },
    orderBy: { data_conclusao: 'asc' },
    take: 60,
  });

  const revisoes = await prisma.sessao_estudo.findMany({
    where: {
      id_usuario: idUsuario,
      status: { in: ['REVISAO', 'REVISAO_FACIL', 'REVISAO_MEDIO', 'REVISAO_DIFICIL', 'REVISAO_ERREI'] },
    },
    select: { id_topico: true, inicio: true },
  });

  const pendentes: RevisaoPendente[] = [];
  for (const progresso of topicos) {
    if (!progresso.data_conclusao) continue;
    const vencimento = new Date(progresso.data_conclusao);
    vencimento.setDate(vencimento.getDate() + 1);
    vencimento.setHours(0, 0, 0, 0);
    if (vencimento > hoje) continue;
    const jaRevisado = revisoes.some(revisao =>
      revisao.id_topico === progresso.id_topico && revisao.inicio >= vencimento,
    );
    if (jaRevisado) continue;
    pendentes.push({
      idTopico: Number(progresso.id_topico),
      disciplina: progresso.topico.disciplina?.nome ?? 'Disciplina',
      topico: progresso.topico.descricao,
      atrasada: vencimento < hoje,
    });
  }
  return pendentes;
}

export async function gerarAssistenteEstudo(idUsuario: bigint) {
  const [ciclo, prioridades, questoes, revisoes, ajustes] = await Promise.all([
    buscarCicloService(idUsuario),
    calcularPrioridadesDisciplinas(idUsuario),
    buscarResumoQuestoes(idUsuario),
    buscarRevisoesPendentes(idUsuario),
    buscarAjustesPlano(idUsuario),
  ]);

  const piorQuestao = questoes.disciplinas[0] ?? null;
  const prioridade = prioridades[0] ?? null;
  let tipo: TipoAcao = 'DESCANSO';
  let titulo = 'Tudo em ordem por enquanto';
  let mensagem = 'Quando houver ciclo, revisões ou questões registradas, eu organizo a próxima ação.';
  let destino = '/dashboard';
  let payload: unknown = {};
  let explicacao = {
    principal: 'Ainda não há sinais suficientes para priorizar uma tarefa.',
    sinaisUsados: [] as string[],
    alternativas: [] as string[],
  };

  if (ajustes.pausaAtiva) {
    tipo = 'DESCANSO';
    titulo = 'Plano pausado';
    mensagem = `Você pausou o plano até ${new Date(ajustes.pausaAtiva.dataFim).toLocaleDateString('pt-BR')}.`;
    destino = '/agenda';
    payload = ajustes.pausaAtiva;
    explicacao = {
      principal: 'A pausa ativa indica impossibilidade de estudo no período informado.',
      sinaisUsados: ['pausa ativa na Agenda'],
      alternativas: ['retomar após a pausa', 'ajustar meta temporária se conseguir estudar pouco'],
    };
  } else if (!ciclo) {
    tipo = 'CRIAR_CICLO';
    titulo = 'Crie seu ciclo de estudos';
    mensagem = 'O ciclo é a base para eu organizar sua rotina automaticamente.';
    destino = '/ciclos';
    explicacao = {
      principal: 'Sem ciclo ativo, não existe uma fila de estudo para organizar.',
      sinaisUsados: ['nenhum ciclo ativo encontrado'],
      alternativas: ['criar ciclo de estudos', 'escolher edital e cargo'],
    };
  } else if (revisoes.some(item => item.atrasada)) {
    const revisao = revisoes.find(item => item.atrasada) ?? revisoes[0];
    tipo = 'REVISAO';
    titulo = `Revisar ${revisao.disciplina}`;
    mensagem = 'Há revisão atrasada. Vou priorizar memória antes de avançar conteúdo novo.';
    destino = '/revisoes';
    payload = revisao;
    explicacao = {
      principal: 'Revisões atrasadas têm prioridade porque protegem retenção antes de conteúdo novo.',
      sinaisUsados: [`${revisoes.filter(item => item.atrasada).length} revisão(ões) atrasada(s)`, `${revisoes.length} revisão(ões) pendente(s)`],
      alternativas: ['fazer a revisão agora', 'remarcar se estiver sem tempo'],
    };
  } else if (piorQuestao && piorQuestao.total >= 10 && piorQuestao.percentual < 65) {
    tipo = 'QUESTOES';
    titulo = `Treinar questões de ${piorQuestao.disciplina}`;
    mensagem = `Seu aproveitamento está em ${piorQuestao.percentual}%. Uma bateria curta ajuda a calibrar o estudo.`;
    destino = '/desempenho';
    payload = piorQuestao;
    explicacao = {
      principal: 'O aproveitamento em questões está baixo o suficiente para recomendar treino antes de avançar.',
      sinaisUsados: [`${piorQuestao.percentual}% de aproveitamento`, `${piorQuestao.erros} erro(s) registrados`, `${piorQuestao.total} questão(ões) feitas`],
      alternativas: ['registrar nova bateria', 'revisar tópicos fracos'],
    };
  } else if (prioridade && prioridade.score >= 45) {
    tipo = 'REFORCO';
    titulo = `Reforçar ${prioridade.nome}`;
    mensagem = `Motivo: ${prioridade.motivos.slice(0, 2).join(' e ')}.`;
    destino = '/minha-mesa';
    payload = prioridade;
    explicacao = {
      principal: 'Essa disciplina acumulou sinais de atenção no histórico recente.',
      sinaisUsados: prioridade.motivos,
      alternativas: ['fazer sessão de reforço', 'rebalancear ciclo', 'remarcar se hoje não for possível'],
    };
  } else if (ciclo.hojeSlots[0]) {
    tipo = 'CICLO';
    titulo = `Estudar ${ciclo.hojeSlots[0].nome}`;
    mensagem = 'A próxima sessão do ciclo está adequada para agora.';
    destino = '/minha-mesa';
    payload = ciclo.hojeSlots[0];
    explicacao = {
      principal: 'Não há revisão ou alerta crítico acima do ciclo, então a próxima sessão planejada é a melhor ação.',
      sinaisUsados: ['ciclo ativo', 'fila de hoje disponível', 'sem alerta crítico prioritário'],
      alternativas: ['concluir sessão', 'pular', 'remarcar'],
    };
  }

  return {
    tipo,
    titulo,
    mensagem,
    destino,
    payload,
    explicacao,
    sinais: {
      revisoesPendentes: revisoes.length,
      revisoesAtrasadas: revisoes.filter(item => item.atrasada).length,
      disciplinasCriticas: prioridades.slice(0, 4),
      piorDesempenhoQuestoes: piorQuestao,
    },
    recomendacoes: [
      revisoes.length > 0 ? 'Resolva revisões antes de avançar muitos conteúdos novos.' : null,
      prioridade ? `Mantenha ${prioridade.nome} em observação.` : null,
      piorQuestao ? `Use questões para validar ${piorQuestao.disciplina}.` : null,
    ].filter((item): item is string => Boolean(item)),
  };
}
