import React, { useState, useEffect } from 'react';
import { AI_PROVIDERS, MODEL_CONFIGS, multiAI, type AIProvider, type AIConfig } from '../services/multiAiService';

interface AIProviderSettingsProps {
  onProviderChange?: (provider: AIProvider) => void;
  currentProvider?: AIProvider;
}

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({
  onProviderChange,
  currentProvider = AI_PROVIDERS.GEMINI
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(currentProvider);
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    [AI_PROVIDERS.GEMINI]: localStorage.getItem('GEMINI_API_KEY') || '',
    [AI_PROVIDERS.OPENAI]: localStorage.getItem('OPENAI_API_KEY') || '',
    [AI_PROVIDERS.CLAUDE]: localStorage.getItem('CLAUDE_API_KEY') || '',
    [AI_PROVIDERS.GROQ]: localStorage.getItem('GROQ_API_KEY') || '',
    [AI_PROVIDERS.HUGGINGFACE]: localStorage.getItem('HF_API_KEY') || '',
    [AI_PROVIDERS.TOGETHER]: localStorage.getItem('TOGETHER_API_KEY') || ''
  });
  const [selectedModels, setSelectedModels] = useState<Record<AIProvider, string>>({
    [AI_PROVIDERS.GEMINI]: 'gemini-1.5-flash',
    [AI_PROVIDERS.OPENAI]: 'gpt-4o-mini',
    [AI_PROVIDERS.CLAUDE]: 'claude-3-haiku-20240307',
    [AI_PROVIDERS.GROQ]: 'llama-3.1-8b-instant',
    [AI_PROVIDERS.HUGGINGFACE]: 'microsoft/DialoGPT-large',
    [AI_PROVIDERS.TOGETHER]: 'meta-llama/Llama-3-8b-chat-hf'
  });
  const [testResults, setTestResults] = useState<Record<AIProvider, boolean | null>>({
    [AI_PROVIDERS.GEMINI]: null,
    [AI_PROVIDERS.OPENAI]: null,
    [AI_PROVIDERS.CLAUDE]: null,
    [AI_PROVIDERS.GROQ]: null,
    [AI_PROVIDERS.HUGGINGFACE]: null,
    [AI_PROVIDERS.TOGETHER]: null
  });

  // Configura os providers no serviço
  useEffect(() => {
    Object.entries(apiKeys).forEach(([provider, apiKey]) => {
      if (apiKey) {
        multiAI.addProvider({
          provider: provider as AIProvider,
          apiKey,
          model: selectedModels[provider as AIProvider],
          baseUrl: MODEL_CONFIGS[provider as AIProvider].baseUrl
        });
      }
    });
  }, [apiKeys, selectedModels]);

  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    localStorage.setItem(`${provider.toUpperCase()}_API_KEY`, value);
  };

  const handleModelChange = (provider: AIProvider, model: string) => {
    setSelectedModels(prev => ({ ...prev, [provider]: model }));
  };

  const testProvider = async (provider: AIProvider) => {
    if (!apiKeys[provider]) {
      alert(`Configure a API key para ${provider} primeiro!`);
      return;
    }

    setTestResults(prev => ({ ...prev, [provider]: null }));
    
    try {
      const isWorking = await multiAI.testProvider(provider);
      setTestResults(prev => ({ ...prev, [provider]: isWorking }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getProviderIcon = (provider: AIProvider) => {
    const icons = {
      [AI_PROVIDERS.GEMINI]: '🔷',
      [AI_PROVIDERS.OPENAI]: '🤖',
      [AI_PROVIDERS.CLAUDE]: '🎭',
      [AI_PROVIDERS.GROQ]: '⚡',
      [AI_PROVIDERS.HUGGINGFACE]: '🤗',
      [AI_PROVIDERS.TOGETHER]: '🤝'
    };
    return icons[provider];
  };

  const getStatusColor = (provider: AIProvider) => {
    const result = testResults[provider];
    if (result === null) return 'text-gray-400';
    return result ? 'text-green-400' : 'text-red-400';
  };

  const getStatusText = (provider: AIProvider) => {
    const result = testResults[provider];
    if (result === null) return 'Não testado';
    return result ? 'Funcionando' : 'Erro';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Configurar Provedores de IA</h3>
        <div className="text-sm text-gray-400">
          {multiAI.getConfiguredProviders().length} configurados
        </div>
      </div>

      <div className="space-y-4">
        {Object.values(AI_PROVIDERS).map(provider => (
          <div key={provider} className="border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getProviderIcon(provider)}</span>
                <div>
                  <h4 className="font-medium capitalize">{provider}</h4>
                  <p className="text-xs text-gray-400">
                    {MODEL_CONFIGS[provider].free} • {MODEL_CONFIGS[provider].limit}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getStatusColor(provider)}`}>
                  {getStatusText(provider)}
                </span>
                <button
                  onClick={() => testProvider(provider)}
                  disabled={!apiKeys[provider]}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
                >
                  Testar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">API Key:</label>
                <input
                  type="password"
                  value={apiKeys[provider]}
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                  placeholder={`Cole sua ${provider} API key aqui`}
                  className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Modelo:</label>
                <select
                  value={selectedModels[provider]}
                  onChange={(e) => handleModelChange(provider, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
                >
                  {MODEL_CONFIGS[provider].models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            {provider === selectedProvider && (
              <div className="mt-2 px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-xs">
                ✓ Provider ativo
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium mb-2">Provider Ativo:</label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                const provider = e.target.value as AIProvider;
                setSelectedProvider(provider);
                onProviderChange?.(provider);
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
            >
              {Object.values(AI_PROVIDERS).map(provider => (
                <option key={provider} value={provider} disabled={!apiKeys[provider]}>
                  {getProviderIcon(provider)} {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  {!apiKeys[provider] && ' (Não configurado)'}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Links úteis:</div>
            <div className="space-x-2 text-xs">
              <a href="https://aistudio.google.com" target="_blank" className="text-blue-400 hover:underline">Gemini</a>
              <a href="https://platform.openai.com" target="_blank" className="text-blue-400 hover:underline">OpenAI</a>
              <a href="https://console.groq.com" target="_blank" className="text-blue-400 hover:underline">Groq</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
