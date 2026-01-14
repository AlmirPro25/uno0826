
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { projectService } from '@/services/api/project';
import { Project, UUID } from '@/types/models';
import { APIErrorResponse } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refetchProjects: () => void;
}

/**
 * Custom hook to fetch and manage a user's projects.
 * Automatically refetches on user ID change or when `refetchProjects` is called.
 */
export function useProjects(): UseProjectsResult {
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0); // Simple mechanism to trigger refetch

  const fetchProjects = useCallback(async (userId: UUID) => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProjects = await projectService.getProjects(userId);
      setProjects(fetchedProjects);
    } catch (err: any) {
      let errorMessage = "Ocorreu um erro ao carregar seus projetos.";
      if (err.response?.data) {
        const apiError = err.response.data as APIErrorResponse;
        errorMessage = apiError.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Projetos",
        description: errorMessage,
      });
      setProjects([]); // Clear projects on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProjects(user.id);
    } else if (!isAuthenticated && !isLoading) {
      // If not authenticated and not loading initially, clear projects and set error
      setProjects([]);
      setError("Autenticação necessária para carregar projetos.");
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchProjects, refetchIndex, isLoading]);

  const refetchProjects = useCallback(() => {
    setRefetchIndex(prev => prev + 1);
  }, []);

  return { projects, isLoading, error, refetchProjects };
}
