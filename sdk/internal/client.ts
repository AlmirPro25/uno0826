/**
 * Cliente base do SDK
 */

import { ProstQSConfig, ApiResponse, ApiError } from './types';

export class ProstQSClient {
  private config: ProstQSConfig;
  private token: string | null = null;

  constructor(config: ProstQSConfig) {
    this.config = config;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiUrl}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-App-ID': this.config.appId,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ProstQSError(
        error.error.message,
        error.error.code,
        error.error.type,
        response.status
      );
    }

    return data as ApiResponse<T>;
  }

  // Convenience methods
  async get<T>(path: string): Promise<T> {
    const response = await this.request<T>('GET', path);
    return response.data;
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const response = await this.request<T>('POST', path, body);
    return response.data;
  }

  async put<T>(path: string, body?: any): Promise<T> {
    const response = await this.request<T>('PUT', path, body);
    return response.data;
  }

  async delete<T>(path: string, options?: { data?: any }): Promise<T> {
    const response = await this.request<T>('DELETE', path, options?.data);
    return response.data;
  }

  get appId() {
    return this.config.appId;
  }

  get apiUrl() {
    return this.config.apiUrl;
  }
}

export class ProstQSError extends Error {
  code: string;
  type: string;
  status: number;

  constructor(message: string, code: string, type: string, status: number) {
    super(message);
    this.name = 'ProstQSError';
    this.code = code;
    this.type = type;
    this.status = status;
  }

  isValidation() {
    return this.type === 'VALIDATION';
  }

  isBusiness() {
    return this.type === 'BUSINESS';
  }

  isSystem() {
    return this.type === 'SYSTEM';
  }

  isSecurity() {
    return this.type === 'SECURITY';
  }
}
