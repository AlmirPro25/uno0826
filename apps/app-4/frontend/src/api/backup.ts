import { axiosInstance as api } from './axios';

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: string;
}

export const backupAPI = {
  // Create a new backup
  createBackup: async (type: 'full' | 'partial' = 'full'): Promise<{ message: string; backup: BackupInfo }> => {
    const response = await api.post(`/admin/backups?type=${type}`);
    return response.data;
  },

  // List all backups
  listBackups: async (): Promise<{ backups: BackupInfo[] }> => {
    const response = await api.get('/admin/backups');
    return response.data;
  },

  // Download a backup
  downloadBackup: async (filename: string): Promise<void> => {
    const response = await api.get(`/admin/backups/${filename}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Delete a backup
  deleteBackup: async (filename: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/backups/${filename}`);
    return response.data;
  },

  // Restore from a backup
  restoreBackup: async (filename: string): Promise<{ message: string; restoredTables: string[] }> => {
    const response = await api.post(`/admin/backups/${filename}/restore`);
    return response.data;
  },
};
