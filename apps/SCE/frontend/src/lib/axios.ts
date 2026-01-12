import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * ================================================================================
 * CLIENTE HTTP — SCE
 * ================================================================================
 * 
 * REGRA: Token vem do Zustand store (sce_prostqs_auth), não de localStorage direto.
 * O store persiste automaticamente via zustand/persist.
 * 
 * Fluxo de auth:
 * 1. Login via Kernel → token salvo no store
 * 2. Interceptor lê do store → injeta no header
 * 3. 401 → limpa store → redireciona para /
 * 
 * ================================================================================
 */

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Extrai token do Zustand store persistido
 * O store usa key 'sce_prostqs_auth' no localStorage
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

// Interceptor de Requisição: Injeção de JWT do Kernel
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getTokenFromStore();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Tratamento de 401 e NEEDS_LINK
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const code = (error.response?.data as any)?.code;
    
    if (status === 401) {
      // Token inválido ou expirado → logout e redirecionar
      clearAuthStore();
      if (typeof window !== 'undefined') {
        window.location.href = '/?reason=expired';
      }
    }
    
    if (status === 403 && code === 'NEEDS_LINK') {
      // Usuário autenticado mas sem membership no SCE
      // Redirecionar para home onde o modal de link será mostrado
      if (typeof window !== 'undefined') {
        window.location.href = '/?needs_link=true';
      }
    }
    
    const errorMessage = (error.response?.data as any)?.error || 'Erro na infraestrutura.';
    console.error(`[SCE-API-ERROR]: ${errorMessage}`);
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
