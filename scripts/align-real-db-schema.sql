ALTER TABLE planejamento.sessao_estudo
  ADD COLUMN IF NOT EXISTS id_ciclo_disciplina BIGINT NULL,
  ADD COLUMN IF NOT EXISTS qualidade VARCHAR(20) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessao_estudo_id_ciclo_disciplina_fkey'
      AND conrelid = 'planejamento.sessao_estudo'::regclass
  ) THEN
    ALTER TABLE planejamento.sessao_estudo
      ADD CONSTRAINT sessao_estudo_id_ciclo_disciplina_fkey
      FOREIGN KEY (id_ciclo_disciplina)
      REFERENCES planejamento.ciclo_disciplina(id_ciclo_disciplina)
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessao_estudo_ciclo_disciplina
  ON planejamento.sessao_estudo (id_ciclo_disciplina);

ALTER TABLE planejamento.sessao_estudo
  DROP CONSTRAINT IF EXISTS sessao_estudo_status_check;

ALTER TABLE planejamento.sessao_estudo
  ADD CONSTRAINT sessao_estudo_status_check
  CHECK (status IN (
    'EM_ANDAMENTO',
    'PAUSADO',
    'FINALIZADO',
    'CONCLUIDA',
    'PULADA',
    'REMARCADA',
    'REVISAO',
    'REVISAO_FACIL',
    'REVISAO_MEDIO',
    'REVISAO_DIFICIL',
    'REVISAO_ERREI'
  ));
