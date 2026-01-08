
import { create } from 'zustand';
import { Project } from '../../../shared/types/schema';
import { ProjectService } from '@/services/api/project.service';

interface InfrastructureState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => void;
}

/**
 * @description Estado global da infraestrutura para sincronização entre componentes.
 */
export const useInfrastructureStore = create<InfrastructureState>((set) => ({
  projects: [],
  isLoading: false,
  error: null,
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await ProjectService.getAll();
      set({ projects, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  addProject: (project) => set((state) => ({ 
    projects: [project, ...state.projects] 
  })),
}));
