import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { buscarStatusAssinatura } from '@/service/assinatura.service';
import { buscarCicloService } from '@/service/ciclo.service';
import { gerarAssistenteEstudo } from '@/service/assistente-estudo.service';
import { buscarDiagnosticoInicial } from '@/service/diagnostico-inicial.service';

export async function GET() {
  try {
    const idUsuario = await autenticarUsuario();
    const [assinatura, ciclo, assistente, diagnostico] = await Promise.all([
      buscarStatusAssinatura(idUsuario),
      buscarCicloService(idUsuario),
      gerarAssistenteEstudo(idUsuario),
      buscarDiagnosticoInicial(idUsuario),
    ]);

    return NextResponse.json({
      assinatura,
      temCiclo: Boolean(ciclo),
      ciclo,
      assistente,
      diagnostico,
      passos: {
        assinatura: assinatura.ativa,
        diagnostico: diagnostico.completo,
        ciclo: Boolean(ciclo),
        primeiraSessao: Boolean(ciclo?.hojeSlots?.[0]),
      },
    });
  } catch (err) {
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
