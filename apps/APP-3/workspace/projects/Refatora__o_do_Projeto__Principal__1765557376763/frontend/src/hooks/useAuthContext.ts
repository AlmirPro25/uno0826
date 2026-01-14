
import { useContext } from 'react';
import { AuthContext } from '../App';

/**
 * Hook personalizado para acessar o contexto de autenticação.
 * @returns {AuthContextType} O contexto de autenticação.
 */
export const useAuthContext = () => {
  return useContext(AuthContext);
};
