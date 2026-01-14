
import { useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { login, register } from '../services/authService';

/**
 * Interface para os dados do formulário de autenticação.
 */
interface AuthFormData {
  email: string;
  password: string;
}

/**
 * Componente da página de autenticação (Login e Registro).
 * @returns {JSX.Element} O componente AuthPage.
 */
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuthContext();

  /**
   * Manipula a mudança de estado entre login e registro.
   * Limpa o formulário e erros ao alternar.
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '' });
    setError('');
  };

  /**
   * Manipula o envio do formulário.
   * Chama a API de login ou registro.
   * @param {React.FormEvent} e - Evento de formulário.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const data = await login(formData.email, formData.password);
        auth.login(data.token, data.user_id, formData.email);
      } else {
        const data = await register(formData.email, formData.password);
        auth.login(data.token, data.user_id, formData.email);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">
          {isLogin ? 'Login' : 'Criar Conta'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-dark">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible-primary"
              required
              aria-label="Email de login"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-dark">Senha</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible-primary"
              required
              aria-label="Senha de login"
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-lg text-white font-semibold shadow-md focus-visible-primary disabled:opacity-50 transition duration-150 ease-in-out bg-primary hover:bg-indigo-600"
            aria-label={isLogin ? 'Entrar na conta' : 'Criar nova conta'}
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Registrar')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button
            onClick={toggleMode}
            className="ml-1 font-semibold text-primary hover:text-indigo-600 transition duration-150 ease-in-out focus-visible-primary"
            aria-label={isLogin ? 'Alternar para registro' : 'Alternar para login'}
          >
            {isLogin ? 'Registre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
