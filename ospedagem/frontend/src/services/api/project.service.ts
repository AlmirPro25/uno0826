
import api from '@/lib/axios';
import { Project, AppType } from '../../../../shared/types/schema';

export const ProjectService = {
  async getAll(): Promise<Project[]> {
    const { data } = await api.get<Project[]>('/projects');
    return data;
  },

  async getById(id: string): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  async create(payload: Partial<Project>): Promise<Project> {
    const { data } = await api.post<Project>('/projects', payload);
    return data;
  },

  async update(id: string, payload: Partial<Project>): Promise<Project> {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async triggerDeploy(projectId: string): Promise<{ deploymentId: string }> {
    const { data } = await api.post(`/projects/${projectId}/deploy`);
    return data;
  }
};
