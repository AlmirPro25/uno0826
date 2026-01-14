
import apiClient from '@/lib/api';
import { CreateProjectRequest, UpdateProjectRequest } from '@/types/api';
import { Project, UUID } from '@/types/models';

/**
 * API client for Project related operations.
 */
export const projectService = {
  /**
   * Fetches all projects for a specific user.
   * @param userId The ID of the user whose projects are to be fetched.
   * @returns An array of Project objects.
   */
  getProjects: async (userId: UUID): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>(`/users/${userId}/projects`);
    return response.data;
  },

  /**
   * Creates a new project for a specific user.
   * @param userId The ID of the user creating the project.
   * @param data The project creation request data.
   * @returns The newly created Project object.
   */
  createProject: async (userId: UUID, data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post<Project>(`/users/${userId}/projects`, data);
    return response.data;
  },

  /**
   * Fetches a single project by its ID for a specific user.
   * @param userId The ID of the user who owns the project.
   * @param projectId The ID of the project to fetch.
   * @returns The Project object.
   */
  getProjectById: async (userId: UUID, projectId: UUID): Promise<Project> => {
    const response = await apiClient.get<Project>(`/users/${userId}/projects/${projectId}`);
    return response.data;
  },

  /**
   * Updates an existing project for a specific user.
   * @param userId The ID of the user who owns the project.
   * @param projectId The ID of the project to update.
   * @param data The partial project data to update.
   * @returns The updated Project object.
   */
  updateProject: async (userId: UUID, projectId: UUID, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/users/${userId}/projects/${projectId}`, data);
    return response.data;
  },

  /**
   * Deletes a project for a specific user.
   * @param userId The ID of the user who owns the project.
   * @param projectId The ID of the project to delete.
   */
  deleteProject: async (userId: UUID, projectId: UUID): Promise<void> => {
    await apiClient.delete(`/users/${userId}/projects/${projectId}`);
  },
};
