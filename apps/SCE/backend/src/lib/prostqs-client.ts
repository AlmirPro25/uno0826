/**
 * PROST-QS Client for Sovereign Cloud Engine (SCE)
 * 
 * Integração com o kernel de observabilidade e governança
 * Eventos de lifecycle: deploy, container, project
 */

import { randomUUID } from 'crypto';

interface ProstQSConfig {
  url: string;
  appId: string;
  appKey: string;
  appSecret: string;
}

interface TelemetryEvent {
  type: string;
  user_id?: string;
  session_id?: string;
  data?: Record<string, any>;
  timestamp?: string;
}

class ProstQSClient {
  private config: ProstQSConfig;
  private enabled: boolean = false;

  constructor() {
    this.config = {
      url: process.env.PROSTQS_URL || 'https://uno0826.onrender.com',
      appId: process.env.PROSTQS_APP_ID || '',
      appKey: process.env.PROSTQS_APP_KEY || '',
      appSecret: process.env.PROSTQS_APP_SECRET || '',
    };

    this.enabled = !!(this.config.appId && this.config.appKey);
    
    if (this.enabled) {
      console.log('🔗 [PROST-QS] Client initialized for SCE');
    } else {
      console.log('⚠️ [PROST-QS] Client disabled - missing credentials');
    }
  }

  /**
   * Envia evento de telemetria para o PROST-QS
   */
  async sendEvent(event: TelemetryEvent): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const response = await fetch(`${this.config.url}/api/v1/telemetry/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': this.config.appId,
          'X-App-Key': this.config.appKey,
        },
        body: JSON.stringify({
          ...event,
          timestamp: event.timestamp || new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error(`[PROST-QS] Event failed: ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[PROST-QS] Event error:', error);
      return false;
    }
  }

  // ========================================
  // DEPLOY EVENTS
  // ========================================

  async deployStarted(deploymentId: string, projectId: string, projectName: string, branch: string) {
    return this.sendEvent({
      type: 'deploy.started',
      session_id: deploymentId,
      data: {
        deployment_id: deploymentId,
        project_id: projectId,
        project_name: projectName,
        branch,
        stage: 'queued',
      },
    });
  }

  async deployBuilding(deploymentId: string, projectId: string) {
    return this.sendEvent({
      type: 'deploy.building',
      session_id: deploymentId,
      data: {
        deployment_id: deploymentId,
        project_id: projectId,
        stage: 'building',
      },
    });
  }

  async deployHealthy(deploymentId: string, projectId: string, duration: number) {
    return this.sendEvent({
      type: 'deploy.healthy',
      session_id: deploymentId,
      data: {
        deployment_id: deploymentId,
        project_id: projectId,
        stage: 'healthy',
        duration_ms: duration,
      },
    });
  }

  async deployFailed(deploymentId: string, projectId: string, error: string, stage: string) {
    return this.sendEvent({
      type: 'deploy.failed',
      session_id: deploymentId,
      data: {
        deployment_id: deploymentId,
        project_id: projectId,
        stage,
        error,
      },
    });
  }

  // ========================================
  // CONTAINER EVENTS
  // ========================================

  async containerStarted(containerId: string, projectId: string, imageTag: string) {
    return this.sendEvent({
      type: 'container.started',
      session_id: containerId,
      data: {
        container_id: containerId,
        project_id: projectId,
        image_tag: imageTag,
      },
    });
  }

  async containerStopped(containerId: string, projectId: string, reason: string) {
    return this.sendEvent({
      type: 'container.stopped',
      session_id: containerId,
      data: {
        container_id: containerId,
        project_id: projectId,
        reason,
      },
    });
  }

  async containerCrashed(containerId: string, projectId: string, exitCode: number, logs?: string) {
    return this.sendEvent({
      type: 'container.crashed',
      session_id: containerId,
      data: {
        container_id: containerId,
        project_id: projectId,
        exit_code: exitCode,
        logs: logs?.slice(-1000), // Últimos 1000 chars
      },
    });
  }

  async containerMetrics(containerId: string, projectId: string, cpu: number, memory: number) {
    return this.sendEvent({
      type: 'container.metrics',
      session_id: containerId,
      data: {
        container_id: containerId,
        project_id: projectId,
        cpu_percent: cpu,
        memory_mb: memory,
      },
    });
  }

  // ========================================
  // PROJECT EVENTS
  // ========================================

  async projectCreated(projectId: string, name: string, type: string, userId?: string) {
    return this.sendEvent({
      type: 'project.created',
      user_id: userId,
      data: {
        project_id: projectId,
        name,
        type,
      },
    });
  }

  async projectDeleted(projectId: string, name: string, userId?: string) {
    return this.sendEvent({
      type: 'project.deleted',
      user_id: userId,
      data: {
        project_id: projectId,
        name,
      },
    });
  }

  // ========================================
  // INFRA EVENTS
  // ========================================

  async infraHealthCheck(healthy: boolean, services: Record<string, boolean>) {
    return this.sendEvent({
      type: 'infra.health_check',
      data: {
        healthy,
        services,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async infraResourceAlert(resource: string, value: number, threshold: number) {
    return this.sendEvent({
      type: 'infra.resource_alert',
      data: {
        resource, // 'cpu', 'memory', 'disk'
        value,
        threshold,
        exceeded: value > threshold,
      },
    });
  }
}

// Singleton
export const prostqs = new ProstQSClient();
