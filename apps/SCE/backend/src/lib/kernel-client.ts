/**
 * UNO.KERNEL Client for SCE Multi-Tenant Integration
 * 
 * Cada usuário do SCE tem seu próprio "App" no Kernel.
 * Isso garante isolamento total de dados, billing e regras.
 */

const KERNEL_URL = process.env.KERNEL_URL || 'https://uno0826.onrender.com';
const KERNEL_MASTER_KEY = process.env.KERNEL_MASTER_KEY || ''; // Key do SCE como plataforma

interface KernelApp {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  api_secret: string;
  owner_id: string;
}

interface KernelUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Cria uma identidade no Kernel para o usuário do SCE
 */
export async function createKernelIdentity(
  email: string,
  name: string,
  password: string
): Promise<KernelUser | null> {
  try {
    const res = await fetch(`${KERNEL_URL}/api/v1/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password })
    });
    
    if (!res.ok) {
      console.error(`[KERNEL] Failed to create identity: ${res.status}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[KERNEL] Error creating identity:', error);
    return null;
  }
}


/**
 * Cria um App no Kernel para o usuário do SCE
 * Cada usuário SCE = 1 App no Kernel = isolamento total
 */
export async function createKernelApp(
  userToken: string,
  appName: string
): Promise<KernelApp | null> {
  try {
    const res = await fetch(`${KERNEL_URL}/api/v1/apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: appName,
        slug: appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      })
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`[KERNEL] Failed to create app: ${res.status} - ${text}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[KERNEL] Error creating app:', error);
    return null;
  }
}

/**
 * Emite telemetria para o App específico do usuário
 */
export async function emitTelemetry(
  appKey: string,
  appSecret: string,
  event: {
    type: string;
    user_id?: string;
    session_id?: string;
    feature?: string;
    target_id?: string;
    target_type?: string;
    context?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${KERNEL_URL}/api/v1/telemetry/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prost-App-Key': appKey,
        'X-Prost-App-Secret': appSecret
      },
      body: JSON.stringify({
        ...event,
        user_id: event.user_id || '00000000-0000-0000-0000-000000000000',
        session_id: event.session_id || '00000000-0000-0000-0000-000000000000',
        context: JSON.stringify(event.context || {}),
        metadata: JSON.stringify(event.metadata || {}),
        timestamp: new Date().toISOString()
      })
    });
    
    return res.ok;
  } catch (error) {
    console.error('[KERNEL] Error emitting telemetry:', error);
    return false;
  }
}


/**
 * Busca telemetria do App do usuário
 */
export async function getTelemetry(
  appKey: string,
  appSecret: string,
  params?: { limit?: number; type?: string }
): Promise<unknown[]> {
  try {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    
    const res = await fetch(`${KERNEL_URL}/api/v1/telemetry/events?${query}`, {
      headers: {
        'X-Prost-App-Key': appKey,
        'X-Prost-App-Secret': appSecret
      }
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch (error) {
    console.error('[KERNEL] Error fetching telemetry:', error);
    return [];
  }
}

/**
 * Busca alertas do App do usuário
 */
export async function getAlerts(
  appKey: string,
  appSecret: string
): Promise<unknown[]> {
  try {
    const res = await fetch(`${KERNEL_URL}/api/v1/telemetry/alerts`, {
      headers: {
        'X-Prost-App-Key': appKey,
        'X-Prost-App-Secret': appSecret
      }
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.alerts || [];
  } catch (error) {
    console.error('[KERNEL] Error fetching alerts:', error);
    return [];
  }
}

// ========================================
// HELPER: Criar cliente para usuário específico
// ========================================

export function createUserKernelClient(appKey: string, appSecret: string) {
  return {
    // Telemetria
    emit: (type: string, data: Omit<Parameters<typeof emitTelemetry>[2], 'type'>) =>
      emitTelemetry(appKey, appSecret, { type, ...data }),
    
    getTelemetry: (params?: Parameters<typeof getTelemetry>[2]) =>
      getTelemetry(appKey, appSecret, params),
    
    getAlerts: () => getAlerts(appKey, appSecret),
    
    // Deploy events
    deployStarted: (deployId: string, projectId: string, projectName: string) =>
      emitTelemetry(appKey, appSecret, {
        type: 'deploy.started',
        target_id: projectId,
        target_type: 'project',
        context: { project_name: projectName },
        metadata: { deploy_id: deployId }
      }),
    
    deploySucceeded: (deployId: string, projectId: string, durationMs: number) =>
      emitTelemetry(appKey, appSecret, {
        type: 'deploy.succeeded',
        target_id: projectId,
        target_type: 'project',
        metadata: { deploy_id: deployId, duration_ms: durationMs }
      }),
    
    deployFailed: (deployId: string, projectId: string, error: string) =>
      emitTelemetry(appKey, appSecret, {
        type: 'deploy.failed',
        target_id: projectId,
        target_type: 'project',
        metadata: { deploy_id: deployId, error }
      }),
    
    // Container events
    containerStarted: (containerId: string, projectId: string) =>
      emitTelemetry(appKey, appSecret, {
        type: 'container.started',
        target_id: projectId,
        target_type: 'project',
        metadata: { container_id: containerId }
      }),
    
    containerCrashed: (containerId: string, projectId: string, exitCode: number) =>
      emitTelemetry(appKey, appSecret, {
        type: 'container.crashed',
        target_id: projectId,
        target_type: 'project',
        metadata: { container_id: containerId, exit_code: exitCode }
      }),
  };
}

export const kernel = {
  createIdentity: createKernelIdentity,
  createApp: createKernelApp,
  emitTelemetry,
  getTelemetry,
  getAlerts,
  createUserClient: createUserKernelClient
};
