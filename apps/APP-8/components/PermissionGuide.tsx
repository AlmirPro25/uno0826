import React from 'react';
import { MicIcon, ScreenIcon, UserIcon, CloseIcon } from './Icons';

interface PermissionGuideProps {
  onClose: () => void;
  onRequestPermissions: () => void;
}

const PermissionGuide: React.FC<PermissionGuideProps> = ({ onClose, onRequestPermissions }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl p-5 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Permissões Necessárias</h2>
        <p className="text-gray-400 text-sm mb-4">
          Para funcionar, precisamos de acesso a:
        </p>

        <div className="space-y-3 mb-5">
          {/* Screen Permission */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <ScreenIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-0.5">Compartilhamento de Tela</h3>
              <p className="text-xs text-gray-400">
                A IA vê sua tela em tempo real. Você escolhe qual janela compartilhar.
              </p>
            </div>
          </div>

          {/* Microphone Permission */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <MicIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-0.5">Microfone</h3>
              <p className="text-xs text-gray-400">
                Conversação por voz natural. Suas palavras são transcritas em tempo real.
              </p>
            </div>
          </div>

          {/* Camera Permission */}
          <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-0.5">Webcam</h3>
              <p className="text-xs text-gray-400">
                A IA vê você através da webcam e reconhece seu rosto. Pode ser desativada a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4">
          <h4 className="text-xs font-semibold text-purple-400 mb-1.5">🔒 Sua Privacidade</h4>
          <ul className="text-xs text-gray-400 space-y-0.5">
            <li>• Você controla quando iniciar e parar</li>
            <li>• Conversas salvas localmente no navegador</li>
            <li>• Pode revogar permissões a qualquer momento</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onRequestPermissions}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-purple-600/30"
          >
            Conceder Permissões
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionGuide;
