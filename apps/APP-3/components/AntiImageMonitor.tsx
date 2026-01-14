import React, { useEffect, useState } from 'react';
import { AntiImageDirective } from '@/services/AntiImageDirective';
import { useAppStore } from '@/store/useAppStore';

/**
 * Monitor em tempo real que detecta e previne geração de imagens no código
 */
export const AntiImageMonitor: React.FC = () => {
  const { htmlCode, setHtmlCode, setAiStatusMessage } = useAppStore();
  const [violations, setViolations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    if (!isMonitoring || !htmlCode) return;

    const validation = AntiImageDirective.validateCode(htmlCode);
    
    if (!validation.isValid) {
      setViolations(validation.violations);
      
      // Auto-sanitizar se necessário
      const sanitizedCode = AntiImageDirective.sanitizeCode(htmlCode);
      if (sanitizedCode !== htmlCode) {
        setHtmlCode(sanitizedCode);
        setAiStatusMessage('🛡️ Código sanitizado automaticamente - imagens removidas');
        
        // Limpar mensagem após 5 segundos
        setTimeout(() => setAiStatusMessage(''), 5000);
      }
    } else {
      setViolations([]);
    }
  }, [htmlCode, isMonitoring, setHtmlCode, setAiStatusMessage]);

  if (violations.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-900/90 border border-red-500 rounded-lg p-4 max-w-md z-50 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <i className="fa-solid fa-shield-halved text-red-400 text-lg"></i>
        <h3 className="text-red-300 font-bold">Sistema Anti-Imagem Ativo</h3>
        <button
          onClick={() => setIsMonitoring(false)}
          className="ml-auto text-red-400 hover:text-red-300"
        >
          <i className="fa-solid fa-times"></i>
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-red-200 text-sm">Violações detectadas e corrigidas:</p>
        {violations.map((violation, index) => (
          <div key={index} className="bg-red-800/50 rounded p-2 text-xs text-red-100">
            ⚠️ {violation}
          </div>
        ))}
      </div>
      
      <div className="mt-3 p-2 bg-green-900/30 border border-green-600 rounded text-xs text-green-200">
        ✅ Use o sistema de geração de imagens dedicado do Almir
      </div>
    </div>
  );
};
