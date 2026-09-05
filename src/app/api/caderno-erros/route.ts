import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { listarCadernoErros } from '@/service/caderno-erros.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    return NextResponse.json(await listarCadernoErros(idUsuario));
  } catch (err) {
    console.error('[GET /api/caderno-erros] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
