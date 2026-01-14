
import { create } from 'zustand';
import { AgvStatus } from '../types';

/**
 * Zustand store for managing the state of all 5,000 AGVs.
 * Using a Map for efficient lookup by robotId instead of array iteration (Anti-pattern 3 mitigation).
 */
interface AgvState {
  agvs: Map<string, AgvStatus>;
  setAllAgvData: (data: AgvStatus[]) => void;
  updateAgvData: (agv: AgvStatus) => void;
  getAgvById: (agvId: string) => AgvStatus | undefined;
}

export const useAgvDataStore = create<AgvState>((set, get) => ({
  agvs: new Map(),

  /**
   * Initializes or replaces the entire AGV fleet data. Used for initial snapshot on connection.
   * @param data Array of AgvStatus objects.
   */
  setAllAgvData: (data: AgvStatus[]) => set(() => {
    const newMap = new Map<string, AgvStatus>();
    data.forEach(agv => newMap.set(agv.robotId, agv));
    return { agvs: newMap };
  }),

  /**
   * Updates a single AGV's data. Used for real-time delta updates from WebSocket.
   * @param agv The updated AgvStatus object.
   */
  updateAgvData: (agv: AgvStatus) => set(state => {
    const newMap = new Map(state.agvs); // Create a new map to ensure immutability for React updates
    newMap.set(agv.robotId, agv);
    return { agvs: newMap };
  }),

  /**
   * Retrieves a specific AGV's data by its ID.
   * @param agvId The ID of the AGV.
   * @returns The AgvStatus object or undefined if not found.
   */
  getAgvById: (agvId: string) => get().agvs.get(agvId),
}));
