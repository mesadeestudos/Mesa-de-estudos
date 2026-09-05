CREATE TABLE IF NOT EXISTS planejamento.diagnostico_inicial_usuario (
  id_diagnostico BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL UNIQUE,
  nivel_atual VARCHAR(30) NOT NULL,
  dias_ate_prova INTEGER NULL,
  estudou_edital_antes BOOLEAN NOT NULL DEFAULT false,
  dificuldade_principal VARCHAR(40) NOT NULL,
  preferencia_sessao VARCHAR(30) NOT NULL,
  materias_temidas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  objetivo TEXT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT diagnostico_nivel_check CHECK (nivel_atual IN ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO')),
  CONSTRAINT diagnostico_dificuldade_check CHECK (dificuldade_principal IN ('CONSTANCIA', 'TEORIA', 'REVISAO', 'QUESTOES', 'TEMPO')),
  CONSTRAINT diagnostico_sessao_check CHECK (preferencia_sessao IN ('CURTA', 'MEDIA', 'LONGA'))
);

ALTER TABLE planejamento.questao_treino
  ADD COLUMN IF NOT EXISTS motivo_erro VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS confianca VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS observacao TEXT NULL;

CREATE TABLE IF NOT EXISTS planejamento.simulado (
  id_simulado BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  data_realizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  total_questoes INTEGER NOT NULL,
  total_acertos INTEGER NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  observacao TEXT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT simulado_total_check CHECK (total_questoes > 0),
  CONSTRAINT simulado_acertos_check CHECK (total_acertos >= 0 AND total_acertos <= total_questoes)
);

CREATE TABLE IF NOT EXISTS planejamento.simulado_disciplina (
  id_simulado_disciplina BIGSERIAL PRIMARY KEY,
  id_simulado BIGINT NOT NULL REFERENCES planejamento.simulado(id_simulado) ON DELETE CASCADE,
  id_disciplina INTEGER NOT NULL,
  total_questoes INTEGER NOT NULL,
  total_acertos INTEGER NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  CONSTRAINT simulado_disc_total_check CHECK (total_questoes > 0),
  CONSTRAINT simulado_disc_acertos_check CHECK (total_acertos >= 0 AND total_acertos <= total_questoes)
);

CREATE INDEX IF NOT EXISTS idx_diagnostico_inicial_usuario
  ON planejamento.diagnostico_inicial_usuario (id_usuario);

CREATE INDEX IF NOT EXISTS idx_questao_treino_motivo
  ON planejamento.questao_treino (id_usuario, motivo_erro);

CREATE INDEX IF NOT EXISTS idx_simulado_usuario_data
  ON planejamento.simulado (id_usuario, data_realizacao DESC);

CREATE INDEX IF NOT EXISTS idx_simulado_disciplina
  ON planejamento.simulado_disciplina (id_disciplina, percentual);
