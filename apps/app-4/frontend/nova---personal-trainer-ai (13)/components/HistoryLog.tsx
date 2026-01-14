import React from 'react';
import { History, Calendar, ArrowRight, Utensils, User, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const HistoryLog: React.FC = () => {
  const { history, clearHistory } = useAppContext();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Log de Memória</h2>
          <p className="text-slate-400">Histórico neural de todas as análises realizadas.</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Limpar Memória
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed text-slate-500">
          <History size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum registro encontrado</p>
          <p className="text-sm">Realize análises de comida ou corpo para popular sua timeline.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
          {history.map((entry) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Icon Indicator */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {entry.type === 'food' ? <Utensils size={16} /> : <User size={16} />}
              </div>
              
              {/* Content Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-800 hover:border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${entry.type === 'food' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {entry.type === 'food' ? 'NUTRIÇÃO' : 'BIOMETRIA'}
                  </span>
                  <time className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(entry.timestamp).toLocaleDateString()} • {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </time>
                </div>
                
                <p className="text-slate-200 text-sm font-medium mb-3 line-clamp-2">
                  {entry.summary}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {entry.metrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-slate-900/50 p-2 rounded border border-slate-700/30">
                            <p className="text-[10px] text-slate-400 uppercase">{m.label}</p>
                            <p className="text-sm font-semibold text-emerald-400">{m.value}</p>
                        </div>
                    ))}
                </div>
                
                <div className="bg-slate-900/30 p-2 rounded text-xs text-blue-200/80 border-l-2 border-blue-500 pl-3">
                  "{entry.recommendation}"
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
