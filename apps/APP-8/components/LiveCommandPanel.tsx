import React, { useState, useEffect, useRef } from 'react';

interface Message {
  speaker: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  isCommand?: boolean;
  response?: string;
  executed?: boolean;
}

export const LiveCommandPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'executing' | 'done'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Verifica status do executor
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/live/status');
        const data = await response.json();
        setStatus(data.executing ? 'executing' : 'idle');
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (text: string, isUser: boolean = true) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      speaker: isUser ? 'Você' : 'Sistema',
      text,
      timestamp: new Date(),
      isUser,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // MODO AGÊNTICO COM FUNCTION CALLING
      const response = await fetch('http://localhost:3001/api/live/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: newMessage.speaker,
          text: newMessage.text,
          isUser: newMessage.isUser,
          useFunctionCalling: true, // Ativa function calling
        }),
      });

      const data = await response.json();

      if (data.response) {
        // Adiciona resposta do agente
        const toolsInfo = data.toolsUsed && data.toolsUsed.length > 0 
          ? ` (${data.toolsUsed.join(', ')})` 
          : '';
        
        setMessages(prev => [
          ...prev,
          {
            speaker: data.acted ? `🤖 Agente${toolsInfo}` : '💬 Assistente',
            text: data.response,
            timestamp: new Date(),
            isUser: false,
            isCommand: data.acted,
            executed: data.acted,
          },
        ]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [
        ...prev,
        {
          speaker: 'Sistema',
          text: '❌ Erro ao processar mensagem',
          timestamp: new Date(),
          isUser: false,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const toggleVoice = () => {
    if (!isListening) {
      // Inicia reconhecimento de voz
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          sendMessage(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert('Reconhecimento de voz não suportado neste navegador');
      }
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🧠 Live Agent
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            (Consciência + Subconsciente)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {status === 'executing' && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Executando...</span>
            </div>
          )}
          {status === 'idle' && (
            <div className="flex items-center gap-2 text-green-600">
              ✅
              <span className="text-sm">Pronto</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-lg mb-2">🧠 Live Agent ativo!</p>
            <p className="text-sm mb-3">Sou um agente em tempo real que decide quando e como agir.</p>
            <div className="text-xs space-y-2 max-w-md mx-auto text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="font-semibold">💬 Conversar:</p>
              <p className="ml-4">"Como você está?" → Respondo naturalmente</p>
              
              <p className="font-semibold mt-2">⚡ Ações Rápidas:</p>
              <p className="ml-4">"Abra o YouTube" → Executo direto</p>
              
              <p className="font-semibold mt-2">🎭 Tarefas Complexas:</p>
              <p className="ml-4">"Pesquise Python e clique no primeiro" → Coordeno com Maestro</p>
              
              <p className="font-semibold mt-2">❓ Perguntas:</p>
              <p className="ml-4">"O que tem na tela?" → Analiso e respondo</p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser
                  ? 'bg-blue-600 text-white'
                  : msg.isCommand
                  ? msg.executed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">{msg.speaker}</span>
                {msg.isCommand && (msg.executed ? '✅' : '❌')}
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-3 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
            title={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
          >
            {isListening ? '🔴' : '🎤'}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite um comando ou fale..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            disabled={isProcessing || isListening}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing || isListening}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isProcessing ? '⏳' : '📤'}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Dica: Use o microfone para comandos por voz ou digite diretamente
        </p>
      </form>
    </div>
  );
};
