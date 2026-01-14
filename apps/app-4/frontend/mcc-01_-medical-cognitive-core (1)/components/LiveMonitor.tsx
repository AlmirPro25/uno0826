import React, { useState, useEffect, useRef } from 'react';
import { analyzeRealtimeSegment } from '../services/geminiService';
import { ClinicalEntity } from '../types';

interface LiveMonitorProps {
  onFinalize: (fullTranscript: string) => void;
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ onFinalize }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [entities, setEntities] = useState<ClinicalEntity[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const bufferRef = useRef<string>('');
  const lastProcessedIndexRef = useRef<number>(0);

  // Start listening on mount (optional, but let's make it manual start for safety)
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Polling loop to analyze new text segments
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isListening || processing) return;

      const fullText = bufferRef.current;
      const newText = fullText.slice(lastProcessedIndexRef.current);

      if (newText.length > 15) { // Only analyze if we have enough new text
        setProcessing(true);
        lastProcessedIndexRef.current = fullText.length;
        
        try {
          const result = await analyzeRealtimeSegment(newText);
          
          // Merge entities (avoiding duplicates simply for demo)
          if (result.entities && result.entities.length > 0) {
             setEntities(prev => {
                const combined = [...result.entities, ...prev];
                // Keep only last 10 entities to avoid clutter
                return combined.slice(0, 10);
             });
          }
          
          // Update risk score (smooth transition could be added here)
          setRiskScore(result.current_risk_score || 0);
          
        } catch (e) {
          console.error("Live loop error", e);
        } finally {
          setProcessing(false);
        }
      }
    }, 4000); // Check every 4 seconds

    return () => clearInterval(interval);
  }, [isListening, processing]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser not supported for Ambient Mode.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
         setTranscript(prev => {
             const updated = prev + finalTranscript;
             bufferRef.current = updated;
             return updated;
         });
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-emerald-400 border-emerald-500 shadow-emerald-500/50';
    if (score < 70) return 'text-amber-400 border-amber-500 shadow-amber-500/50';
    return 'text-rose-500 border-rose-500 shadow-rose-500/50';
  };

  const getEntityColor = (type: string) => {
    switch(type) {
      case 'symptom': return 'bg-rose-900/50 text-rose-200 border-rose-700';
      case 'medication': return 'bg-blue-900/50 text-blue-200 border-blue-700';
      case 'vital': return 'bg-emerald-900/50 text-emerald-200 border-emerald-700';
      default: return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 text-slate-200 flex flex-col h-[650px] font-mono">
      {/* HUD Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">
            Ambient Core <span className="text-slate-600">|</span> v.2.0 Active
          </h2>
        </div>
        <div className="flex space-x-2">
            {!isListening ? (
                <button onClick={startListening} className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded tracking-wider transition-all">
                    Initialize Monitor
                </button>
            ) : (
                <button onClick={stopListening} className="px-4 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded tracking-wider transition-all">
                    Stop Protocol
                </button>
            )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Transcript Stream */}
        <div className="w-2/3 p-6 border-r border-slate-800 flex flex-col relative">
           <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"></div>
           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {transcript ? (
                <p className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {transcript}
                    <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-blink align-middle"></span>
                </p>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-700">
                    <p className="text-center italic">
                        "Aguardando entrada de áudio ambiental..."<br/>
                        <span className="text-xs not-italic mt-2 block">System Standby</span>
                    </p>
                </div>
              )}
           </div>
           <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
           
           <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
               <button 
                onClick={() => onFinalize(transcript)}
                disabled={!transcript}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors uppercase text-xs font-bold tracking-wider"
               >
                   <span>Transfer to Triage Core</span>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </button>
           </div>
        </div>

        {/* Right: Cognitive Analysis Dashboard */}
        <div className="w-1/3 bg-slate-950 p-6 flex flex-col space-y-8">
            
            {/* Dynamic Risk Gauge */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Real-time Risk Probability</label>
                <div className="relative h-32 w-full flex items-center justify-center">
                     {/* Simplified Gauge Visualization */}
                     <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${getRiskColor(riskScore)} shadow-lg`}>
                         <span className={`text-2xl font-bold ${getRiskColor(riskScore).split(' ')[0]}`}>
                             {riskScore}%
                         </span>
                     </div>
                     <div className="absolute bottom-0 text-[10px] text-slate-500">DYNAMIC HEURISTIC</div>
                </div>
            </div>

            {/* Extracted Entities Stream */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex justify-between">
                    <span>Detected Entities</span>
                    {processing && <span className="text-emerald-500 animate-pulse">ANALYZING...</span>}
                </label>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {entities.map((ent, idx) => (
                        <div key={idx} className={`p-2 rounded border-l-2 text-xs animate-fade-in-right ${getEntityColor(ent.type)}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="uppercase font-bold opacity-70 text-[10px]">{ent.type}</span>
                                <span className="text-[10px] opacity-50">{(ent.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="font-semibold truncate" title={ent.value}>{ent.value}</div>
                        </div>
                    ))}
                    {entities.length === 0 && (
                        <div className="text-slate-700 text-xs text-center py-10">No clinical entities extracted yet.</div>
                    )}
                </div>
            </div>

             {/* System Log */}
             <div className="h-20 border-t border-slate-900 pt-2 font-mono text-[9px] text-slate-600 leading-tight opacity-50">
                 <p>&gt; SYSTEM READY.</p>
                 <p>&gt; GEMINI-2.5-FLASH CONNECTED.</p>
                 <p>&gt; AMBIENT LISTENER: {isListening ? 'ON' : 'OFF'}.</p>
                 {processing && <p>&gt; PROCESSING SEGMENT...</p>}
             </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;