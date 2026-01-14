import React, { useState, useRef, useEffect } from 'react';
import { MensagemChat, Paciente, ArquivoAnexo } from '../types';
import { enviarMensagemCopiloto } from '../services/geminiService';

interface AIChatPanelProps {
  paciente: Paciente;
  historicoChat: MensagemChat[];
  onNewMessage: (msg: MensagemChat) => void;
}

// Declaração global para API de reconhecimento de voz
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ paciente, historicoChat, onNewMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string, name: string, type: string }[]>([]);
  
  // Estado para controle do microfone
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null); // Referência para colar prints

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [historicoChat, previews]);

  // --- LÓGICA DE VOZ (DITADO CONTÍNUO) ---
  useEffect(() => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          console.warn("Speech API not supported in this browser.");
          return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true; // Escuta contínua
      recognition.interimResults = true; // Resultados parciais enquanto fala
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
          let finalTranscript = '';
          
          // Itera sobre os resultados para pegar o último trecho
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
          }

          // Se tiver um resultado final, adiciona ao input existente
          if (finalTranscript) {
              setInput(prev => {
                  const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                  return prev + space + finalTranscript;
              });
          }
      };

      recognition.onend = () => {
          // SE O USUÁRIO NÃO APERTOU PARAR, REINICIA AUTOMATICAMENTE (Logica "não para no silencio")
          if (isRecording) {
              try {
                  recognition.start();
              } catch (e) {
                  // Ignora erros de "já iniciado"
              }
          }
      };
      
      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed') {
              setIsRecording(false);
          }
      };

      recognitionRef.current = recognition;

      return () => {
          if (recognitionRef.current) recognitionRef.current.stop();
      };
  }, [isRecording]); // Recria se o estado de gravação mudar (para garantir closures atualizadas se necessário)

  const toggleRecording = () => {
      if (isRecording) {
          setIsRecording(false);
          recognitionRef.current?.stop();
      } else {
          setIsRecording(true);
          recognitionRef.current?.start();
      }
  };

  // --- LÓGICA DE ARQUIVOS (MULTIMODAL) ---

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const addFiles = (files: FileList | File[]) => {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);

      // Gera previews
      newFiles.forEach(file => {
          const url = URL.createObjectURL(file);
          setPreviews(prev => [...prev, { url, name: file.name, type: file.type }]);
      });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
          addFiles(event.target.files);
      }
  };

  const removeFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- LÓGICA DE COLAR (PRINT SCREEN) ---
  const handlePaste = (e: React.ClipboardEvent) => {
      if (e.clipboardData.files.length > 0) {
          e.preventDefault(); // Evita colar o nome do arquivo se for texto
          addFiles(e.clipboardData.files);
      }
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    // Se estiver gravando, para a gravação ao enviar
    if (isRecording) {
        toggleRecording();
    }

    // Processa todos os anexos
    const anexosProcessados: ArquivoAnexo[] = [];
    for (const file of selectedFiles) {
        const base64 = await fileToBase64(file);
        const tipo = file.type.startsWith('image/') ? 'imagem' : 
                     file.type.startsWith('audio/') ? 'audio' : 'arquivo';
        
        anexosProcessados.push({
            nome: file.name,
            tipo: tipo,
            mimeType: file.type,
            dadosBase64: base64
        });
    }

    const userMsg: MensagemChat = {
      id: Date.now().toString(),
      remetente: 'user',
      conteudo: input,
      anexos: anexosProcessados.length > 0 ? anexosProcessados : undefined,
      timestamp: new Date(),
      tipo: 'texto'
    };

    onNewMessage(userMsg);
    
    // Limpeza
    setInput('');
    setSelectedFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsLoading(true);

    const respostaTexto = await enviarMensagemCopiloto(historicoChat, input, paciente, anexosProcessados.length > 0 ? anexosProcessados : undefined);

    const aiMsg: MensagemChat = {
      id: (Date.now() + 1).toString(),
      remetente: 'ai',
      conteudo: respostaTexto,
      timestamp: new Date(),
      tipo: 'texto'
    };

    onNewMessage(aiMsg);
    setIsLoading(false);
  };

  return (
    <div 
        className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
        onPaste={handlePaste} // Listener global no painel para capturar Print Screen
    >
      {/* Header do Chat */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-slate-700 text-sm">Copiloto Clínico Multimodal</span>
        </div>
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Vision Enabled
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {historicoChat.length === 0 && (
            <div className="text-center p-8 text-slate-400 text-sm">
                <p>O Copiloto analisou a Pasta Viva de <strong>{paciente.nome}</strong>.</p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg inline-block text-left max-w-xs">
                    <p className="font-bold text-blue-700 text-xs uppercase mb-2">Novas Capacidades:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                        <li>📸 Cole Prints (Ctrl+V) direto aqui</li>
                        <li>🎙️ Use o microfone para ditar</li>
                        <li>📎 Anexe múltiplos exames</li>
                    </ul>
                </div>
            </div>
        )}

        {historicoChat.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-1 shadow-sm ${
              msg.remetente === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              
              {/* Renderização de Anexos (Galeria) */}
              {msg.anexos && msg.anexos.length > 0 && (
                  <div className={`mb-2 grid gap-1 ${msg.anexos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {msg.anexos.map((anexo, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden bg-black/10 relative group">
                              {anexo.tipo === 'imagem' && (
                                  <img 
                                    src={`data:${anexo.mimeType};base64,${anexo.dadosBase64}`} 
                                    alt="Anexo Clínico" 
                                    className="w-full h-32 object-cover"
                                  />
                              )}
                              {anexo.tipo === 'audio' && (
                                  <div className="p-2 flex items-center justify-center bg-slate-800 text-white h-full">
                                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                  </div>
                              )}
                              {/* Hover Info */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                                  <span className="text-[9px] text-white truncate w-full">{anexo.nome}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <div className="px-3 py-2">
                {msg.remetente === 'ai' && (
                    <div className="text-[10px] font-bold text-indigo-500 mb-1 uppercase tracking-wide">
                    SNDT AI
                    </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.conteudo}</div>
                <div className={`text-[10px] mt-1 text-right ${msg.remetente === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs text-slate-400 animate-pulse">Processando Multimodal...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview Area (Arquivos anexados antes de enviar) */}
      {previews.length > 0 && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex gap-2 overflow-x-auto animate-slide-up">
              {previews.map((file, idx) => (
                  <div key={idx} className="relative shrink-0 w-16 h-16 group">
                      {file.type.startsWith('image/') ? (
                          <img src={file.url} className="w-16 h-16 object-cover rounded border border-slate-300" />
                      ) : (
                          <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center text-slate-500 border border-slate-300">
                              <span className="text-[9px] font-bold uppercase">{file.name.split('.').pop()}</span>
                          </div>
                      )}
                      <button 
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                      >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
              ))}
              <div className="flex items-center justify-center text-xs text-slate-400 px-2 italic">
                  +{previews.length} anexos
              </div>
          </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200" ref={inputAreaRef}>
        <div className="flex gap-2 relative items-end">
          {/* Botão de Anexo (Múltiplo) */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden" 
            multiple
            accept="image/*,audio/*,application/pdf"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="Anexar Imagens/Arquivos"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>

          {/* Botão Microfone (Toggle) */}
          <button 
            onClick={toggleRecording}
            className={`p-3 rounded-lg transition-all duration-300 ${
                isRecording 
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
            }`}
            title="Ditar (Clique para iniciar/parar)"
          >
             {isRecording ? (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
             ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             )}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder={previews.length > 0 ? "Comente sobre os arquivos..." : "Digite, fale ou cole um print (Ctrl+V)..."}
            className="flex-1 bg-slate-100 text-slate-800 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent border resize-none max-h-24 overflow-y-auto"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 text-center flex justify-center gap-4">
            <span>🔒 Dados Criptografados</span>
            <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Multimodal Ready
            </span>
            {isRecording && (
                <span className="text-red-500 animate-pulse font-bold flex items-center gap-1">
                    ● Gravando...
                </span>
            )}
        </div>
      </div>
    </div>
  );
};