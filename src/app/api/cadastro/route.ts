import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cadastroService } from '@/service/user.auth.service';
import {
  ativarAssinaturaUsuario,
  lerCookieCheckoutAssinado,
} from '@/service/assinatura.service';

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Erro ao realizar cadastro';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newUser = await cadastroService(body);
    const cookieStore = await cookies();
    const checkout = lerCookieCheckoutAssinado(cookieStore.get('checkout_aprovado')?.value);

    if (checkout) {
      await ativarAssinaturaUsuario(BigInt(newUser.id), {
        plano: checkout.plano,
        checkoutId: checkout.checkoutId,
        valorCentavos: checkout.valorCentavos,
        provider: process.env.PAYMENT_PROVIDER ?? 'MOCK',
        status: checkout.valorCentavos === 0 ? 'TRIALING' : 'ACTIVE',
        dias: checkout.valorCentavos === 0 ? 7 : undefined,
      });
    }

    const res = NextResponse.json({ ...newUser, assinaturaAtivada: Boolean(checkout) }, { status: 201 });
    res.cookies.delete('checkout_aprovado');
    res.cookies.set('step', 'LOGIN', { path: '/', maxAge: 60 * 30, sameSite: 'lax' });
    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { message: getErrorMessage(err) },
      { status: 400 },
    );
  }
}
