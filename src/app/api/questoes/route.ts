import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { atualizarQuestoes, buscarResumoQuestoes, registrarQuestoes } from '@/service/questoes.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const resumo = await buscarResumoQuestoes(idUsuario);
    return NextResponse.json(resumo);
  } catch (err) {
    console.error('[GET /api/questoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as {
      idDisciplina?: number;
      idTopico?: number | null;
      total?: number;
      acertos?: number;
    };

    if (!body.idDisciplina || !body.total || body.acertos === undefined) {
      return NextResponse.json({ message: 'Disciplina, total e acertos sao obrigatorios.' }, { status: 400 });
    }

    const resultado = await registrarQuestoes(idUsuario, {
      idDisciplina: body.idDisciplina,
      idTopico: body.idTopico ?? null,
      total: body.total,
      acertos: body.acertos,
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    console.error('[POST /api/questoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as {
      id?: number;
      idDisciplina?: number;
      idTopico?: number | null;
      total?: number;
      acertos?: number;
    };

    if (!body.id || !body.idDisciplina || !body.total || body.acertos === undefined) {
      return NextResponse.json({ message: 'Id, disciplina, total e acertos sao obrigatorios.' }, { status: 400 });
    }

    const resultado = await atualizarQuestoes(idUsuario, {
      id: body.id,
      idDisciplina: body.idDisciplina,
      idTopico: body.idTopico ?? null,
      total: body.total,
      acertos: body.acertos,
    });

    return NextResponse.json(resultado);
  } catch (err) {
    console.error('[PUT /api/questoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
