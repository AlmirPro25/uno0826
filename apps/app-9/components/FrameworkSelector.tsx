import React from 'react';

interface FrameworkSelectorProps {
  selectedFramework: 'tensorflow' | 'pytorch' | 'both';
  onFrameworkChange: (framework: 'tensorflow' | 'pytorch' | 'both') => void;
  disabled?: boolean;
}

export const FrameworkSelector: React.FC<FrameworkSelectorProps> = ({
  selectedFramework,
  onFrameworkChange,
  disabled = false
}) => {
  const frameworks = [
    {
      id: 'tensorflow',
      name: 'TensorFlow/Keras',
      icon: '🔥',
      description: 'Google\'s ML framework',
      pros: ['Fácil de usar', 'Keras integrado', 'TensorBoard', 'Produção'],
      color: 'bg-orange-600'
    },
    {
      id: 'pytorch',
      name: 'PyTorch',
      icon: '⚡',
      description: 'Facebook\'s research framework',
      pros: ['Dinâmico', 'Pythônico', 'Pesquisa', 'Flexível'],
      color: 'bg-red-600'
    },
    {
      id: 'both',
      name: 'Ambos',
      icon: '🔄',
      description: 'Gerar código para ambos',
      pros: ['Comparação', 'Flexibilidade', 'Aprendizado', 'Portabilidade'],
      color: 'bg-purple-600'
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Framework de Deep Learning
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {frameworks.map((framework) => (
          <div
            key={framework.id}
            className={`relative cursor-pointer transition-all duration-200 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => !disabled && onFrameworkChange(framework.id as any)}
          >
            <input
              type="radio"
              name="framework"
              value={framework.id}
              checked={selectedFramework === framework.id}
              onChange={() => onFrameworkChange(framework.id as any)}
              disabled={disabled}
              className="sr-only"
            />
            
            <div className={`
              border-2 rounded-lg p-4 transition-all duration-200
              ${selectedFramework === framework.id 
                ? `${framework.color} border-transparent shadow-lg` 
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }
            `}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{framework.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{framework.name}</h3>
                  <p className="text-xs text-gray-300">{framework.description}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                {framework.pros.map((pro, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
              
              {selectedFramework === framework.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedFramework === 'both' && (
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400">ℹ️</span>
            <span className="text-sm font-semibold text-blue-400">Modo Comparativo</span>
          </div>
          <p className="text-xs text-gray-300">
            Será gerado código equivalente em TensorFlow e PyTorch para comparação e aprendizado.
            Ideal para entender as diferenças entre os frameworks.
          </p>
        </div>
      )}
    </div>
  );
};