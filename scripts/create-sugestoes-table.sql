CREATE TABLE IF NOT EXISTS planejamento.sugestao_usuario (
  id_sugestao BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  prioridade VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  titulo VARCHAR(140) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'NOVA',
  pagina_origem VARCHAR(120) NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sugestao_categoria_check CHECK (categoria IN ('MELHORIA', 'BUG', 'CONTEUDO', 'USABILIDADE', 'OUTRO')),
  CONSTRAINT sugestao_prioridade_check CHECK (prioridade IN ('BAIXA', 'NORMAL', 'ALTA')),
  CONSTRAINT sugestao_status_check CHECK (status IN ('NOVA', 'EM_ANALISE', 'PLANEJADA', 'CONCLUIDA', 'RECUSADA'))
);

CREATE INDEX IF NOT EXISTS idx_sugestao_usuario_data
  ON planejamento.sugestao_usuario (id_usuario, data_criacao DESC);

CREATE INDEX IF NOT EXISTS idx_sugestao_status
  ON planejamento.sugestao_usuario (status, data_criacao DESC);
