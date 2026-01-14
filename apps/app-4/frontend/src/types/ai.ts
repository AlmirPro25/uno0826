// Tipos para o sistema de IA MCC-01

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export interface PatientContext {
  age?: string;
  gender?: string;
  history?: string;
}

export interface TriageInput {
  text: string;
  images: string[]; // Base64 strings
  context?: PatientContext;
}

export interface TriageOutput {
  summary: string;
  risk_level: RiskLevel;
  risk_reasoning: string;
  hypotheses: string[];
  suggested_exams: string[];
  immediate_actions: string[];
  questions_for_doctor?: string[];
  questions_for_patient?: string[];
  disclaimer: string;
}

export interface ClinicalEntity {
  type: 'symptom' | 'medication' | 'vital' | 'risk_factor';
  value: string;
  confidence: number;
}

export interface LiveAnalysisResult {
  entities: ClinicalEntity[];
  current_risk_score: number;
  detected_intent: string;
}
