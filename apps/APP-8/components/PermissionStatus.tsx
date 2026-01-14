import React, { useState, useEffect } from 'react';
import { MicIcon, ScreenIcon, UserIcon } from './Icons';

interface PermissionStatusProps {
  onRetry: () => void;
}

interface PermissionState {
  camera: 'granted' | 'denied' | 'prompt' | 'checking';
  microphone: 'granted' | 'denied' | 'prompt' | 'checking';
  screen: 'granted' | 'denied' | 'prompt' | 'checking';
}

const PermissionStatus: React.FC<PermissionStatusProps> = ({ onRetry }) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'checking',
    microphone: 'checking',
    screen: 'checking'
  });

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check microphone
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissions(prev => ({ ...prev, microphone: micPermission.state as any }));

        // Check camera
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissions(prev => ({ ...prev, camera: cameraPermission.state as any }));

        // Screen sharing doesn't have a permission API, so we assume prompt
        setPermissions(prev => ({ ...prev, screen: 'prompt' }));
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkPermissions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'denied': return 'text-red-400 bg-red-900/30 border-red-700';
      case 'prompt': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted': return 'Concedida';
      case 'denied': return 'Negada';
      case 'prompt': return 'Pendente';
      default: return 'Verificando...';
    }
  };

  const allGranted = permissions.camera === 'granted' && 
                     permissions.microphone === 'granted' && 
                     permissions.screen === 'granted';

  return (
    <div className="fixed bottom-4 right-4 z-30 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 max-w-sm">
      <h3 className="text-sm font-semibold text-white mb-3">Status das Permissões</h3>
      
      <div className="space-y-2 mb-4">
        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor(permissions.screen)}`}>
          <div className="flex items-center gap-2">
            <ScreenIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Tela</span>
          </div>
          <span className="text-xs">{getStatusText(permissions.screen)}</span>
        </div>

        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor(permissions.microphone)}`}>
          <div className="flex items-center gap-2">
            <MicIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Microfone</span>
          </div>
          <span className="text-xs">{getStatusText(permissions.microphone)}</span>
        </div>

        <div className={`flex items-center justify-between p-2 rounded border ${getStatusColor(permissions.camera)}`}>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Câmera</span>
          </div>
          <span className="text-xs">{getStatusText(permissions.camera)}</span>
        </div>
      </div>

      {!allGranted && (
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition-colors"
        >
          Solicitar Permissões
        </button>
      )}
    </div>
  );
};

export default PermissionStatus;
