import React, { useState, useEffect } from 'react';

interface Settings {
  theme: 'dark' | 'light' | 'auto';
  defaultModel: string;
  autoSave: boolean;
  showAdvancedOptions: boolean;
  defaultDataset: string;
  codeStyle: 'compact' | 'verbose' | 'commented';
  exportFormat: 'zip' | 'github' | 'colab';
  notifications: boolean;
  analyticsEnabled: boolean;
  maxHistoryItems: number;
  autoExportOnGenerate: boolean;
  preferredFramework: 'streamlit' | 'gradio' | 'auto';
}

interface SettingsManagerProps {
  onClose: () => void;
  onSettingsChange: (settings: Settings) => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  defaultModel: 'gemini-2.5-flash',
  autoSave: true,
  showAdvancedOptions: false,
  defaultDataset: 'none',
  codeStyle: 'commented',
  exportFormat: 'zip',
  notifications: true,
  analyticsEnabled: true,
  maxHistoryItems: 50,
  autoExportOnGenerate: false,
  preferredFramework: 'auto'
};

export const SettingsManager: React.FC<SettingsManagerProps> = ({ onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-creator-settings');
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    }
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('ai-creator-settings', JSON.stringify(settings));
    onSettingsChange(settings);
    setHasChanges(false);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ai-creator-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...DEFAULT_SETTINGS, ...importedSettings });
        setHasChanges(true);
      } catch (error) {
        alert('Erro ao importar configurações. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Configurações</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aparência */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
              🎨 Aparência
            </h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tema</label>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as any)}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Estilo do Código</label>
              <select
                value={settings.codeStyle}
                onChange={(e) => updateSetting('codeStyle', e.target.value as any)}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="compact">Compacto</option>
                <option value="verbose">Detalhado</option>
                <option value="commented">Com Comentários</option>
              </select>
            </div>
          </div>

          {/* Padrões */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
              🔧 Padrões
            </h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Modelo Padrão</label>
              <select
                value={settings.defaultModel}
                onChange={(e) => updateSetting('defaultModel', e.target.value)}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Dataset Padrão</label>
              <select
                value={settings.defaultDataset}
                onChange={(e) => updateSetting('defaultDataset', e.target.value)}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="none">Nenhum</option>
                <option value="mnist">MNIST</option>
                <option value="cifar10">CIFAR-10</option>
                <option value="imdb">IMDB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Framework de UI Preferido</label>
              <select
                value={settings.preferredFramework}
                onChange={(e) => updateSetting('preferredFramework', e.target.value as any)}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="auto">Automático</option>
                <option value="streamlit">Streamlit</option>
                <option value="gradio">Gradio</option>
              </select>
            </div>
          </div>

          {/* Comportamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
              ⚡ Comportamento
            </h3>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => updateSetting('autoSave', e.target.checked)}
                className="rounded border-gray-500 bg-gray-800 text-purple-600"
              />
              <span className="text-gray-300">Salvamento Automático</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showAdvancedOptions}
                onChange={(e) => updateSetting('showAdvancedOptions', e.target.checked)}
                className="rounded border-gray-500 bg-gray-800 text-purple-600"
              />
              <span className="text-gray-300">Mostrar Opções Avançadas</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoExportOnGenerate}
                onChange={(e) => updateSetting('autoExportOnGenerate', e.target.checked)}
                className="rounded border-gray-500 bg-gray-800 text-purple-600"
              />
              <span className="text-gray-300">Auto-exportar após Gerar</span>
            </label>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Máximo de Itens no Histórico: {settings.maxHistoryItems}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={settings.maxHistoryItems}
                onChange={(e) => updateSetting('maxHistoryItems', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Privacidade */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
              🔒 Privacidade
            </h3>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="rounded border-gray-500 bg-gray-800 text-purple-600"
              />
              <span className="text-gray-300">Notificações</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.analyticsEnabled}
                onChange={(e) => updateSetting('analyticsEnabled', e.target.checked)}
                className="rounded border-gray-500 bg-gray-800 text-purple-600"
              />
              <span className="text-gray-300">Analytics e Métricas</span>
            </label>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Formato de Exportação Padrão</label>
              <select
                value={settings.exportFormat}
                onChange={(e) => updateSetting('exportFormat', e.target.value as any)}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="zip">ZIP</option>
                <option value="github">GitHub</option>
                <option value="colab">Google Colab</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveSettings}
              disabled={!hasChanges}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Salvar Configurações
            </button>
            
            <button
              onClick={resetSettings}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Restaurar Padrões
            </button>
            
            <button
              onClick={exportSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Exportar Configurações
            </button>
            
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              Importar Configurações
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
            >
              Fechar
            </button>
          </div>
          
          {hasChanges && (
            <p className="text-yellow-400 text-sm mt-2">
              ⚠️ Você tem alterações não salvas
            </p>
          )}
        </div>
      </div>
    </div>
  );
};