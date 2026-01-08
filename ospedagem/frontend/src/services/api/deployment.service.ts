const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class DeploymentService {
  static getLogStreamUrl(deploymentId: string): string {
    return `${BASE_URL}/deployments/${deploymentId}/logs/stream`;
  }

  static async triggerDeploy(projectId: string) {
    const token = localStorage.getItem('sce_token');
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
    const token = localStorage.getItem('sce_token');
    const response = await fetch(`${BASE_URL}/deployments/${deploymentId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.json();
  }
}
