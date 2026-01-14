import { axiosInstance } from './axios';

// Types
export interface FitnessProfile {
  id: number;
  user_id: number;
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  height_cm: number;
  weight_kg: number;
  age: number;
  level: number;
  total_xp: number;
  daily_calories_burn_target: number;
  daily_calories_intake_target: number;
  weekly_workout_target: number;
  total_workouts: number;
  total_workout_minutes: number;
  total_calories_burned: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  current_streak: number;
  longest_streak: number;
  last_workout_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id?: number;
  user_id?: number;
  date: string;
  duration_minutes: number;
  calories_burned: number;
  workout_type: string;
  focus: string;
  intensity: 'low' | 'moderate' | 'high';
  avg_heart_rate?: number;
  max_heart_rate?: number;
  min_heart_rate?: number;
  distance_km?: number;
  avg_speed?: number;
  avg_cadence?: number;
  ai_feedback?: string;
  mood_before?: string;
  mood_after?: string;
  source: string;
  created_at?: string;
}

export interface DailyFitnessStats {
  id?: number;
  user_id?: number;
  date: string;
  calories_burned: number;
  calories_consumed: number;
  calories_net: number;
  workout_duration_minutes: number;
  workout_count: number;
  steps: number;
  active_minutes: number;
  mood: 'energetic' | 'tired' | 'neutral';
  source: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionLog {
  id?: number;
  user_id?: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_description: string;
  image_url?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  nutritional_quality: 'excellent' | 'good' | 'moderate' | 'poor';
  ai_recommendation?: string;
  source: string;
  created_at?: string;
}

export interface BodyAnalysis {
  id?: number;
  user_id?: number;
  analysis_type: 'posture' | 'body_composition';
  summary: string;
  metrics: string; // JSON
  recommendation: string;
  image_url?: string;
  source: string;
  created_at?: string;
}

export interface DailyPlanItem {
  day: string;
  focus: string;
  workout: string;
  nutrition_focus: string;
  duration: number;
}

export interface WeeklyFitnessPlan {
  id?: number;
  user_id?: number;
  title: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  days: string; // JSON array of DailyPlanItem
  generated_by: string;
  created_at?: string;
}

export interface FitnessAchievement {
  id: number;
  user_id: number;
  type: string;
  name: string;
  description: string;
  icon: string;
  xp_awarded: number;
  earned_at: string;
}

export interface HeartRateReading {
  id?: number;
  user_id?: number;
  session_id?: number;
  timestamp?: string;
  bpm: number;
  source: string;
}

export interface FitnessSummary {
  profile: FitnessProfile;
  todayStats?: DailyFitnessStats;
  weekStats: DailyFitnessStats[];
  weeklyCaloriesBurned: number;
  weeklyWorkoutMinutes: number;
  weeklyWorkouts: number;
  activePlan?: WeeklyFitnessPlan;
  recentWorkouts: WorkoutSession[];
  achievements: number;
  currentStreak: number;
  longestStreak: number;
}

// NOVA Sync Data (for syncing from NOVA app)
export interface NOVASyncData {
  profile?: {
    goal: string;
    height_cm: number;
    weight_kg: number;
    age: number;
    level: number;
  };
  daily_stats?: DailyFitnessStats[];
  workout_sessions?: WorkoutSession[];
  nutrition_logs?: NutritionLog[];
  body_analyses?: BodyAnalysis[];
  active_plan?: WeeklyFitnessPlan;
}

// API Functions

// Profile
export async function getFitnessProfile(): Promise<FitnessProfile> {
  const response = await axiosInstance.get('/fitness/profile');
  return response.data;
}

export async function updateFitnessProfile(profile: Partial<FitnessProfile>): Promise<FitnessProfile> {
  const response = await axiosInstance.put('/fitness/profile', profile);
  return response.data;
}

export async function getFitnessSummary(): Promise<FitnessSummary> {
  const response = await axiosInstance.get('/fitness/summary');
  return response.data;
}

// NOVA Sync
export async function syncFromNOVA(data: NOVASyncData): Promise<void> {
  await axiosInstance.post('/fitness/sync', data);
}

// Daily Stats
export async function getDailyStats(days: number = 7): Promise<DailyFitnessStats[]> {
  const response = await axiosInstance.get(`/fitness/stats?days=${days}`);
  return response.data || [];
}

export async function createDailyStats(stats: Partial<DailyFitnessStats>): Promise<DailyFitnessStats> {
  const response = await axiosInstance.post('/fitness/stats', stats);
  return response.data;
}

// Workout Sessions
export async function getWorkoutSessions(days: number = 30): Promise<WorkoutSession[]> {
  const response = await axiosInstance.get(`/fitness/workouts?days=${days}`);
  return response.data || [];
}

export async function createWorkoutSession(session: Partial<WorkoutSession>): Promise<WorkoutSession> {
  const response = await axiosInstance.post('/fitness/workouts', session);
  return response.data;
}

// Nutrition
export async function getNutritionLogs(days: number = 7): Promise<NutritionLog[]> {
  const response = await axiosInstance.get(`/fitness/nutrition?days=${days}`);
  return response.data || [];
}

export async function createNutritionLog(log: Partial<NutritionLog>): Promise<NutritionLog> {
  const response = await axiosInstance.post('/fitness/nutrition', log);
  return response.data;
}

// Body Analysis
export async function getBodyAnalyses(limit: number = 10): Promise<BodyAnalysis[]> {
  const response = await axiosInstance.get(`/fitness/body-analysis?limit=${limit}`);
  return response.data || [];
}

export async function createBodyAnalysis(analysis: Partial<BodyAnalysis>): Promise<BodyAnalysis> {
  const response = await axiosInstance.post('/fitness/body-analysis', analysis);
  return response.data;
}

// Weekly Plan
export async function getActivePlan(): Promise<WeeklyFitnessPlan | null> {
  try {
    const response = await axiosInstance.get('/fitness/plan');
    return response.data;
  } catch {
    return null;
  }
}

export async function saveWeeklyPlan(plan: Partial<WeeklyFitnessPlan>): Promise<WeeklyFitnessPlan> {
  const response = await axiosInstance.post('/fitness/plan', plan);
  return response.data;
}

// Heart Rate
export async function recordHeartRate(reading: Partial<HeartRateReading>): Promise<HeartRateReading> {
  const response = await axiosInstance.post('/fitness/heart-rate', reading);
  return response.data;
}

export async function getHeartRateHistory(hours: number = 24): Promise<HeartRateReading[]> {
  const response = await axiosInstance.get(`/fitness/heart-rate?hours=${hours}`);
  return response.data || [];
}

// Achievements
export async function getFitnessAchievements(): Promise<FitnessAchievement[]> {
  const response = await axiosInstance.get('/fitness/achievements');
  return response.data || [];
}

// Helper functions
export function parseWeeklyPlanDays(daysJSON: string): DailyPlanItem[] {
  if (!daysJSON) return [];
  try {
    return JSON.parse(daysJSON);
  } catch {
    return [];
  }
}

export function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    weight_loss: 'Perda de Peso',
    muscle_gain: 'Ganho de Massa',
    maintenance: 'Manutenção'
  };
  return labels[goal] || goal;
}

export function getMoodEmoji(mood: string): string {
  const emojis: Record<string, string> = {
    energetic: '⚡',
    tired: '😴',
    neutral: '😐'
  };
  return emojis[mood] || '😐';
}

export function getIntensityColor(intensity: string): string {
  const colors: Record<string, string> = {
    low: 'text-green-500',
    moderate: 'text-yellow-500',
    high: 'text-red-500'
  };
  return colors[intensity] || 'text-gray-500';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
