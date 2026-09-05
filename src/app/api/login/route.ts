import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth';
import { loginService } from '@/service/user.auth.service';
import { buscarStatusAssinatura } from '@/service/assinatura.service';

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Erro ao fazer login';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resultado = await loginService(body);
    const assinatura = await buscarStatusAssinatura(BigInt(resultado.idUsuario)).catch(() => null);
    const res = NextResponse.json({
      primeiroAcesso: resultado.primeiroAcesso,
      assinatura,
      redirectTo: resultado.primeiroAcesso ? '/onboarding' : '/dashboard',
    });

    res.cookies.set(AUTH_COOKIE, resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: resultado.expiresIn,
    });
    res.cookies.set('subscription_status', assinatura?.ativa ? 'ACTIVE' : 'INACTIVE', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: resultado.expiresIn,
    });

    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { message: getErrorMessage(err) },
      { status: 400 },
    );
  }
}
