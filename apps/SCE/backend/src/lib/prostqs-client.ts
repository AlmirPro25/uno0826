/**
 * PROST-QS Client for Sovereign Cloud Engine (SCE)
 * Baseado no cliente do VOX-BRIDGE que FUNCIONA
 * 
 * Headers corretos:
 * - X-Prost-App-Key: pq_pk_xxx
 * - X-Prost-App-Secret: pq_sk_xxx
 */

const PROSTQS_URL = process.env.PROSTQS_URL || 'https://uno0826.onrender.com';
const PROSTQS_APP_KEY = process.env.PROSTQS_APP_KEY || '';
const PROSTQS_APP_SECRET = process.env.PROSTQS_APP_SECRET || '';
const APP_ID = process.env.PROSTQS_APP_ID || '';

// Validar configuração
const isConfigured = !!(PROSTQS_URL && PROSTQS_APP_KEY && PROSTQS_APP_SECRET);

if (isConfigured) {
  console.log(`✅ [PROST-QS] SCE Client configured`);
  console.log(`   URL: ${PROSTQS_URL}`);
  console.log(`   APP_ID: ${APP_ID}`);
  console.log(`   KEY: ${PROSTQS_APP_KEY.substring(0, 20)}...`);
} else {
  console.warn('⚠️ [PROST-QS] Client disabled - missing PROSTQS_APP_KEY or PROSTQS_APP_SECRET');
}

/**
 * Emite evento de telemetria para o PROST-QS
 */
async function emitTelemetry(
  type: string,
  userId: string = '00000000-0000-0000-0000-000000000000',
  sessionId: string = '00000000-0000-0000-0000-000000000000',
  options: {
    feature?: string;
    targetId?: string;
    targetType?: string;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
  } = {}
): Promise<boolean> {
  if (!isConfigured) {
    console.log(`⏭️ [PROST-QS] Skipped (not configured): ${type}`);
    return false;
  }

  try {
    const event = {
      user_id: userId || '00000000-0000-0000-0000-000000000000',
      session_id: sessionId || '00000000-0000-0000-0000-000000000000',
      type,
      feature: options.feature || '',
      target_id: options.targetId || '',
      target_type: options.targetType || '',
      context: JSON.stringify(options.context || {}),
      metadata: JSON.stringify(options.metadata || {}),
      timestamp: new Date().toISOString()
    };

    console.log(`📤 [PROST-QS] Sending: ${type}`);

    const response = await fetch(`${PROSTQS_URL}/api/v1/telemetry/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prost-App-Key': PROSTQS_APP_KEY,
        'X-Prost-App-Secret': PROSTQS_APP_SECRET
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [PROST-QS] ${type} failed: HTTP ${response.status} - ${text}`);
      return false;
    }

    console.log(`✅ [PROST-QS] ${type} sent successfully`);
    return true;
  } catch (error: any) {
    console.error(`❌ [PROST-QS] Error sending ${type}:`, error.message);
    return false;
  }
}

// ========================================
// DEPLOY EVENTS
// ========================================

function deployStarted(deploymentId: string, projectId: string, projectName: string, branch: string) {
  return emitTelemetry('deploy.started', 'system', deploymentId, {
    feature: 'deployment',
    targetId: projectId,
    targetType: 'project',
    context: { project_name: projectName, branch },
    metadata: { stage: 'queued' }
  });
}

function deployBuilding(deploymentId: string, projectId: string) {
  return emitTelemetry('deploy.building', 'system', deploymentId, {
    feature: 'deployment',
    targetId: projectId,
    targetType: 'project',
    metadata: { stage: 'building' }
  });
}

function deployHealthy(deploymentId: string, projectId: string, durationMs: number) {
  return emitTelemetry('deploy.healthy', 'system', deploymentId, {
    feature: 'deployment',
    targetId: projectId,
    targetType: 'project',
    metadata: { stage: 'healthy', duration_ms: durationMs }
  });
}

function deployFailed(deploymentId: string, projectId: string, error: string, stage: string) {
  return emitTelemetry('deploy.failed', 'system', deploymentId, {
    feature: 'deployment',
    targetId: projectId,
    targetType: 'project',
    metadata: { stage, error }
  });
}

// ========================================
// CONTAINER EVENTS
// ========================================

function containerStarted(containerId: string, projectId: string, imageTag: string) {
  return emitTelemetry('container.started', 'system', containerId, {
    feature: 'container',
    targetId: projectId,
    targetType: 'project',
    metadata: { image_tag: imageTag }
  });
}

function containerStopped(containerId: string, projectId: string, reason: string) {
  return emitTelemetry('container.stopped', 'system', containerId, {
    feature: 'container',
    targetId: projectId,
    targetType: 'project',
    metadata: { reason }
  });
}

function containerCrashed(containerId: string, projectId: string, exitCode: number, logs?: string) {
  return emitTelemetry('container.crashed', 'system', containerId, {
    feature: 'container',
    targetId: projectId,
    targetType: 'project',
    metadata: { exit_code: exitCode, logs: logs?.slice(-1000) }
  });
}

function containerMetrics(containerId: string, projectId: string, cpu: number, memory: number) {
  return emitTelemetry('container.metrics', 'system', containerId, {
    feature: 'container',
    targetId: projectId,
    targetType: 'project',
    metadata: { cpu_percent: cpu, memory_mb: memory }
  });
}

// ========================================
// PROJECT EVENTS
// ========================================

function projectCreated(projectId: string, name: string, type: string, userId?: string) {
  return emitTelemetry('project.created', userId || 'system', projectId, {
    feature: 'project',
    targetId: projectId,
    targetType: 'project',
    context: { name, type }
  });
}

function projectDeleted(projectId: string, name: string, userId?: string) {
  return emitTelemetry('project.deleted', userId || 'system', projectId, {
    feature: 'project',
    targetId: projectId,
    targetType: 'project',
    context: { name }
  });
}

// ========================================
// INFRA EVENTS
// ========================================

function infraHealthCheck(healthy: boolean, services: Record<string, boolean>) {
  return emitTelemetry('infra.health_check', 'system', '', {
    feature: 'infrastructure',
    metadata: { healthy, services }
  });
}

function infraResourceAlert(resource: string, value: number, threshold: number) {
  return emitTelemetry('infra.resource_alert', 'system', '', {
    feature: 'infrastructure',
    metadata: { resource, value, threshold, exceeded: value > threshold }
  });
}

// ========================================
// EXPORTS
// ========================================

export const prostqs = {
  // Config
  isConfigured,
  APP_ID,
  
  // Core
  emitTelemetry,
  
  // Deploy
  deployStarted,
  deployBuilding,
  deployHealthy,
  deployFailed,
  
  // Container
  containerStarted,
  containerStopped,
  containerCrashed,
  containerMetrics,
  
  // Project
  projectCreated,
  projectDeleted,
  
  // Infra
  infraHealthCheck,
  infraResourceAlert
};
