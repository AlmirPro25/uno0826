import { axiosInstance } from './axios';

// Types
export interface TriageReport {
    id: number;
    patient_id: number;
    doctor_id?: number;
    clinic_id?: number;
    patient_complaint: string;
    history_of_present_illness: string;
    vital_signs_note: string;
    suspected_diagnosis: string; // JSON array
    recommended_specialty: string;
    priority: string;
    reasoning: string;
    transcript?: string;
    session_type: string;
    ai_model?: string;
    session_length?: number;
    status: string;
    reviewed_by_id?: number;
    reviewed_at?: string;
    review_notes?: string;
    appointment_id?: number;
    medical_record_id?: number;
    latitude?: number;
    longitude?: number;
    created_at: string;
    updated_at: string;
    patient?: {
        id: number;
        full_name: string;
        email: string;
    };
    doctor?: {
        id: number;
        full_name: string;
        specialty?: string;
    };
}

export interface CreateTriageReportInput {
    patient_complaint: string;
    history_of_present_illness?: string;
    vital_signs_note?: string;
    suspected_diagnosis: string[];
    recommended_specialty: string;
    priority: string;
    reasoning?: string;
    transcript?: string;
    session_type?: string;
    ai_model?: string;
    session_length?: number;
    latitude?: number;
    longitude?: number;
}

export interface TriageStats {
    total: number;
    today: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
}

// API Functions

/**
 * Create a new triage report (patient only)
 */
export const createTriageReport = async (data: CreateTriageReportInput): Promise<TriageReport> => {
    const response = await axiosInstance.post('/triage-reports', data);
    return response.data;
};

/**
 * Get current user's triage reports
 */
export const getMyTriageReports = async (): Promise<TriageReport[]> => {
    const response = await axiosInstance.get('/triage-reports/my-reports');
    return response.data;
};

/**
 * Get a specific triage report by ID
 */
export const getTriageReport = async (id: number): Promise<TriageReport> => {
    const response = await axiosInstance.get(`/triage-reports/${id}`);
    return response.data;
};

/**
 * Get triage reports for a specific patient (doctor/admin)
 */
export const getPatientTriageReports = async (patientId: number): Promise<TriageReport[]> => {
    const response = await axiosInstance.get(`/patients/${patientId}/triage-reports`);
    return response.data;
};

/**
 * Get pending triage reports (doctor only)
 */
export const getPendingTriageReports = async (specialty?: string, limit?: number): Promise<TriageReport[]> => {
    const params = new URLSearchParams();
    if (specialty) params.append('specialty', specialty);
    if (limit) params.append('limit', limit.toString());
    
    const response = await axiosInstance.get(`/triage-reports/pending?${params.toString()}`);
    return response.data;
};

/**
 * Get triage reports assigned to current doctor
 */
export const getAssignedTriageReports = async (): Promise<TriageReport[]> => {
    const response = await axiosInstance.get('/triage-reports/assigned');
    return response.data;
};

/**
 * Accept a triage case (doctor only)
 */
export const acceptTriageReport = async (id: number): Promise<TriageReport> => {
    const response = await axiosInstance.put(`/triage-reports/${id}/accept`);
    return response.data;
};

/**
 * Review a triage report (doctor only)
 */
export const reviewTriageReport = async (id: number, notes: string): Promise<TriageReport> => {
    const response = await axiosInstance.put(`/triage-reports/${id}/review`, { notes });
    return response.data;
};

/**
 * Update triage report status
 */
export const updateTriageStatus = async (id: number, status: string): Promise<void> => {
    await axiosInstance.put(`/triage-reports/${id}/status`, { status });
};

/**
 * Link triage report to appointment
 */
export const linkTriageToAppointment = async (id: number, appointmentId: number): Promise<void> => {
    await axiosInstance.put(`/triage-reports/${id}/link-appointment`, { appointment_id: appointmentId });
};

/**
 * Get triage statistics (admin only)
 */
export const getTriageStats = async (): Promise<TriageStats> => {
    const response = await axiosInstance.get('/triage-reports/stats');
    return response.data;
};

// Status constants
export const TRIAGE_STATUS = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    ACCEPTED: 'accepted',
    REFERRED: 'referred',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const;

// Priority constants (Manchester Protocol)
export const TRIAGE_PRIORITY = {
    EMERGENCY: 'Emergência (Vermelho)',
    VERY_URGENT: 'Muito Urgente (Laranja)',
    URGENT: 'Urgente (Amarelo)',
    LESS_URGENT: 'Pouco Urgente (Verde)',
    NON_URGENT: 'Não Urgente (Azul)',
} as const;

// Helper to get priority color
export const getPriorityColor = (priority: string): string => {
    switch (priority) {
        case TRIAGE_PRIORITY.EMERGENCY:
            return 'bg-red-600 text-white';
        case TRIAGE_PRIORITY.VERY_URGENT:
            return 'bg-orange-500 text-white';
        case TRIAGE_PRIORITY.URGENT:
            return 'bg-yellow-500 text-black';
        case TRIAGE_PRIORITY.LESS_URGENT:
            return 'bg-green-500 text-white';
        case TRIAGE_PRIORITY.NON_URGENT:
            return 'bg-blue-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};

// Helper to get status label
export const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        pending: 'Aguardando',
        reviewed: 'Revisado',
        accepted: 'Aceito',
        referred: 'Encaminhado',
        completed: 'Concluído',
        cancelled: 'Cancelado',
    };
    return labels[status] || status;
};
