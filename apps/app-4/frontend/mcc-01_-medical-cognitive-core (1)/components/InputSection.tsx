import React, { useState, useRef, useEffect } from 'react';
import { TriageInput } from '../types';

interface InputSectionProps {
  onSubmit: (data: TriageInput) => void;
  isLoading: boolean;
  initialText?: string;
}

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [age, setAge] = useState('');
  const [history, setHistory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Update text if initialText prop changes (e.g. coming from Live Monitor)
  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    setMicError(null);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMicError("Navegador incompatível (use Chrome/Edge).");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError("Permissão de microfone negada.");
        } else if (event.error === 'no-speech') {
          // Ignore no-speech errors usually, just stop or let it be
        } else {
          setMicError("Erro no reconhecimento de voz.");
        }
      };

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        setText(prev => {
          const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + newTranscript;
        });
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
        setMicError("Falha ao iniciar microfone.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImages(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSubmit = () => {
    if (!text.trim() && images.length === 0) return;
    
    onSubmit({
      text,
      images,
      context: { age, history }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          Admissão & Triagem
        </h2>

        {/* Patient Context Lite */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Idade do Paciente</label>
            <input 
              type="text" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ex: 45 anos"
              className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Histórico Prévio</label>
            <input 
              type="text" 
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Ex: Hipertenso, Diabético..."
              className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Main Complaint */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700">Queixa Principal / Relato Clínico</label>
            <div className="flex items-center space-x-2">
              {micError && (
                <span className="text-xs text-red-500 font-medium animate-fade-in">{micError}</span>
              )}
              <button
                onClick={toggleVoiceInput}
                type="button"
                className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
                  isListening 
                  ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isListening ? (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping"></span>
                    Gravando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    Ditar
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isListening ? "Escutando... Pode falar pausadamente." : "Descreva os sintomas, duração, intensidade e evolução..."}
            className={`w-full h-32 p-3 border rounded-lg focus:outline-none resize-none text-slate-700 transition-all ${
              isListening 
              ? 'border-red-400 ring-2 ring-red-100 bg-red-50/10' 
              : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
            }`}
          ></textarea>
        </div>

        {/* Image Upload Area */}
        <div 
          className={`mb-6 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <div className="flex flex-wrap gap-4 justify-center mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200 shadow-sm">
                <img src={img} alt="upload preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          
          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
             <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             <span className="text-sm text-slate-600 font-medium">Clique para enviar exames/fotos ou arraste aqui</span>
             <span className="text-xs text-slate-400 mt-1">Suporta JPG, PNG, WebP (Visão Computacional Ativada)</span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || (!text && images.length === 0)}
          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
            isLoading || (!text && images.length === 0)
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processando Protocolo Cognitivo...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Iniciar Análise Clínica</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;