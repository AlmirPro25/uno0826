import React, { useState, useMemo } from 'react';
import { stackTemplates } from '@/config/stackTemplates';
import type { TechStack } from '@/types/ProjectStructure';

// === TIPOS ===
interface TechOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface SelectedStack {
  frontend: string | null;
  backend: string | null;
  styling: string | null;
}

interface TechStackSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStack: (stack: TechStack, specialist: 'general' | 'frontend' | 'backend', fullStack?: SelectedStack, projectName?: string) => void;
}

// === OPÇÕES DE TECNOLOGIA ===
const frontendOptions: TechOption[] = [
  { id: 'html5-vanilla', name: 'HTML5 + JS', icon: 'fab fa-html5', description: 'HTML5 puro com JavaScript vanilla', color: 'orange' },
  { id: 'react-typescript', name: 'React', icon: 'fab fa-react', description: 'React com TypeScript e Hooks', color: 'cyan' },
  { id: 'vue-composition', name: 'Vue 3', icon: 'fab fa-vuejs', description: 'Vue 3 Composition API', color: 'green' },
  { id: 'angular-standalone', name: 'Angular', icon: 'fab fa-angular', description: 'Angular Standalone Components', color: 'red' },
  { id: 'svelte', name: 'Svelte', icon: 'fas fa-fire', description: 'Svelte com compilação otimizada', color: 'orange' },
  { id: 'nextjs', name: 'Next.js', icon: 'fas fa-n', description: 'React com SSR/SSG', color: 'white' },
];

const backendOptions: TechOption[] = [
  { id: 'nodejs-express', name: 'Node.js + Express', icon: 'fab fa-node-js', description: 'Backend JavaScript/TypeScript', color: 'green' },
  { id: 'python-fastapi', name: 'FastAPI', icon: 'fab fa-python', description: 'Python moderno e performático', color: 'cyan' },
  { id: 'python-flask', name: 'Flask', icon: 'fab fa-python', description: 'Python leve e flexível', color: 'yellow' },
  { id: 'java-spring', name: 'Spring Boot', icon: 'fab fa-java', description: 'Java Enterprise', color: 'orange' },
  { id: 'csharp-dotnet', name: '.NET Core', icon: 'fab fa-microsoft', description: 'C# com ASP.NET', color: 'purple' },
  { id: 'php-laravel', name: 'Laravel', icon: 'fab fa-laravel', description: 'PHP elegante', color: 'red' },
  { id: 'go-fiber', name: 'Go + Fiber', icon: 'fas fa-bolt', description: 'Go ultra-performático', color: 'cyan' },
];

const stylingOptions: TechOption[] = [
  { id: 'tailwind', name: 'Tailwind CSS', icon: 'fas fa-wind', description: 'Utility-first CSS', color: 'cyan' },
  { id: 'css-vanilla', name: 'CSS Puro', icon: 'fab fa-css3-alt', description: 'CSS moderno sem frameworks', color: 'blue' },
  { id: 'sass', name: 'SASS/SCSS', icon: 'fab fa-sass', description: 'CSS com superpoderes', color: 'pink' },
  { id: 'styled-components', name: 'Styled Components', icon: 'fas fa-palette', description: 'CSS-in-JS para React', color: 'pink' },
  { id: 'chakra', name: 'Chakra UI', icon: 'fas fa-yin-yang', description: 'Components acessíveis', color: 'teal' },
  { id: 'material', name: 'Material UI', icon: 'fas fa-square', description: 'Design System Google', color: 'blue' },
];

// === COMPONENTE PRINCIPAL ===
export const TechStackSelector: React.FC<TechStackSelectorProps> = ({
  isOpen,
  onClose,
  onSelectStack
}) => {
  const [selectedStack, setSelectedStack] = useState<SelectedStack>({
    frontend: null,
    backend: null,
    styling: null
  });
  const [projectName, setProjectName] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<'general' | 'frontend' | 'backend'>('general');
  const [isCreating, setIsCreating] = useState(false);

  // Verificar se pelo menos uma tecnologia foi selecionada
  const hasSelection = selectedStack.frontend || selectedStack.backend;

  // Determinar o especialista automático baseado na seleção
  const autoSpecialist = useMemo(() => {
    if (selectedStack.frontend && selectedStack.backend) return 'general';
    if (selectedStack.frontend && !selectedStack.backend) return 'frontend';
    if (!selectedStack.frontend && selectedStack.backend) return 'backend';
    return 'general';
  }, [selectedStack]);

  const handleSelect = (category: keyof SelectedStack, id: string) => {
    setSelectedStack(prev => ({
      ...prev,
      [category]: prev[category] === id ? null : id // Toggle
    }));
  };

  const handleConfirm = async () => {
    if (!hasSelection) return;

    setIsCreating(true);

    // Determinar qual stack principal usar (prioridade: frontend > backend)
    const primaryStack = selectedStack.frontend || selectedStack.backend || 'html5-vanilla';

    try {
      // Passar a stack completa para o handler
      await onSelectStack(primaryStack as TechStack, selectedSpecialist || autoSpecialist, selectedStack, projectName);
      onClose();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setSelectedStack({ frontend: null, backend: null, styling: null });
    setProjectName('');
  };

  if (!isOpen) return null;

  // Componente de Card de Tecnologia
  const TechCard = ({ option, category, isSelected }: { option: TechOption; category: keyof SelectedStack; isSelected: boolean }) => (
    <button
      onClick={() => handleSelect(category, option.id)}
      className={`p-3 rounded-lg border-2 transition-all text-left hover:scale-[1.02] flex items-center gap-3 ${isSelected
        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-600/50`}>
        <i className={`${option.icon} text-xl`} style={{ color: option.color === 'white' ? '#fff' : `var(--${option.color}-400, ${option.color})` }}></i>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-100 text-sm truncate">{option.name}</h4>
        <p className="text-xs text-slate-400 truncate">{option.description}</p>
      </div>
      {isSelected && (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-check text-white text-xs"></i>
        </div>
      )}
    </button>
  );

  // Componente de Seção
  const Section = ({ title, icon, color, options, category }: {
    title: string;
    icon: string;
    color: string;
    options: TechOption[];
    category: keyof SelectedStack
  }) => (
    <div className="mb-6">
      <h3 className={`text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2`}>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <i className={`${icon} text-sm`} style={{ color }}></i>
        </span>
        {title}
        {selectedStack[category] && (
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full ml-2">
            Selecionado
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((option) => (
          <TechCard
            key={option.id}
            option={option}
            category={category}
            isSelected={selectedStack[category] === option.id}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-blue-400"></i>
              Montar Stack Completa
            </h2>
            <p className="text-sm text-slate-400 mt-1">Escolha as tecnologias para frontend, backend e estilização</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-md hover:bg-slate-700"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Nome do Projeto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa-solid fa-folder mr-2 text-yellow-400"></i>
              Nome do Projeto (opcional)
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="meu-projeto-incrivel"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Seção Frontend */}
          <Section
            title="Frontend"
            icon="fa-solid fa-desktop"
            color="#22c55e"
            options={frontendOptions}
            category="frontend"
          />

          {/* Seção Backend */}
          <Section
            title="Backend"
            icon="fa-solid fa-server"
            color="#a855f7"
            options={backendOptions}
            category="backend"
          />

          {/* Seção Styling */}
          <Section
            title="CSS / Styling"
            icon="fa-solid fa-palette"
            color="#ec4899"
            options={stylingOptions}
            category="styling"
          />

          {/* Resumo da Stack */}
          {hasSelection && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
              <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-clipboard-list text-blue-400"></i>
                Resumo da Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedStack.frontend && (
                  <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium flex items-center gap-2">
                    <i className="fa-solid fa-desktop text-xs"></i>
                    {frontendOptions.find(o => o.id === selectedStack.frontend)?.name}
                  </span>
                )}
                {selectedStack.backend && (
                  <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium flex items-center gap-2">
                    <i className="fa-solid fa-server text-xs"></i>
                    {backendOptions.find(o => o.id === selectedStack.backend)?.name}
                  </span>
                )}
                {selectedStack.styling && (
                  <span className="px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded-full text-sm font-medium flex items-center gap-2">
                    <i className="fa-solid fa-palette text-xs"></i>
                    {stylingOptions.find(o => o.id === selectedStack.styling)?.name}
                  </span>
                )}
              </div>

              {/* Especialista IA Automático */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-2">
                  <i className="fa-solid fa-robot mr-2 text-blue-400"></i>
                  Especialista IA sugerido:
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${autoSpecialist === 'frontend' ? 'bg-green-500/20 text-green-300' :
                    autoSpecialist === 'backend' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                    {autoSpecialist === 'frontend' ? 'Frontend' :
                      autoSpecialist === 'backend' ? 'Backend' :
                        'FullStack'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-between items-center p-6 border-t border-slate-700 bg-slate-800/80 flex-shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate-left"></i>
            Limpar Seleção
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSelection || isCreating}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-blue-500/25"
            >
              {isCreating ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Criando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rocket"></i>
                  Criar Projeto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStackSelector;