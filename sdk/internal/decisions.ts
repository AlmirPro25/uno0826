/**
 * Decisions SDK - Query system decisions
 */

import { ProstQSClient } from './client';

export interface Decision {
  id: string;
  app_id: string;
  type: string;
  outcome: 'allowed' | 'blocked' | 'deferred' | 'escalated' | 'retry';
  reason: string;
  reason_code?: string;
  user_id?: string;
  session_id?: string;
  resource_id?: string;
  resource_type?: string;
  trigger_type?: string;
  trigger_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reversible: boolean;
  decided_at: string;
  expires_at?: string;
}

export interface DecisionStats {
  by_outcome: Record<string, number>;
  total: number;
  period: {
    hours: number;
    since: string;
  };
}

export class DecisionsSDK {
  private client: ProstQSClient;

  constructor(client: ProstQSClient) {
    this.client = client;
  }

  /**
   * Listar decisões recentes
   */
  async list(limit: number = 50): Promise<Decision[]> {
    const response = await this.client.request<Decision[]>('GET', `/decisions?limit=${limit}`);
    return response.data;
  }

  /**
   * Listar decisões críticas
   */
  async listCritical(hours: number = 24): Promise<Decision[]> {
    const response = await this.client.request<Decision[]>('GET', `/decisions/critical?hours=${hours}`);
    return response.data;
  }

  /**
   * Listar decisões por tipo
   */
  async listByType(type: string, limit: number = 50): Promise<Decision[]> {
    const response = await this.client.request<Decision[]>('GET', `/decisions/by-type/${type}?limit=${limit}`);
    return response.data;
  }

  /**
   * Listar decisões de um usuário
   */
  async listByUser(userId: string, limit: number = 50): Promise<Decision[]> {
    const response = await this.client.request<Decision[]>('GET', `/decisions/by-user/${userId}?limit=${limit}`);
    return response.data;
  }

  /**
   * Obter estatísticas de decisões
   */
  async stats(hours: number = 24): Promise<DecisionStats> {
    const response = await this.client.request<DecisionStats>('GET', `/decisions/stats?hours=${hours}`);
    return response.data;
  }
}

// Tipos de decisão
export const DecisionTypes = {
  // Acesso
  ACCESS_ALLOWED: 'access.allowed',
  ACCESS_DENIED: 'access.denied',
  ACCESS_DEFERRED: 'access.deferred',
  
  // Pagamento
  PAYMENT_ALLOWED: 'payment.allowed',
  PAYMENT_BLOCKED: 'payment.blocked',
  PAYMENT_RETRY: 'payment.retry',
  
  // Regras
  RULE_TRIGGERED: 'rule.triggered',
  RULE_SKIPPED: 'rule.skipped',
  RULE_SHADOW: 'rule.shadow',
  
  // Kill Switch
  KILLSWITCH_BLOCK: 'killswitch.block',
  KILLSWITCH_ALLOW: 'killswitch.allow',
  
  // Segurança
  SECURITY_BLOCK: 'security.block',
  SECURITY_QUARANTINE: 'security.quarantine',
  SECURITY_ESCALATE: 'security.escalate',
  
  // Invariantes
  INVARIANT_VIOLATION: 'invariant.violation',
  INVARIANT_RECOVERY: 'invariant.recovery',
  
  // Rate Limit
  RATELIMIT_BLOCK: 'ratelimit.block',
  RATELIMIT_THROTTLE: 'ratelimit.throttle',
} as const;

// Outcomes
export const Outcomes = {
  ALLOWED: 'allowed',
  BLOCKED: 'blocked',
  DEFERRED: 'deferred',
  ESCALATED: 'escalated',
  RETRY: 'retry',
} as const;

// Severidades
export const Severities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
