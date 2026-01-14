import { axiosInstance } from './axios';

// Types
export interface MatchRequest {
    message: string;
    symptoms?: string[];
    duration?: string;
    severity?: number;
    prefer_telemedicine?: boolean;
    prefer_female_doctor?: boolean;
    prefer_male_doctor?: boolean;
    max_wait_minutes?: number;
    max_price_reais?: number;
    insurance_plan?: string;
    latitude?: number;
    longitude?: number;
    max_distance_km?: number;
    triage_report_id?: number;
    previous_doctor_id?: number;
}

export interface AIClassification {
    chief_complaint: string;
    symptoms: string[];
    urgency_level: 'IMMEDIATE' | 'TODAY' | 'WEEK' | 'FLEXIBLE';
    risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    suggested_specialties: string[];
    can_be_remote: boolean;
    requires_exam_first: boolean;
    red_flags?: string[];
    reasoning: string;
}

export interface DoctorProfile {
    id: number;
    user_id: number;
    specialties: string;
    years_experience: number;
    accepts_emergency: boolean;
    accepts_telemedicine: boolean;
    available_now: boolean;
    average_rating: number;
    total_reviews: number;
    consultation_price: number;
}

export interface MatchResult {
    doctor: {
        id: number;
        fullName: string;
        email: string;
        specialty?: string;
    };
    doctor_profile?: DoctorProfile;
    match_score: number;
    match_reasons: string[];
    estimated_wait_time: number;
    can_start_now: boolean;
    next_available_slot?: string;
    consultation_type: 'IMMEDIATE' | 'SCHEDULED' | 'TELEMEDICINE';
    price: number;
}

export interface ClinicalMatch {
    id: number;
    patient_id: number;
    doctor_id?: number;
    triage_report_id?: number;
    chief_complaint: string;
    symptoms_summary: string;
    urgency_level: string;
    risk_level: string;
    suggested_specialties: string;
    can_be_remote: boolean;
    match_score: number;
    match_reason: string;
    status: string;
    patient_accepted: boolean;
    doctor_accepted: boolean;
    created_at: string;
    patient?: any;
    doctor?: any;
}

export interface StartMatchResponse {
    match_id: number;
    classification: AIClassification;
    matches: MatchResult[];
    best_match?: MatchResult;
    status: string;
}

// API Functions

/**
 * Start intelligent matching process
 */
export const startMatch = async (data: MatchRequest): Promise<StartMatchResponse> => {
    const response = await axiosInstance.post('/match/start', data);
    return response.data;
};

/**
 * Classify symptoms without creating a match
 */
export const classifySymptoms = async (data: MatchRequest): Promise<AIClassification> => {
    const response = await axiosInstance.post('/match/classify', data);
    return response.data;
};

/**
 * Find matches without creating a record
 */
export const findMatches = async (data: MatchRequest & { classification?: AIClassification }): Promise<{
    classification: AIClassification;
    matches: MatchResult[];
    total: number;
}> => {
    const response = await axiosInstance.post('/match/find', data);
    return response.data;
};

/**
 * Get user's matches
 */
export const getMyMatches = async (): Promise<ClinicalMatch[]> => {
    const response = await axiosInstance.get('/match/my');
    return response.data;
};

/**
 * Get pending matches for doctor
 */
export const getPendingMatches = async (): Promise<ClinicalMatch[]> => {
    const response = await axiosInstance.get('/match/pending');
    return response.data;
};

/**
 * Get specific match by ID
 */
export const getMatch = async (id: number): Promise<ClinicalMatch> => {
    const response = await axiosInstance.get(`/match/${id}`);
    return response.data;
};

/**
 * Accept a match
 */
export const acceptMatch = async (id: number): Promise<ClinicalMatch> => {
    const response = await axiosInstance.post(`/match/${id}/accept`);
    return response.data;
};

// Helper functions

export const getUrgencyLabel = (level: string): string => {
    const labels: Record<string, string> = {
        IMMEDIATE: 'Imediato',
        TODAY: 'Hoje',
        WEEK: 'Esta semana',
        FLEXIBLE: 'Flexível',
    };
    return labels[level] || level;
};

export const getUrgencyColor = (level: string): string => {
    const colors: Record<string, string> = {
        IMMEDIATE: 'bg-red-500 text-white',
        TODAY: 'bg-orange-500 text-white',
        WEEK: 'bg-yellow-500 text-black',
        FLEXIBLE: 'bg-green-500 text-white',
    };
    return colors[level] || 'bg-gray-500 text-white';
};

export const getRiskColor = (level: string): string => {
    const colors: Record<string, string> = {
        LOW: 'text-emerald-500 bg-emerald-50',
        MODERATE: 'text-yellow-600 bg-yellow-50',
        HIGH: 'text-orange-500 bg-orange-50',
        CRITICAL: 'text-red-500 bg-red-50 animate-pulse',
    };
    return colors[level] || 'text-gray-500 bg-gray-50';
};
