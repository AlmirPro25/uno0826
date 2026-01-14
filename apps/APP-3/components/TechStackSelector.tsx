import React from 'react';
import { stackTemplates } from '@/config/stackTemplates';
import type { TechStack } from '@/types/ProjectStructure';

interface TechStackSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStack: (stack: TechStack, specialist: 'general' | 'frontend' | 'backend') => void;
}

export const TechStackSelector: React.FC<TechStackSelectorProps> = ({
  isOpen,
  onClose,
  onSelectStack
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<'frontend' | 'backend' | 'all'>('all');
  const [selectedStack, setSelectedStack] = React.useState<TechStack | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = React.useState<'general' | 'frontend' | 'backend'>('general');

  if (!isOpen) return null;

  const filteredStacks = Object.values(stackTemplates).filter(stack => 
    selectedCategory === 'all' || stack.category === selectedCategory
  );

  const handleConfirm = () => {
    if (selectedStack) {
      onSelectStack(selectedStack, selectedSpecialist);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            <i className="fa-solid fa-layer-group mr-2 text-blue-400"></i>
            Escolher Tecnologias
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-md hover:bg-slate-700"
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <i className="fa-solid fa-globe mr-2"></i>Todas
          </button>
          <button
            onClick={() => setSelectedCategory('frontend')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'frontend' 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <i className="fa-solid fa-desktop mr-2"></i>Frontend
          </button>
          <button
            onClick={() => setSelectedCategory('backend')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'backend' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <i className="fa-solid fa-server mr-2"></i>Backend
          </button>
        </div>

        {/* Grid de Tecnologias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredStacks.map((stack) => (
            <button
              key={stack.id}
              onClick={() => setSelectedStack(stack.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                selectedStack === stack.id
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <i className={`${stack.icon} text-2xl ${
                  stack.category === 'frontend' ? 'text-green-400' : 'text-purple-400'
                }`}></i>
                <div>
                  <h3 className="font-semibold text-slate-100">{stack.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stack.category === 'frontend' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {stack.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300">{stack.description}</p>
              
              {/* Dependências */}
              {stack.dependencies.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">Principais dependências:</p>
                  <div className="flex flex-wrap gap-1">
                    {stack.dependencies.slice(0, 3).map((dep) => (
                      <span key={dep} className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-300">
                        {dep}
                      </span>
                    ))}
                    {stack.dependencies.length > 3 && (
                      <span className="text-xs text-slate-400">+{stack.dependencies.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Seletor de Especialista IA */}
        {selectedStack && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">
              <i className="fa-solid fa-robot mr-2 text-blue-400"></i>
              Especialista IA
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedSpecialist('general')}
                className={`p-3 rounded-lg text-center transition-colors ${
                  selectedSpecialist === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                <i className="fa-solid fa-brain block text-xl mb-1"></i>
                <span className="text-sm font-medium">Geral</span>
                <p className="text-xs opacity-80">Conhecimento amplo</p>
              </button>
              <button
                onClick={() => setSelectedSpecialist('frontend')}
                className={`p-3 rounded-lg text-center transition-colors ${
                  selectedSpecialist === 'frontend'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                <i className="fa-solid fa-desktop block text-xl mb-1"></i>
                <span className="text-sm font-medium">Frontend</span>
                <p className="text-xs opacity-80">UI/UX especialista</p>
              </button>
              <button
                onClick={() => setSelectedSpecialist('backend')}
                className={`p-3 rounded-lg text-center transition-colors ${
                  selectedSpecialist === 'backend'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                <i className="fa-solid fa-server block text-xl mb-1"></i>
                <span className="text-sm font-medium">Backend</span>
                <p className="text-xs opacity-80">APIs e banco de dados</p>
              </button>
            </div>
          </div>
        )}

        {/* Preview da Stack Selecionada */}
        {selectedStack && (
          <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              <i className="fa-solid fa-eye mr-2 text-green-400"></i>
              Preview: {stackTemplates[selectedStack].name}
            </h3>
            <p className="text-sm text-slate-300 mb-3">{stackTemplates[selectedStack].aiInstructions}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-2">Arquivos padrão:</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  {stackTemplates[selectedStack].defaultFiles.map((file) => (
                    <li key={file.name} className="flex items-center gap-2">
                      <i className="fa-solid fa-file-code text-blue-400"></i>
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
              
              {stackTemplates[selectedStack].dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-200 mb-2">Dependências:</h4>
                  <div className="flex flex-wrap gap-1">
                    {stackTemplates[selectedStack].dependencies.map((dep) => (
                      <span key={dep} className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-300">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStack}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i className="fa-solid fa-rocket"></i>
            Criar Projeto
          </button>
        </div>
      </div>
    </div>
  );
};