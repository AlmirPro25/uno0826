import React, { useState } from 'react';
import { PatientProfile, CognitiveManifesto } from '../types';
import { AgentFactory } from '../services/agentFactory';

interface IntakeTerminalProps {
  onInstantiate: (profile: PatientProfile, manifesto: CognitiveManifesto) => void;
  apiKey: string;
}

const IntakeTerminal: React.FC<IntakeTerminalProps> = ({ onInstantiate, apiKey }) => {
  const [profile, setProfile] = useState<PatientProfile>({
    name: '',
    age: '',
    gender: '',
    chiefComplaint: '',
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("INITIALIZING GENESIS PROTOCOL...");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    
    setIsCalculating(true);
    const factory = new AgentFactory(apiKey);

    try {
        setStatusMessage("ANALYZING SYMPTOMS & SEMANTICS...");
        // Artificial delay for UX "weight" - lets the user feel the processing
        await new Promise(r => setTimeout(r, 800)); 
        
        setStatusMessage("SELECTING CLINICAL SPECIALTY...");
        const manifesto = await factory.createManifesto(profile);
        
        setStatusMessage(`INSTANTIATING: ${manifesto.agentName.toUpperCase()}...`);
        await new Promise(r => setTimeout(r, 1000));

        onInstantiate(profile, manifesto);

    } catch (error) {
        setStatusMessage("ERROR: GENESIS FAILED.");
        console.error(error);
        setIsCalculating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/90 border border-cyan-800 p-8 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.1)] backdrop-blur-xl relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>

        <div className="relative z-10">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 tracking-[0.2em] border-b border-cyan-800 pb-2">
                PATIENT INTAKE PROTOCOL
            </h2>

            {!isCalculating ? (
                <form onSubmit={handleSubmit} className="space-y-6 font-mono">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-cyan-600 text-xs mb-1">PATIENT IDENTIFIER</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-slate-950 border border-slate-700 text-cyan-100 p-2 focus:border-cyan-500 outline-none"
                                value={profile.name}
                                onChange={e => setProfile({...profile, name: e.target.value})}
                                placeholder="Name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-cyan-600 text-xs mb-1">AGE</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-slate-950 border border-slate-700 text-cyan-100 p-2 focus:border-cyan-500 outline-none"
                                    value={profile.age}
                                    onChange={e => setProfile({...profile, age: e.target.value})}
                                    placeholder="00"
                                />
                             </div>
                             <div>
                                <label className="block text-cyan-600 text-xs mb-1">SEX</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 text-cyan-100 p-2 focus:border-cyan-500 outline-none"
                                    value={profile.gender}
                                    onChange={e => setProfile({...profile, gender: e.target.value})}
                                >
                                    <option value="">--</option>
                                    <option value="M">M</option>
                                    <option value="F">F</option>
                                    <option value="X">X</option>
                                </select>
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-cyan-600 text-xs mb-1">PRIMARY SYMPTOM / CHIEF COMPLAINT</label>
                        <textarea 
                            required
                            className="w-full bg-slate-950 border border-slate-700 text-cyan-100 p-2 focus:border-cyan-500 outline-none h-24"
                            value={profile.chiefComplaint}
                            onChange={e => setProfile({...profile, chiefComplaint: e.target.value})}
                            placeholder="Describe current symptoms (e.g., 'Sharp pain in left chest radiating to arm')..."
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={!apiKey}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-black font-bold py-3 px-8 rounded-sm tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        >
                            {apiKey ? 'INITIATE AGENT GENESIS' : 'API KEY REQUIRED'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-cyan-400 font-mono">
                    <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-800 border-l-transparent rounded-full animate-spin mb-6"></div>
                    <div className="animate-pulse tracking-widest text-lg">{statusMessage}</div>
                    
                    {/* Visual noise for 'thinking' */}
                    <div className="w-64 h-1 bg-slate-800 mt-4 overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-[shimmer_1s_infinite] w-1/2"></div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default IntakeTerminal;
