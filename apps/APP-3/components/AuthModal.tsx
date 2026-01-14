
import React, { useState, useEffect } from 'react';
import * as AuthService from '@/services/AuthService';
import type { UserProfile } from '@/store/useAppStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (data: { token: string; user: UserProfile }) => void;
}

// Extend the Window interface to include the google object from the GSI client library
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: any) => void; }) => void;
                    renderButton: (parent: HTMLElement, options: any) => void;
                    prompt: () => void;
                }
            }
        }
    }
}


const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("Google Client ID (GOOGLE_CLIENT_ID) is not configured in environment variables.");
      setError("O login com Google não está configurado.");
      return;
    }

    if (window.google) {
      try {
        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleSignIn,
        });

        const googleButtonContainer = document.getElementById('google-signin-button');
        if (googleButtonContainer) {
            googleButtonContainer.innerHTML = ''; // Clear previous button
            window.google.accounts.id.renderButton(
                googleButtonContainer,
                { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', shape: 'rectangular', width: '100%' }
            );
        }
      } catch (e) {
          console.error("Error initializing Google Sign-In", e);
          setError("Falha ao iniciar o login com Google.");
      }
    }
  }, [isOpen]);

  const handleGoogleSignIn = async (response: { credential?: string }) => {
    if (!response.credential) {
      setError("Falha ao obter credencial do Google.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        const authData = await AuthService.loginWithGoogle(response.credential);
        const userProfile: UserProfile = { id: authData.id, email: authData.email };
        onLoginSuccess({ token: authData.token, user: userProfile });
        onClose();
    } catch (err: any) {
        setError(err.message || "Ocorreu um erro ao fazer login com o Google.");
    } finally {
        setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (mode === 'register' && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      if (mode === 'login') {
        response = await AuthService.login(email, password);
      } else {
        response = await AuthService.register(email, password);
      }
      
      const userProfile: UserProfile = {
          id: response.id,
          email: response.email,
      };

      onLoginSuccess({ token: response.token, user: userProfile });
      onClose();

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginButtonDisabled = isLoading || !email || !password;
  const isRegisterButtonDisabled = isLoading || !email || password.length < 8 || password !== confirmPassword;

  return (
     <div 
        className="login-modal fixed inset-0 z-50 flex items-center justify-center p-4" 
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <div className="login-modal-content p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-sm animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-sky-500/20 p-2 rounded-lg">
                        <i className="fa-solid fa-code-branch text-sky-400 text-xl"></i>
                    </div>
                    <div>
                        <h2 id="login-modal-title" className="text-xl font-bold text-slate-100">
                            Bem-vindo de volta!
                        </h2>
                        <p className="text-sm text-slate-400">Acesse sua conta para continuar.</p>
                    </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-sky-300 transition-colors p-1 rounded-md disabled:opacity-50" 
                  aria-label="Fechar modal"
                  disabled={isLoading}
                >
                    <i className="fa-solid fa-times w-5 h-5"></i>
                </button>
            </div>
            
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-md mb-4 animate-shake">
                    {error}
                </div>
            )}
            
            <div id="google-signin-button" className="mb-4 flex justify-center"></div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-800 px-2 text-xs text-slate-500">OU</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                    <input 
                      type="email" 
                      id="login-email" 
                      name="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input w-full p-2.5 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800"
                      required 
                      placeholder="seu@email.com"
                      disabled={isLoading}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                    <input 
                      type="password" 
                      id="login-password" 
                      name="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input w-full p-2.5 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800"
                      required 
                      placeholder="********"
                      disabled={isLoading}
                    />
                </div>

                {mode === 'register' && (
                  <div className="mb-6">
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-1">Confirmar Senha</label>
                      <input 
                        type="password" 
                        id="confirm-password" 
                        name="confirm-password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="login-input w-full p-2.5 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800"
                        required 
                        placeholder="********"
                        disabled={isLoading}
                      />
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="login-button w-full font-semibold py-2.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-wait"
                  disabled={mode === 'login' ? isLoginButtonDisabled : isRegisterButtonDisabled}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (mode === 'login' ? 'Entrar com Email' : 'Registrar com Email')}
                </button>
            </form>
            <p className="text-xs text-slate-400 mt-6 text-center">
                {mode === 'login' ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="text-sky-400 hover:underline disabled:opacity-50" disabled={isLoading}>
                    {mode === 'login' ? 'Crie uma aqui' : 'Faça login aqui'}.
                </button>
            </p>
        </div>
        <style>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
            }
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0); }
              20%, 80% { transform: translate3d(2px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
              40%, 60% { transform: translate3d(4px, 0, 0); }
            }
            .animate-shake {
              animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
            }
        `}</style>
    </div>
  );
};

export default AuthModal;
