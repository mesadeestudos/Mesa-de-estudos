import prisma from '@/lib/prisma';
import { calcularPrioridadesDisciplinas } from '@/service/prioridade.service';

interface TabelaExisteRow {
  existe: string | null;
}

interface SimuladoRow {
  id_simulado: bigint;
  titulo: string;
  data_realizacao: Date;
  total_questoes: number;
  total_acertos: number;
  percentual: number;
  observacao: string | null;
}

interface SimuladoDisciplinaRow {
  id_simulado: bigint;
  id_disciplina: number;
  disciplina: string;
  total_questoes: number;
  total_acertos: number;
  percentual: number;
}

export interface SimuladoInput {
  titulo?: string;
  dataRealizacao?: string;
  totalQuestoes?: number;
  totalAcertos?: number;
  observacao?: string | null;
  disciplinas?: Array<{ idDisciplina: number; totalQuestoes: number; totalAcertos: number }>;
}

async function tabelasSimuladoExistem() {
  const resultado = await prisma.$queryRaw<TabelaExisteRow[]>`
    SELECT to_regclass('planejamento.simulado')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

function percentual(acertos: number, total: number) {
  return Number(((acertos / Math.max(1, total)) * 100).toFixed(2));
}

export async function listarSimulados(idUsuario: bigint) {
  const existe = await tabelasSimuladoExistem();
  if (!existe) {
    return {
      configuracaoPendente: true,
      simulados: [],
      disciplinas: [],
      analise: {
        quedaRecente: false,
        mensagem: 'Execute scripts/create-ia-orientadora-tables.sql para ativar simulados.',
        sugestoes: [],
      },
    };
  }

  const [simulados, disciplinas, prioridades] = await Promise.all([
    prisma.$queryRaw<SimuladoRow[]>`
      SELECT id_simulado, titulo, data_realizacao, total_questoes, total_acertos, percentual, observacao
      FROM planejamento.simulado
      WHERE id_usuario = ${idUsuario}
      ORDER BY data_realizacao DESC, id_simulado DESC
      LIMIT 12
    `,
    prisma.$queryRaw<SimuladoDisciplinaRow[]>`
      SELECT sd.id_simulado, sd.id_disciplina, d.nome AS disciplina, sd.total_questoes, sd.total_acertos, sd.percentual
      FROM planejamento.simulado_disciplina sd
      JOIN planejamento.simulado s ON s.id_simulado = sd.id_simulado
      JOIN concurso.disciplina d ON d.id_disciplina = sd.id_disciplina
      WHERE s.id_usuario = ${idUsuario}
      ORDER BY sd.percentual ASC
      LIMIT 24
    `,
    calcularPrioridadesDisciplinas(idUsuario).catch(() => []),
  ]);

  const quedaRecente = simulados.length >= 2 && Number(simulados[0].percentual) + 5 < Number(simulados[1].percentual);
  const piorDisciplina = disciplinas[0] ?? null;
  const prioridade = prioridades[0] ?? null;
  const sugestoes = [
    piorDisciplina ? `Revise ${piorDisciplina.disciplina} antes do próximo simulado.` : null,
    quedaRecente ? 'Faça uma revisão pós-simulado antes de aumentar conteúdo novo.' : null,
    prioridade ? `Inclua ${prioridade.nome} no próximo bloco de reforço.` : null,
  ].filter((item): item is string => Boolean(item));

  return {
    configuracaoPendente: false,
    simulados: simulados.map(item => ({
      id: Number(item.id_simulado),
      titulo: item.titulo,
      dataRealizacao: item.data_realizacao.toISOString(),
      totalQuestoes: item.total_questoes,
      totalAcertos: item.total_acertos,
      percentual: Number(item.percentual),
      observacao: item.observacao,
    })),
    disciplinas: disciplinas.map(item => ({
      idSimulado: Number(item.id_simulado),
      idDisciplina: item.id_disciplina,
      disciplina: item.disciplina,
      totalQuestoes: item.total_questoes,
      totalAcertos: item.total_acertos,
      percentual: Number(item.percentual),
    })),
    analise: {
      quedaRecente,
      piorDisciplina: piorDisciplina ? {
        disciplina: piorDisciplina.disciplina,
        percentual: Number(piorDisciplina.percentual),
      } : null,
      mensagem: piorDisciplina
        ? `O ponto mais fraco dos simulados recentes é ${piorDisciplina.disciplina}.`
        : 'Registre simulados para comparar desempenho por disciplina.',
      sugestoes,
    },
  };
}

export async function registrarSimulado(idUsuario: bigint, input: SimuladoInput) {
  const existe = await tabelasSimuladoExistem();
  if (!existe) {
    throw Object.assign(new Error('Tabela de simulados ainda não configurada.'), { status: 503 });
  }

  const disciplinas = input.disciplinas?.filter(item => item.idDisciplina && item.totalQuestoes > 0) ?? [];
  const totalQuestoes = Math.max(1, Math.floor(input.totalQuestoes ?? disciplinas.reduce((soma, item) => soma + item.totalQuestoes, 0)));
  const totalAcertos = Math.min(totalQuestoes, Math.max(0, Math.floor(input.totalAcertos ?? disciplinas.reduce((soma, item) => soma + item.totalAcertos, 0))));
  const dataRealizacao = input.dataRealizacao ? new Date(`${input.dataRealizacao}T00:00:00`) : new Date();

  await prisma.$transaction(async (tx) => {
    const [simulado] = await tx.$queryRaw<Pick<SimuladoRow, 'id_simulado'>[]>`
      INSERT INTO planejamento.simulado
        (id_usuario, titulo, data_realizacao, total_questoes, total_acertos, percentual, observacao)
      VALUES
        (${idUsuario}, ${input.titulo?.trim() || 'Simulado'}, ${dataRealizacao}, ${totalQuestoes}, ${totalAcertos}, ${percentual(totalAcertos, totalQuestoes)}, ${input.observacao ?? null})
      RETURNING id_simulado
    `;

    for (const item of disciplinas) {
      const total = Math.max(1, Math.floor(item.totalQuestoes));
      const acertos = Math.min(total, Math.max(0, Math.floor(item.totalAcertos)));
      await tx.$executeRaw`
        INSERT INTO planejamento.simulado_disciplina
          (id_simulado, id_disciplina, total_questoes, total_acertos, percentual)
        VALUES
          (${simulado.id_simulado}, ${item.idDisciplina}, ${total}, ${acertos}, ${percentual(acertos, total)})
      `;
    }
  });

  return listarSimulados(idUsuario);
}
