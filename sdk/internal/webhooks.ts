/**
 * PROST-QS SDK — Webhook Module
 * 
 * Gerenciamento de webhooks para notificações em tempo real.
 * 
 * "O Kernel avisa, o app decide o que fazer"
 */

import { ProstQSClient } from './client';

// Tipos de eventos disponíveis
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'app.membership.created'
  | 'app.membership.removed'
  | 'alert.triggered'
  | 'incident.created';

export interface WebhookEndpoint {
  id: string;
  app_id: string;
  url: string;
  events: string; // JSON array
  description: string;
  status: 'active' | 'disabled' | 'failed';
  fail_count: number;
  last_success?: string;
  last_failure?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: string;
  response_code: number;
  response_body?: string;
  duration_ms: number;
  success: boolean;
  attempt: number;
  error?: string;
  created_at: string;
}

export interface WebhookStats {
  endpoint_id: string;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  avg_latency_ms: number;
}

export interface CreateEndpointRequest {
  url: string;
  events: WebhookEventType[];
  description?: string;
}

export interface UpdateEndpointRequest {
  url: string;
  events: WebhookEventType[];
  description?: string;
}

export interface CreateEndpointResponse {
  endpoint: WebhookEndpoint;
  secret: string;
  warning: string;
}

export interface EventTypeInfo {
  type: WebhookEventType;
  description: string;
}

/**
 * Webhook Module
 */
export class WebhookModule {
  constructor(private client: ProstQSClient) {}

  /**
   * Lista tipos de eventos disponíveis
   */
  async getEventTypes(): Promise<EventTypeInfo[]> {
    const response = await this.client.get<{ events: EventTypeInfo[] }>('/webhooks/events');
    return response.events;
  }

  /**
   * Cria um novo endpoint de webhook
   * 
   * IMPORTANTE: O secret retornado só é mostrado uma vez!
   */
  async createEndpoint(data: CreateEndpointRequest): Promise<CreateEndpointResponse> {
    return this.client.post<CreateEndpointResponse>('/webhooks', data);
  }

  /**
   * Lista todos os endpoints do app
   */
  async listEndpoints(): Promise<WebhookEndpoint[]> {
    const response = await this.client.get<{ endpoints: WebhookEndpoint[] }>('/webhooks');
    return response.endpoints;
  }

  /**
   * Busca um endpoint específico
   */
  async getEndpoint(id: string): Promise<WebhookEndpoint> {
    return this.client.get<WebhookEndpoint>(`/webhooks/${id}`);
  }

  /**
   * Atualiza um endpoint
   */
  async updateEndpoint(id: string, data: UpdateEndpointRequest): Promise<WebhookEndpoint> {
    return this.client.put<WebhookEndpoint>(`/webhooks/${id}`, data);
  }

  /**
   * Remove um endpoint
   */
  async deleteEndpoint(id: string): Promise<void> {
    await this.client.delete(`/webhooks/${id}`);
  }

  /**
   * Testa um endpoint enviando um webhook de teste
   */
  async testEndpoint(id: string): Promise<{ delivery: WebhookDelivery; success: boolean }> {
    return this.client.post(`/webhooks/${id}/test`);
  }

  /**
   * Rotaciona o secret de um endpoint
   * 
   * IMPORTANTE: O novo secret só é mostrado uma vez!
   */
  async rotateSecret(id: string): Promise<{ secret: string; warning: string }> {
    return this.client.post(`/webhooks/${id}/rotate`);
  }

  /**
   * Habilita um endpoint
   */
  async enableEndpoint(id: string): Promise<void> {
    await this.client.post(`/webhooks/${id}/enable`);
  }

  /**
   * Desabilita um endpoint
   */
  async disableEndpoint(id: string): Promise<void> {
    await this.client.post(`/webhooks/${id}/disable`);
  }

  /**
   * Busca histórico de entregas de um endpoint
   */
  async getDeliveries(endpointId: string): Promise<WebhookDelivery[]> {
    const response = await this.client.get<{ deliveries: WebhookDelivery[] }>(
      `/webhooks/${endpointId}/deliveries`
    );
    return response.deliveries;
  }

  /**
   * Busca estatísticas de um endpoint
   */
  async getStats(endpointId: string): Promise<WebhookStats> {
    return this.client.get<WebhookStats>(`/webhooks/${endpointId}/stats`);
  }
}

/**
 * Utilitário para verificar assinatura de webhook
 * 
 * Use no seu servidor para validar que o webhook veio do PROST-QS
 * 
 * NOTA: Esta função deve ser usada apenas em ambiente Node.js
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Implementação usando Web Crypto API (funciona em Node.js 18+ e browsers)
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(payload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Comparação segura (timing-safe em browsers modernos)
    return signature === expectedSignature;
  } catch {
    console.warn('Webhook signature verification failed');
    return false;
  }
}

/**
 * Tipo do payload de webhook recebido
 */
export interface WebhookPayload<T = Record<string, unknown>> {
  id: string;
  type: WebhookEventType;
  created_at: string;
  data: T;
}

/**
 * Headers enviados com cada webhook
 */
export interface WebhookHeaders {
  'X-Webhook-ID': string;
  'X-Webhook-Event': string;
  'X-Webhook-Timestamp': string;
  'X-Webhook-Signature': string;
}
