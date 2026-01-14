// components/AndroidExportModal.tsx
// Modal para exportar HTML como APK Android

import React, { useState } from 'react';
import { androidWebViewGenerator, type AndroidAppConfig } from '@/services/AndroidWebViewGenerator';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({
  isOpen,
  onClose,
  htmlContent
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  
  const [config, setConfig] = useState<AndroidAppConfig>({
    appName: 'Meu App',
    packageName: 'com.meuapp.app',
    versionName: '1.0.0',
    versionCode: 1,
    minSdk: 24,
    targetSdk: 34,
    htmlContent: '',
    enableJavaScript: true,
    enableGeolocation: false,
    enableCamera: false,
    orientation: 'sensor',
    fullscreen: false
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress('🤖 Analisando HTML...');

    try {
      // Atualizar config com HTML atual
      const finalConfig = { ...config, htmlContent };

      setProgress('🏗️ Gerando estrutura do projeto Android...');
      const project = await androidWebViewGenerator.generateAndroidProject(finalConfig);

      setProgress('📦 Criando arquivo ZIP...');
      await androidWebViewGenerator.exportAsZip(project, config.appName);

      setProgress('✅ Projeto Android gerado com sucesso!');
      
      setTimeout(() => {
        onClose();
        setIsGenerating(false);
        setProgress('');
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao gerar projeto Android:', error);
      setProgress('❌ Erro ao gerar projeto. Verifique o console.');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                Exportar como App Android
              </h2>
              <p className="text-green-100 mt-1">
                Transforme seu HTML em um aplicativo Android nativo
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informações do App */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📱 Informações do Aplicativo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome do App
                </label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Meu App Incrível"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Package Name
                </label>
                <input
                  type="text"
                  value={config.packageName}
                  onChange={(e) => setConfig({ ...config, packageName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  placeholder="com.empresa.app"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Versão
                </label>
                <input
                  type="text"
                  value={config.versionName}
                  onChange={(e) => setConfig({ ...config, versionName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1.0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Orientação
                </label>
                <select
                  value={config.orientation}
                  onChange={(e) => setConfig({ ...config, orientation: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="sensor">Automática</option>
                  <option value="portrait">Retrato</option>
                  <option value="landscape">Paisagem</option>
                </select>
              </div>
            </div>
          </div>

          {/* Permissões */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              🔐 Permissões e Recursos
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={config.enableJavaScript}
                  onChange={(e) => setConfig({ ...config, enableJavaScript: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <div className="text-white font-medium">JavaScript</div>
                  <div className="text-slate-400 text-sm">Habilitar execução de JavaScript (recomendado)</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={config.enableGeolocation}
                  onChange={(e) => setConfig({ ...config, enableGeolocation: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <div className="text-white font-medium">Geolocalização</div>
                  <div className="text-slate-400 text-sm">Acesso à localização do dispositivo</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={config.enableCamera}
                  onChange={(e) => setConfig({ ...config, enableCamera: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <div className="text-white font-medium">Câmera</div>
                  <div className="text-slate-400 text-sm">Acesso à câmera do dispositivo</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={config.fullscreen}
                  onChange={(e) => setConfig({ ...config, fullscreen: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <div className="text-white font-medium">Tela Cheia</div>
                  <div className="text-slate-400 text-sm">App ocupa toda a tela (esconde barra de status)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              O que será gerado?
            </h4>
            <ul className="text-blue-200 text-sm space-y-1 ml-7">
              <li>✅ Projeto Android Studio completo</li>
              <li>✅ MainActivity.kt com WebView configurado</li>
              <li>✅ Seu HTML embutido no app</li>
              <li>✅ AndroidManifest.xml com permissões</li>
              <li>✅ Gradle configurado e pronto para build</li>
              <li>✅ README com instruções de compilação</li>
              <li>✅ Interface JavaScript para comunicação nativa</li>
            </ul>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <span className="text-white font-medium">{progress}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <span className="text-xl">🤖</span>
                  Gerar Projeto Android
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
