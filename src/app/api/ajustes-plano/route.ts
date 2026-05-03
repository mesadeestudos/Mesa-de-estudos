import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { buscarAjustesPlano, criarAjustePlano } from '@/service/ajuste-plano.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const ajustes = await buscarAjustesPlano(idUsuario);
    return NextResponse.json(ajustes);
  } catch (err) {
    console.error('[GET /api/ajustes-plano] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json() as {
      tipo?: 'PAUSA' | 'META_TEMPORARIA';
      dataInicio?: string;
      dataFim?: string;
      horasPorDia?: number | null;
      motivo?: string | null;
    };

    if (!body.tipo || !body.dataInicio || !body.dataFim) {
      return NextResponse.json({ message: 'Tipo, data de inicio e data final sao obrigatorios.' }, { status: 400 });
    }

    const ajustes = await criarAjustePlano(idUsuario, {
      tipo: body.tipo,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      horasPorDia: body.horasPorDia,
      motivo: body.motivo,
    });

    return NextResponse.json(ajustes, { status: 201 });
  } catch (err) {
    console.error('[POST /api/ajustes-plano] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
