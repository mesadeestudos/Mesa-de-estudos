import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import {
  listarRevisoesInteligentes,
  registrarRevisaoInteligente,
} from '@/service/revisoes-inteligentes.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const itens = await listarRevisoesInteligentes(idUsuario, 14);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return NextResponse.json({
      pendentes: itens.filter(item => new Date(item.vencimento) <= hoje),
      proximas: itens.filter(item => new Date(item.vencimento) > hoje),
      resumo: {
        pendentes: itens.filter(item => new Date(item.vencimento) <= hoje).length,
        atrasadas: itens.filter(item => item.atrasada).length,
        proximas: itens.filter(item => new Date(item.vencimento) > hoje).length,
      },
    });
  } catch (err) {
    console.error('[GET /api/revisoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as { idTopico?: number; duracaoMinutos?: number; resultado?: string };
    const resultado = await registrarRevisaoInteligente(idUsuario, body);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error('[POST /api/revisoes] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
