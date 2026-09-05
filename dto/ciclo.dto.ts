export interface DisciplinaCicloDTO {
  id:              number;
  dificuldade?:    string;
  minutosAlocados: number;
  ordem:           number;
}

export interface CriarCicloDTO {
  horasDiarias: number;
  idCargo:      number;
  modo:         'automatico' | 'personalizado';
  metodoEstudo?: string;
  momentoEstudo?: string;
  disciplinas:  Array<{ id: number; dificuldade: string }>;
}

export interface CicloResponseDTO {
  idCiclo:      number;
  idPlano:      number;
  distribuicao: DisciplinaCicloDTO[];
}
