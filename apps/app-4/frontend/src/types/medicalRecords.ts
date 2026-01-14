export interface MedicalRecord {
    id: number;
    patientId: number;
    doctorId: number;
    diagnosis: string;
    notes: string;
    consultationDate: string;
}

export interface CreateMedicalRecordPayload {
    diagnosis: string;
    notes: string;
}
