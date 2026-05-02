import { NextResponse } from 'next/server';
import { criarCicloService, buscarCicloService, desativarCicloService, avancarCicloService } from '@/service/ciclo.service';
import { autenticarUsuario, toHttpError } from '@/lib/auth';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const ciclo = await buscarCicloService(idUsuario);
    return NextResponse.json(ciclo);
  } catch (err) {
    console.error('[GET /api/ciclos] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json();
    const resultado = await criarCicloService(body, idUsuario);
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    console.error('[POST /api/ciclos] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH() {
  try {
    const idUsuario = await autenticarUsuario();
    const resultado = await avancarCicloService(idUsuario);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error('[PATCH /api/ciclos] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE() {
  try {
    const idUsuario = await autenticarUsuario();
    await desativarCicloService(idUsuario);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/ciclos] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
