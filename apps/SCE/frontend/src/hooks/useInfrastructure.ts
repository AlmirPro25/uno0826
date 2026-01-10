
import { useEffect, useCallback } from 'react';
import { useInfrastructureStore } from '@/stores/useInfrastructureStore';
import { ProjectService } from '@/services/api/project.service';

/**
 * @description Hook de alto nível para orquestração de dados da infraestrutura.
 */
export function useInfrastructure() {
  const { projects, isLoading, error, fetchProjects } = useInfrastructureStore();

  useEffect(() => {
    if (projects.length === 0 && !isLoading) {
      fetchProjects();
    }
  }, [fetchProjects, projects.length, isLoading]);

  const deployProject = useCallback(async (projectId: string) => {
    try {
      return await ProjectService.triggerDeploy(projectId);
    } catch (err) {
      throw err;
    }
  }, []);

  const stats = {
    totalApps: projects.length,
    frontendApps: projects.filter(p => p.type === 'FRONTEND').length,
    backendApps: projects.filter(p => p.type === 'BACKEND').length,
    healthyApps: projects.length, // Em produção, isto viria de um check real
  };

  return {
    projects,
    isLoading,
    error,
    stats,
    deployProject,
    refresh: fetchProjects
  };
}
