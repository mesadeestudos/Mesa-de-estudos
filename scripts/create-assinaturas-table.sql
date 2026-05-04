CREATE TABLE IF NOT EXISTS planejamento.assinatura_usuario (
  id_assinatura BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL,
  plano VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'MOCK',
  provider_customer_id VARCHAR(120) NULL,
  provider_subscription_id VARCHAR(120) NULL,
  checkout_id VARCHAR(120) NULL,
  valor_centavos INTEGER NULL,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMPTZ NULL,
  data_cancelamento TIMESTAMPTZ NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assinatura_status_check CHECK (status IN ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'PENDING')),
  CONSTRAINT assinatura_plano_check CHECK (plano IN ('MENSAL', 'TRIMESTRAL', 'ANUAL'))
);

CREATE INDEX IF NOT EXISTS idx_assinatura_usuario_status
  ON planejamento.assinatura_usuario (id_usuario, status);

CREATE INDEX IF NOT EXISTS idx_assinatura_checkout
  ON planejamento.assinatura_usuario (checkout_id);
