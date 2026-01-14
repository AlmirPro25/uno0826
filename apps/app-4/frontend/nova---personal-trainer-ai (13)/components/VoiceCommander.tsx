import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppView } from '../types';

export const VoiceCommander: React.FC = () => {
  const { navigate, playSound } = useAppContext();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        console.log("Comando de voz recebido:", command);
        processCommand(command);
        setIsListening(false);
        playSound('success');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsListening(false);
        playSound('error');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const processCommand = (command: string) => {
    if (command.includes('painel') || command.includes('início') || command.includes('dashboard')) {
      navigate(AppView.DASHBOARD);
    } else if (command.includes('treino') || command.includes('começar') || command.includes('exercício')) {
      navigate(AppView.LIVE_SESSION);
    } else if (command.includes('chat') || command.includes('conversar') || command.includes('nova')) {
      navigate(AppView.CHAT);
    } else if (command.includes('analisar') || command.includes('foto') || command.includes('comida') || command.includes('biometria')) {
      navigate(AppView.ANALYSIS);
    } else if (command.includes('plano') || command.includes('planejamento') || command.includes('semana')) {
      navigate(AppView.PLANNER);
    } else if (command.includes('histórico') || command.includes('memória')) {
      navigate(AppView.HISTORY);
    } else if (command.includes('perfil') || command.includes('configuração') || command.includes('ajustes')) {
      navigate(AppView.PROFILE);
    } else {
        // Feedback visual ou sonoro de comando não reconhecido poderia ser adicionado aqui
        playSound('error');
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador não suporta comandos de voz nativos.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      playSound('off');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      playSound('on');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleListening}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2
          ${isListening 
            ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-red-500/50' 
            : 'bg-slate-900 border-blue-500/50 text-blue-400 hover:bg-slate-800 hover:border-blue-400 shadow-blue-500/30'}
        `}
        title="Comando de Voz Global"
      >
        {isListening ? <Mic size={24} /> : <Command size={24} />}
      </button>
      {isListening && (
        <div className="absolute bottom-16 right-0 bg-slate-900 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap border border-slate-700 animate-fade-in-up">
          Ouvindo comando...
        </div>
      )}
    </div>
  );
};