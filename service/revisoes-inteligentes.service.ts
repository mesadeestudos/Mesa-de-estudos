import prisma from '@/lib/prisma';
import {
  calcularIntervalosAdaptativos,
  normalizarResultadoRevisao,
  STATUS_REVISAO,
} from '@/service/revisao-adaptativa.service';

export interface RevisaoInteligente {
  idTopico: number;
  idDisciplina: number | null;
  disciplina: string;
  topico: string;
  intervaloDias: number;
  etapa: number;
  vencimento: string;
  atrasada: boolean;
  hoje: boolean;
  motivo: string;
  explicacao: string;
  statusAnterior: string | null;
  diasDesdeBase: number;
}

const STATUS_REVISOES = [
  'REVISAO',
  'REVISAO_FACIL',
  'REVISAO_MEDIO',
  'REVISAO_DIFICIL',
  'REVISAO_ERREI',
];

function adicionarDias(base: Date, dias: number) {
  const data = new Date(base);
  data.setDate(data.getDate() + dias);
  return data;
}

function inicioDoDia(data: Date) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function diasEntre(inicio: Date, fim: Date) {
  return Math.max(0, Math.floor((inicioDoDia(fim).getTime() - inicioDoDia(inicio).getTime()) / 86_400_000));
}

function motivoPorStatus(status: string | null, etapa: number, dias: number) {
  if (status === 'REVISAO_ERREI') return 'voce errou esse tema na ultima revisao';
  if (status === 'REVISAO_DIFICIL') return 'voce marcou esse tema como dificil';
  if (status === 'REVISAO_FACIL') return 'voce marcou esse tema como facil, entao o intervalo aumentou';
  if (status === 'REVISAO_MEDIO') return 'voce marcou esse tema como medio';
  if (etapa === 1) return 'primeira revisao apos concluir o topico';
  return `${dias} dia(s) desde a ultima revisao`;
}

export async function listarRevisoesInteligentes(idUsuario: bigint, horizonteDias = 14) {
  const hoje = inicioDoDia(new Date());
  const limite = adicionarDias(hoje, horizonteDias);

  const [topicos, revisoesFeitas] = await Promise.all([
    prisma.topico_progresso.findMany({
      where: { id_usuario: idUsuario, concluido: true, data_conclusao: { not: null } },
      include: { topico: { include: { disciplina: true } } },
      orderBy: { data_conclusao: 'asc' },
      take: 120,
    }),
    prisma.sessao_estudo.findMany({
      where: {
        id_usuario: idUsuario,
        status: { in: STATUS_REVISOES },
      },
      select: { id_topico: true, inicio: true, status: true },
      orderBy: { inicio: 'asc' },
    }),
  ]);

  const revisoesPorTopico = new Map<string, typeof revisoesFeitas>();
  for (const revisao of revisoesFeitas) {
    const chave = revisao.id_topico.toString();
    revisoesPorTopico.set(chave, [...(revisoesPorTopico.get(chave) ?? []), revisao]);
  }

  const itens: RevisaoInteligente[] = [];
  for (const progresso of topicos) {
    if (!progresso.data_conclusao) continue;

    const revisoesTopico = revisoesPorTopico.get(progresso.id_topico.toString()) ?? [];
    const ultimaRevisao = revisoesTopico[revisoesTopico.length - 1] ?? null;
    const statusAnterior = ultimaRevisao?.status ?? null;
    const intervalos = calcularIntervalosAdaptativos(statusAnterior);
    const indiceIntervalo = Math.min(revisoesTopico.length, intervalos.length - 1);
    const intervaloDias = intervalos[indiceIntervalo];
    const base = ultimaRevisao?.inicio ?? progresso.data_conclusao;
    const vencimento = inicioDoDia(adicionarDias(base, intervaloDias));

    if (vencimento > limite) continue;

    const diasDesdeBase = diasEntre(base, hoje);
    const etapa = revisoesTopico.length + 1;
    const motivo = motivoPorStatus(statusAnterior, etapa, diasDesdeBase);
    const atrasada = vencimento < hoje;

    itens.push({
      idTopico: Number(progresso.id_topico),
      idDisciplina: progresso.topico.id_disciplina,
      disciplina: progresso.topico.disciplina?.nome ?? 'Disciplina',
      topico: progresso.topico.descricao,
      intervaloDias,
      etapa,
      vencimento: vencimento.toISOString(),
      atrasada,
      hoje: vencimento.getTime() === hoje.getTime(),
      motivo,
      explicacao: atrasada
        ? `Esta revisao venceu porque ${motivo}. Fazer agora protege a retencao antes de conteudo novo.`
        : `Esta revisao foi agendada porque ${motivo}.`,
      statusAnterior,
      diasDesdeBase,
    });
  }

  return itens.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
}

export async function registrarRevisaoInteligente(
  idUsuario: bigint,
  input: { idTopico?: number; duracaoMinutos?: number; resultado?: string },
) {
  if (!input.idTopico) {
    throw Object.assign(new Error('Topico obrigatorio.'), { status: 400 });
  }

  const topico = await prisma.topico.findUnique({
    where: { id_topico: BigInt(input.idTopico) },
    include: { disciplina: true },
  });
  if (!topico || !topico.id_disciplina) {
    throw Object.assign(new Error('Topico nao encontrado.'), { status: 404 });
  }

  const agora = new Date();
  const minutos = Math.max(5, input.duracaoMinutos ?? 20);
  const resultado = normalizarResultadoRevisao(input.resultado);

  await prisma.sessao_estudo.create({
    data: {
      id_usuario: idUsuario,
      id_disciplina: topico.id_disciplina,
      id_topico: topico.id_topico,
      inicio: new Date(agora.getTime() - minutos * 60_000),
      fim: agora,
      duracao_minutos: minutos,
      status: STATUS_REVISAO[resultado],
    },
  });

  const proximosIntervalos = calcularIntervalosAdaptativos(STATUS_REVISAO[resultado]);
  return {
    ok: true,
    resultado,
    proximaRevisaoEmDias: proximosIntervalos[1] ?? proximosIntervalos[0],
  };
}
