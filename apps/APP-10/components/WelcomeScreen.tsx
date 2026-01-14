
import React from 'react';
import { Command, Search, GitBranch, FilePlus, Zap, Terminal, Keyboard } from 'lucide-react';

export const WelcomeScreen: React.FC<{ onCreateFile: () => void }> = ({ onCreateFile }) => {
  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col items-center justify-center text-slate-400 select-none p-8">
      <div className="max-w-2xl w-full flex flex-col gap-12 animate-in fade-in zoom-in duration-500">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
                <Zap className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-2">Aether Prime v5</h1>
                <p className="text-slate-500 text-lg">Sensory AGI & Autonomous Architect</p>
            </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start</h2>
                
                <button 
                    onClick={onCreateFile}
                    className="flex items-center gap-3 w-full p-3 rounded-lg text-left bg-[#2a2d2e]/50 hover:bg-[#2a2d2e] border border-transparent hover:border-indigo-500/30 transition-all group"
                >
                    <FilePlus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <div>
                        <div className="text-sm font-medium text-slate-200">New File</div>
                        <div className="text-xs text-slate-500">Create a new file in the virtual drive</div>
                    </div>
                </button>

                <div className="flex items-center gap-3 w-full p-3 rounded-lg text-left bg-[#2a2d2e]/50 opacity-60 cursor-not-allowed border border-transparent">
                    <GitBranch className="w-5 h-5 text-slate-400" />
                    <div>
                        <div className="text-sm font-medium text-slate-200">Clone Repository</div>
                        <div className="text-xs text-slate-500">Connect to remote Git</div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">AGI Capabilities</h2>
                <div className="flex flex-col gap-1 p-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>Self-Correcting Error Loops</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>Autonomous Verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>LaTeX (.tex) & Scientific Docs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>Deep Architecture Planning</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-[#0c0c0e]/50 rounded-xl p-6 border border-white/5">
            <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2"><Command className="w-4 h-4" /> Command Palette</span>
                    <span className="text-slate-500 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">F1</span>
                </div>
                <div className="flex items-center justify-between">
                     <span className="text-slate-400 flex items-center gap-2"><Search className="w-4 h-4" /> Quick Open</span>
                     <span className="text-slate-500 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">Ctrl + P</span>
                </div>
                <div className="flex items-center justify-between">
                     <span className="text-slate-400 flex items-center gap-2"><Terminal className="w-4 h-4" /> Toggle Terminal</span>
                     <span className="text-slate-500 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">Ctrl + `</span>
                </div>
                <div className="flex items-center justify-between">
                     <span className="text-slate-400 flex items-center gap-2"><Keyboard className="w-4 h-4" /> Save File</span>
                     <span className="text-slate-500 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">Ctrl + S</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
