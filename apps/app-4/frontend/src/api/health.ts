import { axiosInstance } from './axios';

// Health Metrics
export interface HealthMetric {
    id: string;
    type: string;
    value: number;
    unit: string;
    recordedAt: string;
    notes?: string;
}

export interface HealthMetricInput {
    type: string;
    value: number;
    unit: string;
    notes?: string;
}

export const getMyHealthMetrics = async (type?: string): Promise<HealthMetric[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await axiosInstance.get(`/health/metrics${params}`);
    return response.data;
};

export const addHealthMetric = async (data: HealthMetricInput): Promise<HealthMetric> => {
    const response = await axiosInstance.post('/health/metrics', data);
    return response.data;
};

// Medications
export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    startDate: string;
    endDate?: string;
    notes?: string;
    active: boolean;
}

export interface MedicationInput {
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    startDate: string;
    endDate?: string;
    notes?: string;
}

export const getMyMedications = async (): Promise<Medication[]> => {
    const response = await axiosInstance.get('/health/medications');
    return response.data;
};

export const addMedication = async (data: MedicationInput): Promise<Medication> => {
    const response = await axiosInstance.post('/health/medications', data);
    return response.data;
};

export const updateMedication = async (id: string, data: Partial<MedicationInput>): Promise<Medication> => {
    const response = await axiosInstance.put(`/health/medications/${id}`, data);
    return response.data;
};

export const deleteMedication = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/health/medications/${id}`);
};

export const markMedicationTaken = async (id: string, time: string): Promise<void> => {
    await axiosInstance.post(`/health/medications/${id}/taken`, { time });
};

// Exams
export interface Exam {
    id: string;
    name: string;
    type: string;
    category: string;
    requestedAt: string;
    scheduledAt?: string;
    completedAt?: string;
    status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    doctorId: number;
    clinicId?: number;
    resultUrl?: string;
    notes?: string;
}

export const getMyExams = async (): Promise<Exam[]> => {
    const response = await axiosInstance.get('/health/exams');
    return response.data;
};

export const getExamById = async (id: string): Promise<Exam> => {
    const response = await axiosInstance.get(`/health/exams/${id}`);
    return response.data;
};

// Vaccines
export interface Vaccine {
    id: string;
    name: string;
    date: string;
    nextDose?: string;
    doses: number;
    totalDoses: number;
    manufacturer?: string;
    lot?: string;
    location?: string;
    status: 'complete' | 'pending' | 'overdue';
}

export interface VaccineInput {
    name: string;
    date: string;
    nextDose?: string;
    doses: number;
    totalDoses: number;
    manufacturer?: string;
    lot?: string;
    location?: string;
}

export const getMyVaccines = async (): Promise<Vaccine[]> => {
    const response = await axiosInstance.get('/health/vaccines');
    return response.data;
};

export const addVaccine = async (data: VaccineInput): Promise<Vaccine> => {
    const response = await axiosInstance.post('/health/vaccines', data);
    return response.data;
};

// Emergency Contacts
export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
}

export const getEmergencyContacts = async (): Promise<EmergencyContact[]> => {
    const response = await axiosInstance.get('/health/emergency-contacts');
    return response.data;
};

export const addEmergencyContact = async (data: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> => {
    const response = await axiosInstance.post('/health/emergency-contacts', data);
    return response.data;
};

export const deleteEmergencyContact = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/health/emergency-contacts/${id}`);
};

// Send Emergency Alert
export interface EmergencyAlert {
    type: string;
    latitude?: number;
    longitude?: number;
    message?: string;
}

export const sendEmergencyAlert = async (data: EmergencyAlert): Promise<void> => {
    await axiosInstance.post('/health/emergency-alert', data);
};

// Health Summary
export interface HealthSummary {
    healthScore: number;
    lastMetrics: HealthMetric[];
    activeMedications: number;
    pendingExams: number;
    overdueVaccines: number;
    upcomingAppointments: number;
}

export const getHealthSummary = async (): Promise<HealthSummary> => {
    const response = await axiosInstance.get('/health/summary');
    return response.data;
};
