import React, { useState } from 'react';
import { User, Target, Save, Shield, Cpu, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const ProfileSettings: React.FC = () => {
  const { userProfile, updateProfile, playSound } = useAppContext();
  const [formData, setFormData] = useState(userProfile);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'height' || name === 'weight' || name === 'age' ? Number(value) : value
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    playSound('success');
    updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Basal Metabolic Rate Calculation (Mifflin-St Jeor Equation)
  const bmr = Math.round(10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex items-center gap-4">
        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
          <Cpu className="text-white" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Calibragem Neural</h2>
          <p className="text-slate-400">Ajuste os parâmetros biológicos para o algoritmo Nova.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-400" /> Identidade Biológica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nome de Operador</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Idade</label>
                <input 
                  type="number" 
                  name="age" 
                  value={formData.age} 
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Peso (kg)</label>
                <input 
                  type="number" 
                  name="weight" 
                  value={formData.weight} 
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Altura (cm)</label>
                <input 
                  type="number" 
                  name="height" 
                  value={formData.height} 
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
               <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Target size={14} /> Objetivo Primário
               </label>
               <div className="grid grid-cols-3 gap-3">
                 {[
                   { id: 'weight_loss', label: 'Perda de Peso' },
                   { id: 'muscle_gain', label: 'Hipertrofia' },
                   { id: 'maintenance', label: 'Manutenção' }
                 ].map((goal) => (
                   <button
                    key={goal.id}
                    onClick={() => { playSound('click'); setFormData(p => ({...p, goal: goal.id as any})); setIsSaved(false); }}
                    className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                      formData.goal === goal.id 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                   >
                     {goal.label}
                   </button>
                 ))}
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all ${
                  isSaved 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 cursor-default' 
                  : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
              >
                {isSaved ? 'Configuração Sincronizada' : 'Atualizar Sistema'}
                {isSaved ? <Shield size={18} /> : <Save size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/30 p-6 rounded-2xl">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-white font-semibold">Nível de Atleta</h3>
               <span className="bg-blue-500 text-xs font-bold px-2 py-1 rounded text-white">LVL {userProfile.level}</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
               <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
             </div>
             <p className="text-xs text-slate-400">450 XP para o próximo nível (Baseado em minutos de treino).</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
             <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
               <Activity size={18} className="text-emerald-400" /> Métricas Basais
             </h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                 <span className="text-slate-400 text-sm">Taxa Metabólica Basal</span>
                 <span className="text-white font-mono">{bmr} kcal/dia</span>
               </div>
               <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                 <span className="text-slate-400 text-sm">IMC Estimado</span>
                 <span className="text-white font-mono">{(formData.weight / ((formData.height/100) ** 2)).toFixed(1)}</span>
               </div>
               <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mt-4">
                 <p className="text-xs text-blue-200">
                   "Com base no seu perfil, o Gemini Live irá ajustar a intensidade dos comandos verbais para {formData.goal === 'muscle_gain' ? 'Alta Intensidade' : 'Queima Aeróbica'}."
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};