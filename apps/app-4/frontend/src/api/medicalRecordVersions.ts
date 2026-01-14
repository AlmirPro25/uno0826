import { axiosInstance as api } from './axios';

export interface MedicalRecordVersion {
  id: number;
  medical_record_id: number;
  version: number;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  vitals: string;
  allergies: string;
  medications: string;
  changed_by: number;
  changed_by_name: string;
  change_reason: string;
  change_summary: string;
  created_at: string;
}

export interface FieldDiff {
  field: string;
  old_value: string;
  new_value: string;
}

export interface VersionComparison {
  from_version: number;
  to_version: number;
  differences: FieldDiff[];
  changed_at: string;
  changed_by: string;
}

// Listar versões de um prontuário
export const getVersions = async (recordId: number): Promise<MedicalRecordVersion[]> => {
  const response = await api.get(`/medical-records/${recordId}/versions`);
  return response.data;
};

// Obter uma versão específica
export const getVersion = async (recordId: number, versionNum: number): Promise<MedicalRecordVersion> => {
  const response = await api.get(`/medical-records/${recordId}/versions/${versionNum}`);
  return response.data;
};

// Comparar duas versões
export const compareVersions = async (
  recordId: number,
  fromVersion: number,
  toVersion: number
): Promise<VersionComparison> => {
  const response = await api.get(`/medical-records/${recordId}/versions/compare`, {
    params: { from: fromVersion, to: toVersion }
  });
  return response.data;
};

// Restaurar uma versão anterior
export const restoreVersion = async (
  recordId: number,
  versionNum: number,
  reason?: string
): Promise<MedicalRecordVersion> => {
  const response = await api.post(`/medical-records/${recordId}/versions/${versionNum}/restore`, {
    reason
  });
  return response.data;
};

// Exportar histórico de versões
export const exportVersionHistory = async (recordId: number): Promise<Blob> => {
  const response = await api.get(`/medical-records/${recordId}/versions/export`, {
    responseType: 'blob'
  });
  return response.data;
};

export default {
  getVersions,
  getVersion,
  compareVersions,
  restoreVersion,
  exportVersionHistory
};
