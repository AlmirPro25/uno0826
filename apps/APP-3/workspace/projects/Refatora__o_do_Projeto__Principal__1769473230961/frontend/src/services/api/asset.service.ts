
import { uplink } from '@/lib/axios';
import { Asset, Manifest, SecurityLog } from '../../../../shared/types';

/**
 * ASSET SURVEILLANCE MODULE
 * Gerenciamento de Ativos, Manifestos e Logs de Segurança.
 */
export const assetService = {

  // Retrieve full fleet status
  async getAllAssets(): Promise<Asset[]> {
    const response = await uplink.get<Asset[]>('/assets');
    return response.data;
  },

  // Get specific tactical data for one asset
  async getAssetById(id: string): Promise<Asset> {
    const response = await uplink.get<Asset>(`/assets/${id}`);
    return response.data;
  },

  // DIGITAL VAULT ACCESS
  async getManifests(assetId: string): Promise<Manifest[]> {
    const response = await uplink.get<Manifest[]>(`/assets/${assetId}/manifest`);
    return response.data;
  },

  // SECURITY PROTOCOLS
  async getSecurityLogs(assetId: string): Promise<SecurityLog[]> {
    const response = await uplink.get<SecurityLog[]>(`/assets/${assetId}/logs`);
    return response.data;
  },

  // ACTIVE MEASURES: LOCKDOWN
  async initiateLockdown(id: string): Promise<{ success: boolean; timestamp: string }> {
    const response = await uplink.post<{ success: boolean; timestamp: string }>(`/assets/${id}/lockdown`);
    return response.data;
  }
};
