/**
 * Telemetry SDK - Track events, sessions
 */

import { ProstQSClient } from './client';
import { TelemetryEvent } from './types';

export class TelemetrySDK {
  private client: ProstQSClient;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private queue: TelemetryEvent[] = [];
  private flushInterval: number | null = null;

  constructor(client: ProstQSClient) {
    this.client = client;
  }

  /**
   * Identificar usuário para eventos futuros
   */
  identify(userId: string) {
    this.userId = userId;
  }

  /**
   * Iniciar sessão de telemetria
   */
  async startSession(deviceId?: string): Promise<string> {
    const response = await this.client.request<{ session_id: string }>('POST', '/telemetry/sessions', {
      device_id: deviceId,
      user_id: this.userId,
    });
    
    this.sessionId = response.data.session_id;
    
    // Iniciar flush automático a cada 10 segundos
    this.startAutoFlush();
    
    return this.sessionId;
  }

  /**
   * Enviar heartbeat (ping) da sessão
   */
  async ping(currentFeature?: string): Promise<void> {
    if (!this.sessionId) return;
    
    await this.client.request('POST', `/telemetry/sessions/${this.sessionId}/ping`, {
      current_feature: currentFeature,
    });
  }

  /**
   * Encerrar sessão
   */
  async endSession(): Promise<void> {
    if (!this.sessionId) return;
    
    // Flush eventos pendentes
    await this.flush();
    
    await this.client.request('POST', `/telemetry/sessions/${this.sessionId}/end`, {});
    
    this.sessionId = null;
    this.stopAutoFlush();
  }

  /**
   * Rastrear evento
   */
  track(type: string, properties?: Record<string, any>, context?: Record<string, any>) {
    const event: TelemetryEvent = {
      type,
      user_id: this.userId || undefined,
      session_id: this.sessionId || undefined,
      properties,
      context,
      timestamp: new Date().toISOString(),
    };
    
    this.queue.push(event);
    
    // Flush se queue estiver grande
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  /**
   * Enviar eventos em batch
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await this.client.request('POST', '/telemetry/events/batch', { events });
    } catch (error) {
      // Re-adicionar eventos na fila em caso de erro
      this.queue = [...events, ...this.queue];
      throw error;
    }
  }

  private startAutoFlush() {
    if (this.flushInterval) return;
    
    this.flushInterval = window.setInterval(() => {
      this.flush().catch(console.error);
    }, 10000) as unknown as number;
  }

  private stopAutoFlush() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// Eventos padrão
export const Events = {
  // Sessão
  SESSION_START: 'session.start',
  SESSION_PING: 'session.ping',
  SESSION_END: 'session.end',
  
  // Navegação
  PAGE_VIEW: 'nav.screen.view',
  FEATURE_ENTER: 'nav.feature.enter',
  FEATURE_LEAVE: 'nav.feature.leave',
  
  // Interações
  BUTTON_CLICK: 'interaction.button.click',
  FORM_SUBMIT: 'interaction.form.submit',
  
  // Erros
  ERROR: 'error.generic',
  ERROR_API: 'error.api',
} as const;
