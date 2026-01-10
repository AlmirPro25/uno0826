import { useState, useCallback } from 'react';

const PROSTQS_URL = process.env.NEXT_PUBLIC_PROSTQS_URL || 'https://uno0826.onrender.com';
const APP_ID = process.env.NEXT_PUBLIC_PROSTQS_APP_ID || '011c6e88-9556-43ff-ad4e-27e20a5f5ea5';

interface Membership {
  app_id: string;
  app_name: string;
  role: string;
  status: string;
  linked_at: string;
  last_access_at: string;
}

interface LoginResponse {
  user_id: string;
  email: string;
  name: string;
  token: string;
  expires_at: number;
  is_new_user: boolean;
  origin_app_id: string;
  memberships: Membership[];
  needs_link: boolean;
  plan: string;
  capabilities: string[];
}

interface LinkResponse {
  success: boolean;
  token: string;
  expires_at: number;
  memberships: Membership[];
}

interface AuthState {
  isAuthenticated: boolean;
  needsLink: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    originAppId: string;
    memberships: Membership[];
    plan: string;
    capabilities: string[];
  } | null;
  token: string | null;
  error: string | null;
}

/**
 * Hook para autenticação multi-app com PROST-QS
 * 
 * Fluxo:
 * 1. login() → pode retornar needs_link: true
 * 2. Se needs_link, chamar linkApp()
 * 3. Após link, novo JWT é retornado
 * 
 * Princípio: "needs_link não é erro, é estado legítimo"
 */
export function useProstQSAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    needsLink: false,
    user: null,
    token: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Login no PROST-QS
   * Retorna needs_link: true se usuário não tem membership neste app
   */
  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    setState(prev => ({ ...prev, error: null }));

    try {
      const response = await fetch(`${PROSTQS_URL}/api/v1/identity/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          requesting_app_id: APP_ID, // ← IMPORTANTE: sempre enviar
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Credenciais inválidas');
      }

      const data: LoginResponse = await response.json();

      // Atualizar estado
      setState({
        isAuthenticated: !data.needs_link, // Só autenticado se não precisa de link
        needsLink: data.needs_link,
        user: {
          id: data.user_id,
          email: data.email,
          name: data.name,
          originAppId: data.origin_app_id,
          memberships: data.memberships,
          plan: data.plan,
          capabilities: data.capabilities,
        },
        token: data.token, // Salvar token mesmo se needs_link (para usar no link-app)
        error: null,
      });

      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Vincular usuário a este app
   * Chamado quando login retorna needs_link: true
   */
  const linkApp = useCallback(async (): Promise<LinkResponse> => {
    if (!state.token) {
      throw new Error('Token não disponível. Faça login primeiro.');
    }

    setIsLoading(true);
    setState(prev => ({ ...prev, error: null }));

    try {
      const response = await fetch(`${PROSTQS_URL}/api/v1/identity/link-app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ app_id: APP_ID }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao vincular conta');
      }

      const data: LinkResponse = await response.json();

      // Atualizar estado com novo token
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        needsLink: false,
        token: data.token, // ← Novo JWT com membership atualizado
        user: prev.user ? {
          ...prev.user,
          memberships: data.memberships,
        } : null,
      }));

      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state.token]);

  /**
   * Registrar novo usuário
   */
  const register = useCallback(async (email: string, password: string, name: string): Promise<LoginResponse> => {
    setIsLoading(true);
    setState(prev => ({ ...prev, error: null }));

    try {
      const response = await fetch(`${PROSTQS_URL}/api/v1/identity/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          origin_app_id: APP_ID, // ← Este app é a origem
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar conta');
      }

      const data: LoginResponse = await response.json();

      // Registro já cria membership automaticamente no app de origem
      setState({
        isAuthenticated: true,
        needsLink: false,
        user: {
          id: data.user_id,
          email: data.email,
          name: data.name,
          originAppId: data.origin_app_id,
          memberships: data.memberships,
          plan: data.plan,
          capabilities: data.capabilities,
        },
        token: data.token,
        error: null,
      });

      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      needsLink: false,
      user: null,
      token: null,
      error: null,
    });
  }, []);

  /**
   * Buscar perfil do usuário
   */
  const getProfile = useCallback(async () => {
    if (!state.token) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${PROSTQS_URL}/api/v1/identity/me`, {
      headers: { 'Authorization': `Bearer ${state.token}` },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar perfil');
    }

    return response.json();
  }, [state.token]);

  return {
    // Estado
    ...state,
    isLoading,
    
    // Ações
    login,
    register,
    linkApp,
    logout,
    getProfile,
    
    // Helpers
    hasCapability: (cap: string) => state.user?.capabilities.includes(cap) ?? false,
    hasMembership: (appId: string) => state.user?.memberships.some(m => m.app_id === appId && m.status === 'active') ?? false,
  };
}
