import React, { useEffect, useRef, useState } from 'react';
import { BrainRegion, AgentState, LogEntry, TranscriptItem } from '@/types/neuro';
import NeuralOscilloscope from './NeuralOscilloscope';
import TranscriptionStream from './TranscriptionStream';

interface BrainHUDProps {
    agentState: AgentState;
    logs: LogEntry[];
    transcripts: TranscriptItem[];
    audioLevel: number; // 0 to 1
    videoStream: MediaStream | null; // Passed from parent to render inside the Eye
    videoUplinkActive?: boolean; // New prop for heartbeat
    onFileUpload?: (file: File) => void;
}

const BrainHUD: React.FC<BrainHUDProps> = ({ agentState, logs, transcripts, audioLevel, videoStream, videoUplinkActive, onFileUpload }) => {
    const latestLeft = logs.filter(l => l.region === BrainRegion.LEFT).slice(-1)[0];
    const latestRight = logs.filter(l => l.region === BrainRegion.RIGHT).slice(-1)[0];
    const latestFront = logs.filter(l => l.region === BrainRegion.FRONTAL).slice(-1)[0];

    const eyeVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Active Widget State
    const [activeWidget, setActiveWidget] = useState<'TRIAGE' | 'RESEARCH' | null>(null);

    // Fake Telemetry State
    const [latency, setLatency] = useState(45);
    const [stability, setStability] = useState(99);

    useEffect(() => {
        const interval = setInterval(() => {
            setLatency(prev => Math.max(20, Math.min(150, prev + (Math.random() * 20 - 10))));
            setStability(prev => Math.max(85, Math.min(100, prev + (Math.random() * 2 - 1))));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (latestLeft?.metadata?.urgency !== undefined) {
            setActiveWidget('TRIAGE');
            const timer = setTimeout(() => setActiveWidget(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [latestLeft]);

    useEffect(() => {
        if (latestRight?.metadata?.sources) {
            setActiveWidget('RESEARCH');
            const timer = setTimeout(() => setActiveWidget(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [latestRight]);

    // Attach stream to the "Eye" video element
    useEffect(() => {
        if (eyeVideoRef.current && videoStream) {
            eyeVideoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onFileUpload) {
            onFileUpload(e.target.files[0]);
        }
    };

    // Determine if Visual Cortex is active
    const isVisualActive = latestRight?.message.includes("Visual") && Date.now() - latestRight.timestamp < 5000;
    const isThinking = agentState === AgentState.THINKING || agentState === AgentState.CONSULTING_SUBCONSCIOUS;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-between p-4 font-mono text-xs overflow-hidden bg-slate-950 text-cyan-50">

            {/* BACKGROUND GRID & DECORATION */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>
            <div className="absolute left-10 top-1/2 -translate-y-1/2 w-px h-64 bg-cyan-900/50"></div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-px h-64 bg-cyan-900/50"></div>

            {/* TOP: CONSCIOUSNESS STREAM */}
            <div className="w-full flex flex-col items-center gap-2 z-20">
                <div className={`w-full max-w-2xl border border-cyan-500/30 bg-slate-900/80 p-4 rounded-b-xl backdrop-blur-md transition-all duration-300 ${agentState === AgentState.SPEAKING ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex gap-2 items-center">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                            <span className="text-cyan-400 font-bold tracking-widest">CORTEX.LIVE</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${agentState !== AgentState.IDLE ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-500'}`}>
                            STATUS: {agentState}
                        </span>
                    </div>
                    <div className="h-12 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent z-10"></div>
                        <div className="text-slate-300 text-sm font-light">
                            {latestFront ? `"${latestFront.message}"` : "Initializing neural pathways..."}
                        </div>
                    </div>
                </div>

                {/* OSCILLOSCOPE */}
                <div className="w-full max-w-2xl opacity-80">
                    <NeuralOscilloscope
                        audioLevel={audioLevel}
                        isActive={agentState !== AgentState.IDLE}
                        color={agentState === AgentState.SPEAKING ? '#22d3ee' : '#10b981'}
                    />
                </div>
            </div>

            {/* CENTER: THE EYE (RETINAL DISPLAY) & WIDGETS */}
            <div className="flex-grow flex items-center justify-center relative z-10 w-full perspective-[1000px]">

                {/* DATA PORT (Upload) */}
                {onFileUpload && (
                    <div className="absolute left-10 top-10 flex flex-col gap-2 z-50">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-900/80 border border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 p-3 rounded-sm backdrop-blur transition-all group flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:animate-bounce">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            <span className="text-[10px] font-bold tracking-widest">INGEST DATA</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                    </div>
                )}

                {/* HOLOGRAPHIC WIDGETS */}
                {activeWidget === 'TRIAGE' && latestLeft?.metadata && (
                    <div className="absolute z-40 bg-slate-950/90 border border-emerald-500/50 p-6 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur-xl w-80 animate-[slideUp_0.5s_ease-out] text-emerald-100 left-1/2 -translate-x-1/2 bottom-32">
                        <div className="flex justify-between items-center border-b border-emerald-800 pb-2 mb-4">
                            <h3 className="font-bold text-emerald-400 tracking-widest">TRIAGE PROTOCOL</h3>
                            <span className="bg-emerald-900/50 px-2 py-1 rounded text-[10px] border border-emerald-700">AUTO-GEN</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span>URGENCY SCORE</span>
                                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${latestLeft.metadata.urgency > 7 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${(latestLeft.metadata.urgency / 10) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="font-bold">{latestLeft.metadata.urgency}/10</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeWidget === 'RESEARCH' && latestRight?.metadata && (
                    <div className="absolute z-40 bg-slate-950/90 border border-violet-500/50 p-6 rounded-lg shadow-[0_0_50px_rgba(139,92,246,0.2)] backdrop-blur-xl w-80 animate-[slideUp_0.5s_ease-out] text-violet-100 right-10 bottom-32">
                        <div className="flex justify-between items-center border-b border-violet-800 pb-2 mb-4">
                            <h3 className="font-bold text-violet-400 tracking-widest">MEDICAL DATABASE</h3>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar text-[10px]">
                            {latestRight.metadata.result.substring(0, 300)}...
                        </div>
                    </div>
                )}

                {/* THE EYE */}
                <div className="relative group scale-75 lg:scale-100 transition-transform mb-10">
                    <div className={`absolute -inset-8 rounded-full border border-cyan-900/50 border-dashed animate-[spin_10s_linear_infinite] opacity-50`}></div>
                    <div className={`absolute -inset-4 rounded-full border border-cyan-800/30 animate-[spin_15s_linear_infinite_reverse]`}></div>

                    {/* UPLINK INDICATOR */}
                    {videoUplinkActive && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-red-500 font-bold tracking-widest animate-pulse z-50">
                            • VISION UPLINK •
                        </div>
                    )}

                    <div className={`w-32 h-32 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-300 ${isThinking ? 'shadow-[0_0_30px_rgba(139,92,246,0.3)] border-violet-500/50' : ''}`}>
                        <video
                            ref={eyeVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen filter grayscale contrast-125 transition-opacity duration-500 ${isVisualActive ? 'opacity-100' : 'opacity-20'}`}
                        />
                        <div className={`absolute inset-0 rounded-full bg-cyan-500 blur-[4px] mix-blend-overlay transition-all duration-75`} style={{ opacity: (0.3 + audioLevel) }}></div>
                        <div className="absolute w-1 h-1 bg-white rounded-full z-10"></div>
                    </div>

                    {/* Lines */}
                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] -z-10 pointer-events-none opacity-40">
                        <path d="M 300 150 L 100 250" stroke={latestLeft ? "#10b981" : "#1e293b"} strokeWidth="1" fill="none" className="transition-colors duration-300" />
                        <path d="M 300 150 L 500 250" stroke={latestRight ? "#8b5cf6" : "#1e293b"} strokeWidth="1" fill="none" className="transition-colors duration-300" />
                    </svg>
                </div>

                {/* TRANSCRIPTION STREAM LAYER */}
                <TranscriptionStream items={transcripts} />
            </div>

            {/* BOTTOM: TELEMETRY & SUBCONSCIOUS */}
            <div className="z-10 w-full max-w-6xl grid grid-cols-12 gap-4 h-32">

                {/* LEFT LOGIC */}
                <div className="col-span-4 border-l-2 border-emerald-500/50 pl-4 bg-gradient-to-r from-emerald-900/10 to-transparent">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-emerald-400 font-bold tracking-widest text-[10px]">LOGIC.PROTOCOL</span>
                    </div>
                    <div className="h-full overflow-y-auto font-mono text-[9px] text-emerald-200/80 space-y-1 pr-2 no-scrollbar">
                        {logs.filter(l => l.region === BrainRegion.LEFT).slice(-5).reverse().map(l => (
                            <div key={l.id} className="opacity-80 leading-tight">
                                <span className="text-emerald-500 font-bold mr-2">[{l.type.toUpperCase()}]</span>
                                {l.message}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER SYSTEM STATUS */}
                <div className="col-span-4 flex items-end justify-center pb-2">
                    <div className="grid grid-cols-3 gap-8 w-full border-t border-slate-800 pt-2">
                        <div className="text-center">
                            <div className="text-[9px] text-slate-500 tracking-widest">LATENCY</div>
                            <div className="text-cyan-400 font-mono text-lg">{latency.toFixed(0)}ms</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] text-slate-500 tracking-widest">NEURAL STABILITY</div>
                            <div className="text-emerald-400 font-mono text-lg">{stability.toFixed(1)}%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] text-slate-500 tracking-widest">BUFFER</div>
                            <div className="text-violet-400 font-mono text-lg">{(audioLevel * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT RESEARCH */}
                <div className="col-span-4 border-r-2 border-violet-500/50 pr-4 text-right bg-gradient-to-l from-violet-900/10 to-transparent">
                    <div className="flex justify-between items-center mb-1 flex-row-reverse">
                        <span className="text-violet-400 font-bold tracking-widest text-[10px]">DEEP.RESEARCH</span>
                    </div>
                    <div className="h-full overflow-y-auto font-mono text-[9px] text-violet-200/80 space-y-1 pl-2 no-scrollbar" dir="rtl">
                        {logs.filter(l => l.region === BrainRegion.RIGHT).slice(-5).reverse().map(l => (
                            <div key={l.id} className="opacity-80 leading-tight" dir="ltr">
                                <span className="text-violet-500 font-bold mr-2">[{l.type.toUpperCase()}]</span>
                                {l.message}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BrainHUD;
