import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import {
  criarSugestaoUsuario,
  listarSugestoesUsuario,
} from '@/service/sugestao.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const sugestoes = await listarSugestoesUsuario(idUsuario);
    return NextResponse.json(sugestoes);
  } catch (err) {
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json();
    const sugestao = await criarSugestaoUsuario(idUsuario, body);
    return NextResponse.json(sugestao, { status: 201 });
  } catch (err) {
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
