
import React from 'react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (repoName: string) => void;
  repoName: string;
  onRepoNameChange: (name: string) => void;
  deploymentStatus: string | null;
  deploymentUrl: string | null;
  isLoading: boolean;
  githubUser: string;
}

const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
  onDeploy,
  repoName,
  onRepoNameChange,
  deploymentStatus,
  deploymentUrl,
  isLoading,
  githubUser,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoName.trim() && !isLoading) {
      onDeploy(repoName.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[180] p-4" // High z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vercel-deploy-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="vercel-deploy-modal-title" className="text-xl sm:text-2xl font-semibold text-cyan-400">
            <i className="fa-solid fa-cloud-arrow-up mr-2"></i>Implantar na Vercel (Simulação)
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Fechar modal de implantação Vercel"
            disabled={isLoading}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vercel-repo-name" className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Repositório GitHub a Implantar:
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-slate-700 border border-r-0 border-slate-600 rounded-l-md text-slate-400 text-sm">
                {githubUser}/
              </span>
              <input
                type="text"
                id="vercel-repo-name"
                value={repoName}
                onChange={(e) => onRepoNameChange(e.target.value)}
                placeholder="meu-projeto-incrivel"
                className="w-full p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-r-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                disabled={isLoading}
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Este deve ser um repositório existente na sua conta GitHub.</p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !repoName.trim()}
            className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-2 text-sm font-medium"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Implantando...
              </>
            ) : (
              <>
                <i className="fa-solid fa-rocket mr-1.5"></i>
                Iniciar Implantação na Vercel (Simulado)
              </>
            )}
          </button>
        </form>

        {(deploymentStatus || deploymentUrl) && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-1.5">Status da Implantação:</h3>
            {deploymentStatus && (
              <p className={`text-sm p-2 rounded-md ${deploymentUrl ? 'bg-green-700/30 text-green-300' : (deploymentStatus.toLowerCase().includes('falha') ? 'bg-red-700/30 text-red-300' : 'bg-slate-700/50 text-slate-300')} animate-pulse-fast`}>
                {deploymentStatus}
              </p>
            )}
            {deploymentUrl && (
              <div className="mt-2">
                <p className="text-sm text-slate-300">URL do Projeto (Simulado):</p>
                <a
                  href={deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 hover:underline break-all text-sm"
                >
                  {deploymentUrl} <i className="fa-solid fa-arrow-up-right-from-square fa-xs ml-1"></i>
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-5 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
            disabled={isLoading}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VercelDeployModal;
