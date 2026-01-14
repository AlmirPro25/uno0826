/**
 * NOVA Sync Service
 * 
 * Este serviço permite sincronizar dados do app NOVA (Personal Trainer AI)
 * com o backend do MediSync, integrando dados de fitness ao Health Intelligence Core.
 * 
 * Uso:
 * 1. No NOVA, importe este serviço
 * 2. Configure o token de autenticação do MediSync
 * 3. Chame syncToMediSync() periodicamente ou em eventos importantes
 */

import { syncFromNOVA, NOVASyncData } from '@/api/fitness';

// Tipos do NOVA (espelhados do types.ts do NOVA)
interface NOVAUserProfile {
  name: string;
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  height: number;
  weight: number;
  age: number;
  level: number;
}

interface NOVADailyStats {
  date: string;
  caloriesBurned: number;
  caloriesConsumed: number;
  workoutDurationMinutes: number;
  mood: 'energetic' | 'tired' | 'neutral';
}

interface NOVAAnalysisResult {
  id: string;
  type: 'food' | 'body';
  timestamp: string;
  summary: string;
  metrics: { label: string; value: string | number; unit?: string }[];
  estimatedCalories?: number;
  recommendation: string;
  disclaimer: string;
}

interface NOVAWeeklyPlan {
  id: string;
  createdAt: string;
  title: string;
  days: {
    day: string;
    focus: string;
    workout: string;
    nutritionFocus: string;
    duration: number;
  }[];
}

interface NOVAState {
  userProfile: NOVAUserProfile;
  stats: NOVADailyStats[];
  history: NOVAAnalysisResult[];
  activePlan: NOVAWeeklyPlan | null;
}

const NOVA_STORAGE_KEY = 'NOVA_SYSTEM_STATE_V1';

/**
 * Carrega o estado atual do NOVA do localStorage
 */
export function loadNOVAState(): NOVAState | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem(NOVA_STORAGE_KEY);
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Converte dados do NOVA para o formato do MediSync
 */
export function convertNOVAToMediSync(novaState: NOVAState): NOVASyncData {
  const syncData: NOVASyncData = {};

  // Converter perfil
  if (novaState.userProfile) {
    syncData.profile = {
      goal: novaState.userProfile.goal,
      height_cm: novaState.userProfile.height,
      weight_kg: novaState.userProfile.weight,
      age: novaState.userProfile.age,
      level: novaState.userProfile.level
    };
  }

  // Converter stats diários
  if (novaState.stats && novaState.stats.length > 0) {
    syncData.daily_stats = novaState.stats.map(stat => ({
      date: stat.date === 'Hoje' ? new Date().toISOString() : stat.date,
      calories_burned: stat.caloriesBurned,
      calories_consumed: stat.caloriesConsumed,
      calories_net: stat.caloriesConsumed - stat.caloriesBurned,
      workout_duration_minutes: stat.workoutDurationMinutes,
      workout_count: stat.workoutDurationMinutes > 0 ? 1 : 0,
      steps: 0,
      active_minutes: stat.workoutDurationMinutes,
      mood: stat.mood,
      source: 'nova'
    }));
  }

  // Converter análises de comida para nutrition logs
  if (novaState.history && novaState.history.length > 0) {
    const foodAnalyses = novaState.history.filter(h => h.type === 'food');
    syncData.nutrition_logs = foodAnalyses.map(analysis => {
      // Extrair macros dos metrics
      const getMetricValue = (label: string): number => {
        const metric = analysis.metrics.find(m => m.label.toLowerCase().includes(label.toLowerCase()));
        if (!metric) return 0;
        const value = typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0;
        return value;
      };

      return {
        date: analysis.timestamp,
        meal_type: 'snack' as const,
        food_description: analysis.summary,
        calories: analysis.estimatedCalories || 0,
        protein_g: getMetricValue('proteína') || getMetricValue('protein'),
        carbs_g: getMetricValue('carboidrato') || getMetricValue('carb'),
        fat_g: getMetricValue('gordura') || getMetricValue('fat'),
        fiber_g: getMetricValue('fibra') || getMetricValue('fiber'),
        sugar_g: getMetricValue('açúcar') || getMetricValue('sugar'),
        nutritional_quality: 'good' as const,
        ai_recommendation: analysis.recommendation,
        source: 'nova_ai'
      };
    });

    // Converter análises de corpo
    const bodyAnalyses = novaState.history.filter(h => h.type === 'body');
    syncData.body_analyses = bodyAnalyses.map(analysis => ({
      analysis_type: 'body_composition' as const,
      summary: analysis.summary,
      metrics: JSON.stringify(analysis.metrics),
      recommendation: analysis.recommendation,
      source: 'nova_ai'
    }));
  }

  // Converter plano semanal
  if (novaState.activePlan) {
    syncData.active_plan = {
      title: novaState.activePlan.title,
      start_date: novaState.activePlan.createdAt,
      end_date: new Date(new Date(novaState.activePlan.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      days: JSON.stringify(novaState.activePlan.days.map(day => ({
        day: day.day,
        focus: day.focus,
        workout: day.workout,
        nutrition_focus: day.nutritionFocus,
        duration: day.duration
      }))),
      generated_by: 'nova_ai'
    };
  }

  return syncData;
}

/**
 * Sincroniza dados do NOVA com o MediSync
 * Retorna true se a sincronização foi bem-sucedida
 */
export async function syncToMediSync(): Promise<boolean> {
  try {
    const novaState = loadNOVAState();
    if (!novaState) {
      console.log('NOVA: Nenhum dado para sincronizar');
      return false;
    }

    const syncData = convertNOVAToMediSync(novaState);
    await syncFromNOVA(syncData);
    
    console.log('NOVA: Dados sincronizados com MediSync');
    
    // Salvar timestamp da última sincronização
    localStorage.setItem('NOVA_LAST_SYNC', new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('NOVA: Erro ao sincronizar com MediSync:', error);
    return false;
  }
}

/**
 * Verifica se precisa sincronizar (última sync > 1 hora)
 */
export function needsSync(): boolean {
  const lastSync = localStorage.getItem('NOVA_LAST_SYNC');
  if (!lastSync) return true;
  
  const lastSyncTime = new Date(lastSync).getTime();
  const oneHour = 60 * 60 * 1000;
  
  return Date.now() - lastSyncTime > oneHour;
}

/**
 * Sincroniza automaticamente se necessário
 */
export async function autoSync(): Promise<void> {
  if (needsSync()) {
    await syncToMediSync();
  }
}

/**
 * Registra um treino e sincroniza
 */
export async function logWorkoutAndSync(workout: {
  durationMinutes: number;
  caloriesBurned: number;
  type: string;
  focus: string;
  intensity: 'low' | 'moderate' | 'high';
  heartRate?: { avg: number; max: number; min: number };
}): Promise<boolean> {
  try {
    const syncData: NOVASyncData = {
      workout_sessions: [{
        date: new Date().toISOString(),
        duration_minutes: workout.durationMinutes,
        calories_burned: workout.caloriesBurned,
        workout_type: workout.type,
        focus: workout.focus,
        intensity: workout.intensity,
        avg_heart_rate: workout.heartRate?.avg,
        max_heart_rate: workout.heartRate?.max,
        min_heart_rate: workout.heartRate?.min,
        source: 'nova'
      }]
    };

    await syncFromNOVA(syncData);
    return true;
  } catch (error) {
    console.error('NOVA: Erro ao registrar treino:', error);
    return false;
  }
}

/**
 * Registra leitura de frequência cardíaca
 */
export async function logHeartRate(bpm: number, sessionId?: number): Promise<boolean> {
  try {
    const { recordHeartRate } = await import('@/api/fitness');
    await recordHeartRate({
      bpm,
      session_id: sessionId,
      source: 'bluetooth'
    });
    return true;
  } catch (error) {
    console.error('NOVA: Erro ao registrar frequência cardíaca:', error);
    return false;
  }
}

export default {
  loadNOVAState,
  convertNOVAToMediSync,
  syncToMediSync,
  needsSync,
  autoSync,
  logWorkoutAndSync,
  logHeartRate
};
