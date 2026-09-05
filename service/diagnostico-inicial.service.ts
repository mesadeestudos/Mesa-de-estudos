import prisma from '@/lib/prisma';

export type NivelAtual = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
export type DificuldadePrincipal = 'CONSTANCIA' | 'TEORIA' | 'REVISAO' | 'QUESTOES' | 'TEMPO';
export type PreferenciaSessao = 'CURTA' | 'MEDIA' | 'LONGA';

interface TabelaExisteRow {
  existe: string | null;
}

interface DiagnosticoRow {
  id_diagnostico: bigint;
  nivel_atual: NivelAtual;
  dias_ate_prova: number | null;
  estudou_edital_antes: boolean;
  dificuldade_principal: DificuldadePrincipal;
  preferencia_sessao: PreferenciaSessao;
  materias_temidas: string[];
  objetivo: string | null;
  data_atualizacao: Date;
}

export interface DiagnosticoInicialInput {
  nivelAtual?: string;
  diasAteProva?: number | null;
  estudouEditalAntes?: boolean;
  dificuldadePrincipal?: string;
  preferenciaSessao?: string;
  materiasTemidas?: string[];
  objetivo?: string | null;
}

async function tabelaDiagnosticoExiste() {
  const resultado = await prisma.$queryRaw<TabelaExisteRow[]>`
    SELECT to_regclass('planejamento.diagnostico_inicial_usuario')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

function normalizarEnum<T extends string>(valor: string | undefined, permitidos: readonly T[], padrao: T): T {
  const normalizado = (valor ?? '').toUpperCase() as T;
  return permitidos.includes(normalizado) ? normalizado : padrao;
}

function mapDiagnostico(row: DiagnosticoRow) {
  return {
    id: Number(row.id_diagnostico),
    nivelAtual: row.nivel_atual,
    diasAteProva: row.dias_ate_prova,
    estudouEditalAntes: row.estudou_edital_antes,
    dificuldadePrincipal: row.dificuldade_principal,
    preferenciaSessao: row.preferencia_sessao,
    materiasTemidas: row.materias_temidas ?? [],
    objetivo: row.objetivo,
    dataAtualizacao: row.data_atualizacao.toISOString(),
  };
}

export async function buscarDiagnosticoInicial(idUsuario: bigint) {
  const existe = await tabelaDiagnosticoExiste();
  if (!existe) {
    return {
      configuracaoPendente: true,
      completo: false,
      diagnostico: null,
      estrategia: 'Execute scripts/create-ia-orientadora-tables.sql para ativar o diagnóstico inicial.',
    };
  }

  const [diagnostico] = await prisma.$queryRaw<DiagnosticoRow[]>`
    SELECT
      id_diagnostico,
      nivel_atual,
      dias_ate_prova,
      estudou_edital_antes,
      dificuldade_principal,
      preferencia_sessao,
      materias_temidas,
      objetivo,
      data_atualizacao
    FROM planejamento.diagnostico_inicial_usuario
    WHERE id_usuario = ${idUsuario}
    LIMIT 1
  `;

  if (!diagnostico) {
    return {
      configuracaoPendente: false,
      completo: false,
      diagnostico: null,
      estrategia: 'Responda o diagnóstico para eu calibrar ciclo, revisões, questões e ritmo de estudo.',
    };
  }

  const mapped = mapDiagnostico(diagnostico);
  const foco = {
    CONSTANCIA: 'começar com sessões sustentáveis e proteger frequência diária',
    TEORIA: 'priorizar teoria guiada antes de baterias longas de questões',
    REVISAO: 'bloquear conteúdo novo quando houver revisão crítica',
    QUESTOES: 'usar baterias curtas para revelar pontos fracos e corrigir erros',
    TEMPO: 'reduzir escopo diário e escolher a ação de maior impacto',
  }[mapped.dificuldadePrincipal];

  return {
    configuracaoPendente: false,
    completo: true,
    diagnostico: mapped,
    estrategia: `Estratégia calibrada para ${mapped.nivelAtual.toLowerCase()}: ${foco}.`,
  };
}

export async function salvarDiagnosticoInicial(idUsuario: bigint, input: DiagnosticoInicialInput) {
  const existe = await tabelaDiagnosticoExiste();
  if (!existe) {
    throw Object.assign(new Error('Tabela de diagnóstico inicial ainda não configurada.'), { status: 503 });
  }

  const nivelAtual = normalizarEnum(input.nivelAtual, ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'] as const, 'INICIANTE');
  const dificuldadePrincipal = normalizarEnum(input.dificuldadePrincipal, ['CONSTANCIA', 'TEORIA', 'REVISAO', 'QUESTOES', 'TEMPO'] as const, 'CONSTANCIA');
  const preferenciaSessao = normalizarEnum(input.preferenciaSessao, ['CURTA', 'MEDIA', 'LONGA'] as const, 'MEDIA');
  const diasAteProva = input.diasAteProva === null || input.diasAteProva === undefined
    ? null
    : Math.max(0, Math.floor(Number(input.diasAteProva)));
  const materiasTemidas = (input.materiasTemidas ?? [])
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  await prisma.$executeRaw`
    INSERT INTO planejamento.diagnostico_inicial_usuario
      (id_usuario, nivel_atual, dias_ate_prova, estudou_edital_antes, dificuldade_principal, preferencia_sessao, materias_temidas, objetivo)
    VALUES
      (${idUsuario}, ${nivelAtual}, ${diasAteProva}, ${Boolean(input.estudouEditalAntes)}, ${dificuldadePrincipal}, ${preferenciaSessao}, ${materiasTemidas}, ${input.objetivo ?? null})
    ON CONFLICT (id_usuario) DO UPDATE SET
      nivel_atual = EXCLUDED.nivel_atual,
      dias_ate_prova = EXCLUDED.dias_ate_prova,
      estudou_edital_antes = EXCLUDED.estudou_edital_antes,
      dificuldade_principal = EXCLUDED.dificuldade_principal,
      preferencia_sessao = EXCLUDED.preferencia_sessao,
      materias_temidas = EXCLUDED.materias_temidas,
      objetivo = EXCLUDED.objetivo,
      data_atualizacao = NOW()
  `;

  return buscarDiagnosticoInicial(idUsuario);
}
