import React, { useState, useEffect } from 'react';
import { Telemetria } from '../types';

interface TelemetryPanelProps {
  telemetria: Telemetria;
  isLive: boolean;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetria: initialData, isLive }) => {
  // Estado local para simular a flutuação dos sinais vitais (jitter)
  // Em produção real, isso viria via WebSocket ou Server-Sent Events (SSE)
  const [liveData, setLiveData] = useState(initialData);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
        setLiveData(prev => {
            // Algoritmo simples de flutuação biológica
            const jitterFC = Math.floor(Math.random() * 3) - 1; // -1, 0, ou +1
            const jitterSpo2 = Math.random() > 0.8 ? (Math.floor(Math.random() * 2) - 1) : 0; // Flutua menos

            return {
                ...prev,
                fc: prev.fc + jitterFC,
                spo2: Math.min(100, Math.max(80, prev.spo2 + jitterSpo2)),
                // Mantemos PA e Temp mais estáveis pois variam menos segundo a segundo
            };
        });
    }, 2000); // Atualiza a cada 2 segundos

    return () => clearInterval(interval);
  }, [isLive, initialData]); // Reinicia se mudar o paciente base

  // Reset visual quando muda o paciente
  useEffect(() => {
      setLiveData(initialData);
  }, [initialData]);

  return (
    <div className="bg-slate-900 rounded-lg p-4 text-white shadow-lg border border-slate-700 relative overflow-hidden transition-all duration-500">
      {/* Header simulando feed de vídeo */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
        <span className="text-xs font-mono uppercase text-gray-400">{isLive ? 'AO VIVO - IoT STREAM' : 'OFFLINE'}</span>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-1">TELEMETRIA VISUAL</h3>
        <div className="h-32 bg-black rounded flex items-center justify-center border border-slate-800 relative overflow-hidden group">
            {/* Simulação de vídeo feed com ruído digital css */}
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif')] opacity-10 bg-cover mix-blend-screen"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80"></div>
            
            <div className="z-10 text-slate-500 text-xs text-center">
                <div className="mb-1 flex justify-center items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    [Sinal Criptografado AES-256]
                </div>
                Análise Facial: <span className="text-green-400">Normal</span><br/>
                Detector de Dor: <span className="text-slate-400">Inativo</span>
            </div>
            {/* Overlay de dados da IA sobre o vídeo */}
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-green-400 bg-black/50 px-1 rounded border border-green-900/30">
                LATÊNCIA: 24ms | CONFIDENCE: 99.2%
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 p-3 rounded border-l-4 border-red-500 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Frequência Cardíaca</div>
          <div className="flex items-baseline gap-1">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{liveData.fc}</div>
            <span className="text-xs font-normal text-slate-500 animate-pulse">bpm</span>
          </div>
          {/* Sparkline fake */}
          <div className="h-1 w-full bg-slate-700 mt-2 rounded-full overflow-hidden">
             <div className="h-full bg-red-500 w-[60%] animate-[pulse_1s_ease-in-out_infinite]"></div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded border-l-4 border-blue-500 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Saturação O2</div>
          <div className="flex items-baseline gap-1">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{liveData.spo2}</div>
            <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <div className="h-1 w-full bg-slate-700 mt-2 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 w-[98%]"></div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded border-l-4 border-yellow-500 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Pressão Arterial</div>
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-bold font-mono tracking-tighter text-white">{liveData.pa}</div>
            <span className="text-xs font-normal text-slate-500">mmHg</span>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded border-l-4 border-orange-500 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Temp Corpórea</div>
            <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold font-mono tracking-tighter text-white">{liveData.temp}</div>
                <span className="text-xs font-normal text-slate-500">°C</span>
            </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center mb-1">
            <div className="text-[10px] font-mono text-slate-400">ANÁLISE NEURAL (STREAM)</div>
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping"></div>
        </div>
        <p className="text-xs text-yellow-200/90 leading-relaxed font-medium">
            ⚠ Variação de FC detectada nos últimos 10s. Padrão compatível com ansiedade ou dor aguda.
        </p>
      </div>
    </div>
  );
};