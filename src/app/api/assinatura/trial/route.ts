import { NextResponse } from 'next/server';
import {
  criarCookieCheckoutAssinado,
  criarTrialPendente,
} from '@/service/assinatura.service';

export async function GET(req: Request) {
  const trial = criarTrialPendente();
  const token = criarCookieCheckoutAssinado({
    checkoutId: trial.checkoutId,
    plano: trial.plano,
    valorCentavos: trial.valorCentavos,
  });

  const res = NextResponse.redirect(new URL('/cadastro', req.url));
  res.cookies.set('checkout_aprovado', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  res.cookies.set('step', 'CADASTRO', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return res;
}
