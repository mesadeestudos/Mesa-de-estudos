import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { autenticarUsuario, toHttpError } from '@/lib/auth';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const [usuario, sessoesAtivas] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id_usuario: idUsuario },
        select: { email: true, email_verificado: true, data_criacao: true },
      }).catch(() => null),
      prisma.sessao.count({ where: { id_usuario: idUsuario, revogado: false, expira_em: { gt: new Date() } } }),
    ]);

    return NextResponse.json({
      email: usuario?.email ?? '',
      emailVerificado: Boolean(usuario?.email_verificado),
      dataCriacao: usuario?.data_criacao?.toISOString() ?? null,
      sessoesAtivas,
    });
  } catch (err) {
    console.error('[GET /api/configuracoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as { senhaAtual?: string; novaSenha?: string; confirmarSenha?: string };

    if (!body.senhaAtual || !body.novaSenha || !body.confirmarSenha) {
      return NextResponse.json({ message: 'Preencha a senha atual, nova senha e confirmação.' }, { status: 400 });
    }

    if (body.novaSenha !== body.confirmarSenha) {
      return NextResponse.json({ message: 'A confirmação da nova senha não confere.' }, { status: 400 });
    }

    if (body.novaSenha.length < 8) {
      return NextResponse.json({ message: 'A nova senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    const credencial = await prisma.credencial.findUnique({ where: { id_usuario: idUsuario } });
    if (!credencial) {
      return NextResponse.json({ message: 'Credencial não encontrada.' }, { status: 404 });
    }

    const senhaValida = await bcrypt.compare(body.senhaAtual, credencial.senha_hash);
    if (!senhaValida) {
      return NextResponse.json({ message: 'Senha atual incorreta.' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(body.novaSenha, 10);
    await prisma.credencial.update({
      where: { id_usuario: idUsuario },
      data: { senha_hash: senhaHash, reset_token: null, reset_token_expira_em: null },
    });

    return NextResponse.json({ ok: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('[PATCH /api/configuracoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE() {
  try {
    const idUsuario = await autenticarUsuario();
    await prisma.sessao.updateMany({
      where: { id_usuario: idUsuario, revogado: false },
      data: { revogado: true },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.delete('authorization');
    return res;
  } catch (err) {
    console.error('[DELETE /api/configuracoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
