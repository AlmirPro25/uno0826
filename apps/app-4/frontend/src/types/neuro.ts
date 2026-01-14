export enum BrainRegion {
    FRONTAL = 'FRONTAL', // The Executive (Live API)
    LEFT = 'LEFT',       // Subconscious Light (Flash - Quick Logic)
    RIGHT = 'RIGHT'      // Subconscious Pro (Pro - Deep Reasoning/Search)
}

export enum AgentState {
    IDLE = 'IDLE',
    LISTENING = 'LISTENING',
    THINKING = 'THINKING',
    SPEAKING = 'SPEAKING',
    CONSULTING_SUBCONSCIOUS = 'CONSULTING_SUBCONSCIOUS'
}

export interface PatientProfile {
    name: string;
    age: string;
    gender: string;
    chiefComplaint: string;
    history?: string;
    triageReportId?: string; // Link to existing triage
}

export interface CognitiveManifesto {
    agentName: string;
    role: string;
    specialty: string;
    tone: string;
    context: string;
    voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
    allowedTools?: string[];
}

export interface LogEntry {
    id: string;
    timestamp: number;
    region: BrainRegion;
    message: string;
    type: 'info' | 'warning' | 'tool-call' | 'research';
    metadata?: any;
}

export interface TranscriptItem {
    id: string;
    source: 'USER' | 'AGENT';
    text: string;
    isFinal: boolean;
    timestamp: number;
}

export interface MedicalRecord {
    patientId: string;
    timestamp: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string[];
    riskAssessment: {
        level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
        justification: string;
    };
}
