import prisma from '@/lib/prisma';

interface TabelaExisteRow {
  existe: string | null;
}

interface ErroTopicoRow {
  id_topico: bigint | null;
  topico: string | null;
  id_disciplina: number;
  disciplina: string;
  total_questoes: bigint | number;
  total_acertos: bigint | number;
  sessoes: bigint | number;
  motivo_erro: string | null;
}

async function tabelaQuestoesExiste() {
  const resultado = await prisma.$queryRaw<TabelaExisteRow[]>`
    SELECT to_regclass('planejamento.questao_treino')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

async function colunaMotivoErroExiste() {
  const resultado = await prisma.$queryRaw<TabelaExisteRow[]>`
    SELECT column_name AS existe
    FROM information_schema.columns
    WHERE table_schema = 'planejamento'
      AND table_name = 'questao_treino'
      AND column_name = 'motivo_erro'
    LIMIT 1
  `;
  return Boolean(resultado[0]?.existe);
}

export async function listarCadernoErros(idUsuario: bigint) {
  const existe = await tabelaQuestoesExiste();
  if (!existe) {
    return {
      configuracaoPendente: true,
      itens: [],
      resumo: {
        totalErros: 0,
        topicoMaisCritico: null,
        mensagem: 'Execute scripts/create-questoes-table.sql para ativar o caderno de erros.',
      },
    };
  }

  const temMotivo = await colunaMotivoErroExiste();
  const linhas = temMotivo
    ? await prisma.$queryRaw<ErroTopicoRow[]>`
      SELECT
        qt.id_topico,
        t.descricao AS topico,
        qt.id_disciplina,
        d.nome AS disciplina,
        SUM(qt.total_questoes) AS total_questoes,
        SUM(qt.total_acertos) AS total_acertos,
        COUNT(*) AS sessoes,
        COALESCE(qt.motivo_erro, 'NAO_INFORMADO') AS motivo_erro
      FROM planejamento.questao_treino qt
      JOIN concurso.disciplina d ON d.id_disciplina = qt.id_disciplina
      LEFT JOIN concurso.topico t ON t.id_topico = qt.id_topico
      WHERE qt.id_usuario = ${idUsuario}
        AND qt.total_acertos < qt.total_questoes
      GROUP BY qt.id_topico, t.descricao, qt.id_disciplina, d.nome, COALESCE(qt.motivo_erro, 'NAO_INFORMADO')
      ORDER BY (SUM(qt.total_questoes) - SUM(qt.total_acertos)) DESC
      LIMIT 24
    `
    : await prisma.$queryRaw<ErroTopicoRow[]>`
      SELECT
        qt.id_topico,
        t.descricao AS topico,
        qt.id_disciplina,
        d.nome AS disciplina,
        SUM(qt.total_questoes) AS total_questoes,
        SUM(qt.total_acertos) AS total_acertos,
        COUNT(*) AS sessoes,
        'NAO_INFORMADO' AS motivo_erro
      FROM planejamento.questao_treino qt
      JOIN concurso.disciplina d ON d.id_disciplina = qt.id_disciplina
      LEFT JOIN concurso.topico t ON t.id_topico = qt.id_topico
      WHERE qt.id_usuario = ${idUsuario}
        AND qt.total_acertos < qt.total_questoes
      GROUP BY qt.id_topico, t.descricao, qt.id_disciplina, d.nome
      ORDER BY (SUM(qt.total_questoes) - SUM(qt.total_acertos)) DESC
      LIMIT 24
    `;

  const itens = linhas.map((item) => {
    const total = Number(item.total_questoes ?? 0);
    const acertos = Number(item.total_acertos ?? 0);
    const erros = Math.max(0, total - acertos);
    const percentual = total > 0 ? Number(((acertos / total) * 100).toFixed(1)) : 0;
    const motivo = item.motivo_erro ?? 'NAO_INFORMADO';
    const acao = motivo === 'FALTA_TEORIA'
      ? 'Revisar teoria antes de novas questões.'
      : motivo === 'DISTRAcao'.toUpperCase()
        ? 'Resolver bateria curta com atenção ao enunciado.'
        : motivo === 'INTERPRETACAO'
          ? 'Treinar leitura do comando e justificativa das alternativas.'
          : motivo === 'DECOREBA'
            ? 'Fazer revisão ativa com perguntas rápidas.'
            : percentual < 60
              ? 'Revisar o tópico e refazer erros.'
              : 'Refazer questões erradas para consolidar.';

    return {
      idTopico: item.id_topico ? Number(item.id_topico) : null,
      topico: item.topico ?? 'Sem tópico específico',
      idDisciplina: item.id_disciplina,
      disciplina: item.disciplina,
      total,
      acertos,
      erros,
      sessoes: Number(item.sessoes ?? 0),
      percentual,
      motivoErro: motivo,
      recomendacao: `${item.topico ?? item.disciplina}: ${erros} erro(s). ${acao}`,
    };
  });

  const totalErros = itens.reduce((soma, item) => soma + item.erros, 0);
  return {
    configuracaoPendente: false,
    itens,
    resumo: {
      totalErros,
      topicoMaisCritico: itens[0] ?? null,
      mensagem: itens[0]
        ? `Você errou ${itens[0].erros} vez(es) em ${itens[0].topico}. Corrija esse bloco antes de avançar.`
        : 'Quando houver erros registrados, eles aparecerão aqui com recomendação de correção.',
    },
  };
}
