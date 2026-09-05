import { NextResponse } from 'next/server';
import {
  criarCheckoutPendente,
  criarCookieCheckoutAssinado,
} from '@/service/assinatura.service';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { plano?: string };
    const checkout = criarCheckoutPendente({ plano: body.plano });
    const token = criarCookieCheckoutAssinado({
      checkoutId: checkout.checkoutId,
      plano: checkout.plano,
      valorCentavos: checkout.valorCentavos,
    });

    const res = NextResponse.json({
      checkoutId: checkout.checkoutId,
      provider: checkout.provider,
      plano: checkout.plano,
      valorCentavos: checkout.valorCentavos,
      redirectUrl: checkout.url,
      mock: checkout.provider !== 'STRIPE',
    });

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
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { message: e.message ?? 'Nao foi possivel iniciar o pagamento.' },
      { status: e.status ?? 500 },
    );
  }
}
