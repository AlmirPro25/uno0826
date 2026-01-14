import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Star, User, Calendar, Loader2, ArrowLeft,
    AlertCircle, Edit2, Trash2, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    doctor?: {
        id: number;
        fullName: string;
        specialty?: string;
    };
    appointment?: {
        id: number;
        startTime: string;
    };
}

export default function PatientReviewsPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState('');
    const [saving, setSaving] = useState(false);

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
            const response = await axiosInstance.get('/reviews/my-reviews');
            setReviews(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar avaliações');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (review: Review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditComment(review.comment);
    };

    const handleSaveEdit = async () => {
        if (!editingReview) return;
        
        setSaving(true);
        try {
            await axiosInstance.put(`/reviews/${editingReview.id}`, {
                rating: editRating,
                comment: editComment
            });
            setReviews(reviews.map(r => 
                r.id === editingReview.id 
                    ? { ...r, rating: editRating, comment: editComment }
                    : r
            ));
            setEditingReview(null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao atualizar avaliação');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
        
        try {
            await axiosInstance.delete(`/reviews/${id}`);
            setReviews(reviews.filter(r => r.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir avaliação');
        }
    };

    const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => onRate?.(star)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                        <Star
                            className={`w-5 h-5 ${
                                star <= rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

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
                    onClick={() => router.push('/paciente/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Star className="w-7 h-7" />
                                Minhas Avaliações
                            </h1>
                            <p className="text-yellow-100 mt-1">
                                {reviews.length} avaliação(ões) realizadas
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold">{averageRating}</p>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                            star <= Math.round(Number(averageRating))
                                                ? 'text-white fill-white'
                                                : 'text-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-yellow-100 mt-1">Média</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Edit Modal */}
                {editingReview && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Editar Avaliação
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nota
                                    </label>
                                    {renderStars(editRating, true, setEditRating)}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Comentário
                                    </label>
                                    <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditingReview(null)}
                                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50"
                                    >
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma avaliação encontrada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Após suas consultas, você poderá avaliar os médicos aqui.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Dr(a). {review.doctor?.fullName}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {review.doctor?.specialty}
                                            </p>
                                            {review.appointment && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Consulta em {format(new Date(review.appointment.startTime), "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(review)}
                                            className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-3">
                                    {renderStars(review.rating)}
                                    <span className="text-sm text-gray-500">
                                        {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                </div>

                                {review.comment && (
                                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
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
