
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { projectService } from '@/services/api/project';
import { Project, UUID } from '@/types/models';
import { APIErrorResponse } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';

interface UseProjectDetailsResult {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  refetchProject: () => void;
}

/**
 * Custom hook to fetch and manage details of a single project.
 * @param projectId The ID of the project to fetch.
 */
export function useProjectDetails(projectId: UUID | undefined): UseProjectDetailsResult {
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const fetchProject = useCallback(async (userId: UUID, projId: UUID) => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProject = await projectService.getProjectById(userId, projId);
      setProject(fetchedProject);
    } catch (err: any) {
      let errorMessage = "Ocorreu um erro ao carregar os detalhes do projeto.";
      if (err.response?.data) {
        const apiError = err.response.data as APIErrorResponse;
        errorMessage = apiError.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Projeto",
        description: errorMessage,
      });
      setProject(null); // Clear project on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      setProject(null);
      setError("ID do projeto não fornecido.");
      return;
    }

    if (isAuthenticated && user?.id) {
      fetchProject(user.id, projectId);
    } else if (!isAuthenticated && !isLoading) {
      setProject(null);
      setError("Autenticação necessária para carregar os detalhes do projeto.");
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, projectId, fetchProject, refetchIndex, isLoading]);

  const refetchProject = useCallback(() => {
    setRefetchIndex(prev => prev + 1);
  }, []);

  return { project, isLoading, error, refetchProject };
}
