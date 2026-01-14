import React, { useState, useEffect } from 'react';
import { GeminiResponse, SampleDataset } from '../types';

interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  response: GeminiResponse;
  dataset: SampleDataset;
  hyperparams: {
    learningRate: string;
    epochs: string;
    batchSize: string;
  };
  isFavorite: boolean;
}

interface ProjectHistoryProps {
  onLoadProject: (item: HistoryItem) => void;
  onClose: () => void;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ onLoadProject, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    const savedHistory = localStorage.getItem('ai-creator-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const toggleFavorite = (id: string) => {
    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setHistory(updatedHistory);
    localStorage.setItem('ai-creator-history', JSON.stringify(updatedHistory));
  };

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('ai-creator-history', JSON.stringify(updatedHistory));
  };

  const filteredHistory = filter === 'favorites' 
    ? history.filter(item => item.isFavorite)
    : history;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Histórico de Projetos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Todos ({history.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'favorites' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Favoritos ({history.filter(h => h.isFavorite).length})
          </button>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {filter === 'favorites' ? 'Nenhum favorito encontrado' : 'Nenhum projeto no histórico'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-purple-500 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                      {item.prompt.substring(0, 80)}...
                    </h3>
                    <p className="text-xs text-gray-400">{formatDate(item.timestamp)}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`p-2 rounded transition-colors ${
                        item.isFavorite 
                          ? 'text-yellow-400 hover:text-yellow-300' 
                          : 'text-gray-400 hover:text-yellow-400'
                      }`}
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => onLoadProject(item)}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      Carregar
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-700 px-2 py-1 rounded">Dataset: {item.dataset}</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">LR: {item.hyperparams.learningRate}</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">Épocas: {item.hyperparams.epochs}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Função utilitária para salvar no histórico
export const saveToHistory = (
  prompt: string,
  response: GeminiResponse,
  dataset: SampleDataset,
  hyperparams: { learningRate: string; epochs: string; batchSize: string }
) => {
  const historyItem: HistoryItem = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    prompt,
    response,
    dataset,
    hyperparams,
    isFavorite: false
  };

  const savedHistory = localStorage.getItem('ai-creator-history');
  const history: HistoryItem[] = savedHistory ? JSON.parse(savedHistory) : [];
  
  // Manter apenas os últimos 50 itens
  const updatedHistory = [historyItem, ...history].slice(0, 50);
  
  localStorage.setItem('ai-creator-history', JSON.stringify(updatedHistory));
};