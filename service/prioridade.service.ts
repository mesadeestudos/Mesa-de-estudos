import prisma from '@/lib/prisma';

export interface PrioridadeDisciplina {
  idDisciplina: number;
  nome: string;
  percentual: number;
  minutos: number;
  sessoes: number;
  diasSemEstudar: number | null;
  score: number;
  motivos: string[];
}

interface DisciplinaPrioridadeRow {
  id_disciplina: number;
  nome: string;
  percentual: number | null;
  concluida: boolean | null;
  minutos: number | null;
  sessoes: bigint | number | null;
  ultima_sessao: Date | null;
}

const diasEntre = (data: Date | null) => {
  if (!data) return null;
  return Math.max(0, Math.floor((Date.now() - data.getTime()) / 86_400_000));
};

export async function calcularPrioridadesDisciplinas(idUsuario: bigint): Promise<PrioridadeDisciplina[]> {
  const linhas = await prisma.$queryRaw<DisciplinaPrioridadeRow[]>`
    SELECT
      d.id_disciplina,
      d.nome,
      dp.percentual,
      dp.concluida,
      COALESCE(SUM(se.duracao_minutos), 0) AS minutos,
      COUNT(se.id_sessao) AS sessoes,
      MAX(se.inicio) AS ultima_sessao
    FROM planejamento.disciplina_progresso dp
    JOIN concurso.disciplina d ON d.id_disciplina = dp.id_disciplina
    LEFT JOIN planejamento.sessao_estudo se
      ON se.id_usuario = dp.id_usuario
      AND se.id_disciplina = dp.id_disciplina
      AND se.fim IS NOT NULL
      AND se.status IN ('CONCLUIDA', 'REVISAO', 'REVISAO_FACIL', 'REVISAO_MEDIO', 'REVISAO_DIFICIL', 'REVISAO_ERREI')
    WHERE dp.id_usuario = ${idUsuario}
    GROUP BY d.id_disciplina, d.nome, dp.percentual, dp.concluida
  `;

  return linhas.map((linha) => {
    const percentual = Number(linha.percentual ?? 0);
    const minutos = Number(linha.minutos ?? 0);
    const sessoes = Number(linha.sessoes ?? 0);
    const diasSemEstudar = diasEntre(linha.ultima_sessao);
    const motivos: string[] = [];
    let score = 0;

    if (!linha.concluida) score += Math.max(0, 100 - percentual) * 0.45;
    if (percentual < 30) {
      score += 24;
      motivos.push('baixo avanço');
    }
    if (minutos === 0) {
      score += 18;
      motivos.push('sem tempo registrado');
    }
    if (diasSemEstudar === null) {
      score += 16;
      motivos.push('ainda não estudada');
    } else if (diasSemEstudar >= 7) {
      score += 18;
      motivos.push(`${diasSemEstudar} dias sem estudo`);
    } else if (diasSemEstudar >= 3) {
      score += 9;
      motivos.push(`${diasSemEstudar} dias sem estudo`);
    }
    if (sessoes >= 3 && percentual < 50) {
      score += 12;
      motivos.push('muito tempo com pouco avanço');
    }
    if (motivos.length === 0) motivos.push('manter na rotação');

    return {
      idDisciplina: linha.id_disciplina,
      nome: linha.nome,
      percentual,
      minutos,
      sessoes,
      diasSemEstudar,
      score: Number(score.toFixed(2)),
      motivos,
    };
  }).sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome));
}
