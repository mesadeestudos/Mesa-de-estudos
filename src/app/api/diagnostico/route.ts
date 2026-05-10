import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { buscarDiagnosticoInicial, salvarDiagnosticoInicial } from '@/service/diagnostico-inicial.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    return NextResponse.json(await buscarDiagnosticoInicial(idUsuario));
  } catch (err) {
    console.error('[GET /api/diagnostico] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json();
    return NextResponse.json(await salvarDiagnosticoInicial(idUsuario, body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/diagnostico] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
