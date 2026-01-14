
import React, { useRef, useEffect, useState } from 'react';
import { Message as MessageType, Attachment, Persona } from '../types';
import { PromptInput } from './PromptInput';
import { Message } from './Message';
import { EmptyState } from './EmptyState';
import { PersonaInfoBanner } from './PersonaInfoBanner';
import { detectTechnicalContext } from '../services/neuralArchitectService';
import { RemoteBrowserCanvas } from './RemoteBrowserCanvas';

interface ChatViewProps {
  messages: MessageType[];
  isLoading: boolean;
  onSend: (prompt: string, attachments?: Attachment[]) => void;
  onStop: () => void;
  onCameraClick: () => void;
  onRegenerate: () => void;
  onEditPrompt: (messageId: string, newContent: string) => void;
  onTranscribe: (audioBase64: string) => void;
  onTextToSpeech: (text: string) => Promise<string>;
  onShowInteractiveCode: (message: MessageType) => void;
  theme: 'light' | 'dark';
  projectName?: string;
  onOpenLibrary: () => void;
  appendToPromptRef: React.MutableRefObject<(text: string) => void>;
  isThinkingMode: boolean;
  selectedPersona?: Persona;
  onWebSearch?: (query: string) => void;
  onOpenVoiceSettings?: () => void;
  isSearchMode?: boolean;
  onToggleSearchMode?: () => void;
  isBrowserMode?: boolean;
  onToggleBrowserMode?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = (props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [technicalContext, setTechnicalContext] = useState<{
    domain: string;
    complexity: string;
    technologies: string[];
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (props.messages.length > 0) {
        scrollToBottom();
    }
  }, [props.messages]);

  // Detectar contexto técnico quando há mensagens
  useEffect(() => {
    if (props.messages.length > 0) {
      const lastUserMessage = [...props.messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        const context = detectTechnicalContext(lastUserMessage.content);
        setTechnicalContext(context);
      }
    }
  }, [props.messages]);

  return (
    <div className="flex-1 flex bg-bg-primary h-full max-w-full w-full">
      {/* Chat Area - SEMPRE VISÍVEL */}
      <div className={`flex flex-col ${props.isBrowserMode ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
        {/* Scrollable area for messages or empty state */}
        <div className="flex-1 overflow-y-auto chat-message-container">
          <div className="w-full max-w-4xl mx-auto h-full">
           {props.projectName && (
                <div className="sticky top-0 bg-bg-primary/80 backdrop-blur-sm z-10 p-4 text-center text-sm font-semibold text-text-secondary">
                    Trabalhando no projeto: {props.projectName}
                </div>
            )}
          {props.messages.length === 0 ? (
            <EmptyState onSend={props.onSend} />
          ) : (
            <div className="px-4">
              {props.selectedPersona?.isGenerated && (
                <PersonaInfoBanner persona={props.selectedPersona} />
              )}
              
              {/* Technical Context Indicator */}
              {technicalContext && props.selectedPersona?.domain && (
                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400 font-semibold">🔍 Contexto Detectado:</span>
                    <span className="px-2 py-1 bg-purple-500/20 rounded text-purple-300">
                      {technicalContext.domain}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-300">
                      {technicalContext.complexity}
                    </span>
                    {technicalContext.technologies.length > 0 && (
                      <span className="text-gray-400">
                        | {technicalContext.technologies.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {props.messages.map((msg, index) => (
                <Message
                  key={msg.id}
                  message={msg}
                  onEdit={props.onEditPrompt}
                  onRegenerate={props.onRegenerate}
                  isLastMessage={index === props.messages.length - 1}
                  onStop={props.onStop}
                  onTextToSpeech={props.onTextToSpeech}
                  theme={props.theme}
                  onSend={props.onSend}
                  onShowInteractiveCode={props.onShowInteractiveCode}
                  isThinkingMode={props.isThinkingMode}
                  onOpenVoiceSettings={props.onOpenVoiceSettings}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        </div>
        
        {/* Prompt input area - SEMPRE VISÍVEL */}
        <div className="w-full max-w-4xl mx-auto px-4 pb-4 flex-shrink-0">
        <PromptInput
          onSend={props.onSend}
          isLoading={props.isLoading}
          onCameraClick={props.onCameraClick}
          onTranscribe={props.onTranscribe}
          onOpenLibrary={props.onOpenLibrary}
          appendToPromptRef={props.appendToPromptRef}
          onWebSearch={props.onWebSearch}
          isSearchMode={props.isSearchMode}
          onToggleSearchMode={props.onToggleSearchMode}
          isBrowserMode={props.isBrowserMode}
          onToggleBrowserMode={props.onToggleBrowserMode}
        />
        <p className="text-center text-xs text-text-tertiary pt-3">
          {props.isBrowserMode ? (
            <span className="text-emerald-400 flex items-center justify-center gap-2">
              <i className="fa-solid fa-globe fa-spin-pulse"></i>
              🌐 Modo Navegação Ativo - Canvas aberto | Digite URL ou pesquisa
            </span>
          ) : props.isSearchMode ? (
            <span className="text-blue-400">🔍 Modo Pesquisa Ativo - Todas as mensagens serão pesquisadas na web</span>
          ) : (
            'Gemini pode cometer erros. Considere verificar informações importantes.'
          )}
        </p>
        </div>
      </div>

      {/* Browser Canvas - Aparece ao lado quando ativo */}
      {props.isBrowserMode && (
        <div className="w-1/2 h-full border-l border-border-color">
          <RemoteBrowserCanvas
            url="https://www.google.com"
            onUrlChange={(url) => console.log('Navegou para:', url)}
            onClose={props.onToggleBrowserMode}
          />
        </div>
      )}
    </div>
  );
};
