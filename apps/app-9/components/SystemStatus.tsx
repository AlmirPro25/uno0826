import React from 'react';

export const SystemStatus: React.FC = () => {
  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs text-gray-400 max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-semibold">Sistema Ativo</span>
      </div>
      <div className="space-y-1">
        <div>✅ Fallback System: Ativo</div>
        <div>✅ Templates: 6 disponíveis</div>
        <div>✅ Histórico: Funcionando</div>
        <div>✅ Exportação: Múltiplos formatos</div>
        <div>✅ Atalhos: Configurados</div>
      </div>
    </div>
  );
};