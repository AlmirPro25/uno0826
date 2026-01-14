import { axiosInstance } from "./axios";
import { MedicalRecord, CreateMedicalRecordPayload } from "@/types/medicalRecords";

export interface UpdateMedicalRecordPayload {
    diagnosis?: string;
    notes?: string;
}

export const medicalRecordsAPI = {
    getRecords: async (patientId: number): Promise<MedicalRecord[]> => {
        const response = await axiosInstance.get<MedicalRecord[]>(
            `/patients/${patientId}/records`
        );
        return response.data;
    },

    getRecord: async (recordId: number): Promise<MedicalRecord> => {
        const response = await axiosInstance.get<MedicalRecord>(
            `/records/${recordId}`
        );
        return response.data;
    },

    createRecord: async (
        patientId: number,
        payload: CreateMedicalRecordPayload
    ): Promise<MedicalRecord> => {
        const response = await axiosInstance.post<MedicalRecord>(
            `/patients/${patientId}/records`,
            payload
        );
        return response.data;
    },

    updateRecord: async (
        recordId: number,
        payload: UpdateMedicalRecordPayload
    ): Promise<MedicalRecord> => {
        const response = await axiosInstance.put<MedicalRecord>(
            `/records/${recordId}`,
            payload
        );
        return response.data;
    },

    deleteRecord: async (recordId: number): Promise<void> => {
        await axiosInstance.delete(`/records/${recordId}`);
    },
};
