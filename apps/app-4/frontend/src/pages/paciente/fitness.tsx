import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  getFitnessSummary,
  getWorkoutSessions,
  getNutritionLogs,
  getActivePlan,
  parseWeeklyPlanDays,
  getMoodEmoji,
  formatDuration,
  FitnessSummary,
  WorkoutSession,
  NutritionLog,
  WeeklyFitnessPlan,
  DailyPlanItem
} from '@/api/fitness';
import {
  Activity,
  Flame,
  Heart,
  Trophy,
  Zap,
  Calendar,
  TrendingUp,
  Dumbbell,
  Apple,
  Play,
  Award,
  BarChart3
} from 'lucide-react';

export default function FitnessPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [authLoading, setAuthLoading] = useState(true);
  const [summary, setSummary] = useState<FitnessSummary | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
  const [plan, setPlan] = useState<WeeklyFitnessPlan | null>(null);
  const [planDays, setPlanDays] = useState<DailyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'nutrition' | 'plan'>('overview');

  useEffect(() => {
    setAuthLoading(false);
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, workoutsData, nutritionData, planData] = await Promise.all([
        getFitnessSummary(),
        getWorkoutSessions(30),
        getNutritionLogs(7),
        getActivePlan()
      ]);
      setSummary(summaryData);
      setWorkouts(workoutsData);
      setNutrition(nutritionData);
      setPlan(planData);
      if (planData?.days) {
        setPlanDays(parseWeeklyPlanDays(planData.days));
      }
    } catch (error) {
      console.error('Erro ao carregar dados fitness:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNOVA = () => {
    router.push('/nova');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const profile = summary?.profile;
  const todayStats = summary?.todayStats;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary-500" />
            Fitness & Bem-estar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe seus treinos, nutrição e progresso
          </p>
        </div>
        <button
          onClick={openNOVA}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
        >
          <Play className="w-5 h-5" />
          Abrir NOVA
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-6 h-6 text-orange-500" />}
          label="Calorias Queimadas"
          value={todayStats?.calories_burned || 0}
          unit="kcal"
          target={profile?.daily_calories_burn_target || 500}
          color="orange"
        />
        <StatCard
          icon={<Dumbbell className="w-6 h-6 text-blue-500" />}
          label="Treinos Semana"
          value={summary?.weeklyWorkouts || 0}
          target={profile?.weekly_workout_target || 5}
          color="blue"
        />
        <StatCard
          icon={<Zap className="w-6 h-6 text-yellow-500" />}
          label="Streak Atual"
          value={summary?.currentStreak || 0}
          unit="dias"
          color="yellow"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-purple-500" />}
          label="Nível"
          value={profile?.level || 1}
          subtitle={`${profile?.total_xp || 0} XP`}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'workouts', label: 'Treinos', icon: Dumbbell },
          { id: 'nutrition', label: 'Nutrição', icon: Apple },
          { id: 'plan', label: 'Plano Semanal', icon: Calendar }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Progresso Semanal
            </h3>
            <div className="space-y-4">
              {summary?.weekStats?.slice(0, 7).map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-gray-500">{new Date(stat.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                      style={{ width: `${Math.min((stat.calories_burned / (profile?.daily_calories_burn_target || 500)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">{stat.calories_burned} kcal</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Workouts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-500" />
              Treinos Recentes
            </h3>
            <div className="space-y-3">
              {workouts.slice(0, 5).map((workout, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{workout.focus}</p>
                      <p className="text-sm text-gray-500">{workout.workout_type} • {formatDuration(workout.duration_minutes)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-500">{workout.calories_burned} kcal</p>
                    <p className="text-xs text-gray-500">{new Date(workout.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
              {workouts.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum treino registrado</p>
              )}
            </div>
          </div>

          {/* Heart Rate */}
          {profile?.avg_heart_rate && profile.avg_heart_rate > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Frequência Cardíaca
              </h3>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{Math.round(profile.avg_heart_rate)}</p>
                  <p className="text-sm text-gray-500">Média (bpm)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{profile.max_heart_rate}</p>
                  <p className="text-sm text-gray-500">Máxima (bpm)</p>
                </div>
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Conquistas
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.achievements || 0}</p>
                  <p className="text-gray-500">Conquistas desbloqueadas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-purple-500">{profile?.total_xp || 0} XP</p>
                <p className="text-sm text-gray-500">Total acumulado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Treinos</h3>
            <span className="text-sm text-gray-500">{workouts.length} treinos nos últimos 30 dias</span>
          </div>
          <div className="space-y-4">
            {workouts.map((workout, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    workout.intensity === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                    workout.intensity === 'moderate' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <Dumbbell className={`w-6 h-6 ${
                      workout.intensity === 'high' ? 'text-red-500' :
                      workout.intensity === 'moderate' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{workout.focus}</p>
                    <p className="text-sm text-gray-500">{workout.workout_type} • {workout.intensity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDuration(workout.duration_minutes)}</p>
                    <p className="text-xs text-gray-500">Duração</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-orange-500">{workout.calories_burned}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  {workout.avg_heart_rate && (
                    <div className="text-center">
                      <p className="font-semibold text-red-500">{workout.avg_heart_rate}</p>
                      <p className="text-xs text-gray-500">bpm</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(workout.date).toLocaleDateString('pt-BR')}</p>
                    {workout.mood_after && <span className="text-lg">{getMoodEmoji(workout.mood_after)}</span>}
                  </div>
                </div>
              </div>
            ))}
            {workouts.length === 0 && (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum treino registrado ainda</p>
                <button onClick={openNOVA} className="mt-4 text-primary-500 hover:text-primary-600">
                  Iniciar treino no NOVA →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Registro Nutricional</h3>
            <span className="text-sm text-gray-500">Últimos 7 dias</span>
          </div>
          <div className="space-y-4">
            {nutrition.map((log, idx) => (
              <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.total_calories <= (profile?.daily_calorie_target || 2000)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {log.total_calories} / {profile?.daily_calorie_target || 2000} kcal
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{log.protein_g}g</p>
                    <p className="text-xs text-gray-500">Proteína</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-lg font-bold text-yellow-600">{log.carbs_g}g</p>
                    <p className="text-xs text-gray-500">Carboidratos</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{log.fat_g}g</p>
                    <p className="text-xs text-gray-500">Gordura</p>
                  </div>
                  <div className="text-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <p className="text-lg font-bold text-cyan-600">{log.water_ml}ml</p>
                    <p className="text-xs text-gray-500">Água</p>
                  </div>
                </div>
              </div>
            ))}
            {nutrition.length === 0 && (
              <div className="text-center py-12">
                <Apple className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum registro nutricional</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan?.name || 'Plano Semanal'}</h3>
              {plan?.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
            </div>
            {plan && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {plan.status === 'active' ? 'Ativo' : plan.status}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {planDays.map((day, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                day.is_rest_day
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
                  : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      day.is_rest_day ? 'bg-gray-200 dark:bg-gray-600' : 'bg-primary-500'
                    }`}>
                      {day.is_rest_day ? (
                        <span className="text-gray-500 dark:text-gray-400">😴</span>
                      ) : (
                        <Dumbbell className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{day.day_name}</p>
                      <p className="text-sm text-gray-500">
                        {day.is_rest_day ? 'Dia de descanso' : `${day.focus} • ${day.duration_minutes} min`}
                      </p>
                    </div>
                  </div>
                  {!day.is_rest_day && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      day.intensity === 'high' ? 'bg-red-100 text-red-700' :
                      day.intensity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {day.intensity}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {planDays.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum plano ativo</p>
                <button onClick={openNOVA} className="mt-4 text-primary-500 hover:text-primary-600">
                  Criar plano no NOVA →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Treine com NOVA</h3>
            <p className="text-purple-100">Seu personal trainer com IA para treinos personalizados</p>
          </div>
          <button
            onClick={openNOVA}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Iniciar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  target?: number;
  subtitle?: string;
  color: 'orange' | 'blue' | 'yellow' | 'purple' | 'green' | 'red';
}

function StatCard({ icon, label, value, unit, target, subtitle, color }: StatCardProps) {
  const colorClasses = {
    orange: 'from-orange-500 to-orange-400',
    blue: 'from-blue-500 to-blue-400',
    yellow: 'from-yellow-500 to-yellow-400',
    purple: 'from-purple-500 to-purple-400',
    green: 'from-green-500 to-green-400',
    red: 'from-red-500 to-red-400'
  };

  const progress = target ? Math.min((value / target) * 100, 100) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      {progress !== null && (
        <div className="mt-3">
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% da meta</p>
        </div>
      )}
    </div>
  );
}
