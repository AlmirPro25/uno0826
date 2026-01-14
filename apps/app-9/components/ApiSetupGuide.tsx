import React, { useState } from 'react';

interface ApiSetupGuideProps {
  onClose: () => void;
}

export const ApiSetupGuide: React.FC<ApiSetupGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKey, setApiKey] = useState('');

  const steps = [
    {
      title: 'Obter Chave da API Gemini',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Para usar todas as funcionalidades, você precisa de uma chave da API do Google Gemini.
          </p>
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">📝 Passos:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Acesse <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google AI Studio</a></li>
              <li>Faça login com sua conta Google</li>
              <li>Clique em "Create API Key"</li>
              <li>Copie a chave gerada</li>
            </ol>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Importante:</h4>
            <p className="text-sm text-gray-300">
              A API Gemini tem um limite gratuito generoso, mas mantenha sua chave segura e não a compartilhe.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Configurar Variável de Ambiente',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Crie um arquivo <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code> na raiz do projeto:
          </p>
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
            <code className="text-green-400 text-sm font-mono">
              API_KEY=sua_chave_aqui
            </code>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">
              Teste sua chave aqui (opcional):
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua chave da API aqui para testar"
              className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-gray-200 text-sm font-mono"
            />
            {apiKey && (
              <p className="text-xs text-gray-500">
                ✅ Chave detectada ({apiKey.length} caracteres)
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Reiniciar Aplicação',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Após configurar a chave da API, reinicie a aplicação:
          </p>
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
            <code className="text-blue-400 text-sm font-mono">
              # Parar o servidor (Ctrl+C)<br/>
              # Depois executar novamente:<br/>
              npm run dev
            </code>
          </div>
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🎉 Pronto!</h4>
            <p className="text-sm text-gray-300">
              Agora você pode gerar redes neurais personalizadas com IA!
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Configurar API Gemini</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Passo {currentStep} de {steps.length}</span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            {steps[currentStep - 1].title}
          </h3>
          {steps[currentStep - 1].content}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          
          <div className="flex gap-2">
            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Concluir ✓
              </button>
            )}
          </div>
        </div>

        {/* Alternative Options */}
        <div className="mt-6 pt-6 border-t border-gray-600">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Alternativas:</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• <strong>Modo Offline:</strong> Use exemplos pré-configurados sem API</p>
            <p>• <strong>Templates:</strong> Acesse modelos prontos no menu Templates</p>
            <p>• <strong>Histórico:</strong> Reutilize projetos anteriores</p>
          </div>
        </div>
      </div>
    </div>
  );
};