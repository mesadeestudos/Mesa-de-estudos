import crypto from 'crypto';
import prisma from '@/lib/prisma';

export type PlanoAssinatura = 'MENSAL' | 'SEMESTRAL' | 'ANUAL';
export type StatusAssinatura = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PENDING';

interface AssinaturaExisteRow {
  existe: string | null;
}

interface AssinaturaRow {
  id_assinatura: bigint;
  plano: PlanoAssinatura;
  status: StatusAssinatura;
  provider: string;
  provider_subscription_id: string | null;
  data_inicio: Date;
  data_fim: Date | null;
}

const PLANOS: Record<PlanoAssinatura, { valorCentavos: number; dias: number; label: string }> = {
  MENSAL: { valorCentavos: 1990, dias: 30, label: 'Plano Mensal' },
  SEMESTRAL: { valorCentavos: 10740, dias: 180, label: 'Plano Semestral' },
  ANUAL: { valorCentavos: 19080, dias: 365, label: 'Plano Anual' },
};

function normalizarPlano(plano?: string | null): PlanoAssinatura {
  const valor = (plano ?? '').toUpperCase();
  if (valor.includes('ANUAL')) return 'ANUAL';
  if (valor.includes('SEMESTRAL') || valor.includes('TRIMESTRAL')) return 'SEMESTRAL';
  return 'MENSAL';
}

function getCheckoutSecret() {
  const secret = process.env.CHECKOUT_SECRET || process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CHECKOUT_SECRET ou JWT_SECRET obrigatorio em producao.');
  }
  return secret || 'dev-checkout-secret-change-me';
}

function getPaymentProvider() {
  const provider = process.env.PAYMENT_PROVIDER;
  if (provider) return provider;
  return process.env.NODE_ENV === 'production' ? 'UNCONFIGURED' : 'MOCK';
}

async function tabelaAssinaturaExiste() {
  const resultado = await prisma.$queryRaw<AssinaturaExisteRow[]>`
    SELECT to_regclass('planejamento.assinatura_usuario')::text AS existe
  `;
  return Boolean(resultado[0]?.existe);
}

export async function buscarStatusAssinatura(idUsuario: bigint) {
  const existe = await tabelaAssinaturaExiste();
  if (!existe) {
    return {
      configuracaoPendente: true,
      ativa: process.env.SUBSCRIPTION_REQUIRED === 'true' ? false : true,
      assinatura: null,
      motivo: 'Tabela de assinaturas ainda nao configurada.',
    };
  }

  const [assinatura] = await prisma.$queryRaw<AssinaturaRow[]>`
    SELECT
      id_assinatura,
      plano,
      status,
      provider,
      provider_subscription_id,
      data_inicio,
      data_fim
    FROM planejamento.assinatura_usuario
    WHERE id_usuario = ${idUsuario}
    ORDER BY data_criacao DESC
    LIMIT 1
  `;

  const ativa = Boolean(
    assinatura &&
    ['ACTIVE', 'TRIALING'].includes(assinatura.status) &&
    (!assinatura.data_fim || assinatura.data_fim >= new Date()),
  );

  return {
    configuracaoPendente: false,
    ativa,
    assinatura: assinatura ? {
      id: Number(assinatura.id_assinatura),
      plano: assinatura.plano,
      status: assinatura.status,
      provider: assinatura.provider,
      providerSubscriptionId: assinatura.provider_subscription_id,
      dataInicio: assinatura.data_inicio.toISOString(),
      dataFim: assinatura.data_fim?.toISOString() ?? null,
    } : null,
    motivo: ativa ? 'Assinatura ativa.' : 'Assinatura ausente, vencida ou inativa.',
  };
}

export async function exigirAssinaturaAtiva(idUsuario: bigint) {
  const status = await buscarStatusAssinatura(idUsuario);
  if (status.ativa) return status;
  throw Object.assign(new Error(status.motivo), { status: 402 });
}

export function criarCheckoutPendente(input: { plano?: string | null }) {
  const plano = normalizarPlano(input.plano);
  const checkoutId = crypto.randomUUID();
  const planoConfig = PLANOS[plano];
  const provider = getPaymentProvider();

  if (provider === 'UNCONFIGURED') {
    throw Object.assign(new Error('Gateway de pagamento nao configurado.'), { status: 503 });
  }

  if (provider === 'MOCK' && process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
    throw Object.assign(new Error('Pagamento mock bloqueado em producao.'), { status: 503 });
  }

  return {
    checkoutId,
    plano,
    provider,
    valorCentavos: planoConfig.valorCentavos,
    label: planoConfig.label,
    url: provider === 'STRIPE'
      ? null
      : `/pagamento?checkout=${checkoutId}&plano=${encodeURIComponent(planoConfig.label)}&valor=${encodeURIComponent((planoConfig.valorCentavos / 100).toFixed(2).replace('.', ','))}`,
  };
}

export function criarTrialPendente() {
  const checkoutId = crypto.randomUUID();
  return {
    checkoutId,
    plano: 'MENSAL' as PlanoAssinatura,
    valorCentavos: 0,
  };
}

export function criarCookieCheckoutAssinado(input: { checkoutId: string; plano: PlanoAssinatura; valorCentavos: number }) {
  const payload = JSON.stringify({
    checkoutId: input.checkoutId,
    plano: input.plano,
    valorCentavos: input.valorCentavos,
    aprovadoEm: Date.now(),
  });
  const secret = getCheckoutSecret();
  const assinatura = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${assinatura}`;
}

export function lerCookieCheckoutAssinado(valor?: string | null) {
  if (!valor) return null;
  const [payloadBase64, assinatura] = valor.split('.');
  if (!payloadBase64 || !assinatura) return null;
  const payload = Buffer.from(payloadBase64, 'base64url').toString('utf8');
  const secret = getCheckoutSecret();
  const assinaturaEsperada = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(assinaturaEsperada))) return null;
  const parsed = JSON.parse(payload) as { checkoutId: string; plano: PlanoAssinatura; valorCentavos: number; aprovadoEm: number };
  if (Date.now() - parsed.aprovadoEm > 1000 * 60 * 60 * 24) return null;
  return parsed;
}

export async function ativarAssinaturaUsuario(
  idUsuario: bigint,
  input: {
    plano: PlanoAssinatura;
    checkoutId?: string | null;
    valorCentavos?: number | null;
    provider?: string | null;
    status?: StatusAssinatura;
    dias?: number;
  },
) {
  const existe = await tabelaAssinaturaExiste();
  if (!existe) return null;

  const dias = input.dias ?? PLANOS[input.plano].dias;
  const dataFim = new Date(Date.now() + dias * 86_400_000);
  const status = input.status ?? 'ACTIVE';

  await prisma.$executeRaw`
    INSERT INTO planejamento.assinatura_usuario
      (id_usuario, plano, status, provider, checkout_id, valor_centavos, data_inicio, data_fim)
    VALUES
      (${idUsuario}, ${input.plano}, ${status}, ${input.provider ?? 'MOCK'}, ${input.checkoutId ?? null}, ${input.valorCentavos ?? PLANOS[input.plano].valorCentavos}, NOW(), ${dataFim})
  `;

  return buscarStatusAssinatura(idUsuario);
}
