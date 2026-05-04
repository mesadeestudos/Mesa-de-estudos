import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const signature = req.headers.get('x-webhook-secret');

  if (secret && signature !== secret) {
    return NextResponse.json({ message: 'Webhook nao autorizado.' }, { status: 401 });
  }

  const event = await req.json().catch(() => null);

  return NextResponse.json({
    received: true,
    provider: process.env.PAYMENT_PROVIDER ?? 'MOCK',
    eventType: event?.type ?? 'unknown',
    message: 'Webhook recebido. Configure o provider real para atualizar assinatura por evento.',
  });
}
