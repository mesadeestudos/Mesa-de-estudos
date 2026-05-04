import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autenticarUsuario, toHttpError } from '@/lib/auth';

export async function POST() {
  try {
    const idUsuario = await autenticarUsuario();
    await prisma.usuario.update({
      where: { id_usuario: idUsuario },
      data: { primeiro_acesso: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
