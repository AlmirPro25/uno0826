import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DailyStats, UserProfile, AnalysisResult, WeeklyPlan, AppView } from '../types';
import { connectHeartRateMonitor, connectRunningSensor, RunningMetrics } from '../services/bluetoothService';

interface AppContextType {
  userProfile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  stats: DailyStats[];
  todayStats: DailyStats;
  history: AnalysisResult[];
  activePlan: WeeklyPlan | null;
  currentView: AppView;

  // Telemetry
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
  
  // Audio Feedback
  playSound: (type: 'click' | 'success' | 'on' | 'off' | 'error') => void;
}

const STORAGE_KEY = 'NOVA_SYSTEM_STATE_V1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Viajante',
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage if available, else defaults
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).userProfile : DEFAULT_PROFILE;
  });
  
  const [stats, setStats] = useState<DailyStats[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).stats : INITIAL_STATS;
  });

  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).history : [];
  });

  const [activePlan, setActivePlan] = useState<WeeklyPlan | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).activePlan : null;
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Telemetry State (Not persisted)
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [runCadence, setRunCadence] = useState<number | null>(null);
  const [runSpeed, setRunSpeed] = useState<number | null>(null);
  
  const [isHeartDeviceConnected, setIsHeartDeviceConnected] = useState(false);
  const [isRunDeviceConnected, setIsRunDeviceConnected] = useState(false);
  
  const heartDeviceRef = useRef<BluetoothDevice | null>(null);
  const runDeviceRef = useRef<BluetoothDevice | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null); // For UI sounds

  // Persistence Effect
  useEffect(() => {
    const stateToSave = {
      userProfile,
      stats,
      history,
      activePlan
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [userProfile, stats, history, activePlan]);

  // Helper to get today's date key
  const todayKey = 'Hoje';

  const todayStats = stats.find(s => s.date === todayKey) || {
    date: todayKey,
    caloriesBurned: 0,
    caloriesConsumed: 0,
    workoutDurationMinutes: 0,
    mood: 'neutral'
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

  // --- Heart Rate Connection ---
  const connectHeartDevice = async () => {
    if (!navigator.bluetooth) {
      alert("Seu navegador não suporta Web Bluetooth.");
      return;
    }
    try {
      const device = await connectHeartRateMonitor(
        (bpm) => setHeartRate(bpm),
        () => {
          setIsHeartDeviceConnected(false);
          setHeartRate(null);
        }
      );
      heartDeviceRef.current = device;
      setIsHeartDeviceConnected(true);
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  const disconnectHeartDevice = () => {
    if (heartDeviceRef.current && heartDeviceRef.current.gatt?.connected) {
      heartDeviceRef.current.gatt.disconnect();
    }
    setIsHeartDeviceConnected(false);
    setHeartRate(null);
  };

  // --- Run Sensor Connection ---
  const connectRunDevice = async () => {
    if (!navigator.bluetooth) {
      alert("Seu navegador não suporta Web Bluetooth.");
      return;
    }
    try {
      const device = await connectRunningSensor(
        (metrics: RunningMetrics) => {
            setRunSpeed(metrics.speed);
            setRunCadence(metrics.cadence);
        },
        () => {
          setIsRunDeviceConnected(false);
          setRunSpeed(null);
          setRunCadence(null);
        }
      );
      runDeviceRef.current = device;
      setIsRunDeviceConnected(true);
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  const disconnectRunDevice = () => {
    if (runDeviceRef.current && runDeviceRef.current.gatt?.connected) {
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

  const clearHistory = () => {
    setHistory([]);
  };

  const savePlan = (plan: WeeklyPlan) => {
    setActivePlan(plan);
  };

  const navigate = (view: AppView) => {
    setCurrentView(view);
  };

  // --- Audio Feedback System ---
  const playSound = (type: 'click' | 'success' | 'on' | 'off' | 'error') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        switch(type) {
            case 'click':
                // High-tech blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'success':
                // Ascending major chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
             case 'on':
                // Power up
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.linearRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'off':
                // Power down
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.linearRampToValueAtTime(440, now + 0.1);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'error':
                // Low buzz
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.15);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
        }

    } catch (e) {
        // Ignore audio errors gracefully
    }
  };

  return (
    <AppContext.Provider value={{ 
      userProfile, 
      updateProfile, 
      stats, 
      todayStats,
      history,
      activePlan,
      currentView,
      
      heartRate,
      runCadence,
      runSpeed,
      isHeartDeviceConnected,
      isRunDeviceConnected,
      connectHeartDevice,
      disconnectHeartDevice,
      connectRunDevice,
      disconnectRunDevice,

      logCaloriesConsumed, 
      logWorkout,
      addAnalysis,
      clearHistory,
      savePlan,
      navigate,
      playSound
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};