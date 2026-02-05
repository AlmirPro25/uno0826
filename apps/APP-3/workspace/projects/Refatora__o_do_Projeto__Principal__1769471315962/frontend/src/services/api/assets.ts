
import { api } from '../../lib/axios';
import { Asset } from '../../../../shared/types';

export const AssetService = {
  /**
   * Retrieve full fleet inventory with current telemetry.
   */
  getAllAssets: async (): Promise<Asset[]> => {
    const { data } = await api.get<Asset[]>('/assets');
    return data;
  },

  /**
   * Get specific asset details (Schematics & Specs).
   */
  getAssetById: async (id: string): Promise<Asset> => {
    const { data } = await api.get<Asset[]>(`/assets?id=${id}`); // Handling mock filter if needed, or specific endpoint
    // Adjusting based on standard REST conventions, usually backend provides /assets/:id
    // If current backend only supports query params, we filter on client or adjust URL.
    // Assuming standard implementation:
    return data[0]; 
  }
};
