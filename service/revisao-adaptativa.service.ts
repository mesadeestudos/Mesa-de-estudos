import prisma from '@/lib/prisma';

export type ResultadoRevisao = 'facil' | 'medio' | 'dificil' | 'errei';

export const STATUS_REVISAO: Record<ResultadoRevisao, string> = {
  facil: 'REVISAO_FACIL',
  medio: 'REVISAO_MEDIO',
  dificil: 'REVISAO_DIFICIL',
  errei: 'REVISAO_ERREI',
};

const INTERVALOS_BASE = [1, 7, 15, 30];

export function normalizarResultadoRevisao(resultado?: string | null): ResultadoRevisao {
  if (resultado === 'facil' || resultado === 'medio' || resultado === 'dificil' || resultado === 'errei') {
    return resultado;
  }
  return 'medio';
}

export function calcularIntervalosAdaptativos(statusAnterior?: string | null) {
  if (statusAnterior === 'REVISAO_ERREI') return [1, 3, 7, 15];
  if (statusAnterior === 'REVISAO_DIFICIL') return [1, 5, 12, 25];
  if (statusAnterior === 'REVISAO_FACIL') return [2, 10, 21, 45];
  return INTERVALOS_BASE;
}

export async function buscarStatusUltimaRevisao(idUsuario: bigint, idTopico: bigint) {
  const revisao = await prisma.sessao_estudo.findFirst({
    where: {
      id_usuario: idUsuario,
      id_topico: idTopico,
      status: { in: ['REVISAO', 'REVISAO_FACIL', 'REVISAO_MEDIO', 'REVISAO_DIFICIL', 'REVISAO_ERREI'] },
    },
    orderBy: { inicio: 'desc' },
    select: { status: true },
  });
  return revisao?.status ?? null;
}
