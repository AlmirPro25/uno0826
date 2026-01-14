import React from 'react';
import type { GroundingSource } from '@/services/GeminiService';

interface GroundingSourcesDisplayProps {
  sources: GroundingSource[] | null;
  onClose: () => void;
}

const GroundingSourcesDisplay: React.FC<GroundingSourcesDisplayProps> = ({ sources, onClose }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mx-2 my-1 p-3 bg-slate-800/70 border-l-4 border-teal-400 rounded-r-lg shadow-md animate-fade-in-down" role="region" aria-labelledby="grounding-sources-title">
      <div className="flex justify-between items-center mb-2">
        <h4 id="grounding-sources-title" className="text-sm font-semibold text-teal-300 flex items-center gap-2">
          <i className="fa-solid fa-book-open"></i>
          Fontes Consultadas pela IA para o Plano
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-teal-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          aria-label="Ocultar fontes da pesquisa"
        >
          <i className="fa-solid fa-times w-4 h-4"></i>
        </button>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs list-none p-0">
        {sources.map((source, index) => (
          <li key={index} className="truncate">
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-teal-300 hover:underline transition-colors"
              title={source.uri}
            >
              <i className="fa-solid fa-link fa-xs mr-1.5 text-slate-500"></i>
              {source.title || source.uri}
            </a>
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GroundingSourcesDisplay;
