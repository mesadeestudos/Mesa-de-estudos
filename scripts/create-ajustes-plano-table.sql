CREATE TABLE IF NOT EXISTS planejamento.ajuste_plano_usuario (
  id_ajuste_plano BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  horas_por_dia NUMERIC(4,2) NULL,
  motivo TEXT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ajuste_plano_tipo_check CHECK (tipo IN ('PAUSA', 'META_TEMPORARIA')),
  CONSTRAINT ajuste_plano_periodo_check CHECK (data_fim >= data_inicio),
  CONSTRAINT ajuste_plano_horas_check CHECK (horas_por_dia IS NULL OR (horas_por_dia >= 1 AND horas_por_dia <= 12))
);

CREATE INDEX IF NOT EXISTS idx_ajuste_plano_usuario_periodo
  ON planejamento.ajuste_plano_usuario (id_usuario, data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS idx_ajuste_plano_usuario_tipo
  ON planejamento.ajuste_plano_usuario (id_usuario, tipo);
