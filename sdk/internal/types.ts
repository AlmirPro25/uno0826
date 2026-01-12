/**
 * Tipos compartilhados do SDK interno
 */

export interface ProstQSConfig {
  apiUrl: string;
  appId: string;
  apiKey?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  app_id: string;
  role: 'user' | 'admin' | 'owner';
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  app_id: string;
  token: string;
  refresh_token: string;
  expires_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string;
}

export interface TelemetryEvent {
  type: string;
  user_id?: string;
  session_id?: string;
  properties?: Record<string, any>;
  context?: Record<string, any>;
  timestamp?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    type: 'VALIDATION' | 'BUSINESS' | 'SYSTEM' | 'SECURITY';
    details?: Array<{ field: string; message: string }>;
  };
}
