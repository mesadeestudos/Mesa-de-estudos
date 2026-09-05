UPDATE planejamento.assinatura_usuario
SET plano = 'SEMESTRAL'
WHERE plano = 'TRIMESTRAL';

ALTER TABLE planejamento.assinatura_usuario
DROP CONSTRAINT IF EXISTS assinatura_plano_check;

ALTER TABLE planejamento.assinatura_usuario
ADD CONSTRAINT assinatura_plano_check
CHECK (plano IN ('MENSAL', 'SEMESTRAL', 'ANUAL'));
