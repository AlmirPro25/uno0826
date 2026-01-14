import React, { useState } from 'react';
import { ResetIcon } from './icons/Icons';

interface BrowserRunnerProps {
  htmlContent: string;
}

export const BrowserRunner: React.FC<BrowserRunnerProps> = ({ htmlContent }) => {
  const [iframeKey, setIframeKey] = useState(Date.now());

  const handleReload = () => {
    setIframeKey(Date.now());
  };

  return (
    <div className="w-full h-[700px] bg-gray-900 rounded-b-xl overflow-hidden p-2 flex flex-col">
      <div className="flex-shrink-0 bg-gray-700/50 px-4 py-2 flex items-center justify-between rounded-t-lg border-b border-gray-600">
        <h3 className="text-sm font-semibold text-gray-200">Execução no Navegador</h3>
        <div className="flex items-center space-x-2">
           <button 
             onClick={handleReload} 
             title="Recarregar Execução"
             className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-gray-300 bg-gray-600/50 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
           >
            <ResetIcon className="w-4 h-4" />
            <span>Recarregar</span>
          </button>
        </div>
      </div>
      <div className="flex-grow w-full h-full">
        <iframe
          key={iframeKey}
          srcDoc={htmlContent}
          title="Aplicação TensorFlow.js no Navegador"
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};
