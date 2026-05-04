import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { buscarStatusAssinatura } from '@/service/assinatura.service';
import { buscarCicloService } from '@/service/ciclo.service';
import { gerarAssistenteEstudo } from '@/service/assistente-estudo.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const [assinatura, ciclo, assistente] = await Promise.all([
      buscarStatusAssinatura(idUsuario),
      buscarCicloService(idUsuario),
      gerarAssistenteEstudo(idUsuario),
    ]);

    return NextResponse.json({
      assinatura,
      temCiclo: Boolean(ciclo),
      ciclo,
      assistente,
      passos: {
        assinatura: assinatura.ativa,
        ciclo: Boolean(ciclo),
        primeiraSessao: Boolean(ciclo?.hojeSlots?.[0]),
      },
    });
  } catch (err) {
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
