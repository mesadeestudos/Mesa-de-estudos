import { NextResponse } from 'next/server';
import { autenticarUsuario, toHttpError } from '@/lib/auth';
import { gerarAssistenteEstudo } from '@/service/assistente-estudo.service';

function responderPergunta(pergunta: string, assistente: Awaited<ReturnType<typeof gerarAssistenteEstudo>>) {
  const texto = pergunta.toLowerCase();
  const sinais = assistente.sinais;

  if (texto.includes('hoje') || texto.includes('agora') || texto.includes('estudar')) {
    return `${assistente.narrativa} Próxima ação: ${assistente.acaoPrimaria}.`;
  }

  if (texto.includes('atras')) {
    if (sinais.revisoesAtrasadas > 0) {
      return `Você está com ${sinais.revisoesAtrasadas} revisão(ões) atrasada(s). Comece por revisões, depois volte ao ciclo.`;
    }
    if (sinais.precisaRebalancear) {
      return 'Não há revisão atrasada crítica, mas há disciplina pedindo rebalanceamento. Aplique o ajuste antes de avançar muito conteúdo novo.';
    }
    return 'Não encontrei atraso crítico agora. Siga a próxima ação indicada na Minha Mesa.';
  }

  if (texto.includes('quest') || texto.includes('fui mal') || texto.includes('errei')) {
    const erro = sinais.erroCritico;
    if (erro) {
      return `Corrija primeiro ${erro.topico}: foram ${erro.erros} erro(s). ${erro.recomendacao}`;
    }
    const pior = sinais.piorDesempenhoQuestoes;
    if (pior) {
      return `Faça uma bateria curta ou revise ${pior.disciplina}. O aproveitamento está em ${pior.percentual}%.`;
    }
    return 'Registre uma bateria por disciplina e tópico. Com isso eu consigo separar falta de teoria, distração e interpretação.';
  }

  if (texto.includes('2 horas') || texto.includes('duas horas') || texto.includes('pouco tempo')) {
    return sinais.revisoesAtrasadas > 0
      ? 'Com pouco tempo, faça uma revisão atrasada e uma bateria curta de 10 questões. Deixe conteúdo novo para depois.'
      : `Com pouco tempo, faça a ação principal: ${assistente.acaoPrimaria}. Se sobrar tempo, registre questões para calibrar o próximo passo.`;
  }

  if (texto.includes('simulado')) {
    return sinais.simulados?.mensagem
      ? `${sinais.simulados.mensagem} Depois do simulado, revise as disciplinas abaixo de 70% antes de voltar ao ciclo normal.`
      : 'Registre o simulado com total, acertos e disciplinas. Eu vou apontar queda recente e matéria crítica.';
  }

  return `${assistente.explicacao.principal} Minha recomendação agora é: ${assistente.acaoPrimaria}. ${assistente.explicacao.consequencia}`;
}

export async function POST(req: Request) {
  try {
    const idUsuario = await autenticarUsuario();
    const body = await req.json().catch(() => ({})) as { pergunta?: string };
    const pergunta = body.pergunta?.trim();
    if (!pergunta) {
      return NextResponse.json({ message: 'Pergunta obrigatória.' }, { status: 400 });
    }

    const assistente = await gerarAssistenteEstudo(idUsuario);
    return NextResponse.json({
      pergunta,
      resposta: responderPergunta(pergunta, assistente),
      recomendacaoAtual: {
        tipo: assistente.tipo,
        titulo: assistente.titulo,
        destino: assistente.destino,
        acaoPrimaria: assistente.acaoPrimaria,
      },
    });
  } catch (err) {
    console.error('[POST /api/assistente/conversa] erro:', err);
    const { status, message } = toHttpError(err);
    return NextResponse.json({ message }, { status });
  }
}
