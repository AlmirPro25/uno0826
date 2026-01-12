/**
 * PROST-QS SDK — API Keys Module
 * 
 * Gerenciamento de API keys para autenticação de apps externos.
 * 
 * "Apps não usam senha. Apps usam chaves."
 */

import { ProstQSClient } from './client';

// Scopes disponíveis
export type APIKeyScope = 
  | 'read'       // Apenas leitura
  | 'write'      // Leitura e escrita
  | 'admin'      // Acesso administrativo
  | 'telemetry'  // Apenas telemetria
  | 'identity'   // Operações de identidade
  | 'billing';   // Operações de billing

export interface APIKey {
  id: string;
  app_id: string;
  name: string;
  key_prefix: string;
  scopes: string; // JSON array
  description: string;
  status: 'active' | 'revoked' | 'expired';
  last_used_at?: string;
  last_used_ip?: string;
  expires_at?: string;
  created_at: string;
  created_by: string;
  revoked_at?: string;
  revoked_by?: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  scopes: APIKeyScope[];
  description?: string;
  expires_in_days?: number;
}

export interface CreateAPIKeyResponse {
  key: APIKey;
  api_key: string; // A chave completa (só mostrada uma vez!)
  warning: string;
}

export interface ScopeInfo {
  scope: APIKeyScope;
  description: string;
}

export interface KeyUsageStats {
  key_id: string;
  total_requests: number;
  success_requests: number;
  error_requests: number;
  avg_latency_ms: number;
  top_endpoints: { endpoint: string; count: number }[];
}

/**
 * API Keys Module
 */
export class APIKeysModule {
  constructor(private client: ProstQSClient) {}

  /**
   * Lista scopes disponíveis
   */
  async getScopes(): Promise<ScopeInfo[]> {
    const response = await this.client.get<{ scopes: ScopeInfo[] }>('/apikeys/scopes');
    return response.scopes;
  }

  /**
   * Cria uma nova API key
   * 
   * IMPORTANTE: A chave completa só é retornada uma vez!
   */
  async createKey(data: CreateAPIKeyRequest): Promise<CreateAPIKeyResponse> {
    return this.client.post<CreateAPIKeyResponse>('/apikeys', data);
  }

  /**
   * Lista todas as API keys do app
   */
  async listKeys(): Promise<APIKey[]> {
    const response = await this.client.get<{ keys: APIKey[] }>('/apikeys');
    return response.keys;
  }

  /**
   * Busca uma API key específica
   */
  async getKey(id: string): Promise<APIKey> {
    return this.client.get<APIKey>(`/apikeys/${id}`);
  }

  /**
   * Revoga uma API key
   */
  async revokeKey(id: string): Promise<void> {
    await this.client.delete(`/apikeys/${id}`);
  }

  /**
   * Busca estatísticas de uso de uma key
   */
  async getUsageStats(keyId: string): Promise<KeyUsageStats> {
    return this.client.get<KeyUsageStats>(`/apikeys/${keyId}/stats`);
  }
}

/**
 * Helper para usar API key em requisições
 */
export function createAPIKeyHeaders(apiKey: string): Record<string, string> {
  return {
    'X-API-Key': apiKey,
  };
}

/**
 * Helper para usar API key como Bearer token
 */
export function createBearerHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
  };
}
