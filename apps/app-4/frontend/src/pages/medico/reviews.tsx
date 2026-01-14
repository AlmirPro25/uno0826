import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Star, User, Calendar, Loader2, ArrowLeft,
    AlertCircle, MessageSquare, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
    };
    appointment?: {
        id: number;
        startTime: string;
    };
}

interface RatingStats {
    average: number;
    total: number;
    distribution: { [key: number]: number };
}

export default function DoctorReviewsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadReviews();
    }, [isAuthenticated]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const [reviewsRes, statsRes] = await Promise.all([
                axiosInstance.get(`/doctors/${user?.id}/reviews`).catch(() => ({ data: [] })),
                axiosInstance.get(`/doctors/${user?.id}/rating`).catch(() => ({ data: null }))
            ]);
            
            setReviews(reviewsRes.data || []);
            
            // Calculate stats from reviews if API doesn't return them
            const reviewsData = reviewsRes.data || [];
            if (reviewsData.length > 0) {
                const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                let total = 0;
                reviewsData.forEach((r: Review) => {
                    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
                    total += r.rating;
                });
                setStats({
                    average: total / reviewsData.length,
                    total: reviewsData.length,
                    distribution
                });
            } else if (statsRes.data) {
                setStats(statsRes.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar avaliações');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${
                            star <= rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === filterRating)
        : reviews;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Minhas Avaliações | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/medico/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header with Stats */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Star className="w-7 h-7" />
                                Minhas Avaliações
                            </h1>
                            <p className="text-yellow-100 mt-1">
                                Veja o que seus pacientes dizem sobre você
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-5xl font-bold">{stats?.average?.toFixed(1) || '0.0'}</p>
                            <div className="flex gap-1 justify-center mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${
                                            star <= Math.round(stats?.average || 0)
                                                ? 'text-white fill-white'
                                                : 'text-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-yellow-100 mt-1">
                                {stats?.total || 0} avaliações
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Rating Distribution */}
                {stats && stats.total > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Distribuição das Avaliações
                        </h3>
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = stats.distribution[rating] || 0;
                                const percentage = stats.total > 0 
                                    ? ((count / stats.total) * 100).toFixed(0)
                                    : '0';
                                return (
                                    <button
                                        key={rating}
                                        onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                            filterRating === rating 
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className="text-sm text-gray-500 w-4">{rating}</span>
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-yellow-400 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-500 w-12 text-right">
                                            {count} ({percentage}%)
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {filterRating && (
                            <button
                                onClick={() => setFilterRating(null)}
                                className="mt-4 text-sm text-cyan-600 hover:text-cyan-700"
                            >
                                Limpar filtro
                            </button>
                        )}
                    </div>
                )}

                {/* Reviews List */}
                {filteredReviews.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {filterRating 
                                ? `Nenhuma avaliação com ${filterRating} estrela(s)`
                                : 'Nenhuma avaliação ainda'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filterRating 
                                ? 'Tente outro filtro'
                                : 'As avaliações dos seus pacientes aparecerão aqui.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {review.patient?.fullName || 'Paciente'}
                                            </p>
                                            {review.appointment && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Consulta em {format(new Date(review.appointment.startTime), "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {renderStars(review.rating)}
                                        <p className="text-sm text-gray-500 mt-1">
                                            {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                {review.comment && (
                                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 italic">
                                        "{review.comment}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
