import prisma from '@/lib/prisma';
import { buscarCicloService } from '@/service/ciclo.service';
import { gerarAssistenteEstudo } from '@/service/assistente-estudo.service';
import { buscarResumoQuestoes } from '@/service/questoes.service';
import { buscarAjustesPlano } from '@/service/ajuste-plano.service';
import { listarRevisoesInteligentes } from '@/service/revisoes-inteligentes.service';

const inicioDoDia = (data: Date) => {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
};

const adicionarDias = (data: Date, dias: number) => {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
};

function dataKey(data: Date) {
  return data.toISOString().slice(0, 10);
}

interface SessaoSemanaRow {
  id_sessao: bigint;
  id_disciplina: number;
  disciplina_nome: string;
  duracao_minutos: number | null;
  status: string;
  inicio: Date;
}

export async function gerarAgendaService(idUsuario: bigint) {
  const hoje = inicioDoDia(new Date());
  const fimSemana = adicionarDias(hoje, 6);
  const ciclo = await buscarCicloService(idUsuario);

  const [assistente, questoes, ajustes, sessoesSemana, revisoesBase] = await Promise.all([
    gerarAssistenteEstudo(idUsuario),
    buscarResumoQuestoes(idUsuario),
    buscarAjustesPlano(idUsuario),
    prisma.$queryRaw<SessaoSemanaRow[]>`
      SELECT
        se.id_sessao,
        se.id_disciplina,
        d.nome AS disciplina_nome,
        se.duracao_minutos,
        se.status,
        se.inicio
      FROM planejamento.sessao_estudo se
      JOIN concurso.disciplina d ON d.id_disciplina = se.id_disciplina
      WHERE se.id_usuario = ${idUsuario}
        AND se.inicio >= ${hoje}
        AND se.inicio <= ${adicionarDias(fimSemana, 1)}
        AND se.fim IS NOT NULL
      ORDER BY se.inicio ASC
    `,
    listarRevisoesInteligentes(idUsuario, 14),
  ]);
  const revisoes = revisoesBase;

  const dias = Array.from({ length: 7 }, (_, indice) => {
    const data = adicionarDias(hoje, indice);
    const key = dataKey(data);
    const sessoes = sessoesSemana.filter(sessao => dataKey(sessao.inicio) === key);
    const minutos = sessoes.reduce((total, sessao) => total + (sessao.duracao_minutos ?? 0), 0);
    return {
      data: key,
      label: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      minutos,
      sessoes: sessoes.length,
      semEstudo: indice < 1 ? minutos === 0 : false,
      revisoes: revisoes.filter(revisao => dataKey(new Date(revisao.vencimento)) === key).length,
    };
  });

  const sessoesPrevistas = ciclo?.hojeSlots.map(slot => ({
    ordem: slot.ordem,
    disciplina: slot.nome,
    minutos: slot.minutosAlocados,
    tipo: slot.tipo,
  })) ?? [];

  const dataProva = ciclo?.idCiclo
    ? await prisma.ciclo_estudo.findUnique({
      where: { id_ciclo: BigInt(ciclo.idCiclo) },
      include: { plano_estudo: { include: { cargo: { include: { edital: true } } } } },
    })
    : null;

  const topicosRestantes = ciclo
    ? await prisma.topico.count({
      where: {
        disciplina: { ciclo_disciplina: { some: { id_ciclo: BigInt(ciclo.idCiclo) } } },
        topico_progresso: { none: { id_usuario: idUsuario, concluido: true } },
      },
    })
    : 0;

  const horasDiaEfetivas = ajustes.metaTemporaria?.horasPorDia ?? ciclo?.horasPorDia ?? 0;
  const mediaTopicosDia = Math.max(1, horasDiaEfetivas || 1);
  const diasConclusao = ciclo ? Math.ceil(topicosRestantes / mediaTopicosDia) : null;
  const conclusaoPrevista = diasConclusao !== null ? adicionarDias(hoje, diasConclusao).toISOString() : null;
  const atrasoAcumulado = {
    revisoesAtrasadas: revisoes.filter(item => item.atrasada).length,
    diasSemEstudoSemana: dias.filter(item => item.semEstudo).length,
    minutosAbaixoMeta: Math.max(0, (horasDiaEfetivas * 60 * 6) - dias.reduce((total, dia) => total + dia.minutos, 0)),
  };
  const impactoAjuste = ajustes.pausaAtiva
    ? `Plano pausado ate ${new Date(ajustes.pausaAtiva.dataFim).toLocaleDateString('pt-BR')}. Vou priorizar revisoes quando voce voltar.`
    : ajustes.metaTemporaria
      ? `Meta temporaria de ${ajustes.metaTemporaria.horasPorDia}h/dia ativa. A agenda reduz conteudo novo e protege revisoes.`
      : atrasoAcumulado.revisoesAtrasadas > 0
        ? 'Ha revisoes atrasadas. A agenda deve priorizar memoria antes de conteudo novo.'
        : 'Sem ajuste ativo. A agenda segue o ciclo e monitora atrasos.';
  const sugestoesAjuste = [
    atrasoAcumulado.revisoesAtrasadas >= 3 ? 'Crie um bloco curto so para revisoes antes de estudar conteudo novo.' : null,
    atrasoAcumulado.minutosAbaixoMeta >= 180 ? 'Considere uma meta temporaria menor para preservar consistencia.' : null,
    topicosRestantes > 0 && dataProva?.plano_estudo.cargo.edital?.data_prova && conclusaoPrevista && new Date(conclusaoPrevista) > dataProva.plano_estudo.cargo.edital.data_prova
      ? 'A previsao de conclusao passou da data da prova. Rebalanceie o ciclo ou aumente a meta.'
      : null,
    questoes.diagnostico?.piorDisciplina ? `Inclua questoes de ${questoes.diagnostico.piorDisciplina.disciplina} na semana.` : null,
  ].filter((item): item is string => Boolean(item));

  return {
    assistente,
    planoHoje: {
      sessoesPrevistas,
      revisoesVencidas: revisoes.filter(item => item.atrasada),
      revisoesHoje: revisoes.filter(item => item.hoje),
      questaoRecomendada: questoes.disciplinas[0] ?? null,
    },
    semana: {
      metaMinutos: horasDiaEfetivas * 60 * 6,
      minutosRegistrados: dias.reduce((total, dia) => total + dia.minutos, 0),
      dias,
      atrasoAcumulado,
    },
    ajustes,
    inteligencia: {
      impactoAjuste,
      sugestoesAjuste,
      atrasoAcumulado,
    },
    revisoes: {
      vencidas: revisoes.filter(item => item.atrasada),
      futuras: revisoes.filter(item => !item.atrasada).slice(0, 12),
    },
    edital: {
      cargo: ciclo?.cargoNome ?? null,
      concurso: ciclo?.concursoNome ?? null,
      banca: ciclo?.bancaSigla ?? null,
      dataProva: dataProva?.plano_estudo.cargo.edital?.data_prova?.toISOString() ?? null,
      conclusaoPrevista,
      topicosRestantes,
    },
  };
}
