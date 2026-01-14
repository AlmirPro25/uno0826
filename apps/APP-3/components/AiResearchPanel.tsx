import React, { useState, useMemo } from 'react';
import { type ResearchFinding } from '@/services/GeminiService';
import { ResearchResultCard } from '@/components/ResearchResultCard';

interface AiResearchPanelProps {
  findings: ResearchFinding[] | null;
  onClose: () => void;
  editorId?: string; // Preparando para sistema multi-editor
}

const AiResearchPanel: React.FC<AiResearchPanelProps> = ({ findings, onClose, editorId }) => {
  const categories = useMemo(() => {
    if (!findings) return [];
    const uniqueCategories = new Set(findings.map(f => f.category));
    return Array.from(uniqueCategories).sort(); // Ordenar categorias para consistência
  }, [findings]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '');

  // Atualizar categoria ativa quando findings mudam
  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  if (!findings || findings.length === 0) {
    return null;
  }

  const filteredFindings = findings.filter(f => f.category === activeCategory);

  return (
    <div 
      className="mx-2 my-1 p-4 bg-slate-800/90 backdrop-blur-sm border-t-4 border-purple-500 rounded-b-lg shadow-lg animate-fade-in-up" 
      role="region" 
      aria-labelledby="research-panel-title"
      data-editor-id={editorId}
    >
      {/* Header com melhor alinhamento */}
      <div className="flex justify-between items-center mb-4">
        <h3 id="research-panel-title" className="text-md font-semibold text-purple-300 flex items-center gap-2">
          <i className="fa-solid fa-brain text-purple-400"></i>
          Painel de Inteligência da IA
          {editorId && <span className="text-xs text-slate-400 ml-2">({editorId})</span>}
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-purple-300 hover:bg-slate-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          aria-label="Ocultar painel de inteligência"
        >
          <i className="fa-solid fa-times w-4 h-4"></i>
        </button>
      </div>
      
      {/* Tabs com melhor espaçamento e alinhamento */}
      <div className="border-b border-slate-700 mb-4">
        <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-thin" aria-label="Research Categories">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-shrink-0 whitespace-nowrap pb-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-md
                ${activeCategory === category
                  ? 'border-purple-400 text-purple-300 bg-slate-700/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-700/20'
                }`}
              role="tab"
              aria-selected={activeCategory === category}
            >
              {category}
              <span className="ml-2 text-xs opacity-70">
                ({findings.filter(f => f.category === category).length})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Grid compacto com altura reduzida */}
      <div className="research-panel-grid-compact">
        {filteredFindings.slice(0, 6).map((finding, index) => (
          <div key={`${finding.category}-${index}`} className="research-card-compact">
            <ResearchResultCard finding={finding} />
          </div>
        ))}
        {filteredFindings.length > 6 && (
          <div className="text-xs text-slate-400 text-center mt-2">
            +{filteredFindings.length - 6} mais resultados
          </div>
        )}
      </div>
      
      {/* CSS aprimorado com grid consistente */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
        
        /* Grid compacto para research cards */
        .research-panel-grid-compact {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          align-items: start;
          max-height: 180px;
          overflow-y: auto;
          padding-right: 4px;
        }
        
        .research-card-compact {
          font-size: 0.75rem;
        }
        
        /* Scrollbar customizada */
        .research-panel-grid::-webkit-scrollbar {
          width: 6px;
        }
        
        .research-panel-grid::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
          border-radius: 3px;
        }
        
        .research-panel-grid::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }
        
        .research-panel-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
        
        /* Responsividade aprimorada */
        @media (max-width: 768px) {
          .research-panel-grid {
            grid-template-columns: 1fr;
            max-height: 240px;
          }
        }
        
        @media (min-width: 1200px) {
          .research-panel-grid {
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default AiResearchPanel;