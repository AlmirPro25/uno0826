/**
 * Identity SDK - Login, Register, Session
 */

import { ProstQSClient } from './client';
import { User, Session } from './types';

export class IdentitySDK {
  private client: ProstQSClient;

  constructor(client: ProstQSClient) {
    this.client = client;
  }

  /**
   * Registrar novo usuário
   */
  async register(email: string, password: string, name?: string): Promise<User> {
    const response = await this.client.request<User>('POST', '/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  }

  /**
   * Login com email e senha
   */
  async login(email: string, password: string): Promise<Session> {
    const response = await this.client.request<Session>('POST', '/auth/login', {
      email,
      password,
    });
    
    // Salvar token no cliente
    this.client.setToken(response.data.token);
    
    return response.data;
  }

  /**
   * Login implícito (para apps satélites)
   * Usa token do kernel para autenticar em outro app
   */
  async implicitLogin(kernelToken: string): Promise<Session> {
    const response = await this.client.request<Session>('POST', '/auth/implicit-login', {
      kernel_token: kernelToken,
    });
    
    this.client.setToken(response.data.token);
    
    return response.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.client.request('POST', '/auth/logout', {});
    this.client.clearToken();
  }

  /**
   * Obter usuário atual
   */
  async me(): Promise<User> {
    const response = await this.client.request<User>('GET', '/auth/me');
    return response.data;
  }

  /**
   * Refresh token
   */
  async refresh(refreshToken: string): Promise<Session> {
    const response = await this.client.request<Session>('POST', '/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    this.client.setToken(response.data.token);
    
    return response.data;
  }

  /**
   * Vincular conta a outro app (multi-app SSO)
   */
  async linkApp(targetAppId: string): Promise<{ linked: boolean }> {
    const response = await this.client.request<{ linked: boolean }>('POST', '/auth/link-app', {
      target_app_id: targetAppId,
    });
    return response.data;
  }

  /**
   * Listar apps vinculados
   */
  async linkedApps(): Promise<Array<{ app_id: string; app_name: string; linked_at: string }>> {
    const response = await this.client.request<Array<{ app_id: string; app_name: string; linked_at: string }>>('GET', '/auth/linked-apps');
    return response.data;
  }
}
