import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { gerarAgendaService } from '@/service/agenda.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const agenda = await gerarAgendaService(idUsuario);
    return NextResponse.json(agenda);
  } catch (err) {
    console.error('[GET /api/agenda] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
