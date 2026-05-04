import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { buscarStatusAssinatura } from '@/service/assinatura.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const status = await buscarStatusAssinatura(idUsuario);
    return NextResponse.json(status);
  } catch (err) {
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
