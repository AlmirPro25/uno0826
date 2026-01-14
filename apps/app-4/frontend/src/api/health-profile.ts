import { axiosInstance } from './axios';

// Types
export interface HealthProfile {
  id: number;
  user_id: number;
  full_name: string;
  birth_date?: string;
  gender?: string;
  blood_type?: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  body_fat_percent?: number;
  last_weight_date?: string;
  overall_score: number;
  sleep_score: number;
  nutrition_score: number;
  activity_score: number;
  hydration_score: number;
  mental_score: number;
  water_target_ml: number;
  steps_target: number;
  sleep_target_hours: number;
  calories_target: number;
  chronic_conditions: string;
  allergies: string;
  family_history: string;
  surgeries: string;
  smoking_status: string;
  alcohol_use: string;
  exercise_level: string;
  diet_type: string;
  health_goals: string;
  last_triage_id?: number;
  last_triage_date?: string;
  profile_completeness: number;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckIn {
  id: number;
  user_id: number;
  date: string;
  sleep_hours: number;
  sleep_quality: number;
  woke_up_time: string;
  bed_time: string;
  steps: number;
  active_minutes: number;
  exercise_type?: string;
  calories_burned: number;
  calories_consumed: number;
  water_ml: number;
  meals_count: number;
  meals_log: string;
  weight_kg?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  heart_rate?: number;
  blood_glucose?: number;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  symptoms: string;
  notes: string;
  ai_insights: string;
  ai_recommendations: string;
  risk_flags: string;
  source: string;
  created_at: string;
}

export interface HealthMetric {
  id: number;
  user_id: number;
  type: string;
  value: number;
  unit: string;
  date: string;
  source: string;
  created_at: string;
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  dosage: string;
  frequency: string;
  times: string;
  start_date: string;
  end_date?: string;
  instructions: string;
  prescribed_by?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: number;
  medication_id: number;
  user_id: number;
  taken_at: string;
  scheduled_for: string;
  status: string;
  notes?: string;
}

export interface Vaccine {
  id: number;
  user_id: number;
  name: string;
  manufacturer?: string;
  batch?: string;
  dose_number: number;
  total_doses: number;
  applied_at: string;
  next_dose_at?: string;
  location?: string;
  applied_by?: string;
  notes?: string;
  created_at: string;
}

export interface Exam {
  id: number;
  user_id: number;
  name: string;
  type: string;
  requested_by?: number;
  requested_at?: string;
  scheduled_at?: string;
  completed_at?: string;
  result_url?: string;
  results?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthGoal {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  progress: number;
  set_by: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: number;
  user_id: number;
  type: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  points: number;
}

export interface HealthSummary {
  profile: HealthProfile;
  todayCheckIn?: DailyCheckIn;
  healthScore: number;
  healthTrend: 'up' | 'down' | 'stable';
  sleepScore: number;
  hydrationScore: number;
  activityScore: number;
  nutritionScore: number;
  mentalScore: number;
  pendingMedications: number;
  pendingExams: number;
  overdueVaccines: number;
  activeGoals: number;
  achievements: number;
  profileCompleteness: number;
  alerts: { type: string; message: string }[];
}


// API Functions

// Profile
export async function getMyProfile(): Promise<HealthProfile> {
  const response = await axiosInstance.get('/health-profile/me');
  return response.data;
}

export async function updateMyProfile(profile: Partial<HealthProfile>): Promise<HealthProfile> {
  const response = await axiosInstance.put('/health-profile/me', profile);
  return response.data;
}

export async function getHealthSummary(): Promise<HealthSummary> {
  const response = await axiosInstance.get('/health-profile/summary');
  return response.data;
}

export async function updateProfileFromTriage(triageId: number): Promise<void> {
  await axiosInstance.post(`/health-profile/from-triage/${triageId}`);
}

// Daily Check-ins
export async function createDailyCheckIn(checkIn: Partial<DailyCheckIn>): Promise<DailyCheckIn> {
  const response = await axiosInstance.post('/health-profile/check-in', checkIn);
  return response.data;
}

export async function getTodayCheckIn(): Promise<DailyCheckIn | null> {
  try {
    const response = await axiosInstance.get('/health-profile/check-in/today');
    return response.data;
  } catch {
    return null;
  }
}

export async function getCheckInHistory(days: number = 30): Promise<DailyCheckIn[]> {
  const response = await axiosInstance.get(`/health-profile/check-in/history?days=${days}`);
  return response.data || [];
}

export async function processAIChatCheckIn(message: string): Promise<DailyCheckIn> {
  const response = await axiosInstance.post('/health-profile/check-in/ai', { message });
  return response.data;
}

// Metrics
export async function recordMetric(metric: Partial<HealthMetric>): Promise<HealthMetric> {
  const response = await axiosInstance.post('/health-profile/metrics', metric);
  return response.data;
}

export async function getMetrics(type?: string, days: number = 30): Promise<HealthMetric[]> {
  const params = new URLSearchParams({ days: days.toString() });
  if (type) params.append('type', type);
  const response = await axiosInstance.get(`/health-profile/metrics?${params}`);
  return response.data || [];
}

// Medications
export async function getMedications(): Promise<Medication[]> {
  const response = await axiosInstance.get('/health-profile/medications');
  return response.data || [];
}

export async function createMedication(medication: Partial<Medication>): Promise<Medication> {
  const response = await axiosInstance.post('/health-profile/medications', medication);
  return response.data;
}

export async function logMedication(log: Partial<MedicationLog>): Promise<MedicationLog> {
  const response = await axiosInstance.post('/health-profile/medications/log', log);
  return response.data;
}

// Vaccines
export async function getVaccines(): Promise<Vaccine[]> {
  const response = await axiosInstance.get('/health-profile/vaccines');
  return response.data || [];
}

export async function createVaccine(vaccine: Partial<Vaccine>): Promise<Vaccine> {
  const response = await axiosInstance.post('/health-profile/vaccines', vaccine);
  return response.data;
}

// Exams
export async function getExams(): Promise<Exam[]> {
  const response = await axiosInstance.get('/health-profile/exams');
  return response.data || [];
}

export async function createExam(exam: Partial<Exam>): Promise<Exam> {
  const response = await axiosInstance.post('/health-profile/exams', exam);
  return response.data;
}

// Goals
export async function getHealthGoals(): Promise<HealthGoal[]> {
  const response = await axiosInstance.get('/health-profile/goals');
  return response.data || [];
}

export async function createHealthGoal(goal: Partial<HealthGoal>): Promise<HealthGoal> {
  const response = await axiosInstance.post('/health-profile/goals', goal);
  return response.data;
}

export async function updateHealthGoal(id: number, goal: Partial<HealthGoal>): Promise<HealthGoal> {
  const response = await axiosInstance.put(`/health-profile/goals/${id}`, goal);
  return response.data;
}

// Achievements
export async function getAchievements(): Promise<Achievement[]> {
  const response = await axiosInstance.get('/health-profile/achievements');
  return response.data || [];
}

// Helper functions
export function parseJsonArray(jsonString: string): string[] {
  if (!jsonString || jsonString === '[]') return [];
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-teal-500';
  if (score >= 60) return 'from-yellow-500 to-amber-500';
  if (score >= 40) return 'from-orange-500 to-red-400';
  return 'from-red-500 to-rose-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Precisa melhorar';
}
