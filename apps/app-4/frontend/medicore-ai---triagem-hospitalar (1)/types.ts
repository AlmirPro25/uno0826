export enum TriagePriority {
  RED = 'Emergência (Vermelho)',
  ORANGE = 'Muito Urgente (Laranja)',
  YELLOW = 'Urgente (Amarelo)',
  GREEN = 'Pouco Urgente (Verde)',
  BLUE = 'Não Urgente (Azul)',
}

export interface TriageReport {
  patientComplaint: string;
  historyOfPresentIllness: string;
  vitalSignsNote: string;
  suspectedDiagnosis: string[];
  recommendedSpecialty: string;
  priority: TriagePriority;
  reasoning: string;
  externalReferences: Array<{ uri: string; title: string }>;
}

export interface MessageLog {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AudioConfig {
  sampleRate: number;
}
