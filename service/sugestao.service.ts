import prisma from '@/lib/prisma';

export type CategoriaSugestao = 'MELHORIA' | 'BUG' | 'CONTEUDO' | 'USABILIDADE' | 'OUTRO';
export type PrioridadeSugestao = 'BAIXA' | 'NORMAL' | 'ALTA';

interface TabelaExisteRow {
  existe: string | null;
}

interface SugestaoRow {
  id_sugestao: bigint;
  categoria: CategoriaSugestao;
  prioridade: PrioridadeSugestao;
  titulo: string;
  descricao: string;
  status: string;
  pagina_origem: string | null;
  data_criacao: Date;
}

async function tabelaSugestoesExiste() {
  const resultado = await prisma.$queryRaw<TabelaExisteRow[]>`
    SELECT to_regclass('planejamento.sugestao_usuario')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

function normalizarCategoria(valor?: string | null): CategoriaSugestao {
  if (valor === 'BUG' || valor === 'CONTEUDO' || valor === 'USABILIDADE' || valor === 'OUTRO') return valor;
  return 'MELHORIA';
}

function normalizarPrioridade(valor?: string | null): PrioridadeSugestao {
  if (valor === 'BAIXA' || valor === 'ALTA') return valor;
  return 'NORMAL';
}

function mapSugestao(item: SugestaoRow) {
  return {
    id: Number(item.id_sugestao),
    categoria: item.categoria,
    prioridade: item.prioridade,
    titulo: item.titulo,
    descricao: item.descricao,
    status: item.status,
    paginaOrigem: item.pagina_origem,
    dataCriacao: item.data_criacao.toISOString(),
  };
}

export async function listarSugestoesUsuario(idUsuario: bigint) {
  const existe = await tabelaSugestoesExiste();
  if (!existe) {
    return {
      configuracaoPendente: true,
      sugestoes: [],
    };
  }

  const sugestoes = await prisma.$queryRaw<SugestaoRow[]>`
    SELECT
      id_sugestao,
      categoria,
      prioridade,
      titulo,
      descricao,
      status,
      pagina_origem,
      data_criacao
    FROM planejamento.sugestao_usuario
    WHERE id_usuario = ${idUsuario}
    ORDER BY data_criacao DESC
    LIMIT 20
  `;

  return {
    configuracaoPendente: false,
    sugestoes: sugestoes.map(mapSugestao),
  };
}

export async function criarSugestaoUsuario(
  idUsuario: bigint,
  input: {
    categoria?: string | null;
    prioridade?: string | null;
    titulo?: string | null;
    descricao?: string | null;
    paginaOrigem?: string | null;
  },
) {
  const existe = await tabelaSugestoesExiste();
  if (!existe) {
    throw Object.assign(new Error('Modulo de sugestoes ainda nao configurado no banco.'), { status: 503 });
  }

  const titulo = input.titulo?.trim() ?? '';
  const descricao = input.descricao?.trim() ?? '';
  if (titulo.length < 5) {
    throw Object.assign(new Error('Informe um titulo com pelo menos 5 caracteres.'), { status: 400 });
  }
  if (descricao.length < 20) {
    throw Object.assign(new Error('Descreva sua sugestao com pelo menos 20 caracteres.'), { status: 400 });
  }

  const [sugestao] = await prisma.$queryRaw<SugestaoRow[]>`
    INSERT INTO planejamento.sugestao_usuario
      (id_usuario, categoria, prioridade, titulo, descricao, pagina_origem)
    VALUES
      (${idUsuario}, ${normalizarCategoria(input.categoria)}, ${normalizarPrioridade(input.prioridade)}, ${titulo.slice(0, 140)}, ${descricao}, ${input.paginaOrigem?.slice(0, 120) ?? null})
    RETURNING
      id_sugestao,
      categoria,
      prioridade,
      titulo,
      descricao,
      status,
      pagina_origem,
      data_criacao
  `;

  return mapSugestao(sugestao);
}
