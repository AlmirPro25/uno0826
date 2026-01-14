import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Mic, MicOff, CornerDownLeft, Paperclip, X, Trash2, Square, RotateCcw, Activity, Zap, Bug, Wand2, FileCode, History } from 'lucide-react';
import { Attachment } from '../types';
import { useStore } from '../store';
import { MessageBubble } from './MessageBubble';
import * as Memory from '../services/memory';

interface ChatInterfaceProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  onClearChat: () => void;
  onResetAll: () => void;
  className?: string;
}

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  onClearChat,
  onResetAll,
  className = "" 
}) => {
  const { messages, isLoading, stopGeneration, agentStatus, promptHistory, addToPromptHistory } = useStore();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll whenever messages change (including streaming updates)
  useEffect(() => {
    scrollToBottom();
  }, [messages, attachments, messages.length > 0 ? messages[messages.length - 1].content : null]); 

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // --- IMAGE HANDLING ---

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        // Extract base64 data (remove "data:image/xxx;base64,")
        const base64Data = result.split(',')[1];
        
        const newAttachment: Attachment = {
            type: 'image',
            mimeType: file.type,
            data: base64Data,
            previewUrl: result
        };
        setAttachments(prev => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
                processFile(blob);
                e.preventDefault(); // Prevent pasting the file name/placeholder
            }
        }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- SPEECH ---

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionClass = SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true; 
    recognition.interimResults = false; 
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput((prev) => {
          const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
          return prev + spacer + finalTranscript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setIsListening(false);
        alert("Microphone access denied.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // --- SUBMISSION ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      // Salvar no histórico se tiver texto
      if (input.trim()) {
        addToPromptHistory(input.trim());
      }
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      setShowHistory(false);
      if (isListening) {
        stopListening();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if ((input.trim() || attachments.length > 0) && !isLoading) {
            onSendMessage(input, attachments);
            setInput('');
            setAttachments([]);
            if (isListening) stopListening();
        }
    }
  };

  return (
    <div className={`flex flex-col bg-[#0c0c0e] ${className}`}>
      
      {/* HEADER */}
      <div className="flex-none px-5 py-4 flex items-center justify-between bg-[#0c0c0e]/50 backdrop-blur-sm sticky top-0 z-10 border-b border-transparent">
         <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 tracking-wide">AETHER AI</span>
            <div className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/20 text-[9px] text-indigo-300 font-medium uppercase tracking-wider">
               Maestro
            </div>
         </div>
         <div className="flex items-center gap-1">
           {/* Botão Reset Total */}
           <button 
              onClick={onResetAll}
              className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-white/5 rounded-md transition-colors"
              title="Reset Tudo (Arquivos, Chat, Container)"
           >
              <RotateCcw className="w-3.5 h-3.5" />
           </button>
           {/* Botão Limpar Chat */}
           {messages.length > 0 && (
               <button 
                  onClick={onClearChat}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
                  title="Limpar Histórico do Chat"
               >
                  <Trash2 className="w-3.5 h-3.5" />
               </button>
           )}
         </div>
      </div>

      {/* Messages Area - Centralizado */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[200px]">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)]">
                  <Sparkles className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="space-y-2 max-w-[280px]">
                  <h3 className="text-base font-semibold text-slate-200">How can I help you build?</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                      I can see images! Paste a screenshot of a UI, a diagram, or a bug report.
                  </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  <button onClick={() => setInput("Create a modern landing page with hero section")} className="p-3 rounded-xl bg-[#18181b] border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-xs text-slate-400 hover:text-indigo-300 text-left">
                      🚀 Landing Page
                  </button>
                  <button onClick={() => setInput("Create a todo app with local storage")} className="p-3 rounded-xl bg-[#18181b] border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-xs text-slate-400 hover:text-indigo-300 text-left">
                      ✅ Todo App
                  </button>
                  <button onClick={() => setInput("Create a dashboard with charts and stats")} className="p-3 rounded-xl bg-[#18181b] border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-xs text-slate-400 hover:text-indigo-300 text-left">
                      📊 Dashboard
                  </button>
                  <button onClick={() => setInput("Create a chat interface with message bubbles")} className="p-3 rounded-xl bg-[#18181b] border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-xs text-slate-400 hover:text-indigo-300 text-left">
                      💬 Chat UI
                  </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble 
                  key={idx} 
                  message={msg} 
                  isLast={idx === messages.length - 1} 
                  isLoading={isLoading} 
              />
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Area - Centralizado */}
      <div className="p-4 bg-transparent">
        <div className="max-w-3xl mx-auto">
          {/* Quick Actions - Aparecem quando não está carregando */}
          {!isLoading && messages.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-3 animate-in fade-in duration-300">
              <button
                onClick={() => setInput("Fix any errors in the code")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full border border-red-500/20 transition-colors"
              >
                <Bug className="w-3 h-3" />
                Fix Errors
              </button>
              <button
                onClick={() => setInput("Improve the UI design and styling")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/20 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                Improve UI
              </button>
              <button
                onClick={() => setInput("Add more features to the app")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Add Features
              </button>
              <button
                onClick={() => setInput("Refactor and optimize the code")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/20 transition-colors"
              >
                <FileCode className="w-3 h-3" />
                Refactor
              </button>
              <button
                onClick={() => setInput("Check app health and fix any issues")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/20 transition-colors"
              >
                <Activity className="w-3 h-3" />
                Health Check
              </button>
            </div>
          )}

          {/* Status da IA - Melhorado */}
          {isLoading && agentStatus && (
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-lg shadow-indigo-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-xs font-medium text-indigo-300">{agentStatus}</span>
                {agentStatus.includes('$') && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded">
                    TERMINAL
                  </span>
                )}
                {agentStatus.includes('Writing') && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded">
                    FILE
                  </span>
                )}
                {agentStatus.includes('Installing') && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 rounded">
                    NPM
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="relative group">
               <form onSubmit={handleSubmit} className="relative flex flex-col bg-[#18181b] border border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 rounded-xl transition-all shadow-lg shadow-black/20 overflow-hidden">
                  
                  {/* Attachment Preview Strip */}
                  {attachments.length > 0 && (
                      <div className="flex gap-3 p-3 bg-[#121214] border-b border-white/5 overflow-x-auto">
                          {attachments.map((att, idx) => (
                              <div key={idx} className="relative group/preview shrink-0">
                                  <img 
                                      src={att.previewUrl} 
                                      alt="Preview" 
                                      className="h-16 w-16 object-cover rounded-md border border-slate-700"
                                  />
                                  <button 
                                      type="button"
                                      onClick={() => removeAttachment(idx)}
                                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/preview:opacity-100 transition-opacity shadow-sm"
                                  >
                                      <X className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={isListening ? "Listening..." : "Ask Maestro to build... (Paste images here)"}
                    rows={1}
                    className={`w-full bg-transparent text-slate-200 text-[13px] px-4 py-4 focus:outline-none resize-none min-h-[56px] max-h-[200px] placeholder-slate-500 ${isListening ? 'text-indigo-300' : ''}`}
                  />
                  
                  <div className="flex items-center justify-between px-2 pb-2 bg-[#18181b]">
                      <div className="flex items-center gap-1">
                           {/* Hidden File Input */}
                           <input 
                              type="file" 
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              accept="image/*"
                              className="hidden"
                           />
                           <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors relative"
                              title="Attach Image"
                          >
                              <Paperclip className="w-4 h-4" />
                          </button>
                          <button
                              type="button"
                              onClick={toggleListening}
                              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isListening ? 'bg-red-500/10 text-red-400' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'}`}
                          >
                              {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                          </button>
                          {/* History Button */}
                          {promptHistory.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowHistory(!showHistory)}
                                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'}`}
                                title="Prompt History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              {showHistory && (
                                <div className="absolute bottom-full left-0 mb-2 w-72 max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                                  <div className="p-2 border-b border-slate-700 text-xs text-slate-400 font-medium">
                                    Recent Prompts
                                  </div>
                                  {promptHistory.map((prompt, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setInput(prompt);
                                        setShowHistory(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors truncate"
                                    >
                                      {prompt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botão Parar - aparece quando IA está trabalhando */}
                        {isLoading && (
                          <button
                            type="button"
                            onClick={stopGeneration}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium border border-red-500/30"
                            title="Parar geração"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>Parar</span>
                          </button>
                        )}
                        
                        <button
                          type="submit"
                          disabled={(!input.trim() && attachments.length === 0) || isLoading}
                          className="p-2 m-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
                        </button>
                      </div>
                  </div>
              </form>
          </div>
          <div className="text-center mt-2">
              <span className="text-[10px] text-slate-600">AI can make mistakes. Review generated code.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
