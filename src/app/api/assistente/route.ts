import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { gerarAssistenteEstudo } from '@/service/assistente-estudo.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const assistente = await gerarAssistenteEstudo(idUsuario);
    return NextResponse.json(assistente);
  } catch (err) {
    console.error('[GET /api/assistente] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
