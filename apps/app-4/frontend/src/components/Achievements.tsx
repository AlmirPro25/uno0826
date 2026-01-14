import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Star, Flame, Target, Heart, 
    Droplets, Moon, Footprints, Calendar,
    Award, Medal, Crown, Zap, Shield,
    Lock, CheckCircle, X
} from 'lucide-react';
import { getAchievements as getAchievementsAPI, Achievement as APIAchievement } from '@/api/health-profile';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    progress: number;
    total: number;
    unlocked: boolean;
    unlockedAt?: Date;
    category: 'health' | 'streak' | 'goals' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementsProps {
    compact?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
    flame: Flame,
    crown: Crown,
    star: Star,
    droplets: Droplets,
    footprints: Footprints,
    moon: Moon,
    heart: Heart,
    target: Target,
    zap: Zap,
    calendar: Calendar,
    shield: Shield,
    medal: Medal,
    trophy: Trophy,
    award: Award,
};

const defaultAchievements: Achievement[] = [
    { id: '1', name: 'Primeiro Passo', description: 'Complete suas metas por 1 dia', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', progress: 0, total: 1, unlocked: false, category: 'streak', rarity: 'common' },
    { id: '2', name: 'Semana Perfeita', description: 'Complete suas metas por 7 dias seguidos', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', progress: 0, total: 7, unlocked: false, category: 'streak', rarity: 'rare' },
    { id: '3', name: 'Hidratado', description: 'Beba 8 copos de água em um dia', icon: Droplets, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', progress: 0, total: 8, unlocked: false, category: 'health', rarity: 'common' },
    { id: '4', name: 'Maratonista', description: 'Alcance 10.000 passos em um dia', icon: Footprints, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', progress: 0, total: 10000, unlocked: false, category: 'health', rarity: 'common' },
];

export function Achievements({ compact = false }: AchievementsProps) {
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
    const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        try {
            const apiAchievements = await getAchievementsAPI();
            if (apiAchievements.length > 0) {
                const mapped = apiAchievements.map((a: APIAchievement) => ({
                    id: a.id.toString(),
                    name: a.name,
                    description: a.description,
                    icon: iconMap[a.icon] || Trophy,
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                    progress: 1,
                    total: 1,
                    unlocked: true,
                    unlockedAt: new Date(a.earned_at),
                    category: (a.type as 'health' | 'streak' | 'goals' | 'special') || 'special',
                    rarity: 'common' as const,
                }));
                setAchievements([...mapped, ...defaultAchievements.filter(d => !mapped.find((m: Achievement) => m.name === d.name))]);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    };

    const filteredAchievements = achievements.filter(a => {
        if (filter === 'unlocked') return a.unlocked;
        if (filter === 'locked') return !a.unlocked;
        return true;
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalPoints = achievements.filter(a => a.unlocked).reduce((acc, a) => {
        const points = { common: 10, rare: 25, epic: 50, legendary: 100 };
        return acc + points[a.rarity];
    }, 0);

    const getRarityBorder = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'ring-2 ring-purple-500 ring-offset-2';
            case 'epic': return 'ring-2 ring-amber-500 ring-offset-2';
            case 'rare': return 'ring-2 ring-blue-500 ring-offset-2';
            default: return '';
        }
    };

    if (compact) {
        const recentUnlocked = achievements.filter(a => a.unlocked).slice(0, 4);
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Conquistas
                    </h3>
                    <span className="text-sm text-gray-500">{unlockedCount}/{achievements.length}</span>
                </div>
                
                <div className="flex gap-2">
                    {recentUnlocked.map(achievement => (
                        <div 
                            key={achievement.id}
                            className={`flex-1 p-2 rounded-xl ${achievement.bgColor} ${getRarityBorder(achievement.rarity)}`}
                        >
                            <achievement.icon className={`w-6 h-6 mx-auto ${achievement.color}`} />
                        </div>
                    ))}
                    {recentUnlocked.length < 4 && (
                        <div className="flex-1 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Conquistas
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {unlockedCount} de {achievements.length} desbloqueadas
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <Star className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-lg font-bold text-amber-600">{totalPoints}</p>
                                <p className="text-xs text-amber-500">pontos</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2 mt-4">
                        {(['all', 'unlocked', 'locked'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    filter === f
                                        ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {f === 'all' ? 'Todas' : f === 'unlocked' ? 'Desbloqueadas' : 'Bloqueadas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Achievements Grid */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredAchievements.map(achievement => (
                        <motion.button
                            key={achievement.id}
                            onClick={() => setSelectedAchievement(achievement)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl text-center transition-all ${
                                achievement.unlocked 
                                    ? `${achievement.bgColor} ${getRarityBorder(achievement.rarity)}`
                                    : 'bg-gray-100 dark:bg-gray-700/50 opacity-60'
                            }`}
                        >
                            <div className="relative">
                                {achievement.unlocked ? (
                                    <achievement.icon className={`w-10 h-10 mx-auto mb-2 ${achievement.color}`} />
                                ) : (
                                    <div className="relative">
                                        <achievement.icon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                                        <Lock className="w-4 h-4 absolute -bottom-1 -right-1 text-gray-500" />
                                    </div>
                                )}
                            </div>
                            <p className={`text-sm font-medium ${
                                achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                            }`}>
                                {achievement.name}
                            </p>
                            {!achievement.unlocked && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-cyan-500 rounded-full"
                                            style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {achievement.progress}/{achievement.total}
                                    </p>
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Achievement Detail Modal */}
            <AnimatePresence>
                {selectedAchievement && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedAchievement(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedAchievement.bgColor} ${getRarityBorder(selectedAchievement.rarity)}`}>
                                    {selectedAchievement.unlocked ? (
                                        <selectedAchievement.icon className={`w-8 h-8 ${selectedAchievement.color}`} />
                                    ) : (
                                        <Lock className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedAchievement(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {selectedAchievement.name}
                            </h3>
                            <p className="text-gray-500 mb-4">{selectedAchievement.description}</p>

                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    selectedAchievement.rarity === 'legendary' ? 'bg-purple-100 text-purple-700' :
                                    selectedAchievement.rarity === 'epic' ? 'bg-amber-100 text-amber-700' :
                                    selectedAchievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {selectedAchievement.rarity === 'legendary' ? 'Lendário' :
                                     selectedAchievement.rarity === 'epic' ? 'Épico' :
                                     selectedAchievement.rarity === 'rare' ? 'Raro' : 'Comum'}
                                </span>
                                <span className="text-sm text-gray-500">
                                    +{selectedAchievement.rarity === 'legendary' ? 100 :
                                      selectedAchievement.rarity === 'epic' ? 50 :
                                      selectedAchievement.rarity === 'rare' ? 25 : 10} pontos
                                </span>
                            </div>

                            {selectedAchievement.unlocked ? (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                            Desbloqueada!
                                        </p>
                                        <p className="text-xs text-emerald-600">
                                            {selectedAchievement.unlockedAt?.toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Progresso</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedAchievement.progress}/{selectedAchievement.total}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(selectedAchievement.progress / selectedAchievement.total) * 100}%` }}
                                            className="h-full bg-cyan-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Achievements;
