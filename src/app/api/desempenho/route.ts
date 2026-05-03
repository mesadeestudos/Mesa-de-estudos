import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autenticarUsuario, toHttpError } from '@/lib/auth';

function diaKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface SessaoDesempenho {
  id_sessao: bigint;
  id_disciplina: number;
  disciplina_nome: string;
  topico_descricao: string;
  duracao_minutos: number | null;
  status: string;
  inicio: Date;
}

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);

    const [sessoes, progressoDisciplinas, topicosConcluidos, topicosProgresso] = await Promise.all([
      prisma.$queryRaw<SessaoDesempenho[]>`
        SELECT
          se.id_sessao,
          se.id_disciplina,
          d.nome AS disciplina_nome,
          t.descricao AS topico_descricao,
          se.duracao_minutos,
          se.status,
          se.inicio
        FROM planejamento.sessao_estudo se
        JOIN concurso.disciplina d ON d.id_disciplina = se.id_disciplina
        JOIN concurso.topico t ON t.id_topico = se.id_topico
        WHERE se.id_usuario = ${idUsuario}
          AND se.fim IS NOT NULL
        ORDER BY se.inicio DESC
        LIMIT 300
      `,
      prisma.disciplina_progresso.findMany({
        where: { id_usuario: idUsuario },
        include: { disciplina: true },
        orderBy: { percentual: 'asc' },
      }),
      prisma.topico_progresso.count({ where: { id_usuario: idUsuario, concluido: true } }),
      prisma.topico_progresso.findMany({
        where: { id_usuario: idUsuario, concluido: true },
        include: { topico: { include: { disciplina: true } } },
        orderBy: { data_conclusao: 'desc' },
        take: 80,
      }),
    ]);

    const dias = Array.from({ length: 7 }, (_, index) => {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + index);
      return { data: diaKey(data), minutos: 0, sessoes: 0 };
    });
    const diasMap = new Map(dias.map(dia => [dia.data, dia]));
    const disciplinaMap = new Map<number, { idDisciplina: number; nome: string; minutos: number; sessoes: number }>();

    let minutosTotais = 0;
    for (const sessao of sessoes) {
      const minutos = sessao.duracao_minutos ?? 0;
      minutosTotais += minutos;

      if (sessao.inicio >= inicioSemana) {
        const dia = diasMap.get(diaKey(sessao.inicio));
        if (dia) {
          dia.minutos += minutos;
          dia.sessoes += 1;
        }
      }

      const atual = disciplinaMap.get(sessao.id_disciplina) ?? {
        idDisciplina: sessao.id_disciplina,
        nome: sessao.disciplina_nome,
        minutos: 0,
        sessoes: 0,
      };
      atual.minutos += minutos;
      atual.sessoes += 1;
      disciplinaMap.set(sessao.id_disciplina, atual);
    }

    const disciplinas = progressoDisciplinas.map(item => ({
      idDisciplina: item.id_disciplina,
      nome: item.disciplina.nome,
      topicosConcluidos: item.topicos_concluidos ?? 0,
      percentual: Number(item.percentual ?? 0),
      concluida: Boolean(item.concluida),
      minutos: disciplinaMap.get(item.id_disciplina)?.minutos ?? 0,
      sessoes: disciplinaMap.get(item.id_disciplina)?.sessoes ?? 0,
    }));

    const minutosPrimeirosDias = dias.slice(0, 3).reduce((total, dia) => total + dia.minutos, 0);
    const minutosUltimosDias = dias.slice(4).reduce((total, dia) => total + dia.minutos, 0);
    const tendencia =
      minutosUltimosDias > minutosPrimeirosDias * 1.15
        ? 'SUBINDO'
        : minutosUltimosDias < minutosPrimeirosDias * 0.85
          ? 'CAINDO'
          : 'ESTAVEL';

    const pontosFracos = disciplinas
      .filter(disciplina => !disciplina.concluida)
      .sort((a, b) => a.percentual - b.percentual || a.minutos - b.minutos)
      .slice(0, 5)
      .map(disciplina => ({
        idDisciplina: disciplina.idDisciplina,
        nome: disciplina.nome,
        percentual: disciplina.percentual,
        motivo: disciplina.percentual < 30
          ? 'Baixo avanço no edital'
          : disciplina.minutos === 0
            ? 'Sem tempo registrado'
            : 'Precisa de reforço',
      }));

    const recomendacoes = [
      pontosFracos[0] ? `Priorize ${pontosFracos[0].nome} na próxima sessão livre.` : null,
      tendencia === 'CAINDO' ? 'Seu ritmo caiu nos últimos dias; reduza a meta e preserve consistência.' : null,
      tendencia === 'SUBINDO' ? 'Seu ritmo está subindo; mantenha a sequência e proteja revisões.' : null,
      topicosConcluidos === 0 ? 'Conclua o primeiro tópico para liberar revisões e leituras de desempenho.' : null,
    ].filter((item): item is string => Boolean(item));

    return NextResponse.json({
      resumo: {
        minutosTotais,
        horasTotais: Number((minutosTotais / 60).toFixed(1)),
        sessoesConcluidas: sessoes.length,
        topicosConcluidos,
        disciplinasComProgresso: disciplinas.length,
      },
      semana: dias,
      disciplinas,
      inteligencia: {
        tendencia,
        pontosFracos,
        recomendacoes,
        topicos: topicosProgresso.slice(0, 20).map(item => ({
          idTopico: Number(item.id_topico),
          disciplina: item.topico.disciplina?.nome ?? 'Disciplina',
          topico: item.topico.descricao,
          concluidoEm: item.data_conclusao?.toISOString() ?? null,
        })),
      },
      recentes: sessoes.slice(0, 12).map(sessao => ({
        idSessao: Number(sessao.id_sessao),
        disciplina: sessao.disciplina_nome,
        topico: sessao.topico_descricao,
        minutos: sessao.duracao_minutos ?? 0,
        status: sessao.status,
        inicio: sessao.inicio.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[GET /api/desempenho] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
