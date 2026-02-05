
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { useUIStore } from '@/stores/useUIStore';

// Configuração industrial do cliente HTTP
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api', // O Vite Proxy redirecionará para http://localhost:3000
  timeout: 15000,  // 15s timeout para conexões lentas
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0-Luxe'
  }
});

// Interceptor de Requisição: Logging e Injeção de Auth (futuro)
apiClient.interceptors.request.use(
  (config) => {
    // Aqui poderíamos injetar tokens JWT
    // console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Tratamento Unificado de Erros
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const { showError } = useUIStore.getState();
    
    let errorMessage = "Ocorreu um erro inesperado de comunicação.";

    if (error.response) {
      // O servidor respondeu com um status fora de 2xx
      const data = error.response.data as any;
      errorMessage = data.error || `Erro do Servidor (${error.response.status})`;
      
      // Tratamento específico para códigos HTTP
      if (error.response.status === 404) errorMessage = "Recurso não encontrado.";
      if (error.response.status === 429) errorMessage = "Muitas requisições. Acalme-se.";
      if (error.response.status === 500) errorMessage = "Falha crítica no sistema central.";
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      errorMessage = "Sem resposta do servidor. Verifique sua conexão.";
    }

    // Dispara notificação global de erro na UI
    showError(errorMessage);
    console.error(`[API Error]`, error);
    
    return Promise.reject(error);
  }
);

export default apiClient;
