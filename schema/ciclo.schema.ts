import { z } from 'zod';
import { METODOS_ESTUDO, MOMENTOS_ESTUDO } from '@/lib/studyMethods';

const disciplinaInputSchema = z.object({
  id: z.number().int().positive(),
  dificuldade: z.enum(['Baixo', 'Médio', 'Alto']).default('Médio'),
});

export const criarCicloSchema = z.object({
  horasDiarias: z.number().min(1).max(12),
  idCargo: z.number().int().positive(),
  modo: z.enum(['automatico', 'personalizado']),
  metodoEstudo: z.enum(METODOS_ESTUDO).optional(),
  momentoEstudo: z.enum(MOMENTOS_ESTUDO).optional(),
  ritmo: z.enum(['focado', 'equilibrado', 'variado']).optional(),
  disciplinas: z.array(disciplinaInputSchema).min(1).max(60),
});

export type CriarCicloInput = z.infer<typeof criarCicloSchema>;
