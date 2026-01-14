import React, { useState } from 'react';
import { GeminiModel, Persona } from '../types';
import { GEMINI_MODELS, PERSONAS } from '../constants';

interface HeaderProps {
  selectedModel: GeminiModel;
  setSelectedModel: (model: GeminiModel) => void;
  selectedPersona: Persona;
  setSelectedPersona: (persona: Persona) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isThinkingMode: boolean;
  onToggleThinkingMode: () => void;
  liveConversationState: 'idle' | 'connecting' | 'active';
  onLiveConversationClick: () => void;
  onOpenSettings: () => void;
  onOpenMetaPersona: () => void;
  generatedPersonas?: Persona[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
    <label htmlFor={label} className="flex items-center cursor-pointer">
        <div className="relative">
            <input id={label} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block ${checked ? 'bg-blue-500' : 'bg-gray-600'} w-10 h-6 rounded-full transition`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <div className="ml-2 text-sm text-text-secondary">{label}</div>
    </label>
);


export const Header: React.FC<HeaderProps> = (props) => {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const handleModelSelect = (model: GeminiModel) => {
    props.setSelectedModel(model);
    props.setSelectedPersona(PERSONAS[0]); // Reset to general persona
    setIsModelSelectorOpen(false);
  };

  const handlePersonaSelect = (persona: Persona) => {
    props.setSelectedPersona(persona);
    props.setSelectedModel(GEMINI_MODELS.find(m => m.isPro) || GEMINI_MODELS[0]);
    setIsModelSelectorOpen(false);
  };

  const currentSelectionName = props.selectedPersona.id === 'general' ? props.selectedModel.name : props.selectedPersona.name;
  
  const getLiveButtonState = () => {
    switch(props.liveConversationState) {
        case 'connecting':
            return { text: "Conectando...", icon: "fa-spinner fa-spin", disabled: true };
        case 'active':
            return { text: "Sessão Ativa", icon: "fa-microphone-slash", disabled: false, style: "bg-red-500 hover:bg-red-600 text-white" };
        default:
            return { text: "Conversa ao Vivo", icon: "fa-microphone-lines", disabled: false };
    }
  };
  const liveButtonState = getLiveButtonState();

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border-color flex-shrink-0 bg-bg-primary">
      <div className="relative flex items-center gap-3">
        {/* Toggle Sidebar Button - Only show when closed */}
        {!props.isSidebarOpen && (
          <button
            onClick={props.onToggleSidebar}
            className="p-2 rounded-lg hover:bg-[color:var(--bg-tertiary)] transition-all duration-200 hover:scale-110"
            title="Abrir sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        
        <button 
          onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
          className="flex items-center gap-3 px-3 py-1.5 bg-transparent text-text-secondary hover:text-text-primary rounded-lg transition-all duration-200 text-base group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-300 relative overflow-hidden">
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 drop-shadow-lg"
              >
                {/* Estrela principal - maior e mais brilhante */}
                <path 
                  d="M12 1L14 9L22 11L14 13L12 21L10 13L2 11L10 9L12 1Z" 
                  fill="white"
                  stroke="white"
                  strokeWidth="0.5"
                  className="animate-pulse"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
                />
                {/* Estrela pequena superior direita */}
                <path 
                  d="M19 4L19.8 6.8L22.5 7.5L19.8 8.2L19 11L18.2 8.2L15.5 7.5L18.2 6.8L19 4Z" 
                  fill="white"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.9"
                />
                {/* Estrela pequena inferior esquerda */}
                <path 
                  d="M5 16L5.8 18.8L8.5 19.5L5.8 20.2L5 23L4.2 20.2L1.5 19.5L4.2 18.8L5 16Z" 
                  fill="white"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.7"
                />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 drop-shadow-sm" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", letterSpacing: '-0.02em' }}>
              Prox AI Studio
            </span>
          </div>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-secondary group-hover:text-text-primary transition-colors">{currentSelectionName}</span>
          <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isModelSelectorOpen ? 'rotate-180' : ''}`}></i>
        </button>
        {isModelSelectorOpen && (
          <div className="absolute top-full mt-2 w-80 max-h-[70vh] overflow-y-auto bg-[rgba(var(--bg-secondary-rgb),0.95)] backdrop-blur-lg rounded-lg shadow-2xl p-2 z-10 border border-border-color scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div>
              <h3 className="text-xs text-text-tertiary font-semibold px-2 py-1 sticky top-0 bg-[rgba(var(--bg-secondary-rgb),0.95)] backdrop-blur-lg z-10">Models</h3>
              {GEMINI_MODELS.map(model => (
                <button 
                  key={model.id} 
                  onClick={() => handleModelSelect(model)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary ${props.selectedModel.id === model.id && props.selectedPersona.id === 'general' ? 'bg-bg-tertiary' : ''}`}
                >
                  <p className="font-semibold text-sm text-text-primary">{model.name} {model.isPro && <span className="text-xs text-purple-400 ml-1">PRO</span>}</p>
                  <p className="text-xs text-text-tertiary">{model.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-2 border-t border-border-color pt-2">
              <div className="flex items-center justify-between px-2 py-1 sticky top-0 bg-[rgba(var(--bg-secondary-rgb),0.95)] backdrop-blur-lg z-10">
                <h3 className="text-xs text-text-tertiary font-semibold">Specialists Hub</h3>
                <button
                  onClick={() => {
                    setIsModelSelectorOpen(false);
                    props.onOpenMetaPersona();
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  Meta-Persona
                </button>
              </div>
               {/* Regular Personas */}
               {PERSONAS.filter(p => p.id !== 'general' && !p.domain).map(persona => (
                <button 
                  key={persona.id} 
                  onClick={() => handlePersonaSelect(persona)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary flex items-center gap-3 group ${props.selectedPersona.id === persona.id ? 'bg-bg-tertiary' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <i className={`${persona.icon} text-white text-sm`}></i>
                  </div>
                  <span className="font-semibold text-sm text-text-primary">{persona.name}</span>
                </button>
              ))}
              
              {/* Technical Personas Section */}
              {PERSONAS.filter(p => p.domain).length > 0 && (
                <>
                  <div className="border-t border-border-color my-2"></div>
                  <h3 className="text-xs text-blue-400 font-semibold px-2 py-1 flex items-center gap-1">
                    <i className="fa-solid fa-brain"></i>
                    Neural Architect System
                  </h3>
                  {PERSONAS.filter(p => p.domain).map(persona => (
                    <button 
                      key={persona.id} 
                      onClick={() => handlePersonaSelect(persona)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary flex items-center gap-3 group ${props.selectedPersona.id === persona.id ? 'bg-bg-tertiary' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        {persona.id === 'resume-writer' ? (
                          // Special SVG for Resume Writer
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            <circle cx="12" cy="11" r="2" fill="white"/>
                            <path d="M8 17H16M8 14H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <i className={`${persona.icon} text-white text-sm`}></i>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-text-primary block">{persona.name}</span>
                        {persona.domain && (
                          <span className="text-xs text-text-tertiary">{persona.domain}</span>
                        )}
                      </div>
                      {persona.capabilities && persona.capabilities.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {persona.capabilities.length} skills
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}
              {props.generatedPersonas && props.generatedPersonas.length > 0 && (
                <>
                  <div className="border-t border-border-color my-2"></div>
                  <h3 className="text-xs text-purple-400 font-semibold px-2 py-1 flex items-center gap-1">
                    <i className="fa-solid fa-sparkles"></i>
                    Gerados pelo Master AI
                  </h3>
                  {props.generatedPersonas.map(persona => (
                    <button 
                      key={persona.id} 
                      onClick={() => handlePersonaSelect(persona)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary flex items-center gap-3 group ${props.selectedPersona.id === persona.id ? 'bg-bg-tertiary' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                        {/* Sparkles SVG Icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="white" stroke="white" strokeWidth="1"/>
                          <path d="M19 5L19.5 7L21.5 7.5L19.5 8L19 10L18.5 8L16.5 7.5L18.5 7L19 5Z" fill="white" opacity="0.8"/>
                          <path d="M5 14L5.5 16L7.5 16.5L5.5 17L5 19L4.5 17L2.5 16.5L4.5 16L5 14Z" fill="white" opacity="0.6"/>
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-text-primary block">{persona.name}</span>
                        {persona.domain && (
                          <span className="text-xs text-text-tertiary">{persona.domain}</span>
                        )}
                      </div>
                      {persona.isTeamMember && (
                        <i className="fa-solid fa-users text-xs text-blue-400"></i>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-text-secondary">
        <ToggleSwitch checked={props.isThinkingMode} onChange={props.onToggleThinkingMode} label="Thinking Mode" />
        <button 
            onClick={props.onLiveConversationClick} 
            disabled={liveButtonState.disabled}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors ${liveButtonState.style || 'bg-bg-tertiary text-text-secondary hover:bg-opacity-80 hover:text-text-primary'}`}
        >
            <i className={`fa-solid ${liveButtonState.icon}`}></i>
            {liveButtonState.text}
        </button>
        <button onClick={props.onToggleTheme} className="hover:text-text-primary transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-tertiary" data-tooltip={`Mudar para modo ${props.theme === 'dark' ? 'claro' : 'escuro'}`}>
            <i className={`fa-solid ${props.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
         <button onClick={props.onOpenSettings} className="hover:text-text-primary transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-tertiary" data-tooltip="Configurações do Modelo">
            <i className="fa-solid fa-sliders text-base"></i>
        </button>
      </div>
    </div>
  );
};