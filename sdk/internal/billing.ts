/**
 * Billing SDK - Subscriptions, Checkout
 */

import { ProstQSClient } from './client';
import { Subscription } from './types';

export class BillingSDK {
  private client: ProstQSClient;

  constructor(client: ProstQSClient) {
    this.client = client;
  }

  /**
   * Obter subscription atual do usuário
   */
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await this.client.request<Subscription>('GET', '/billing/subscription');
      return response.data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Criar checkout session para upgrade
   */
  async createCheckout(priceId: string, successUrl: string, cancelUrl: string): Promise<{ checkout_url: string }> {
    const response = await this.client.request<{ checkout_url: string }>('POST', '/billing/checkout', {
      price_id: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return response.data;
  }

  /**
   * Abrir portal do cliente (Stripe Customer Portal)
   */
  async createPortalSession(returnUrl: string): Promise<{ portal_url: string }> {
    const response = await this.client.request<{ portal_url: string }>('POST', '/billing/portal', {
      return_url: returnUrl,
    });
    return response.data;
  }

  /**
   * Cancelar subscription
   */
  async cancelSubscription(): Promise<Subscription> {
    const response = await this.client.request<Subscription>('POST', '/billing/subscription/cancel', {});
    return response.data;
  }

  /**
   * Reativar subscription cancelada
   */
  async reactivateSubscription(): Promise<Subscription> {
    const response = await this.client.request<Subscription>('POST', '/billing/subscription/reactivate', {});
    return response.data;
  }

  /**
   * Listar planos disponíveis
   */
  async getPlans(): Promise<Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
  }>> {
    const response = await this.client.request<Array<any>>('GET', '/billing/plans');
    return response.data;
  }

  /**
   * Verificar se usuário tem capability específica
   */
  async hasCapability(capability: string): Promise<boolean> {
    const response = await this.client.request<{ has_capability: boolean }>('GET', `/billing/capabilities/${capability}`);
    return response.data.has_capability;
  }

  /**
   * Listar todas as capabilities do usuário
   */
  async getCapabilities(): Promise<string[]> {
    const response = await this.client.request<{ capabilities: string[] }>('GET', '/billing/capabilities');
    return response.data.capabilities;
  }
}

// Planos padrão
export const Plans = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Capabilities padrão
export const Capabilities = {
  BASIC_TELEMETRY: 'basic_telemetry',
  FULL_TELEMETRY: 'full_telemetry',
  RULES_5: '5_rules',
  RULES_50: '50_rules',
  RULES_UNLIMITED: 'unlimited_rules',
  WEBHOOKS: 'webhooks',
  API_ACCESS: 'api_access',
  SHADOW_MODE: 'shadow_mode',
  KILL_SWITCH: 'kill_switch',
} as const;
