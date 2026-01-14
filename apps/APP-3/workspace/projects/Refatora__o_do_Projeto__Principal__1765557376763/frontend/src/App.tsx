
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import { checkAuth, logout } from './services/authService';

/**
 * Interface para representar o estado de autenticação do usuário.
 */
interface AuthContextType {
  user: { id: number; email: string } | null;
  isAuthenticated: boolean;
  login: (token: string, userId: number, email: string) => void;
  logout: () => void;
}

/**
 * Cria um contexto de autenticação global para a aplicação.
 */
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

/**
 * Componente principal da aplicação que gerencia o estado de autenticação e rotas.
 * @returns {JSX.Element} O componente App.
 */
function App() {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica a autenticação ao carregar o componente
    const user = checkAuth();
    if (user) {
      setUser(user);
    }
    setLoading(false);
  }, []);

  /**
   * Função para login. Armazena o token e atualiza o estado do usuário.
   * @param {string} token - JWT retornado pelo backend.
   * @param {number} userId - ID do usuário.
   * @param {string} email - E-mail do usuário.
   */
  const handleLogin = (token: string, userId: number, email: string) => {
    localStorage.setItem('token', token);
    setUser({ id: userId, email });
  };

  /**
   * Função para logout. Remove o token e limpa o estado do usuário.
   */
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  /**
   * Componente de rota privada. Redireciona para login se não estiver autenticado.
   * @param {object} props - Propriedades do componente.
   * @param {React.ReactNode} props.children - Componente filho a ser renderizado.
   * @returns {JSX.Element} O componente PrivateRoute.
   */
  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/auth" replace />;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-primary">Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login: handleLogin, logout: handleLogout }}>
      <Router>
        <Routes>
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
