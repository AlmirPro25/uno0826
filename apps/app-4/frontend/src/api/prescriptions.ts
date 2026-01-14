import { axiosInstance as api } from './axios';

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions?: string;
}

export interface Prescription {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  medications: string; // JSON string of PrescriptionMedication[]
  instructions: string;
  diagnosis: string;
  notes: string;
  validUntil: string;
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

export interface CreatePrescriptionData {
  patientId: number;
  appointmentId?: number;
  medications: PrescriptionMedication[];
  instructions?: string;
  diagnosis?: string;
  notes?: string;
  validUntil: string; // ISO 8601 format
}

export interface UpdatePrescriptionData {
  medications?: PrescriptionMedication[];
  instructions?: string;
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
}

export const prescriptionsAPI = {
  // Get all prescriptions for the logged-in user
  getMyPrescriptions: async (): Promise<Prescription[]> => {
    const response = await api.get('/prescriptions/my-prescriptions');
    return response.data;
  },

  // Get a specific prescription by ID
  getPrescription: async (id: number): Promise<Prescription> => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  // Get all prescriptions for a specific patient (for doctors)
  getPatientPrescriptions: async (patientId: number): Promise<Prescription[]> => {
    const response = await api.get(`/patients/${patientId}/prescriptions`);
    return response.data;
  },

  // Create a new prescription (doctor only)
  createPrescription: async (data: CreatePrescriptionData): Promise<Prescription> => {
    const payload = {
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      medications: JSON.stringify(data.medications),
      instructions: data.instructions || '',
      diagnosis: data.diagnosis || '',
      notes: data.notes || '',
      validUntil: data.validUntil,
    };
    const response = await api.post('/prescriptions', payload);
    return response.data;
  },

  // Update an existing prescription (doctor only)
  updatePrescription: async (id: number, data: UpdatePrescriptionData): Promise<Prescription> => {
    const payload: Record<string, string> = {};
    if (data.medications) {
      payload.medications = JSON.stringify(data.medications);
    }
    if (data.instructions !== undefined) {
      payload.instructions = data.instructions;
    }
    if (data.diagnosis !== undefined) {
      payload.diagnosis = data.diagnosis;
    }
    if (data.notes !== undefined) {
      payload.notes = data.notes;
    }
    if (data.validUntil) {
      payload.validUntil = data.validUntil;
    }
    const response = await api.put(`/prescriptions/${id}`, payload);
    return response.data;
  },

  // Delete a prescription (doctor only)
  deletePrescription: async (id: number): Promise<void> => {
    await api.delete(`/prescriptions/${id}`);
  },

  // Helper function to parse medications from JSON string
  parseMedications: (medicationsJson: string): PrescriptionMedication[] => {
    try {
      return JSON.parse(medicationsJson);
    } catch {
      return [];
    }
  },
};

export default prescriptionsAPI;
