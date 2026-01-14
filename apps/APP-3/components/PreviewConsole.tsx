import React, { useRef, useEffect } from 'react';

export interface ConsoleMessage {
    id: string;
    level: 'log' | 'warn' | 'error' | 'info' | 'debug';
    message: string;
    timestamp: string;
}

interface PreviewConsoleProps {
    isOpen: boolean;
    messages: ConsoleMessage[];
    onClear: () => void;
    onClose: () => void;
    onAskAiToFix: (errorMessage: string) => void;
}

const PreviewConsole: React.FC<PreviewConsoleProps> = ({ isOpen, messages, onClear, onClose, onAskAiToFix }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const errorCount = messages.filter(m => m.level === 'error').length;
    const warnCount = messages.filter(m => m.level === 'warn').length;

    return (
        <div 
            className="preview-console flex-shrink-0 bg-slate-800 border-t-2 border-slate-700 shadow-2xl overflow-hidden"
            style={{ maxHeight: isOpen ? '250px' : '0' }}
            aria-hidden={!isOpen}
        >
            <div className="h-full flex flex-col">
                {/* Console Toolbar */}
                <div className="flex-shrink-0 bg-slate-900/50 p-1.5 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-xs text-slate-300 ml-2">Console do Preview</span>
                        <div className="flex items-center gap-3 text-xs">
                             <span className={`flex items-center gap-1.5 ${errorCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                <i className="fa-solid fa-circle-xmark"></i> {errorCount}
                            </span>
                             <span className={`flex items-center gap-1.5 ${warnCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                                <i className="fa-solid fa-triangle-exclamation"></i> {warnCount}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClear} title="Limpar console" className="px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white rounded-md transition-colors">
                            <i className="fa-solid fa-ban mr-1"></i>
                            Limpar
                        </button>
                        <button onClick={onClose} title="Fechar console" className="px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white rounded-md transition-colors">
                            <i className="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>
                </div>

                {/* Console Messages */}
                <div ref={scrollRef} className="flex-grow p-2 overflow-y-auto scrollbar-thin">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                            Nenhuma saída de console ainda...
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                           <div key={`${msg.id}-${index}`} className={`log-item log-level-${msg.level} border-l-2 py-1 px-2 text-xs flex items-start gap-2 break-words whitespace-pre-wrap`}>
                                <span className="text-slate-500 shrink-0">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                <div className="flex-grow">
                                    <span className="flex-grow">{msg.message}</span>
                                    {msg.level === 'error' && (
                                        <button
                                            onClick={() => onAskAiToFix(msg.message)}
                                            className="ml-2 mt-1 px-1.5 py-0.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md border border-red-500/30 transition-colors"
                                        >
                                           <i className="fa-solid fa-wand-magic-sparkles fa-xs mr-1"></i> Analisar com IA
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewConsole;
