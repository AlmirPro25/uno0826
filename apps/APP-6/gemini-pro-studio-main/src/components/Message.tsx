
import React, { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Message as MessageType, Attachment, GroundingSource } from '../types';
import { marked } from 'marked';
import { LoadingIndicator } from './LoadingIndicator';
import { VideoPlayer } from './VideoPlayer';
import { audioManager } from '../services/audioManager';
import { ProductGrid } from './ProductGrid';
import { EnrichedBrowserResult } from './EnrichedBrowserResult';
import { VisualCanvas } from './VisualCanvas';
import { StructuredResponse } from './StructuredResponse';

declare const hljs: any;

interface MessageProps {
  message: MessageType;
  onEdit: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  isLastMessage: boolean;
  onStop: () => void;
  onTextToSpeech: (text: string) => Promise<string>;
  onShowInteractiveCode: (message: MessageType) => void;
  onSend: (prompt: string) => void;
  theme: 'light' | 'dark';
  isThinkingMode: boolean;
  onOpenVoiceSettings?: () => void;
}

const renderer = new marked.Renderer();
renderer.code = function({ text, lang }: { text: string; lang?: string; }) {
    const validLanguage = hljs.getLanguage(lang || '') ? lang : 'plaintext';
    return `<pre><code class="language-${validLanguage}">${text}</code></pre>`;
};
renderer.link = function({ href, title, text }: { href: string; title?: string | null; text: string; }) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title || ''}" class="text-blue-400 hover:underline">${text}</a>`;
}
marked.setOptions({ renderer, gfm: true, breaks: true });

const GeminiIcon = () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-md">
        <i className="fa-solid fa-star-of-life"></i>
    </div>
);
const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center font-bold flex-shrink-0 text-text-primary">A</div>
);

const AttachmentPreview: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
    if (attachment.mimeType.startsWith('image/')) {
        return <img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt={attachment.name} className="max-w-xs rounded-lg border border-[color:var(--border-color)]" />;
    }
    const getFileIcon = (mimeType: string) => {
        if (mimeType === 'application/pdf') return 'fa-file-pdf';
        if (mimeType.startsWith('text/')) return 'fa-file-lines';
        return 'fa-file';
    }
    return (
        <div className="bg-[color:var(--bg-tertiary)] p-3 rounded-lg flex items-center gap-3 max-w-xs">
            <i className={`fa-solid ${getFileIcon(attachment.mimeType)} text-text-tertiary text-xl`}></i>
            <span className="text-sm text-text-secondary truncate">{attachment.name}</span>
        </div>
    );
};

const CodeBlock: React.FC<{ codeElement: Element }> = ({ codeElement }) => {
    const [copied, setCopied] = useState(false);
    const codeText = (codeElement as HTMLElement).innerText;
    const language = Array.from(codeElement.classList).find((cls: string) => cls.startsWith('language-'))?.replace('language-', '') || 'text';
    
    const handleCopy = () => {
        navigator.clipboard.writeText(codeText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="my-4 rounded-lg bg-[#282c34] shadow-lg">
            <div className="code-block-header">
                <span>{language}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs hover:text-white transition-colors" data-tooltip={copied ? 'Copiado!' : 'Copiar código'}>
                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
            </div>
            <pre className="m-0"><code dangerouslySetInnerHTML={{ __html: codeElement.innerHTML }}></code></pre>
        </div>
    );
};

const EditPromptInput: React.FC<{ initialContent: string; onSave: (newContent: string) => void; onCancel: () => void; }> = ({ initialContent, onSave, onCancel }) => {
    const [content, setContent] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.focus();
            textarea.select();
        }
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (content.trim()) onSave(content.trim());
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="w-full">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-[color:var(--bg-tertiary)] text-text-primary p-2 rounded-md resize-none focus:outline-none border border-[color:var(--border-color)]"
                rows={1}
            />
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onCancel} className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded-md">Cancelar</button>
                <button onClick={() => { if (content.trim()) onSave(content.trim()); }} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded-md">Salvar e Enviar</button>
            </div>
        </div>
    );
};

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
    <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg p-4 flex gap-3">
        <i className="fa-solid fa-circle-exclamation mt-1"></i>
        <div>
            <p className="font-semibold mb-1">Ocorreu um Erro</p>
            <p className="text-red-300/80">{error}</p>
        </div>
    </div>
);

const TextToSpeechButton: React.FC<{ text: string; onTextToSpeech: (text: string) => Promise<string>; messageId: string }> = ({ text, onTextToSpeech, messageId }) => {
    const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');



    // Verificar se esta mensagem está tocando
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (audioManager.isPlayingMessage(messageId)) {
                setTtsState('playing');
            } else if (ttsState === 'playing') {
                setTtsState('idle');
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, [messageId, ttsState]);

    const handlePlay = async () => {
        // Se esta mensagem está tocando, para
        if (audioManager.isPlayingMessage(messageId)) {
            audioManager.stop(messageId);
            setTtsState('idle');
            return;
        }

        // Se outra mensagem está tocando, para ela primeiro
        if (audioManager.isAnyPlaying()) {
            audioManager.stopAll();
        }

        // Limpar texto de markdown para melhor leitura
        const cleanText = text
            .replace(/```[\s\S]*?```/g, '') // Remove blocos de código
            .replace(/`[^`]+`/g, '') // Remove código inline
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links mas mantém texto
            .replace(/[#*_~]/g, '') // Remove formatação markdown
            .replace(/\n+/g, '. ') // Substitui quebras de linha por pausas
            .trim();

        if (!cleanText) {
            setTtsState('error');
            return;
        }

        setTtsState('loading');

        try {
            // Carregar configuração salva
            const savedConfig = localStorage.getItem('voiceConfig');
            let config = {
                voiceName: null as string | null,
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                language: 'pt-BR'
            };

            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                config.rate = parsed.rate || 1.0;
                config.pitch = parsed.pitch || 1.0;
                config.volume = parsed.volume || 1.0;
                config.language = parsed.language || 'pt-BR';
                config.voiceName = parsed.voice?.name || null;
            }

            // Criar utterance
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // Aplicar configurações
            const voices = window.speechSynthesis.getVoices();
            if (config.voiceName) {
                const selectedVoice = voices.find(v => v.name === config.voiceName);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }
            utterance.rate = config.rate;
            utterance.pitch = config.pitch;
            utterance.volume = config.volume;
            utterance.lang = config.language;

            // Usar o audioManager para reproduzir
            audioManager.play(
                utterance,
                messageId,
                () => setTtsState('playing'),
                () => setTtsState('idle'),
                () => {
                    setTtsState('error');
                    setTimeout(() => setTtsState('idle'), 3000);
                }
            );
        } catch (error) {
            console.error("TTS Error:", error);
            setTtsState('error');
            setTimeout(() => setTtsState('idle'), 3000);
        }
    };

    const getIcon = () => {
        switch(ttsState) {
            case 'loading': return 'fa-spinner fa-spin';
            case 'playing': return 'fa-stop';
            case 'paused': return 'fa-play';
            case 'error': return 'fa-exclamation-triangle';
            default: return 'fa-volume-high';
        }
    };

    const getTooltip = () => {
        switch(ttsState) {
            case 'loading': return 'Carregando...';
            case 'playing': return 'Parar';
            case 'paused': return 'Continuar';
            case 'error': return 'Erro ao reproduzir';
            default: return 'Ouvir';
        }
    };

    return (
        <button 
            onClick={handlePlay} 
            data-tooltip={getTooltip()} 
            className={`p-1.5 text-text-tertiary hover:text-text-primary transition-colors ${
                ttsState === 'playing' ? 'text-purple-400' : ''
            } ${ttsState === 'error' ? 'text-red-400' : ''}`}
        >
            <i className={`fa-solid ${getIcon()} text-sm`}></i>
        </button>
    );
};

const SourceLink: React.FC<{ source: GroundingSource }> = ({ source }) => (
    <a 
        href={source.uri} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] text-text-secondary text-xs px-2.5 py-1 rounded-full transition-colors border border-transparent hover:border-[color:var(--border-color)]"
    >
        <i className={`fa-solid ${source.type === 'web' ? 'fa-globe' : 'fa-map-location-dot'} text-text-tertiary`}></i>
        <span className="truncate max-w-48">{source.title}</span>
    </a>
);

const SuggestedPromptButton: React.FC<{ text: string; onClick: () => void; }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="bg-bg-tertiary hover:bg-opacity-80 text-left text-sm text-text-secondary px-4 py-2 rounded-lg transition-colors duration-200 border border-border-color w-full md:w-auto"
    >
        {text}
    </button>
);


export const Message: React.FC<MessageProps> = React.memo(({ message, onEdit, onRegenerate, isLastMessage, onStop, onTextToSpeech, onShowInteractiveCode, theme, onSend, isThinkingMode, onOpenVoiceSettings }) => {
  const isModel = message.role === 'model';
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (contentRef.current && !isEditing) {
        contentRef.current.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block as HTMLElement);
        });
    }
  }, [message.content, isEditing]);
  
  const handleSaveEdit = (newContent: string) => {
    onEdit(message.id, newContent);
    setIsEditing(false);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const renderContent = () => {
    if (message.videoState) {
        return <VideoPlayer message={message} />;
    }
    if (isEditing) {
        return <EditPromptInput initialContent={message.content} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />;
    }
    if (message.isLoading) {
        return <LoadingIndicator onStop={onStop} isThinking={message.isThinking} />;
    }
    if (message.error) {
        return <ErrorMessage error={message.error} />;
    }
    if (!message.content) {
        return isModel ? <span className="animate-pulse">▍</span> : null;
    }
    try {
      const parsedHtml = marked.parse(message.content) as string;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = parsedHtml;
      const elements = Array.from(tempDiv.childNodes);
      return elements.map((node, index) => {
          if (node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE') {
              return <CodeBlock key={index} codeElement={node.firstChild as Element} />;
          }
          return <div key={index} dangerouslySetInnerHTML={{ __html: (node as Element).outerHTML || node.textContent || '' }} />;
      });
    } catch (e) {
      console.error("Error parsing markdown:", e);
      return <div dangerouslySetInnerHTML={{ __html: message.content.replace(/</g, "&lt;").replace(/>/g, "&gt;") }} />;
    }
  };

  return (
    <div className={`message-fade-in group relative py-6 px-2 flex gap-4 ${isModel && (message.content || message.isLoading || message.error || message.videoState) ? 'bg-[color:var(--bg-quaternary)]' : ''}`}>
      <div className="flex-shrink-0 pt-1">
        {isModel ? <GeminiIcon /> : <UserIcon />}
      </div>
      <div ref={contentRef} className="w-full flex-grow prose prose-invert max-w-none prose-p:my-2 text-base leading-relaxed">
        {message.attachments && !isEditing && (
          <div className="mb-4 flex flex-wrap gap-2">
            {message.attachments.map((att, index) => <AttachmentPreview key={index} attachment={att} />)}
          </div>
        )}
        {message.isEdited && !isEditing && <span className="text-xs text-text-tertiary italic mb-2 block">(Editado)</span>}
         {renderContent()}

        {/* Product Grid */}
        {message.products && message.products.length > 0 && (
          <ProductGrid 
            products={message.products} 
            query={message.productQuery || 'produtos'} 
          />
        )}

        {/* Enriched Browser Result */}
        {message.enrichedResult && (
          <EnrichedBrowserResult 
            result={message.enrichedResult} 
            theme={theme}
          />
        )}

        {/* Visual Canvas */}
        {message.visualCanvas && (
          <VisualCanvas 
            enrichedResult={message.visualCanvas} 
            theme={theme}
          />
        )}

        {/* Structured Response */}
        {message.structuredResponse && (
          <StructuredResponse 
            data={message.structuredResponse} 
            theme={theme}
          />
        )}

        {message.isInteractive && message.htmlCode && (
          <div className="mt-4">
            <button
              onClick={() => onShowInteractiveCode(message)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow"
            >
              <i className="fa-solid fa-play"></i>
              <span>Abrir Pré-visualização Interativa</span>
            </button>
          </div>
        )}

         {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[color:var(--border-color)]">
                <h4 className="text-xs font-semibold text-text-tertiary mb-2">Fontes</h4>
                <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                        <SourceLink key={index} source={source} />
                    ))}
                </div>
            </div>
        )}
         {isLastMessage && message.suggestedPrompts && message.suggestedPrompts.length > 0 && !message.isLoading && (
            <div className="flex flex-wrap justify-start gap-3 mt-4 pt-4 border-t border-border-color">
            {message.suggestedPrompts.map((prompt, index) => (
                <SuggestedPromptButton
                key={index}
                text={prompt}
                onClick={() => onSend(prompt)}
                />
            ))}
            </div>
        )}
      </div>
      {!isEditing && !message.isLoading && !message.videoState && (
         <div className="absolute top-2 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isModel && message.content && !message.error ? (
                <>
                    <TextToSpeechButton text={message.content} onTextToSpeech={onTextToSpeech} messageId={message.id} />
                    {onOpenVoiceSettings && (
                        <button 
                            onClick={onOpenVoiceSettings} 
                            data-tooltip="Configurações de Voz" 
                            className="p-1.5 text-text-tertiary hover:text-purple-400 transition-colors"
                        >
                            <i className="fa-solid fa-sliders text-sm"></i>
                        </button>
                    )}
                    <button onClick={handleCopy} data-tooltip="Copiar" className="p-1.5 text-text-tertiary hover:text-text-primary"><i className="fa-solid fa-clipboard text-sm"></i></button>
                    {isLastMessage && <button onClick={onRegenerate} data-tooltip="Regenerar" className="p-1.5 text-text-tertiary hover:text-text-primary"><i className="fa-solid fa-arrows-rotate text-sm"></i></button>}
                </>
            ) : null}
            {!isModel && (
                <button onClick={() => setIsEditing(true)} data-tooltip="Editar" className="p-1.5 text-text-tertiary hover:text-text-primary"><i className="fa-solid fa-pencil text-sm"></i></button>
            )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isLoading === nextProps.message.isLoading &&
    prevProps.message.error === nextProps.message.error &&
    prevProps.isLastMessage === nextProps.isLastMessage &&
    prevProps.theme === nextProps.theme
  );
});
