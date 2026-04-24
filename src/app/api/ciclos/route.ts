import { NextResponse } from 'next/server';
import { cookies }       from 'next/headers';
import jwt               from 'jsonwebtoken';
import { criarCicloService, buscarCicloService, desativarCicloService, avancarCicloService } from '@/service/ciclo.service';

const SECRET = process.env.JWT_SECRET || 'secret';

async function autenticar() {
  const cookieStore = await cookies();
  const token       = cookieStore.get('authorization')?.value;
  if (!token) throw Object.assign(new Error('Não autenticado.'), { status: 401 });
  const payload = jwt.verify(token, SECRET) as { id: number };
  return BigInt(payload.id);
}

function toHttpError(err: unknown): { status: number; message: string } {
  const e = err as any;
  const status  = e?.status ?? (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError' ? 401 : 500);
  const message = e?.message ?? String(e) ?? 'Erro desconhecido';
  return { status, message };
}

export async function GET() {
  try {
    const idUsuario = await autenticar();
    const ciclo     = await buscarCicloService(idUsuario);
    return NextResponse.json(ciclo);
  } catch (err) {
    console.error('[GET /api/ciclos] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticar();
    const body      = await req.json();
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
    const idUsuario = await autenticar();
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
    const idUsuario = await autenticar();
    await desativarCicloService(idUsuario);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/ciclos] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
