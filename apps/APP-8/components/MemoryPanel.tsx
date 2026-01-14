import React, { useState, useEffect } from 'react';
import { memoryService, MemoryEntry } from '../services/memoryService';
import { CloseIcon, BrainIcon } from './Icons';

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(memoryService.getMemoryStats());
  const [profile, setProfile] = useState(memoryService['userProfile']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStats(memoryService.getMemoryStats());
      setProfile(memoryService['userProfile']);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const results = await memoryService.searchMemories(searchQuery, 10);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleExport = () => {
    const data = memoryService.exportMemories();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-memories-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            memoryService.importMemories(event.target.result as string);
            setStats(memoryService.getMemoryStats());
            alert('Memórias importadas com sucesso!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearMemories = () => {
    if (confirm('Isso apagará TODAS as memórias. Tem certeza?')) {
      memoryService.clearAllMemories();
      setStats(memoryService.getMemoryStats());
      setSearchResults([]);
      alert('Memórias limpas com sucesso!');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conversation': return 'bg-purple-600';
      case 'fact': return 'bg-blue-600';
      case 'preference': return 'bg-green-600';
      case 'skill': return 'bg-yellow-600';
      case 'context': return 'bg-teal-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation': return '💬';
      case 'fact': return '📌';
      case 'preference': return '⭐';
      case 'skill': return '🎯';
      case 'context': return '🔍';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <BrainIcon className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Sistema de Memória</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <CloseIcon className="w-7 h-7" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{stats.totalMemories}</p>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Importância Média</p>
              <p className="text-2xl font-bold text-purple-400">{stats.averageImportance.toFixed(1)}</p>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Habilidades</p>
              <p className="text-2xl font-bold text-teal-400">{profile.skills.length}</p>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Interesses</p>
              <p className="text-2xl font-bold text-yellow-400">{profile.interests.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar memórias..."
              className="flex-1 p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              {isSearching ? '🔍' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((memory) => (
                <div key={memory.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getTypeIcon(memory.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(memory.type)} text-white`}>
                          {memory.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(memory.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          {Array.from({ length: memory.importance }).map((_, i) => (
                            <span key={i} className="text-yellow-400">⭐</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{memory.content}</p>
                      {memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {memory.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BrainIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Busque por memórias ou contextos anteriores</p>
              <p className="text-sm mt-2">O sistema aprende automaticamente durante as conversas</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700 flex gap-3 flex-shrink-0">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            📥 Exportar
          </button>
          <button
            onClick={handleImport}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            📤 Importar
          </button>
          <button
            onClick={handleClearMemories}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            🗑️ Limpar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryPanel;
