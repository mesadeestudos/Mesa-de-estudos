import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { listarSimulados, registrarSimulado } from '@/service/simulado.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    return NextResponse.json(await listarSimulados(idUsuario));
  } catch (err) {
    console.error('[GET /api/simulados] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json();
    return NextResponse.json(await registrarSimulado(idUsuario, body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/simulados] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
