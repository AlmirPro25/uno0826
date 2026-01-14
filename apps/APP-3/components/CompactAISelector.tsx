import React, { useState } from 'react';

interface CompactAISelectorProps {
  activeSpecialist: 'general' | 'frontend' | 'backend';
  onSpecialistChange: (specialist: 'general' | 'frontend' | 'backend') => void;
  isLoading?: boolean;
}

const CompactAISelector: React.FC<CompactAISelectorProps> = ({
  activeSpecialist,
  onSpecialistChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const specialists = [
    {
      id: 'general' as const,
      name: 'Geral',
      icon: 'fa-solid fa-brain',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30'
    },
    {
      id: 'frontend' as const,
      name: 'Frontend',
      icon: 'fa-solid fa-palette',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30'
    },
    {
      id: 'backend' as const,
      name: 'Backend',
      icon: 'fa-solid fa-server',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30'
    }
  ];

  const activeSpec = specialists.find(s => s.id === activeSpecialist);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-200 text-sm font-medium disabled:opacity-50 ${
          activeSpec?.bgColor || 'bg-slate-700 border-slate-600'
        } hover:bg-opacity-80`}
        title={`IA ${activeSpec?.name} - Clique para trocar`}
      >
        <i className={`${activeSpec?.icon} ${activeSpec?.color} text-sm`}></i>
        <span className="text-slate-200">{activeSpec?.name}</span>
        {isLoading ? (
          <i className="fa-solid fa-spinner fa-spin text-xs text-slate-400"></i>
        ) : (
          <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-xs text-slate-400`}></i>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 max-h-80 overflow-y-auto">
            {specialists.map((specialist) => (
              <button
                key={specialist.id}
                onClick={() => {
                  onSpecialistChange(specialist.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700 transition-colors ${
                  activeSpecialist === specialist.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <i className={`${specialist.icon} ${specialist.color} text-sm`}></i>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">
                    {specialist.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {specialist.id === 'general' && 'IA versátil para qualquer código'}
                    {specialist.id === 'frontend' && 'Especialista em UI/UX'}
                    {specialist.id === 'backend' && 'Especialista em APIs e dados'}
                  </div>
                </div>
                {activeSpecialist === specialist.id && (
                  <i className="fa-solid fa-check text-xs text-green-400"></i>
                )}
              </button>
            ))}
            
            {/* Info Footer */}
            <div className="border-t border-slate-700 mt-1 pt-2 px-3 pb-2">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <i className="fa-solid fa-info-circle"></i>
                <span>A IA especialista influencia a geração</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompactAISelector;