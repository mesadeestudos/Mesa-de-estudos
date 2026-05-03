import prisma from '@/lib/prisma';

export interface RegistroQuestoesInput {
  idDisciplina: number;
  idTopico?: number | null;
  total: number;
  acertos: number;
}

export interface AtualizarQuestoesInput {
  id: number;
  idDisciplina: number;
  idTopico?: number | null;
  total: number;
  acertos: number;
}

interface QuestaoResumoRow {
  id_disciplina: number;
  disciplina: string;
  total_questoes: bigint | number;
  total_acertos: bigint | number;
  sessoes: bigint | number;
}

interface QuestaoTopicoRow {
  id_topico: bigint | null;
  topico: string | null;
  disciplina: string;
  total_questoes: bigint | number;
  total_acertos: bigint | number;
}

interface QuestaoRecenteRow {
  id_questao_treino: bigint;
  disciplina: string;
  topico: string | null;
  total_questoes: number;
  total_acertos: number;
  percentual: number;
  data_registro: Date;
}

interface TopicoOpcaoRow {
  id_disciplina: number;
  disciplina: string;
  id_topico: bigint;
  topico: string;
}

interface TabelaExisteRow {
  existe: string | null;
}

async function tabelaQuestoesExiste() {
  const resultado = await prisma.$queryRaw<TabelaExisteRow[]>`
    SELECT to_regclass('planejamento.questao_treino')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

export async function registrarQuestoes(idUsuario: bigint, input: RegistroQuestoesInput) {
  const tabelaExiste = await tabelaQuestoesExiste();
  if (!tabelaExiste) {
    throw Object.assign(new Error('Modulo de questoes ainda nao configurado no banco.'), { status: 503 });
  }

  const total = Math.max(1, Math.floor(input.total));
  const acertos = Math.min(total, Math.max(0, Math.floor(input.acertos)));
  const percentual = Number(((acertos / total) * 100).toFixed(2));

  await prisma.$executeRaw`
    INSERT INTO planejamento.questao_treino
      (id_usuario, id_disciplina, id_topico, total_questoes, total_acertos, percentual)
    VALUES
      (${idUsuario}, ${input.idDisciplina}, ${input.idTopico ? BigInt(input.idTopico) : null}, ${total}, ${acertos}, ${percentual})
  `;

  return { total, acertos, percentual };
}

export async function atualizarQuestoes(idUsuario: bigint, input: AtualizarQuestoesInput) {
  const tabelaExiste = await tabelaQuestoesExiste();
  if (!tabelaExiste) {
    throw Object.assign(new Error('Modulo de questoes ainda nao configurado no banco.'), { status: 503 });
  }

  const total = Math.max(1, Math.floor(input.total));
  const acertos = Math.min(total, Math.max(0, Math.floor(input.acertos)));
  const percentual = Number(((acertos / total) * 100).toFixed(2));

  await prisma.$executeRaw`
    UPDATE planejamento.questao_treino
    SET
      id_disciplina = ${input.idDisciplina},
      id_topico = ${input.idTopico ? BigInt(input.idTopico) : null},
      total_questoes = ${total},
      total_acertos = ${acertos},
      percentual = ${percentual}
    WHERE id_questao_treino = ${BigInt(input.id)}
      AND id_usuario = ${idUsuario}
  `;

  return { total, acertos, percentual };
}

export async function buscarResumoQuestoes(idUsuario: bigint) {
  const tabelaExiste = await tabelaQuestoesExiste();
  if (!tabelaExiste) {
    return {
      configuracaoPendente: true,
      disciplinas: [],
      topicos: [],
      recentes: [],
    };
  }

  const [disciplinas, topicos, recentes, opcoesTopicos] = await Promise.all([
    prisma.$queryRaw<QuestaoResumoRow[]>`
      SELECT
        qt.id_disciplina,
        d.nome AS disciplina,
        SUM(qt.total_questoes) AS total_questoes,
        SUM(qt.total_acertos) AS total_acertos,
        COUNT(*) AS sessoes
      FROM planejamento.questao_treino qt
      JOIN concurso.disciplina d ON d.id_disciplina = qt.id_disciplina
      WHERE qt.id_usuario = ${idUsuario}
      GROUP BY qt.id_disciplina, d.nome
      ORDER BY (SUM(qt.total_acertos)::decimal / NULLIF(SUM(qt.total_questoes), 0)) ASC
    `,
    prisma.$queryRaw<QuestaoTopicoRow[]>`
      SELECT
        qt.id_topico,
        t.descricao AS topico,
        d.nome AS disciplina,
        SUM(qt.total_questoes) AS total_questoes,
        SUM(qt.total_acertos) AS total_acertos
      FROM planejamento.questao_treino qt
      JOIN concurso.disciplina d ON d.id_disciplina = qt.id_disciplina
      LEFT JOIN concurso.topico t ON t.id_topico = qt.id_topico
      WHERE qt.id_usuario = ${idUsuario}
      GROUP BY qt.id_topico, t.descricao, d.nome
      ORDER BY (SUM(qt.total_acertos)::decimal / NULLIF(SUM(qt.total_questoes), 0)) ASC
      LIMIT 12
    `,
    prisma.$queryRaw<QuestaoRecenteRow[]>`
      SELECT
        qt.id_questao_treino,
        d.nome AS disciplina,
        t.descricao AS topico,
        qt.total_questoes,
        qt.total_acertos,
        qt.percentual,
        qt.data_registro
      FROM planejamento.questao_treino qt
      JOIN concurso.disciplina d ON d.id_disciplina = qt.id_disciplina
      LEFT JOIN concurso.topico t ON t.id_topico = qt.id_topico
      WHERE qt.id_usuario = ${idUsuario}
      ORDER BY qt.data_registro DESC
      LIMIT 12
    `,
    prisma.$queryRaw<TopicoOpcaoRow[]>`
      SELECT DISTINCT
        d.id_disciplina,
        d.nome AS disciplina,
        t.id_topico,
        t.descricao AS topico
      FROM planejamento.ciclo_estudo ce
      JOIN planejamento.plano_estudo pe ON pe.id_plano = ce.id_plano
      JOIN planejamento.ciclo_disciplina cd ON cd.id_ciclo = ce.id_ciclo
      JOIN concurso.disciplina d ON d.id_disciplina = cd.id_disciplina
      JOIN concurso.topico t ON t.id_disciplina = d.id_disciplina
      WHERE pe.id_usuario = ${idUsuario}
        AND ce.ativo = true
      ORDER BY d.nome ASC, t.id_topico ASC
    `,
  ]);

  const mapResumo = <T extends { total_questoes: bigint | number; total_acertos: bigint | number }>(item: T) => {
    const total = Number(item.total_questoes ?? 0);
    const acertos = Number(item.total_acertos ?? 0);
    return {
      total,
      acertos,
      erros: Math.max(0, total - acertos),
      percentual: total > 0 ? Number(((acertos / total) * 100).toFixed(1)) : 0,
    };
  };

  return {
    configuracaoPendente: false,
    disciplinas: disciplinas.map(item => ({
      idDisciplina: item.id_disciplina,
      disciplina: item.disciplina,
      sessoes: Number(item.sessoes ?? 0),
      ...mapResumo(item),
    })),
    topicos: topicos.map(item => ({
      idTopico: item.id_topico ? Number(item.id_topico) : null,
      topico: item.topico ?? 'Sem tópico vinculado',
      disciplina: item.disciplina,
      ...mapResumo(item),
    })),
    recentes: recentes.map(item => ({
      id: Number(item.id_questao_treino),
      disciplina: item.disciplina,
      topico: item.topico ?? 'Sem tópico vinculado',
      total: item.total_questoes,
      acertos: item.total_acertos,
      erros: Math.max(0, item.total_questoes - item.total_acertos),
      percentual: Number(item.percentual),
      dataRegistro: item.data_registro.toISOString(),
    })),
    opcoes: {
      topicos: opcoesTopicos.map(item => ({
        idDisciplina: item.id_disciplina,
        disciplina: item.disciplina,
        idTopico: Number(item.id_topico),
        topico: item.topico,
      })),
    },
  };
}
