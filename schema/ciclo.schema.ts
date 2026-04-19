import { z } from 'zod';

const disciplinaInputSchema = z.object({
  id:          z.number().int().positive(),
  dificuldade: z.enum(['Baixo', 'Médio', 'Alto']).optional(),
});

export const criarCicloSchema = z.object({
  horasDiarias: z.number().min(1).max(12),
  idCargo:      z.number().int().positive(),
  modo:         z.enum(['automatico', 'personalizado']),
  disciplinas:  z.array(disciplinaInputSchema).min(1).max(60),
});

export type CriarCicloInput = z.infer<typeof criarCicloSchema>;
