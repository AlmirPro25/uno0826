/**
 * ================================================================================
 * EVENTS SDK — Cliente para Sistema de Eventos do PROST-QS
 * ================================================================================
 * 
 * Permite consultar eventos emitidos pelo sistema.
 * Útil para debugging, auditoria e integração com dashboards.
 * 
 * "Eventos são fatos. Fatos não mentem."
 * 
 * ================================================================================
 */

import { ProstQSClient } from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface Event {
  id: string;
  app_id: string;
  type: string;
  payload: string; // JSON string
  source: string;
  user_id?: string;
  created_at: string;
}

export interface EventType {
  type: string;
  category: string;
  description: string;
}

export interface EventStats {
  app_id: string;
  total: number;
  by_type: Array<{ type: string; count: number }>;
  last_24h: number;
  last_hour: number;
}

// ============================================================================
// EVENTS MODULE
// ============================================================================

export class EventsModule {
  constructor(private client: ProstQSClient) {}

  /**
   * Lista tipos de eventos disponíveis
   */
  async getEventTypes(): Promise<EventType[]> {
    const response = await this.client.get<{ types: EventType[] }>('/events/types');
    return response.types;
  }

  /**
   * Lista eventos de um app
   * @param appId ID do app
   * @param limit Limite de eventos (default: 50, max: 500)
   */
  async getAppEvents(appId: string, limit: number = 50): Promise<Event[]> {
    const response = await this.client.get<{ events: Event[] }>(
      `/events/app/${appId}?limit=${limit}`
    );
    return response.events;
  }

  /**
   * Lista eventos de um usuário
   * @param userId ID do usuário
   * @param limit Limite de eventos (default: 50, max: 500)
   */
  async getUserEvents(userId: string, limit: number = 50): Promise<Event[]> {
    const response = await this.client.get<{ events: Event[] }>(
      `/events/user/${userId}?limit=${limit}`
    );
    return response.events;
  }

  /**
   * Obtém estatísticas de eventos de um app
   * @param appId ID do app
   */
  async getEventStats(appId: string): Promise<EventStats> {
    return this.client.get<EventStats>(`/events/stats/${appId}`);
  }

  /**
   * Parse do payload de um evento
   * @param event Evento com payload JSON
   */
  parsePayload<T = Record<string, unknown>>(event: Event): T {
    try {
      return JSON.parse(event.payload) as T;
    } catch {
      return {} as T;
    }
  }
}

// ============================================================================
// EVENT TYPE CONSTANTS
// ============================================================================

export const EventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_MFA_ENABLED: 'user.mfa.enabled',
  USER_MFA_DISABLED: 'user.mfa.disabled',

  // Session events
  SESSION_CREATED: 'session.created',
  SESSION_REVOKED: 'session.revoked',
  SESSION_EXPIRED: 'session.expired',

  // Billing events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',

  // App events
  APP_MEMBERSHIP_CREATED: 'app.membership.created',
  APP_MEMBERSHIP_REMOVED: 'app.membership.removed',

  // System events
  ALERT_TRIGGERED: 'alert.triggered',
  INCIDENT_CREATED: 'incident.created',
} as const;

export type EventTypeName = typeof EventTypes[keyof typeof EventTypes];
