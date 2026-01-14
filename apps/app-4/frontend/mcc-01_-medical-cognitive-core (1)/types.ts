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

export interface ClinicalRecommendation {
  action: string;
  urgency: string;
}

export interface TriageOutput {
  summary: string;
  risk_level: RiskLevel;
  risk_reasoning: string;
  hypotheses: string[]; // Differential diagnosis hypotheses
  suggested_exams: string[];
  immediate_actions: string[]; // "Condutas iniciais"
  questions_for_doctor: string[]; // Questions to guide the doctor
  questions_for_patient: string[]; // Missing info to ask patient
  disclaimer: string;
  sources_cited?: string[]; // References to medical guidelines
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

// Live Ambient Types
export interface ClinicalEntity {
  type: 'symptom' | 'medication' | 'vital' | 'risk_factor';
  value: string;
  confidence: number;
}

export interface LiveAnalysisResult {
  entities: ClinicalEntity[];
  current_risk_score: number; // 0-100
  detected_intent: string;
}