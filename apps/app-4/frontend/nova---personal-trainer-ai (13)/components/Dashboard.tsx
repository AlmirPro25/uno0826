import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Activity, Flame, Timer, TrendingUp, Utensils, Calendar, ArrowRight, Dumbbell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppView } from '../types';

export const Dashboard: React.FC = () => {
  const { stats, todayStats, userProfile, activePlan, navigate } = useAppContext();

  // Determine current plan day (naive implementation)
  const todayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const todaysPlan = activePlan?.days.find(d => d.day.toLowerCase().includes(todayName.split('-')[0].toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Olá, {userProfile.name}
          </h2>
          <p className="text-slate-400">
            Foco atual: <span className="text-white font-medium capitalize">{userProfile.goal.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Balanço de Hoje</p>
          <p className={`text-2xl font-bold ${todayStats.caloriesConsumed > todayStats.caloriesBurned + 2000 ? 'text-orange-400' : 'text-emerald-400'}`}>
            {todayStats.caloriesConsumed} / {2000 + todayStats.caloriesBurned} <span className="text-sm text-slate-500">kcal</span>
          </p>
        </div>
      </header>

      {/* Active Protocol Widget */}
      {activePlan && (
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">PROTOCOLO ATIVO</span>
                 <span className="text-xs text-slate-400">{activePlan.title}</span>
               </div>
               <h3 className="text-xl font-bold text-white mb-1">
                 {todaysPlan ? `Hoje: ${todaysPlan.focus}` : "Descanso ou Livre"}
               </h3>
               <p className="text-slate-400 text-sm max-w-lg">
                 {todaysPlan ? todaysPlan.workout : "Consulte o Planner para detalhes da semana."}
               </p>
            </div>

            <button 
              onClick={() => navigate(AppView.LIVE_SESSION)}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg shadow-white/5"
            >
              <Dumbbell size={18} />
              Iniciar Treino
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={64} />
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/20 rounded-full text-orange-400">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Queimadas</p>
              <h3 className="text-2xl font-bold">{todayStats.caloriesBurned} <span className="text-sm font-normal text-slate-500">kcal</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Utensils size={64} />
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
              <Utensils size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Consumidas</p>
              <h3 className="text-2xl font-bold">{todayStats.caloriesConsumed} <span className="text-sm font-normal text-slate-500">kcal</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Timer size={64} />
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Tempo Ativo</p>
              <h3 className="text-2xl font-bold">{todayStats.workoutDurationMinutes} <span className="text-sm font-normal text-slate-500">min</span></h3>
            </div>
          </div>
        </div>
        
         <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} />
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <h3 className="text-2xl font-bold">{todayStats.workoutDurationMinutes > 30 ? 'Ativo' : 'Repouso'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 h-80">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400"/> Balanço Calórico (Semana)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                cursor={{ fill: '#334155', opacity: 0.2 }}
              />
              <Bar dataKey="caloriesConsumed" name="Ingeridas" fill="#a855f7" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="caloriesBurned" name="Queimadas" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 h-80">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Timer size={18} className="text-emerald-400"/> Consistência de Treino
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="colorWorkout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="workoutDurationMinutes" stroke="#10b981" fillOpacity={1} fill="url(#colorWorkout)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
