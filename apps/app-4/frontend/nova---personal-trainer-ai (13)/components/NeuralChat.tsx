import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Mic, Image as ImageIcon, X, Paperclip, StopCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { sendNeuralChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

interface Attachment {
  mimeType: string;
  data: string;
  previewUrl?: string; // For display only
}

export const NeuralChat: React.FC = () => {
  const { userProfile, activePlan, history, todayStats, playSound } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Olá, ${userProfile.name}. Sou sua interface tática. Como posso ajustar seu protocolo hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, attachment, isRecording]);

  // --- Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playSound('click');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAttachment({
          mimeType: file.type,
          data: base64String.split(',')[1],
          previewUrl: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAttachment({
            mimeType: 'audio/webm',
            data: base64String.split(',')[1],
            previewUrl: undefined // No visual preview for audio yet
          });
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      playSound('on');
    } catch (err) {
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      playSound('off');
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    playSound('click');
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || loading) return;

    playSound('click');

    // Determine visual representation of user message
    let displayText = input;
    if (attachment) {
      if (attachment.mimeType.startsWith('audio/')) {
        displayText = input ? `🎤 [Áudio] ${input}` : '🎤 [Mensagem de Áudio enviada]';
      } else if (attachment.mimeType.startsWith('image/')) {
        displayText = input ? `📷 [Imagem] ${input}` : '📷 [Imagem enviada]';
      }
    }

    const userMsg: ChatMessage = { role: 'user', text: displayText };
    setMessages(prev => [...prev, userMsg]);
    
    // Save current attachment payload to send
    const payloadAttachment = attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined;
    
    // Reset inputs immediately for UX
    setInput('');
    setAttachment(null);
    setLoading(true);

    // Build Context
    const todayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    const todaysPlan = activePlan?.days.find(d => d.day.toLowerCase().includes(todayName.split('-')[0].toLowerCase()));
    
    let context = `Perfil: ${userProfile.name}, ${userProfile.age} anos, ${userProfile.weight}kg, Obj: ${userProfile.goal}.\n`;
    context += `Stats Hoje: Ingeriu ${todayStats.caloriesConsumed}kcal, Queimou ${todayStats.caloriesBurned}kcal.\n`;
    
    if (todaysPlan) {
      context += `Treino de Hoje (${todayName}): ${todaysPlan.focus} - ${todaysPlan.workout}. Nutrição: ${todaysPlan.nutritionFocus}.\n`;
    } else {
      context += `Sem treino específico planejado para hoje (${todayName}).\n`;
    }

    if (history.length > 0) {
      context += `Última análise (${history[0].type}): ${history[0].summary}.\n`;
    }

    try {
      const responseText = await sendNeuralChatMessage(messages, userMsg.text, context, payloadAttachment);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Erro de conexão neural. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <header className="mb-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Bot className="text-emerald-400" /> Chat Tático
        </h2>
        <p className="text-slate-400">Suporte estratégico multimodal (Texto, Voz, Imagem).</p>
      </header>

      <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4 backdrop-blur-sm relative">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-xs font-bold uppercase tracking-wider">
                {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                {msg.role === 'user' ? userProfile.name : 'System Nova'}
              </div>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              <span className="text-xs text-slate-500">Processando dados...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 relative">
        {/* Attachment Preview Area */}
        {attachment && (
          <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg mb-2 border border-slate-700 mx-1">
            {attachment.mimeType.startsWith('image/') && attachment.previewUrl && (
              <img src={attachment.previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded bg-black" />
            )}
            {attachment.mimeType.startsWith('audio/') && (
              <div className="w-10 h-10 bg-red-900/50 rounded flex items-center justify-center text-red-400">
                <Mic size={20} />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-slate-300 truncate font-mono">
                {attachment.mimeType.startsWith('image/') ? 'Imagem anexada' : 'Áudio gravado'}
              </p>
              <p className="text-[10px] text-slate-500">{attachment.mimeType}</p>
            </div>
            <button onClick={clearAttachment} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-center gap-2">
          
          {/* File Upload Button */}
          <button 
            onClick={() => { playSound('click'); fileInputRef.current?.click(); }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Anexar Imagem"
            disabled={isRecording || loading}
          >
            <Paperclip size={20} />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect}
            />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isRecording ? "Gravando áudio..." : "Digite ou grave..."}
            disabled={isRecording || loading}
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm p-2"
          />

          {/* Record Button */}
          {isRecording ? (
             <button
              onClick={stopRecording}
              className="p-2 text-red-500 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-all animate-pulse"
              title="Parar Gravação"
             >
               <StopCircle size={20} />
             </button>
          ) : (
             <button
              onClick={startRecording}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
              title="Gravar Áudio"
              disabled={!!attachment || loading} // Disable if already has attachment to keep logic simple
             >
               <Mic size={20} />
             </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !attachment) || isRecording}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};