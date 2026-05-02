import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        nome_completo: true,
        nome_usuario: true,
        email: true,
        foto_url: true,
        ativo: true,
        primeiro_acesso: true,
        email_verificado: true,
        data_criacao: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      id: Number(usuario.id_usuario),
      nomeCompleto: usuario.nome_completo,
      nomeUsuario: usuario.nome_usuario ?? '',
      email: usuario.email,
      fotoUrl: usuario.foto_url ?? '',
      ativo: Boolean(usuario.ativo),
      primeiroAcesso: Boolean(usuario.primeiro_acesso),
      emailVerificado: Boolean(usuario.email_verificado),
      dataCriacao: usuario.data_criacao?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('[GET /api/perfil] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as { nomeCompleto?: string; nomeUsuario?: string; fotoUrl?: string };

    const nomeCompleto = body.nomeCompleto?.trim();
    const nomeUsuario = body.nomeUsuario?.trim().toLowerCase().replace(/\s+/g, '_');
    const fotoUrl = body.fotoUrl?.trim();

    if (!nomeCompleto || nomeCompleto.length < 3) {
      return NextResponse.json({ message: 'Informe um nome com pelo menos 3 caracteres.' }, { status: 400 });
    }

    if (nomeUsuario && !/^[a-z0-9._-]{3,30}$/.test(nomeUsuario)) {
      return NextResponse.json({ message: 'O nome de usuário deve ter 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou underline.' }, { status: 400 });
    }

    if (nomeUsuario) {
      const existente = await prisma.usuario.findFirst({
        where: { nome_usuario: nomeUsuario, NOT: { id_usuario: idUsuario } },
        select: { id_usuario: true },
      });
      if (existente) {
        return NextResponse.json({ message: 'Este nome de usuário já está em uso.' }, { status: 409 });
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id_usuario: idUsuario },
      data: {
        nome_completo: nomeCompleto,
        nome_usuario: nomeUsuario || null,
        foto_url: fotoUrl || null,
      },
      select: { nome_completo: true, nome_usuario: true, email: true, foto_url: true },
    });

    const token = jwt.sign(
      {
        id: String(idUsuario),
        email: usuario.email,
        nome: usuario.nome_completo,
        primeiro_acesso: false,
      },
      SECRET,
      { expiresIn: '1h' },
    );

    const res = NextResponse.json({
      ok: true,
      perfil: {
        nomeCompleto: usuario.nome_completo,
        nomeUsuario: usuario.nome_usuario ?? '',
        email: usuario.email,
        fotoUrl: usuario.foto_url ?? '',
      },
    });

    res.cookies.set('authorization', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return res;
  } catch (err) {
    console.error('[PATCH /api/perfil] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

