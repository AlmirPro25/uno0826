

// src/services/ProjectService.ts
import { apiService } from './ApiService';
import type { StoredProjectState, InteractionLogData } from '@/store/useAppStore';

// Type returned by the backend for a single project
export interface ProjectData {
  id: string;
  name: string;
  htmlCode: string;
  projectPlan: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// GET all projects for the logged-in user
export const getProjects = (): Promise<ProjectData[]> => {
    return apiService.get('/projects');
};

// GET a single project by its ID
export const getProjectById = (id: string): Promise<ProjectData> => {
    return apiService.get(`/projects/${id}`);
};

// POST to create a new project
// The body should match the structure expected by the backend validator
export const createProject = (projectData: { name: string; htmlCode: string; projectPlan?: string | null; }): Promise<ProjectData> => {
    return apiService.post('/projects', projectData);
};

// PUT to update an existing project
export const updateProject = (id: string, projectData: Partial<{ name: string; htmlCode: string; projectPlan: string | null; }>): Promise<ProjectData> => {
    return apiService.put(`/projects/${id}`, projectData);
};

// DELETE a project
export const deleteProject = (id: string): Promise<void> => {
    return apiService.delete(`/projects/${id}`);
};

// POST to create a new interaction log
// The backend will associate it with the logged-in user
export const createLog = (logData: Omit<InteractionLogData, 'isGoodForTraining' | 'userRating'> & Partial<Pick<InteractionLogData, 'isGoodForTraining' | 'userRating'>>): Promise<any> => {
    return apiService.post('/logs', logData);
};
