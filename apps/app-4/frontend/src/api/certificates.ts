import { axiosInstance as api } from './axios';

export interface MedicalCertificate {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  type: 'absence' | 'medical_leave' | 'fitness';
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
  cid?: string;
  restrictions?: string;
  notes?: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
    isActive: boolean;
  };
  doctor?: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
    isActive: boolean;
  };
}

export interface CreateCertificateData {
  patientId: number;
  appointmentId?: number;
  type: 'absence' | 'medical_leave' | 'fitness';
  days: number;
  startDate: string; // YYYY-MM-DD format
  reason?: string;
  cid?: string;
  restrictions?: string;
  notes?: string;
}

export const certificateTypeLabels: Record<string, string> = {
  absence: 'Atestado de Comparecimento',
  medical_leave: 'Atestado Médico (Afastamento)',
  fitness: 'Atestado de Aptidão',
};

export const certificatesAPI = {
  // Get all certificates for the logged-in user
  getMyCertificates: async (): Promise<MedicalCertificate[]> => {
    const response = await api.get('/certificates/my-certificates');
    return response.data;
  },

  // Get a specific certificate by ID
  getCertificate: async (id: number): Promise<MedicalCertificate> => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  // Get all certificates for a specific patient (for doctors)
  getPatientCertificates: async (patientId: number): Promise<MedicalCertificate[]> => {
    const response = await api.get(`/patients/${patientId}/certificates`);
    return response.data;
  },

  // Create a new certificate (doctor only)
  createCertificate: async (data: CreateCertificateData): Promise<MedicalCertificate> => {
    const response = await api.post('/certificates', data);
    return response.data;
  },

  // Delete a certificate (doctor only)
  deleteCertificate: async (id: number): Promise<void> => {
    await api.delete(`/certificates/${id}`);
  },
};

export default certificatesAPI;
