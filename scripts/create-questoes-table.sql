CREATE TABLE IF NOT EXISTS planejamento.questao_treino (
  id_questao_treino BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL,
  id_disciplina INT NOT NULL,
  id_topico BIGINT NULL,
  total_questoes INT NOT NULL,
  total_acertos INT NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  motivo_erro VARCHAR(40) NULL,
  confianca VARCHAR(30) NULL,
  observacao TEXT NULL,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questao_treino_total_check CHECK (total_questoes > 0),
  CONSTRAINT questao_treino_acertos_check CHECK (total_acertos >= 0 AND total_acertos <= total_questoes)
);

CREATE INDEX IF NOT EXISTS idx_questao_treino_usuario
  ON planejamento.questao_treino (id_usuario);

CREATE INDEX IF NOT EXISTS idx_questao_treino_disciplina
  ON planejamento.questao_treino (id_usuario, id_disciplina);

CREATE INDEX IF NOT EXISTS idx_questao_treino_topico
  ON planejamento.questao_treino (id_usuario, id_topico);

CREATE INDEX IF NOT EXISTS idx_questao_treino_motivo
  ON planejamento.questao_treino (id_usuario, motivo_erro);
