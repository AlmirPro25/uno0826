
import axios from 'axios';

// Define a URL base da API do backend.
// Em um ambiente Docker, o frontend acessa o backend pelo nome do serviço ('backend').
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const axiosInstance = axios.create({ baseURL: API_BASE_URL });

/**
 * Interface para a resposta da API de login/registro.
 */
interface AuthResponse {
  token: string;
  user_id: number;
}

/**
 * Realiza a requisição de registro de usuário.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<AuthResponse>} Dados de autenticação.
 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await axiosInstance.post('/api/auth/register', { email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao registrar usuário.');
  }
}

/**
 * Realiza a requisição de login de usuário.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<AuthResponse>} Dados de autenticação.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Credenciais inválidas.');
  }
}

/**
 * Verifica se o usuário está autenticado localmente (verifica o token no LocalStorage).
 * @returns {{ id: number, email: string } | null} Dados do usuário se autenticado, senão null.
 */
export function checkAuth(): { id: number, email: string } | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // Nota: A validação completa do JWT (expiração, assinatura) deve ser feita no backend.
    // Aqui fazemos uma verificação básica de existência.
    // Em produção, você pode decodificar o token para obter o ID do usuário.
    // Exemplo simplificado para manter o escopo:
    return { id: 0, email: 'user@example.com' }; // Retorna um objeto placeholder. O ID real é obtido no login.
  } catch {
    return null;
  }
}

/**
 * Remove o token do LocalStorage.
 */
export function logout(): void {
  localStorage.removeItem('token');
}
