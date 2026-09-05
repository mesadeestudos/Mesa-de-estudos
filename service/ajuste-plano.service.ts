import prisma from '@/lib/prisma';

export type TipoAjustePlano = 'PAUSA' | 'META_TEMPORARIA';

interface AjusteExisteRow {
  existe: string | null;
}

interface AjustePlanoRow {
  id_ajuste_plano: bigint;
  tipo: TipoAjustePlano;
  data_inicio: Date;
  data_fim: Date;
  horas_por_dia: number | null;
  motivo: string | null;
}

async function tabelaAjustesExiste() {
  const resultado = await prisma.$queryRaw<AjusteExisteRow[]>`
    SELECT to_regclass('planejamento.ajuste_plano_usuario')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

export async function buscarAjustesPlano(idUsuario: bigint) {
  const existe = await tabelaAjustesExiste();
  if (!existe) {
    return {
      configuracaoPendente: true,
      pausaAtiva: null,
      metaTemporaria: null,
      ajustes: [],
    };
  }

  const hoje = new Date();
  const ajustes = await prisma.$queryRaw<AjustePlanoRow[]>`
    SELECT
      id_ajuste_plano,
      tipo,
      data_inicio,
      data_fim,
      horas_por_dia,
      motivo
    FROM planejamento.ajuste_plano_usuario
    WHERE id_usuario = ${idUsuario}
      AND data_fim >= ${hoje}
    ORDER BY data_inicio ASC
  `;

  const mapAjuste = (item: AjustePlanoRow) => ({
    id: Number(item.id_ajuste_plano),
    tipo: item.tipo,
    dataInicio: item.data_inicio.toISOString(),
    dataFim: item.data_fim.toISOString(),
    horasPorDia: item.horas_por_dia,
    motivo: item.motivo,
  });

  const ativos = ajustes.filter(item => item.data_inicio <= hoje && item.data_fim >= hoje);

  return {
    configuracaoPendente: false,
    pausaAtiva: ativos.find(item => item.tipo === 'PAUSA') ? mapAjuste(ativos.find(item => item.tipo === 'PAUSA')!) : null,
    metaTemporaria: ativos.find(item => item.tipo === 'META_TEMPORARIA') ? mapAjuste(ativos.find(item => item.tipo === 'META_TEMPORARIA')!) : null,
    ajustes: ajustes.map(mapAjuste),
  };
}

export async function criarAjustePlano(
  idUsuario: bigint,
  input: { tipo: TipoAjustePlano; dataInicio: string; dataFim: string; horasPorDia?: number | null; motivo?: string | null },
) {
  const existe = await tabelaAjustesExiste();
  if (!existe) {
    throw Object.assign(new Error('Modulo de ajustes do plano ainda nao configurado no banco.'), { status: 503 });
  }

  const dataInicio = new Date(`${input.dataInicio}T00:00:00`);
  const dataFim = new Date(`${input.dataFim}T23:59:59`);
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime()) || dataFim < dataInicio) {
    throw Object.assign(new Error('Periodo invalido.'), { status: 400 });
  }

  const horasPorDia = input.tipo === 'META_TEMPORARIA'
    ? Math.max(1, Math.min(12, Number(input.horasPorDia ?? 1)))
    : null;

  await prisma.$executeRaw`
    INSERT INTO planejamento.ajuste_plano_usuario
      (id_usuario, tipo, data_inicio, data_fim, horas_por_dia, motivo)
    VALUES
      (${idUsuario}, ${input.tipo}, ${dataInicio}, ${dataFim}, ${horasPorDia}, ${input.motivo ?? null})
  `;

  return buscarAjustesPlano(idUsuario);
}
