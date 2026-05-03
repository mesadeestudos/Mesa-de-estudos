import prisma from '@/lib/prisma';
import { buscarCicloService } from '@/service/ciclo.service';
import { gerarAssistenteEstudo } from '@/service/assistente-estudo.service';
import { buscarResumoQuestoes } from '@/service/questoes.service';

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

  const [assistente, questoes, sessoesSemana, revisoesBase] = await Promise.all([
    gerarAssistenteEstudo(idUsuario),
    buscarResumoQuestoes(idUsuario),
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
    prisma.topico_progresso.findMany({
      where: { id_usuario: idUsuario, concluido: true, data_conclusao: { not: null } },
      include: { topico: { include: { disciplina: true } } },
      orderBy: { data_conclusao: 'asc' },
      take: 80,
    }),
  ]);

  const revisoesFeitas = await prisma.sessao_estudo.findMany({
    where: {
      id_usuario: idUsuario,
      status: { in: ['REVISAO', 'REVISAO_FACIL', 'REVISAO_MEDIO', 'REVISAO_DIFICIL', 'REVISAO_ERREI'] },
    },
    select: { id_topico: true, inicio: true },
  });

  const revisoes = revisoesBase.flatMap((item) => {
    if (!item.data_conclusao) return [];
    const vencimento = inicioDoDia(adicionarDias(item.data_conclusao, 1));
    if (vencimento > adicionarDias(hoje, 14)) return [];
    const feita = revisoesFeitas.some(revisao => revisao.id_topico === item.id_topico && revisao.inicio >= vencimento);
    if (feita) return [];
    return [{
      idTopico: Number(item.id_topico),
      disciplina: item.topico.disciplina?.nome ?? 'Disciplina',
      topico: item.topico.descricao,
      vencimento: vencimento.toISOString(),
      atrasada: vencimento < hoje,
      hoje: dataKey(vencimento) === dataKey(hoje),
    }];
  }).sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

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

  const mediaTopicosDia = Math.max(1, ciclo?.horasPorDia ?? 1);
  const diasConclusao = ciclo ? Math.ceil(topicosRestantes / mediaTopicosDia) : null;
  const conclusaoPrevista = diasConclusao !== null ? adicionarDias(hoje, diasConclusao).toISOString() : null;

  return {
    assistente,
    planoHoje: {
      sessoesPrevistas,
      revisoesVencidas: revisoes.filter(item => item.atrasada),
      revisoesHoje: revisoes.filter(item => item.hoje),
      questaoRecomendada: questoes.disciplinas[0] ?? null,
    },
    semana: {
      metaMinutos: (ciclo?.horasPorDia ?? 0) * 60 * 6,
      minutosRegistrados: dias.reduce((total, dia) => total + dia.minutos, 0),
      dias,
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
