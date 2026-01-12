/**
 * ================================================================================
 * API CLIENT — SCE
 * ================================================================================
 * 
 * Cliente HTTP nativo (fetch) para casos onde axios não é necessário.
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

/**
 * Limpa o store de auth (logout forçado)
 */
function clearAuthStore(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sce_prostqs_auth');
}

export class API {
  static async request(path: string, options: RequestInit = {}) {
    const token = getTokenFromStore();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    
    // 401 → Token inválido/expirado → logout
    if (response.status === 401) {
      clearAuthStore();
      if (typeof window !== 'undefined') {
        window.location.href = '/?reason=expired';
      }
      throw new Error('Sessão expirada');
    }
    
    // 403 NEEDS_LINK → Usuário sem membership no SCE
    if (response.status === 403) {
      const data = await response.json();
      if (data.code === 'NEEDS_LINK') {
        if (typeof window !== 'undefined') {
          window.location.href = '/?needs_link=true';
        }
        throw new Error('Vinculação necessária');
      }
      throw new Error(data.error || 'Acesso negado');
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
