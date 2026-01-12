/**
 * ================================================================================
 * DEPLOYMENT SERVICE — SCE
 * ================================================================================
 * 
 * REGRA: Token vem do Zustand store (sce_prostqs_auth), não de localStorage direto.
 * 
 * ================================================================================
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Extrai token do Zustand store persistido
 */
function getTokenFromStore(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('sce_prostqs_auth');
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

export class DeploymentService {
  static getLogStreamUrl(deploymentId: string): string {
    return `${BASE_URL}/deployments/${deploymentId}/logs/stream`;
  }

  static async triggerDeploy(projectId: string) {
    const token = getTokenFromStore();
    const response = await fetch(`${BASE_URL}/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.json();
  }

  static async getDeployment(deploymentId: string) {
    const token = getTokenFromStore();
    const response = await fetch(`${BASE_URL}/deployments/${deploymentId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.json();
  }
}
