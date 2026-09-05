-- Atualiza a check constraint do campo metodo em plano_estudo
-- para aceitar todos os valores usados pelo sistema atual.
--
-- Execute antes de criar novos ciclos com momentos diferentes de CICLO_AUTOMATICO.

ALTER TABLE planejamento.plano_estudo
  DROP CONSTRAINT IF EXISTS plano_estudo_metodo_check;

ALTER TABLE planejamento.plano_estudo
  ADD CONSTRAINT plano_estudo_metodo_check
  CHECK (metodo IN (
    'AUTOMATICO',
    'CICLO_INTELIGENTE',
    'PLANO_POR_PRAZO',
    'MODO_QUESTOES',
    'REVISAO_INTENSIVA',
    'RECUPERACAO_ATRASO',
    'RETA_FINAL',
    'POMODORO_BLOCOS',
    'TRILHA_OBJETIVO',
    'MANUAL_ASSISTIDO'
  ));
