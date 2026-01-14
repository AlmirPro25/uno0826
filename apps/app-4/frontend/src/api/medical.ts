import { axiosInstance } from './axios';

// Medical Records
export interface MedicalRecord {
    id: number;
    patientId: number;
    doctorId: number;
    appointmentId?: number;
    triageReportId?: number;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
    };
    doctor?: {
        id: number;
        fullName: string;
        specialty?: string;
    };
}

export interface MedicalRecordInput {
    patientId: number;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    notes?: string;
    appointmentId?: number;
    triageReportId?: number;
}

export const getMedicalRecords = async (patientId?: number): Promise<MedicalRecord[]> => {
    const params = patientId ? `?patientId=${patientId}` : '';
    const response = await axiosInstance.get(`/medical-records${params}`);
    return response.data;
};

export const getMyMedicalRecords = async (): Promise<MedicalRecord[]> => {
    const response = await axiosInstance.get('/medical-records/my-records');
    return response.data;
};

export const getMedicalRecordById = async (id: number): Promise<MedicalRecord> => {
    const response = await axiosInstance.get(`/medical-records/${id}`);
    return response.data;
};

export const createMedicalRecord = async (data: MedicalRecordInput): Promise<MedicalRecord> => {
    const response = await axiosInstance.post('/medical-records', data);
    return response.data;
};

export const updateMedicalRecord = async (id: number, data: Partial<MedicalRecordInput>): Promise<MedicalRecord> => {
    const response = await axiosInstance.put(`/medical-records/${id}`, data);
    return response.data;
};

export const deleteMedicalRecord = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/medical-records/${id}`);
};

export const getPatientMedicalRecords = async (patientId: number): Promise<MedicalRecord[]> => {
    const response = await axiosInstance.get(`/patients/${patientId}/records`);
    return response.data;
};

// Prescriptions
export interface Prescription {
    id: number;
    patientId: number;
    doctorId: number;
    appointmentId?: number;
    medications: string;
    instructions?: string;
    validUntil: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
    };
    doctor?: {
        id: number;
        fullName: string;
        crm?: string;
    };
}

export interface PrescriptionInput {
    patientId: number;
    medications: string;
    instructions?: string;
    validUntil: string;
    appointmentId?: number;
}

export const getPrescriptions = async (): Promise<Prescription[]> => {
    const response = await axiosInstance.get('/prescriptions');
    return response.data;
};

export const getMyPrescriptions = async (): Promise<Prescription[]> => {
    const response = await axiosInstance.get('/prescriptions/my-prescriptions');
    return response.data;
};

export const getPrescriptionById = async (id: number): Promise<Prescription> => {
    const response = await axiosInstance.get(`/prescriptions/${id}`);
    return response.data;
};

export const createPrescription = async (data: PrescriptionInput): Promise<Prescription> => {
    const response = await axiosInstance.post('/prescriptions', data);
    return response.data;
};

export const deletePrescription = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/prescriptions/${id}`);
};

export const getPatientPrescriptions = async (patientId: number): Promise<Prescription[]> => {
    const response = await axiosInstance.get(`/patients/${patientId}/prescriptions`);
    return response.data;
};

// Medical Certificates
export interface MedicalCertificate {
    id: number;
    patientId: number;
    doctorId: number;
    type: 'absence' | 'medical_leave' | 'fitness';
    startDate: string;
    endDate?: string;
    days?: number;
    reason?: string;
    cid?: string;
    restrictions?: string;
    observations?: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
    };
    doctor?: {
        id: number;
        fullName: string;
        crm?: string;
    };
}

export interface CertificateInput {
    patientId: number;
    type: 'absence' | 'medical_leave' | 'fitness';
    startDate: string;
    endDate?: string;
    days?: number;
    reason?: string;
    cid?: string;
    restrictions?: string;
    observations?: string;
}

export const getCertificates = async (): Promise<MedicalCertificate[]> => {
    const response = await axiosInstance.get('/certificates');
    return response.data;
};

export const getMyCertificates = async (): Promise<MedicalCertificate[]> => {
    const response = await axiosInstance.get('/certificates/my-certificates');
    return response.data;
};

export const getCertificateById = async (id: number): Promise<MedicalCertificate> => {
    const response = await axiosInstance.get(`/certificates/${id}`);
    return response.data;
};

export const createCertificate = async (data: CertificateInput): Promise<MedicalCertificate> => {
    const response = await axiosInstance.post('/certificates', data);
    return response.data;
};

export const deleteCertificate = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/certificates/${id}`);
};

export const getPatientCertificates = async (patientId: number): Promise<MedicalCertificate[]> => {
    const response = await axiosInstance.get(`/patients/${patientId}/certificates`);
    return response.data;
};

// Appointments
export interface Appointment {
    id: number;
    patientId: number;
    doctorId: number;
    clinicId?: number;
    triageReportId?: number;
    date: string;
    time: string;
    duration: number;
    type: 'presencial' | 'teleconsulta';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    reason?: string;
    notes?: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
        phone?: string;
    };
    doctor?: {
        id: number;
        fullName: string;
        specialty?: string;
    };
    clinic?: {
        id: number;
        name: string;
        address?: string;
    };
}

export interface AppointmentInput {
    doctorId: number;
    clinicId?: number;
    triageReportId?: number;
    date: string;
    time: string;
    duration?: number;
    type: 'presencial' | 'teleconsulta';
    reason?: string;
    notes?: string;
}

export const getAppointments = async (status?: string): Promise<Appointment[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await axiosInstance.get(`/appointments${params}`);
    return response.data;
};

export const getMyAppointments = async (status?: string): Promise<Appointment[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await axiosInstance.get(`/appointments/my-appointments${params}`);
    return response.data;
};

export const getAppointmentById = async (id: number): Promise<Appointment> => {
    const response = await axiosInstance.get(`/appointments/${id}`);
    return response.data;
};

export const createAppointment = async (data: AppointmentInput): Promise<Appointment> => {
    const response = await axiosInstance.post('/appointments', data);
    return response.data;
};

export const updateAppointmentStatus = async (id: number, status: string): Promise<Appointment> => {
    const response = await axiosInstance.put(`/appointments/${id}/status`, { status });
    return response.data;
};

export const cancelAppointment = async (id: number, reason?: string): Promise<void> => {
    await axiosInstance.put(`/appointments/${id}/cancel`, { reason });
};

export const getTodayAppointments = async (): Promise<Appointment[]> => {
    const response = await axiosInstance.get('/appointments/today');
    return response.data;
};

export const getUpcomingAppointments = async (limit?: number): Promise<Appointment[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await axiosInstance.get(`/appointments/upcoming${params}`);
    return response.data;
};
