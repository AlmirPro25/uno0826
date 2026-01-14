import React, { useState } from 'react';
import { Calendar, Zap, Loader2, Sparkles, ChevronRight, Droplet, Dumbbell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { generateWeeklyPlan } from '../services/geminiService';
import { AppView } from '../types';

export const Planner: React.FC = () => {
  const { userProfile, activePlan, savePlan, navigate, playSound } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    playSound('click');
    setLoading(true);
    try {
      const newPlan = await generateWeeklyPlan(userProfile);
      savePlan(newPlan);
      playSound('success');
    } catch (e) {
      alert("Erro ao conectar com a Matrix de Planejamento.");
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  const startDay = () => {
    playSound('on');
    navigate(AppView.LIVE_SESSION);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Neuro-Planner
          </h2>
          <p className="text-slate-400">Geração de protocolos táticos semanais.</p>
        </div>
        
        {!activePlan && !loading && (
          <button 
            onClick={handleGenerate}
            className="group flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Sparkles size={18} className="group-hover:animate-spin" />
            Gerar Protocolo
          </button>
        )}
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white">Analisando Biometria...</h3>
          <p className="text-slate-400">O Gemini 2.5 Flash está construindo sua rotina ideal.</p>
        </div>
      )}

      {activePlan && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-xs text-emerald-400 font-mono mb-1 uppercase tracking-wider">Protocolo Ativo</p>
              <h3 className="text-2xl font-bold text-white">{activePlan.title}</h3>
              <p className="text-sm text-slate-400 mt-1">Personalizado para: {userProfile.name} • Objetivo: {userProfile.goal.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={() => { playSound('click'); handleGenerate(); }}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
              title="Regerar"
            >
              <Sparkles size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activePlan.days.map((day, idx) => (
              <div 
                key={idx} 
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/40 transition-all hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-emerald-400 font-bold text-lg">{day.day}</span>
                    <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">
                      {day.duration} min
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold mb-1">
                        <Dumbbell size={12} /> Foco do Treino
                      </div>
                      <p className="text-white font-medium text-sm leading-snug">{day.focus}</p>
                      <p className="text-slate-400 text-xs mt-1">{day.workout}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-700/50">
                       <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold mb-1">
                        <Droplet size={12} /> Nutrição
                      </div>
                      <p className="text-blue-200 text-sm font-medium">{day.nutritionFocus}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startDay}
                  className="w-full mt-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                >
                  Iniciar Dia <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!activePlan && !loading && (
        <div className="text-center py-20 opacity-50">
          <Calendar size={64} className="mx-auto text-slate-600 mb-4" />
          <p className="text-lg text-slate-400">Nenhum protocolo ativo.</p>
          <p className="text-sm text-slate-500">Clique em "Gerar Protocolo" para iniciar sua jornada.</p>
        </div>
      )}
    </div>
  );
};