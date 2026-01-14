import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { HealthDashboard } from '@/components/HealthDashboard';
import { SymptomChecker } from '@/components/SymptomChecker';
import { EmergencyButton } from '@/components/EmergencyButton';
import { HealthGoals } from '@/components/HealthGoals';
import { HealthSummary } from '@/components/HealthSummary';
import { HealthTips } from '@/components/HealthTips';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { Achievements } from '@/components/Achievements';
import { HealthCalendar } from '@/components/HealthCalendar';
import { WaterTracker } from '@/components/WaterTracker';
import { SleepTracker } from '@/components/SleepTracker';
import { StepsTracker } from '@/components/StepsTracker';
import { NutritionTracker } from '@/components/NutritionTracker';
import { Activity, Brain, Heart, Target, Droplets, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientHealthPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'symptoms' | 'goals' | 'trackers'>('dashboard');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Minha Saúde | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Heart className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Minha Saúde</h1>
                            <p className="text-emerald-100">Monitore seus sinais vitais e bem-estar</p>
                        </div>
                    </div>
                </div>

                {/* Health Summary */}
                <HealthSummary />

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                            activeTab === 'dashboard'
                                ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Activity className="w-5 h-5" />
                        <span className="hidden sm:inline">Sinais Vitais</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('goals')}
                        className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                            activeTab === 'goals'
                                ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Target className="w-5 h-5" />
                        <span className="hidden sm:inline">Metas</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('trackers')}
                        className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                            activeTab === 'trackers'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Droplets className="w-5 h-5" />
                        <span className="hidden sm:inline">Trackers</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('symptoms')}
                        className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                            activeTab === 'symptoms'
                                ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Brain className="w-5 h-5" />
                        <span className="hidden sm:inline">Sintomas</span>
                    </button>
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'dashboard' && <HealthDashboard />}
                    {activeTab === 'goals' && (
                        <div className="space-y-6">
                            <HealthGoals />
                            <WeeklyProgress />
                        </div>
                    )}
                    {activeTab === 'trackers' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <StepsTracker />
                                <NutritionTracker />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <WaterTracker />
                                <SleepTracker />
                            </div>
                        </div>
                    )}
                    {activeTab === 'symptoms' && <SymptomChecker />}
                </motion.div>

                {/* Health Calendar & Achievements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HealthCalendar />
                    <Achievements />
                </div>

                {/* Health Tips */}
                <HealthTips />
            </div>

            {/* Emergency Button */}
            <EmergencyButton />
        </>
    );
}
