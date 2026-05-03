import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import {
  buscarStatusUltimaRevisao,
  calcularIntervalosAdaptativos,
  normalizarResultadoRevisao,
  STATUS_REVISAO,
} from '@/service/revisao-adaptativa.service';

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

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const hoje = inicioDoDia(new Date());
    const limite = adicionarDias(hoje, 14);

    const [topicos, revisoesFeitas] = await Promise.all([
      prisma.topico_progresso.findMany({
        where: { id_usuario: idUsuario, concluido: true, data_conclusao: { not: null } },
        include: { topico: { include: { disciplina: true } } },
        orderBy: { data_conclusao: 'desc' },
      }),
      prisma.sessao_estudo.findMany({
        where: {
          id_usuario: idUsuario,
          status: { in: ['REVISAO', 'REVISAO_FACIL', 'REVISAO_MEDIO', 'REVISAO_DIFICIL', 'REVISAO_ERREI'] },
        },
        select: { id_topico: true, inicio: true },
      }),
    ]);

    const itens = [];
    for (const progresso of topicos) {
      if (!progresso.data_conclusao) continue;

      const statusAnterior = await buscarStatusUltimaRevisao(idUsuario, progresso.id_topico);
      for (const intervalo of calcularIntervalosAdaptativos(statusAnterior)) {
        const vencimento = inicioDoDia(adicionarDias(progresso.data_conclusao, intervalo));
        if (vencimento > limite) continue;

        const jaRevisado = revisoesFeitas.some(revisao =>
          revisao.id_topico === progresso.id_topico && revisao.inicio >= vencimento,
        );
        if (jaRevisado) continue;

        itens.push({
          idTopico: Number(progresso.id_topico),
          idDisciplina: progresso.topico.id_disciplina,
          disciplina: progresso.topico.disciplina?.nome ?? 'Disciplina',
          topico: progresso.topico.descricao,
          intervaloDias: intervalo,
          vencimento: vencimento.toISOString(),
          atrasada: vencimento < hoje,
          hoje: vencimento.getTime() === hoje.getTime(),
        });
        break;
      }
    }

    itens.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

    return NextResponse.json({
      pendentes: itens.filter(item => new Date(item.vencimento) <= hoje),
      proximas: itens.filter(item => new Date(item.vencimento) > hoje),
      resumo: {
        pendentes: itens.filter(item => new Date(item.vencimento) <= hoje).length,
        atrasadas: itens.filter(item => item.atrasada).length,
        proximas: itens.filter(item => new Date(item.vencimento) > hoje).length,
      },
    });
  } catch (err) {
    console.error('[GET /api/revisoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as { idTopico?: number; duracaoMinutos?: number; resultado?: string };
    if (!body.idTopico) {
      return NextResponse.json({ message: 'Topico obrigatorio.' }, { status: 400 });
    }

    const topico = await prisma.topico.findUnique({
      where: { id_topico: BigInt(body.idTopico) },
      include: { disciplina: true },
    });
    if (!topico || !topico.id_disciplina) {
      return NextResponse.json({ message: 'Topico nao encontrado.' }, { status: 404 });
    }

    const agora = new Date();
    const minutos = Math.max(5, body.duracaoMinutos ?? 20);
    const resultado = normalizarResultadoRevisao(body.resultado);

    await prisma.$transaction(async (tx) => {
      await tx.sessao_estudo.create({
        data: {
          id_usuario: idUsuario,
          id_disciplina: topico.id_disciplina!,
          id_topico: topico.id_topico,
          inicio: new Date(agora.getTime() - minutos * 60_000),
          fim: agora,
          duracao_minutos: minutos,
          status: STATUS_REVISAO[resultado],
        },
      });

      await tx.topico_progresso.upsert({
        where: { id_usuario_id_topico: { id_usuario: idUsuario, id_topico: topico.id_topico } },
        update: { concluido: true, data_conclusao: agora },
        create: { id_usuario: idUsuario, id_topico: topico.id_topico, concluido: true, data_conclusao: agora },
      });
    });

    return NextResponse.json({ ok: true, resultado });
  } catch (err) {
    console.error('[POST /api/revisoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
