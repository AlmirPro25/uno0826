import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { AiPersona } from '@/services/GeminiService';

interface PersonaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (persona: AiPersona | null) => void;
  selectedPersona: AiPersona | null;
  recommendedPersona: AiPersona | null;
}

export function PersonaSelector({
  isOpen,
  onClose,
  onSelectPersona,
  selectedPersona,
  recommendedPersona
}: PersonaSelectorProps) {
  const { availablePersonas } = useAppStore();

  if (!isOpen) return null;

  const getPersonaColorClasses = (color: string, isSelected: boolean, isRecommended: boolean) => {
    const baseClasses = "p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer";
    
    if (isSelected) {
      return `${baseClasses} bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25`;
    }
    
    if (isRecommended) {
      return `${baseClasses} bg-amber-600/20 text-amber-200 border-amber-500/50 hover:bg-amber-600/30`;
    }

    const colorMap = {
      red: 'hover:border-red-500/50 hover:bg-red-600/10 text-red-300',
      blue: 'hover:border-blue-500/50 hover:bg-blue-600/10 text-blue-300',
      green: 'hover:border-green-500/50 hover:bg-green-600/10 text-green-300',
      purple: 'hover:border-purple-500/50 hover:bg-purple-600/10 text-purple-300',
      orange: 'hover:border-orange-500/50 hover:bg-orange-600/10 text-orange-300',
      teal: 'hover:border-teal-500/50 hover:bg-teal-600/10 text-teal-300'
    };

    return `${baseClasses} bg-slate-700 border-slate-600 text-slate-300 ${colorMap[color as keyof typeof colorMap] || colorMap.blue}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-user-tie text-amber-400 text-xl"></i>
            <h2 className="text-xl font-bold text-white">Escolher Persona de IA</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Recomendação */}
        {recommendedPersona && (
          <div className="p-4 bg-amber-600/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-lightbulb text-amber-400"></i>
              <span className="text-amber-200 font-medium">Persona Recomendada</span>
            </div>
            <p className="text-sm text-amber-300">
              Baseado no seu prompt, recomendamos a persona <strong>{recommendedPersona.name}</strong> 
              especializada em {recommendedPersona.expertise.join(', ')}.
            </p>
          </div>
        )}

        {/* Opção "Nenhuma Persona" */}
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={() => onSelectPersona(null)}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              !selectedPersona 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-500/50 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-robot text-lg"></i>
              <div>
                <h3 className="font-medium">IA Geral</h3>
                <p className="text-sm opacity-80">Usar a IA padrão sem especialização específica</p>
              </div>
              {!selectedPersona && (
                <div className="ml-auto">
                  <i className="fa-solid fa-check-circle"></i>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Lista de Personas */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePersonas.map((persona) => {
              const isSelected = selectedPersona?.id === persona.id;
              const isRecommended = recommendedPersona?.id === persona.id;

              return (
                <button
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className={getPersonaColorClasses(persona.color, isSelected, isRecommended)}
                >
                  <div className="text-left">
                    {/* Header da Persona */}
                    <div className="flex items-center gap-3 mb-3">
                      <i className={`${persona.icon} text-xl`}></i>
                      <div className="flex-1">
                        <h3 className="font-bold">{persona.name}</h3>
                        {isRecommended && (
                          <span className="text-xs bg-amber-500 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                            Recomendada
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <i className="fa-solid fa-check-circle text-lg"></i>
                      )}
                    </div>

                    {/* Descrição */}
                    <p className="text-sm opacity-90 mb-3">{persona.description}</p>

                    {/* Expertise */}
                    <div className="mb-3">
                      <p className="text-xs font-medium opacity-75 mb-1">Expertise:</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.expertise.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-1 bg-black/20 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {persona.expertise.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-black/20 rounded-full">
                            +{persona.expertise.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Especializações (primeiras 2) */}
                    <div>
                      <p className="text-xs font-medium opacity-75 mb-1">Especializações:</p>
                      <ul className="text-xs opacity-80 space-y-0.5">
                        {persona.specializations.slice(0, 2).map((spec, index) => (
                          <li key={index}>• {spec}</li>
                        ))}
                        {persona.specializations.length > 2 && (
                          <li>• +{persona.specializations.length - 2} especializações</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              <i className="fa-solid fa-info-circle mr-1"></i>
              Personas aplicam expertise específica ao seu código
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}