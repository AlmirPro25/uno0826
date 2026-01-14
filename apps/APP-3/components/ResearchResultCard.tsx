import React from 'react';
import type { ResearchFinding } from '@/services/GeminiService';

interface ResearchResultCardProps {
  finding: ResearchFinding;
}

const getCategoryStyle = (category: ResearchFinding['category']) => {
  switch (category) {
    case 'Design':
      return { icon: 'fa-solid fa-palette', color: 'border-pink-500' };
    case 'Technology':
      return { icon: 'fa-solid fa-code', color: 'border-sky-500' };
    case 'Business':
    case 'Monetization':
      return { icon: 'fa-solid fa-briefcase', color: 'border-green-500' };
    case 'API/Integration':
      return { icon: 'fa-solid fa-plug', color: 'border-amber-500' };
    default:
      return { icon: 'fa-solid fa-question-circle', color: 'border-slate-500' };
  }
};

export const ResearchResultCard: React.FC<ResearchResultCardProps> = ({ finding }) => {
  const { icon, color } = getCategoryStyle(finding.category);

  return (
    <div className={`research-result-card bg-slate-700/50 p-4 rounded-lg border-l-4 ${color} shadow-sm hover:shadow-md hover:bg-slate-700/70 transition-all duration-200`}>
      {/* Header com altura fixa */}
      <div className="flex justify-between items-start mb-3 min-h-[2.5rem]">
        <h4 className="text-sm font-semibold text-slate-100 pr-2 line-clamp-2 leading-tight">
          {finding.title}
        </h4>
        <span className="text-xs text-slate-400 font-medium bg-slate-600/80 px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-1" title={finding.category}>
          <i className={`${icon} fa-xs`}></i>
          <span className="hidden sm:inline">{finding.sourceName}</span>
        </span>
      </div>
      
      {/* Conteúdo com altura controlada */}
      <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
        <p className="text-xs text-slate-300 mb-3 leading-relaxed line-clamp-4 flex-grow">
          {finding.summary}
        </p>
        
        {/* Footer sempre no final */}
        <a
          href={finding.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300 hover:underline transition-colors group flex items-center gap-1 mt-auto"
        >
          <span>Visitar Fonte</span>
          <i className="fa-solid fa-arrow-up-right-from-square fa-xs opacity-70 group-hover:opacity-100 transition-opacity"></i>
        </a>
      </div>
      
      {/* CSS para altura consistente */}
      <style>{`
        .research-result-card {
          height: 180px;
          display: flex;
          flex-direction: column;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media (max-width: 640px) {
          .research-result-card {
            height: 160px;
          }
        }
      `}</style>
    </div>
  );
};
