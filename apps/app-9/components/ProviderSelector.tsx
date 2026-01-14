import React, { useState, useEffect } from 'react';
import { AI_PROVIDERS, MODEL_CONFIGS, multiAI, type AIProvider } from '../services/multiAiService';
import { enhancedAI, getCurrentProvider, setAIProvider, getAvailableProviders } from '../services/enhancedAiService';

interface ProviderSelectorProps {
  onProviderChange?: (provider: AIProvider) => void;
  className?: string;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  onProviderChange,
  className = ""
}) => {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(getCurrentProvider());
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    // Carrega providers disponíveis
    const providers = getAvailableProviders();
    setAvailableProviders(providers);

    // Carrega API keys do localStorage
    const keys: Record<string, string> = {};
    Object.values(AI_PROVIDERS).forEach(provider => {
      const key = localStorage.getItem(`${provider.toUpperCase()}_API_KEY`) || '';
      keys[provider] = key;
      
      // Auto-configura providers que têm API key
      if (key) {
        multiAI.addProvider({
          provider,
          apiKey: key,
          model: getDefaultModel(provider),
          baseUrl: MODEL_CONFIGS[provider].baseUrl
        });
      }
    });
    setApiKeys(keys);
    
    // Atualiza lista de providers disponíveis
    setAvailableProviders(multiAI.getConfiguredProviders());
  }, []);

  const getDefaultModel = (provider: AIProvider): string => {
    const models = MODEL_CONFIGS[provider].models;
    return models[0]; // Primeiro modelo da lista
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

  const getProviderStatus = (provider: AIProvider) => {
    const hasKey = !!apiKeys[provider];
    const isConfigured = availableProviders.includes(provider);
    
    if (!hasKey) return { color: 'text-gray-500', text: 'Não configurado' };
    if (isConfigured) return { color: 'text-green-400', text: 'Pronto' };
    return { color: 'text-yellow-400', text: 'Configurando...' };
  };

  const handleProviderChange = (provider: AIProvider) => {
    if (!availableProviders.includes(provider)) {
      setShowQuickSetup(true);
      return;
    }

    setCurrentProvider(provider);
    setAIProvider(provider);
    onProviderChange?.(provider);
  };

  const handleQuickSetup = (provider: AIProvider, apiKey: string) => {
    // Salva no localStorage
    localStorage.setItem(`${provider.toUpperCase()}_API_KEY`, apiKey);
    
    // Configura no serviço
    multiAI.addProvider({
      provider,
      apiKey,
      model: getDefaultModel(provider),
      baseUrl: MODEL_CONFIGS[provider].baseUrl
    });

    // Atualiza estados
    setApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    setAvailableProviders(multiAI.getConfiguredProviders());
    setShowQuickSetup(false);
    
    // Define como provider ativo
    handleProviderChange(provider);
  };

  const quickSetupLinks = {
    [AI_PROVIDERS.GROQ]: 'https://console.groq.com/keys',
    [AI_PROVIDERS.OPENAI]: 'https://platform.openai.com/api-keys',
    [AI_PROVIDERS.CLAUDE]: 'https://console.anthropic.com/settings/keys',
    [AI_PROVIDERS.HUGGINGFACE]: 'https://huggingface.co/settings/tokens',
    [AI_PROVIDERS.TOGETHER]: 'https://api.together.xyz/settings/api-keys',
    [AI_PROVIDERS.GEMINI]: 'https://aistudio.google.com/app/apikey'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Seletor principal */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-300">IA:</label>
        <select
          value={currentProvider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
        >
          {Object.values(AI_PROVIDERS).map(provider => {
            const status = getProviderStatus(provider);
            return (
              <option key={provider} value={provider}>
                {getProviderIcon(provider)} {provider.charAt(0).toUpperCase() + provider.slice(1)} ({status.text})
              </option>
            );
          })}
        </select>
        
        <button
          onClick={() => setShowQuickSetup(!showQuickSetup)}
          className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          title="Configurar Providers"
        >
          ⚙️
        </button>
      </div>

      {/* Info do provider atual */}
      <div className="mt-1 text-xs text-gray-400">
        {MODEL_CONFIGS[currentProvider].free} • {MODEL_CONFIGS[currentProvider].limit}
      </div>

      {/* Quick Setup Modal */}
      {showQuickSetup && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">⚡ Setup Rápido</h4>
            <button
              onClick={() => setShowQuickSetup(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.values(AI_PROVIDERS).map(provider => {
              const status = getProviderStatus(provider);
              const isConfigured = status.text === 'Pronto';
              
              return (
                <div key={provider} className="border border-gray-600 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{getProviderIcon(provider)}</span>
                      <span className="font-medium text-white capitalize">{provider}</span>
                      <span className={`text-xs ${status.color}`}>({status.text})</span>
                    </div>
                    
                    {isConfigured && (
                      <span className="text-green-400 text-xs">✓</span>
                    )}
                  </div>

                  {!isConfigured && (
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder={`Cole sua ${provider} API key`}
                        className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              handleQuickSetup(provider, target.value.trim());
                            }
                          }
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {MODEL_CONFIGS[provider].free}
                        </span>
                        <a
                          href={quickSetupLinks[provider]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Obter API Key →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400">
            💡 <strong>Dica:</strong> Comece com Groq (grátis e rápido) ou use seu Gemini atual
          </div>
        </div>
      )}
    </div>
  );
};
