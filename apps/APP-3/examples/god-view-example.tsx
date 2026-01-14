/**
 * 👁️ Exemplo de uso da God View
 * 
 * Este exemplo mostra como integrar a God View com o sistema de colaboração multi-agente
 */

import React, { useState } from 'react';
import { GodView } from '../components/GodView';
import { useGodView } from '../hooks/useGodView';
import { orchestrateMultiAgent } from '../services/MultiAgentCoordinator';

export const GodViewExample: React.FC = () => {
  const { isOpen, openGodView, closeGodView, subscribeToSession } = useGodView();
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleStartCollaboration = async () => {
    if (!prompt.trim()) return;
    
    setIsCollaborating(true);
    openGodView(); // Abre a God View em modo demo primeiro
    
    try {
      // Inicia a colaboração real
      const result = await orchestrateMultiAgent(prompt);
      
      // Conecta a God View à sessão real
      subscribeToSession(result.sessionId);
      
      console.log('Colaboração concluída!', result);
    } catch (error) {
      console.error('Erro na colaboração:', error);
    } finally {
      setIsCollaborating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <span>👁️</span> God View Demo
        </h1>
        <p className="text-gray-400 mb-8">
          Visualize a colaboração multi-agente em tempo real
        </p>

        {/* Input */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <label className="block text-sm font-semibold mb-2">
            Descreva o sistema que você quer criar:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Marketplace com autenticação, pagamentos Stripe e dashboard admin"
            className="w-full h-32 bg-gray-900 rounded-lg p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleStartCollaboration}
            disabled={isCollaborating || !prompt.trim()}
            className={`
              flex-1 py-3 rounded-lg font-semibold transition-colors
              ${isCollaborating || !prompt.trim()
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'}
            `}
          >
            {isCollaborating ? '⏳ Colaborando...' : '🚀 Iniciar Colaboração Real'}
          </button>
          
          <button
            onClick={() => openGodView()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors"
          >
            👁️ Abrir Demo
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-gray-800/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">🐝 Como funciona a Colméia:</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
              <span>O sistema analisa seu pedido e identifica os domínios necessários</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
              <span>Especialistas são forjados para cada domínio (Auth, Payments, Admin...)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
              <span>Os agentes negociam contratos de interface entre si</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
              <span>Cada agente trabalha em paralelo, respeitando dependências</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">5</span>
              <span>Os artefatos são integrados e revisados cruzadamente</span>
            </li>
          </ol>
        </div>
      </div>

      {/* God View Modal */}
      {isOpen && <GodView onClose={closeGodView} />}
    </div>
  );
};

export default GodViewExample;
