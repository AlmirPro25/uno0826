/**
 * PROST-QS SDK — Activity Module
 * 
 * Gerenciamento de log de atividades.
 */

import { ProstQSClient } from './client';

export interface Activity {
  id: string;
  user_id: string;
  app_id?: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  metadata?: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  success: boolean;
  created_at: string;
}

export interface ActivityStats {
  user_id: string;
  total_activities: number;
  activities_last_7_days: number;
  logins_last_30_days: number;
  failed_logins_last_30_days: number;
  last_activity: string;
  by_type: Record<string, number>;
}

export interface ListActivitiesResponse {
  activities: Activity[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Activity Service
 */
export class ActivityService {
  constructor(private client: ProstQSClient) {}

  /**
   * Listar atividades do usuário
   */
  async listActivities(limit = 50, offset = 0): Promise<ListActivitiesResponse> {
    return this.client.get(`/activity?limit=${limit}&offset=${offset}`);
  }

  /**
   * Obter estatísticas de atividades
   */
  async getStats(): Promise<ActivityStats> {
    return this.client.get('/activity/stats');
  }

  /**
   * Listar atividades de segurança (admin)
   */
  async listSecurityActivities(limit = 50): Promise<{ activities: Activity[]; count: number }> {
    return this.client.get(`/activity/security?limit=${limit}`);
  }

  /**
   * Listar atividades de um app
   */
  async listAppActivities(appId: string, limit = 50, offset = 0): Promise<ListActivitiesResponse> {
    return this.client.get(`/apps/${appId}/activity?limit=${limit}&offset=${offset}`);
  }
}

/**
 * Criar instância do ActivityService
 */
export function createActivityService(client: ProstQSClient): ActivityService {
  return new ActivityService(client);
}
