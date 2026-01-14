import React, { useState } from 'react';
import { AI_PROVIDERS, multiAI, type AIProvider } from '../services/multiAiService';
import { AIProviderSettings } from './AIProviderSettings';

export const MultiAITester: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS.GEMINI);
  const [prompt, setPrompt] = useState('Crie uma rede neural simples para classificar números pares e ímpares');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSendMessage = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const result = await multiAI.sendMessage(selectedProvider, prompt);
      setResponse(result);
    } catch (error) {
      setResponse(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToAny = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const result = await multiAI.sendToFirstAvailable(prompt);
      setResponse(`[${result.provider.toUpperCase()}] ${result.response}`);
    } catch (error) {
      setResponse(`Erro: ${error instanceof Error ? error.message : 'Nenhum provider disponível'}`);
    } finally {
      setIsLoading(false);
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

  const examplePrompts = [
    'Crie uma rede neural simples para classificar números pares e ímpares',
    'Explique como funciona uma rede neural convolucional',
    'Crie um modelo de regressão linear para prever preços de casas',
    'Como implementar dropout em uma rede neural?'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">🤖 Testador Multi-AI</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            {showSettings ? 'Ocultar' : 'Configurar'} Providers
          </button>
        </div>

        {showSettings && (
          <div className="mb-6">
            <AIProviderSettings
              currentProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
            />
          </div>
        )}

        <div className="space-y-4">
          {/* Seletor de Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider Ativo:
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(AI_PROVIDERS).map(provider => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    selectedProvider === provider
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{getProviderIcon(provider)}</span>
                  <span className="capitalize">{provider}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompts de exemplo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prompts de Exemplo:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="text-left p-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Input do prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seu Prompt:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite seu prompt aqui..."
              className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none text-white resize-none"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !prompt.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {isLoading ? 'Enviando...' : `Enviar para ${selectedProvider.toUpperCase()}`}
            </button>
            
            <button
              onClick={handleSendToAny}
              disabled={isLoading || !prompt.trim()}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {isLoading ? 'Enviando...' : 'Enviar para Qualquer'}
            </button>
          </div>

          {/* Área de resposta */}
          {(response || isLoading) && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resposta:
              </label>
              <div className="bg-gray-900 border border-gray-600 rounded p-4 min-h-32">
                {isLoading ? (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <pre className="text-gray-300 whitespace-pre-wrap text-sm">{response}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações dos providers */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-3">📊 Status dos Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(AI_PROVIDERS).map(provider => (
            <div key={provider} className="bg-gray-700 rounded p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getProviderIcon(provider)}</span>
                <span className="font-medium text-white capitalize">{provider}</span>
              </div>
              <div className="text-xs text-gray-400">
                <div>Configurado: {multiAI.getConfiguredProviders().includes(provider) ? '✅' : '❌'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
