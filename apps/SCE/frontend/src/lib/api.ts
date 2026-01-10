
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class API {
  static async request(path: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sce_token') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sce_token');
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na infraestrutura.');
    }

    return response.json();
  }

  static getStreamUrl(deploymentId: string) {
    return `${BASE_URL}/deployments/${deploymentId}/logs/stream`;
  }
}
