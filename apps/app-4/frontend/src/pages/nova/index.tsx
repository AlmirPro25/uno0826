/**
 * NOVA Personal Trainer AI - Integrado ao MediSync
 * 
 * Este módulo embeda o aplicativo NOVA original, adaptando-o para funcionar
 * dentro do ecossistema MediSync com autenticação e sincronização de dados.
 */

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { 
  LayoutDashboard, Video, Search, Activity, Menu, X, BrainCircuit, 
  History, UserCog, CalendarRange, MessageSquareText, Bluetooth,
  ArrowLeft
} from 'lucide-react';

// ============ TYPES ============
interface UserProfile {
  name: string;
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  height: number;
  weight: number;
  age: number;
  level: number;
}

interface DailyStats {
  date: string;
  caloriesBurned: number;
  caloriesConsumed: number;
  workoutDurationMinutes: number;
  mood: 'energetic' | 'tired' | 'neutral';
}

interface AnalysisResult {
  id: string;
  type: 'food' | 'body';
  timestamp: string;
  summary: string;
  metrics: { label: string; value: string | number; unit?: string }[];
  estimatedCalories?: number;
  recommendation: string;
  disclaimer: string;
}

interface DailyPlan {
  day: string;
  focus: string;
  workout: string;
  nutritionFocus: string;
  duration: number;
}

interface WeeklyPlan {
  id: string;
  createdAt: string;
  title: string;
  days: DailyPlan[];
}

enum AppView {
  DASHBOARD = 'DASHBOARD',
  LIVE_SESSION = 'LIVE_SESSION',
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE',
  PLANNER = 'PLANNER',
  CHAT = 'CHAT',
  DEVICES = 'DEVICES'
}

// ============ CONTEXT ============
interface NovaContextType {
  userProfile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  stats: DailyStats[];
  todayStats: DailyStats;
  history: AnalysisResult[];
  activePlan: WeeklyPlan | null;
  currentView: AppView;
  heartRate: number | null;
  runCadence: number | null;
  runSpeed: number | null;
  isHeartDeviceConnected: boolean;
  isRunDeviceConnected: boolean;
  connectHeartDevice: () => Promise<void>;
  disconnectHeartDevice: () => void;
  connectRunDevice: () => Promise<void>;
  disconnectRunDevice: () => void;
  logCaloriesConsumed: (calories: number) => void;
  logWorkout: (minutes: number, caloriesBurned: number) => void;
  addAnalysis: (analysis: Omit<AnalysisResult, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  savePlan: (plan: WeeklyPlan) => void;
  navigate: (view: AppView) => void;
  playSound: (type: 'click' | 'success' | 'on' | 'off' | 'error') => void;
}

const NovaContext = createContext<NovaContextType | undefined>(undefined);

const STORAGE_KEY = 'NOVA_MEDISYNC_STATE_V1';

// ============ PROVIDER ============
function NovaProvider({ children, userName }: { children: React.ReactNode; userName: string }) {
  const DEFAULT_PROFILE: UserProfile = {
    name: userName || 'Usuário',
    goal: 'maintenance',
    height: 175,
    weight: 70,
    age: 30,
    level: 1
  };

  const INITIAL_STATS: DailyStats[] = [
    { date: 'Seg', caloriesBurned: 320, caloriesConsumed: 2100, workoutDurationMinutes: 45, mood: 'energetic' },
    { date: 'Ter', caloriesBurned: 450, caloriesConsumed: 2300, workoutDurationMinutes: 60, mood: 'tired' },
    { date: 'Qua', caloriesBurned: 280, caloriesConsumed: 1900, workoutDurationMinutes: 30, mood: 'neutral' },
    { date: 'Qui', caloriesBurned: 500, caloriesConsumed: 2400, workoutDurationMinutes: 65, mood: 'energetic' },
    { date: 'Sex', caloriesBurned: 410, caloriesConsumed: 2200, workoutDurationMinutes: 50, mood: 'energetic' },
  ];

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).userProfile : { ...DEFAULT_PROFILE, name: userName };
    }
    return { ...DEFAULT_PROFILE, name: userName };
  });

  const [stats, setStats] = useState<DailyStats[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).stats : INITIAL_STATS;
    }
    return INITIAL_STATS;
  });

  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).history : [];
    }
    return [];
  });

  const [activePlan, setActivePlan] = useState<WeeklyPlan | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).activePlan : null;
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [runCadence, setRunCadence] = useState<number | null>(null);
  const [runSpeed, setRunSpeed] = useState<number | null>(null);
  const [isHeartDeviceConnected, setIsHeartDeviceConnected] = useState(false);
  const [isRunDeviceConnected, setIsRunDeviceConnected] = useState(false);

  const heartDeviceRef = useRef<BluetoothDevice | null>(null);
  const runDeviceRef = useRef<BluetoothDevice | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Persistence
  useEffect(() => {
    const stateToSave = { userProfile, stats, history, activePlan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [userProfile, stats, history, activePlan]);

  const todayKey = 'Hoje';
  const todayStats = stats.find(s => s.date === todayKey) || {
    date: todayKey,
    caloriesBurned: 0,
    caloriesConsumed: 0,
    workoutDurationMinutes: 0,
    mood: 'neutral' as const
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const updateTodayStats = (updater: (current: DailyStats) => DailyStats) => {
    setStats(prev => {
      const exists = prev.find(s => s.date === todayKey);
      if (exists) {
        return prev.map(s => s.date === todayKey ? updater(s) : s);
      } else {
        return [...prev, updater({
          date: todayKey,
          caloriesBurned: 0,
          caloriesConsumed: 0,
          workoutDurationMinutes: 0,
          mood: 'neutral'
        })];
      }
    });
  };

  // Bluetooth Heart Rate
  const connectHeartDevice = async () => {
    if (!navigator.bluetooth) {
      alert("Seu navegador não suporta Web Bluetooth.");
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['heart_rate']
      });
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('heart_rate');
      const characteristic = await service?.getCharacteristic('heart_rate_measurement');
      
      await characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        const heartRateValue = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        setHeartRate(heartRateValue);
      });

      device.addEventListener('gattserverdisconnected', () => {
        setIsHeartDeviceConnected(false);
        setHeartRate(null);
      });

      heartDeviceRef.current = device;
      setIsHeartDeviceConnected(true);
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  const disconnectHeartDevice = () => {
    if (heartDeviceRef.current?.gatt?.connected) {
      heartDeviceRef.current.gatt.disconnect();
    }
    setIsHeartDeviceConnected(false);
    setHeartRate(null);
  };

  const connectRunDevice = async () => {
    if (!navigator.bluetooth) {
      alert("Seu navegador não suporta Web Bluetooth.");
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['running_speed_and_cadence'] }]
      });
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('running_speed_and_cadence');
      const characteristic = await service?.getCharacteristic('rsc_measurement');
      
      await characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const speed = value.getUint16(1, true) / 256;
        const cadence = value.getUint8(3);
        setRunSpeed(speed);
        setRunCadence(cadence);
      });

      device.addEventListener('gattserverdisconnected', () => {
        setIsRunDeviceConnected(false);
        setRunSpeed(null);
        setRunCadence(null);
      });

      runDeviceRef.current = device;
      setIsRunDeviceConnected(true);
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  const disconnectRunDevice = () => {
    if (runDeviceRef.current?.gatt?.connected) {
      runDeviceRef.current.gatt.disconnect();
    }
    setIsRunDeviceConnected(false);
    setRunSpeed(null);
    setRunCadence(null);
  };

  const logCaloriesConsumed = (calories: number) => {
    updateTodayStats(s => ({ ...s, caloriesConsumed: s.caloriesConsumed + calories }));
  };

  const logWorkout = (minutes: number, caloriesBurned: number) => {
    updateTodayStats(s => ({
      ...s,
      workoutDurationMinutes: s.workoutDurationMinutes + minutes,
      caloriesBurned: s.caloriesBurned + caloriesBurned
    }));
    if ((userProfile.level * 100) < (stats.reduce((acc, s) => acc + s.workoutDurationMinutes, 0) + minutes)) {
      updateProfile({ level: userProfile.level + 1 });
    }
  };

  const addAnalysis = (analysis: Omit<AnalysisResult, 'id' | 'timestamp'>) => {
    const newEntry: AnalysisResult = {
      ...analysis,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  const clearHistory = () => setHistory([]);
  const savePlan = (plan: WeeklyPlan) => setActivePlan(plan);
  const navigate = (view: AppView) => setCurrentView(view);

  const playSound = (type: 'click' | 'success' | 'on' | 'off' | 'error') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      switch (type) {
        case 'click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        case 'success':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.1);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        case 'on':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'off':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.linearRampToValueAtTime(440, now + 0.1);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'error':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.15);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
      }
    } catch (e) { /* ignore */ }
  };

  return (
    <NovaContext.Provider value={{
      userProfile, updateProfile, stats, todayStats, history, activePlan, currentView,
      heartRate, runCadence, runSpeed, isHeartDeviceConnected, isRunDeviceConnected,
      connectHeartDevice, disconnectHeartDevice, connectRunDevice, disconnectRunDevice,
      logCaloriesConsumed, logWorkout, addAnalysis, clearHistory, savePlan, navigate, playSound
    }}>
      {children}
    </NovaContext.Provider>
  );
}

function useNovaContext() {
  const context = useContext(NovaContext);
  if (!context) throw new Error("useNovaContext must be used within NovaProvider");
  return context;
}

// ============ COMPONENTS ============

// Dashboard Component
function NovaDashboard() {
  const { stats, todayStats, userProfile, activePlan, navigate, playSound } = useNovaContext();
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

      {activePlan && (
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
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
              onClick={() => { playSound('click'); navigate(AppView.LIVE_SESSION); }}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg"
            >
              <Video size={18} />
              Iniciar Treino
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="🔥" label="Queimadas" value={todayStats.caloriesBurned} unit="kcal" color="orange" />
        <StatCard icon="🍽️" label="Consumidas" value={todayStats.caloriesConsumed} unit="kcal" color="purple" />
        <StatCard icon="⏱️" label="Tempo Ativo" value={todayStats.workoutDurationMinutes} unit="min" color="blue" />
        <StatCard icon="⚡" label="Status" value={todayStats.workoutDurationMinutes > 30 ? 'Ativo' : 'Repouso'} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📊 Balanço Calórico (Semana)
          </h3>
          <div className="space-y-3">
            {stats.map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-10 text-xs text-slate-400">{day.date}</span>
                <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                    style={{ width: `${Math.min((day.caloriesBurned / 500) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-16 text-right">{day.caloriesBurned} kcal</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🏃 Consistência de Treino
          </h3>
          <div className="space-y-3">
            {stats.map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-10 text-xs text-slate-400">{day.date}</span>
                <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.min((day.workoutDurationMinutes / 60) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-16 text-right">{day.workoutDurationMinutes} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }: { icon: string; label: string; value: string | number; unit?: string; color: string }) {
  const colorClasses: Record<string, string> = {
    orange: 'bg-orange-500/20 text-orange-400',
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400'
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <h3 className="text-2xl font-bold">
            {value} {unit && <span className="text-sm font-normal text-slate-500">{unit}</span>}
          </h3>
        </div>
      </div>
    </div>
  );
}

// Live Session Placeholder (Full implementation would include Gemini Live)
function LiveSession() {
  const { userProfile, heartRate, isHeartDeviceConnected, connectHeartDevice, disconnectHeartDevice, playSound, logWorkout } = useNovaContext();
  const [active, setActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = () => {
    playSound('on');
    setActive(true);
    timerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  };

  const stopSession = () => {
    playSound('off');
    setActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const minutes = Math.ceil(sessionDuration / 60);
    const calories = Math.floor(minutes * (heartRate ? heartRate * 0.08 : 7));
    if (minutes > 0) {
      logWorkout(minutes, calories);
    }
    setSessionDuration(0);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-black relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${active ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-mono text-xs text-white/80 uppercase">
            {active ? `AO VIVO • REC` : 'OFFLINE'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={isHeartDeviceConnected ? disconnectHeartDevice : connectHeartDevice}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
              isHeartDeviceConnected 
                ? 'bg-red-900/80 border-red-500 text-white' 
                : 'bg-slate-800/80 border-slate-600 text-slate-400'
            }`}
          >
            {isHeartDeviceConnected ? `${heartRate || '--'} BPM` : 'Conectar Sensor'}
          </button>
          
          {active && (
            <div className="bg-red-900/50 border border-red-500/30 px-3 py-1 rounded-full text-white font-mono text-sm">
              {formatTime(sessionDuration)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center max-w-md p-6">
          <h3 className="text-2xl font-bold text-white mb-2">Coach Nova</h3>
          <p className="text-slate-300 mb-6">Olá, {userProfile.name}.</p>
          
          <div className="text-sm bg-blue-900/30 border border-blue-500/20 p-4 rounded-lg mb-6 text-blue-200">
            <p className="font-bold mb-2">🎯 Treino Neural</p>
            <p className="text-xs">
              Para usar o Gemini Live com vídeo e áudio em tempo real, 
              configure sua API Key do Gemini nas variáveis de ambiente.
            </p>
          </div>

          <p className="text-xs text-slate-500 border border-slate-700 p-2 rounded">
            ⚠️ AVISO: O sistema oferece orientações gerais de bem-estar.
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
        <div className="flex justify-center items-center gap-6">
          {!active ? (
            <button
              onClick={startSession}
              className="p-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Video size={32} />
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="p-6 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 transition-all"
            >
              <X size={32} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Device Hub
function DeviceHub() {
  const { 
    heartRate, runSpeed, runCadence,
    isHeartDeviceConnected, isRunDeviceConnected,
    connectHeartDevice, disconnectHeartDevice,
    connectRunDevice, disconnectRunDevice,
    playSound
  } = useNovaContext();

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Bluetooth className="text-blue-400" /> Hub de Sensores
        </h2>
        <p className="text-slate-400">Conecte seus dispositivos Bluetooth para telemetria em tempo real.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Heart Rate Monitor */}
        <div className={`p-6 rounded-2xl border ${isHeartDeviceConnected ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isHeartDeviceConnected ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Monitor Cardíaco</h3>
                <p className="text-xs text-slate-400">Bluetooth Heart Rate</p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isHeartDeviceConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
          </div>

          {isHeartDeviceConnected && heartRate && (
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-red-400">{heartRate}</p>
              <p className="text-slate-400">BPM</p>
            </div>
          )}

          <button
            onClick={() => {
              playSound('click');
              isHeartDeviceConnected ? disconnectHeartDevice() : connectHeartDevice();
            }}
            className={`w-full py-3 rounded-xl font-bold transition-colors ${
              isHeartDeviceConnected 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isHeartDeviceConnected ? 'Desconectar' : 'Conectar'}
          </button>
        </div>

        {/* Running Sensor */}
        <div className={`p-6 rounded-2xl border ${isRunDeviceConnected ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isRunDeviceConnected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Sensor de Corrida</h3>
                <p className="text-xs text-slate-400">Running Speed & Cadence</p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isRunDeviceConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
          </div>

          {isRunDeviceConnected && (
            <div className="flex justify-around py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{runSpeed?.toFixed(1) || '--'}</p>
                <p className="text-slate-400 text-sm">m/s</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{runCadence || '--'}</p>
                <p className="text-slate-400 text-sm">spm</p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              playSound('click');
              isRunDeviceConnected ? disconnectRunDevice() : connectRunDevice();
            }}
            className={`w-full py-3 rounded-xl font-bold transition-colors ${
              isRunDeviceConnected 
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isRunDeviceConnected ? 'Desconectar' : 'Conectar'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-center">
        <p className="text-sm text-slate-400">
          💡 Dica: Use Chrome ou Edge para melhor compatibilidade com Web Bluetooth.
        </p>
      </div>
    </div>
  );
}

// Profile Settings
function ProfileSettings() {
  const { userProfile, updateProfile, playSound } = useNovaContext();
  const [form, setForm] = useState(userProfile);

  const handleSave = () => {
    playSound('success');
    updateProfile(form);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <UserCog className="text-purple-400" /> Calibragem do Sistema
        </h2>
        <p className="text-slate-400">Configure seu perfil para recomendações personalizadas.</p>
      </header>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Idade</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Altura (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Objetivo</label>
          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weight_loss">Perda de Peso</option>
            <option value="muscle_gain">Ganho de Massa</option>
            <option value="maintenance">Manutenção</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

// History Log
function HistoryLog() {
  const { history, clearHistory, playSound } = useNovaContext();

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <History className="text-cyan-400" /> Memória Neural
          </h2>
          <p className="text-slate-400">Histórico de análises e sessões.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => { playSound('click'); clearHistory(); }}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Limpar Histórico
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <History size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhuma análise registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  item.type === 'food' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.type === 'food' ? '🍽️ Alimento' : '🏋️ Corpo'}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(item.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-white font-medium mb-2">{item.summary}</p>
              <p className="text-sm text-slate-400">{item.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Placeholder components
function Planner() {
  return (
    <div className="text-center py-12">
      <CalendarRange size={48} className="mx-auto mb-4 text-slate-500" />
      <h3 className="text-xl font-bold text-white mb-2">Neuro-Planner</h3>
      <p className="text-slate-400">Geração de planos semanais com IA em breve.</p>
    </div>
  );
}

function NeuralChat() {
  return (
    <div className="text-center py-12">
      <MessageSquareText size={48} className="mx-auto mb-4 text-slate-500" />
      <h3 className="text-xl font-bold text-white mb-2">Chat Tático</h3>
      <p className="text-slate-400">Chat multimodal com IA em breve.</p>
    </div>
  );
}

function AnalysisModule() {
  return (
    <div className="text-center py-12">
      <Search size={48} className="mx-auto mb-4 text-slate-500" />
      <h3 className="text-xl font-bold text-white mb-2">Bio Análise</h3>
      <p className="text-slate-400">Análise de imagens com IA em breve.</p>
    </div>
  );
}


// ============ MAIN APP ============
function NovaApp() {
  const { currentView, navigate, playSound } = useNovaContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const NavButton = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        playSound('click');
        navigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <button
          onClick={() => router.push('/paciente/fitness')}
          className="p-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">NOVA</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2 hidden lg:flex">
              <button
                onClick={() => router.push('/paciente/fitness')}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="bg-blue-600 p-2 rounded-lg">
                <BrainCircuit size={24} className="text-white" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">NOVA</span>
            </div>
            <p className="text-xs text-slate-500 mb-6 hidden lg:block">Personal Trainer AI</p>

            <nav className="space-y-2 flex-1">
              <NavButton view={AppView.DASHBOARD} icon={LayoutDashboard} label="Painel Principal" />
              <NavButton view={AppView.PLANNER} icon={CalendarRange} label="Neuro-Planner" />
              <NavButton view={AppView.LIVE_SESSION} icon={Video} label="Treino Neural" />
              <NavButton view={AppView.CHAT} icon={MessageSquareText} label="Chat Tático" />
              <NavButton view={AppView.ANALYSIS} icon={Search} label="Bio Análise" />
              
              <div className="my-4 border-t border-slate-800/50"></div>
              
              <NavButton view={AppView.DEVICES} icon={Bluetooth} label="Sensores" />
              <NavButton view={AppView.HISTORY} icon={History} label="Memória" />
              <NavButton view={AppView.PROFILE} icon={UserCog} label="Calibragem" />
            </nav>

            <div className="pt-8">
              <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-300">SISTEMA ONLINE</span>
                </div>
                <p className="text-[10px] text-slate-500">MediSync Integration</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative w-full">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full">
            {currentView === AppView.DASHBOARD && <NovaDashboard />}
            {currentView === AppView.PLANNER && <Planner />}
            {currentView === AppView.LIVE_SESSION && (
              <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)]">
                <LiveSession />
              </div>
            )}
            {currentView === AppView.CHAT && <NeuralChat />}
            {currentView === AppView.ANALYSIS && <AnalysisModule />}
            {currentView === AppView.DEVICES && <DeviceHub />}
            {currentView === AppView.HISTORY && <HistoryLog />}
            {currentView === AppView.PROFILE && <ProfileSettings />}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

// ============ PAGE EXPORT ============
export default function NovaPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>NOVA - Personal Trainer AI | MediSync</title>
        <meta name="description" content="NOVA - Seu Personal Trainer com Inteligência Artificial" />
      </Head>
      <NovaProvider userName={user?.fullName || 'Usuário'}>
        <NovaApp />
      </NovaProvider>
    </>
  );
}
