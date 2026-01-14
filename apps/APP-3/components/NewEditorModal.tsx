import React, { useState } from 'react';
import { type TechStack } from '@/types/ProjectStructure';
import { stackTemplates } from '@/config/stackTemplates';

interface NewEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, stack: TechStack, aiSpecialist: 'general' | 'frontend' | 'backend') => void;
  isCreating?: boolean;
}

const NewEditorModal: React.FC<NewEditorModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false
}) => {
  const [selectedStack, setSelectedStack] = useState<TechStack>('html5-vanilla');
  const [editorName, setEditorName] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<'general' | 'frontend' | 'backend'>('general');
  const [activeCategory, setActiveCategory] = useState<'frontend' | 'backend' | 'fullstack'>('frontend');

  const categories = ['frontend', 'backend', 'fullstack'] as const;
  
  const filteredStacks = Object.values(stackTemplates).filter(
    template => template.category === activeCategory
  );

  const handleCreate = () => {
    if (!editorName.trim()) {
      alert('Por favor, digite um nome para o editor');
      return;
    }
    
    onCreate(editorName.trim(), selectedStack, selectedSpecialist);
    handleClose();
  };

  const handleClose = () => {
    setEditorName('');
    setSelectedStack('html5-vanilla');
    setSelectedSpecialist('general');
    setActiveCategory('frontend');
    onClose();
  };

  const getSpecialistColor = (specialist: 'general' | 'frontend' | 'backend') => {
    switch (specialist) {
      case 'frontend': return 'border-green-500 bg-green-500/10 text-green-400';
      case 'backend': return 'border-purple-500 bg-purple-500/10 text-purple-400';
      default: return 'border-blue-500 bg-blue-500/10 text-blue-400';
    }
  };

  const getSpecialistIcon = (specialist: 'general' | 'frontend' | 'backend') => {
    switch (specialist) {
      case 'frontend': return 'fa-solid fa-palette';
      case 'backend': return 'fa-solid fa-server';
      default: return 'fa-solid fa-brain';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              <i className="fa-solid fa-plus-circle text-blue-400"></i>
              Criar Novo Editor
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Escolha a tecnologia e configure seu novo ambiente de desenvolvimento
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Editor Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome do Editor
            </label>
            <input
              type="text"
              value={editorName}
              onChange={(e) => setEditorName(e.target.value)}
              placeholder="Ex: Frontend Principal, API Backend, Landing Page..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* AI Specialist Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              IA Especialista
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['general', 'frontend', 'backend'] as const).map((specialist) => (
                <button
                  key={specialist}
                  onClick={() => setSelectedSpecialist(specialist)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedSpecialist === specialist
                      ? getSpecialistColor(specialist)
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <i className={`${getSpecialistIcon(specialist)} text-lg`}></i>
                    <span className="font-medium capitalize">{specialist === 'general' ? 'Geral' : specialist}</span>
                  </div>
                  <p className="text-xs opacity-80">
                    {specialist === 'general' && 'IA versátil para qualquer tipo de código'}
                    {specialist === 'frontend' && 'Especialista em UI/UX, componentes e interfaces'}
                    {specialist === 'backend' && 'Especialista em APIs, banco de dados e lógica de negócio'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Technology Category Tabs */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Categoria de Tecnologia
            </label>
            <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                    activeCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Stack Selection Grid */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Stack Tecnológico
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStacks.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedStack(template.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
                    selectedStack === template.id
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <i className={`${template.icon} text-2xl ${
                      template.category === 'frontend' ? 'text-green-400' :
                      template.category === 'backend' ? 'text-purple-400' :
                      'text-blue-400'
                    }`}></i>
                    <div>
                      <h3 className="font-semibold text-slate-200">{template.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.category === 'frontend' ? 'bg-green-500/20 text-green-400' :
                        template.category === 'backend' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {template.description}
                  </p>
                  
                  {/* Dependencies Preview */}
                  {template.dependencies && template.dependencies.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-xs text-slate-500 mb-1">Principais dependências:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.dependencies.slice(0, 3).map((dep) => (
                          <span key={dep} className="text-xs bg-slate-600/50 text-slate-400 px-2 py-1 rounded">
                            {dep}
                          </span>
                        ))}
                        {template.dependencies.length > 3 && (
                          <span className="text-xs text-slate-500">+{template.dependencies.length - 3} mais</span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Stack Preview */}
          {selectedStack && (
            <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <i className="fa-solid fa-info-circle text-blue-400"></i>
                Configuração Selecionada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Stack:</span>
                  <span className="ml-2 text-slate-200">{stackTemplates[selectedStack].name}</span>
                </div>
                <div>
                  <span className="text-slate-400">IA Especialista:</span>
                  <span className="ml-2 text-slate-200 capitalize">
                    {selectedSpecialist === 'general' ? 'Geral' : selectedSpecialist}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Categoria:</span>
                  <span className="ml-2 text-slate-200 capitalize">{stackTemplates[selectedStack].category}</span>
                </div>
                <div>
                  <span className="text-slate-400">Arquivos iniciais:</span>
                  <span className="ml-2 text-slate-200">{stackTemplates[selectedStack].defaultFiles.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="text-sm text-slate-400">
            <i className="fa-solid fa-lightbulb mr-1"></i>
            Você pode alterar a IA especialista a qualquer momento
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!editorName.trim() || isCreating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Criando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus"></i>
                  Criar Editor
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEditorModal;