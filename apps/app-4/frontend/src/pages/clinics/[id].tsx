import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { Clinic, ClinicReview } from '@/api/clinics';
import {
    MapPin, Phone, Mail, Globe, Clock, Star, Users,
    Stethoscope, Calendar, ChevronLeft, Loader2, AlertCircle,
    CheckCircle, Award, MessageSquare, Send, Building2
} from 'lucide-react';

interface ClinicDoctor {
    id: number;
    full_name: string;
    specialty: string;
    rating?: number;
}

export default function ClinicDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated } = useAuthStore();
    
    const [clinic, setClinic] = useState<Clinic | null>(null);
    const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
    const [reviews, setReviews] = useState<ClinicReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Review form
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (id) {
            loadClinicData();
        }
    }, [id]);

    const loadClinicData = async () => {
        setLoading(true);
        try {
            const [clinicRes, reviewsRes] = await Promise.all([
                axiosInstance.get(`/clinics/${id}`),
                axiosInstance.get(`/clinics/${id}/reviews`).catch(() => ({ data: [] }))
            ]);
            
            setClinic(clinicRes.data);
            setReviews(reviewsRes.data || []);
            
            // Load doctors if available
            if (clinicRes.data.doctors) {
                setDoctors(clinicRes.data.doctors);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar clínica');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        setSubmittingReview(true);
        try {
            await axiosInstance.post(`/clinics/${id}/reviews`, {
                rating: reviewRating,
                comment: reviewComment
            });
            
            setShowReviewForm(false);
            setReviewComment('');
            setReviewRating(5);
            loadClinicData(); // Reload to get updated reviews
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao enviar avaliação');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleBookAppointment = (doctorId?: number) => {
        const query: any = { clinic_id: id };
        if (doctorId) query.doctor_id = doctorId;
        router.push({ pathname: '/paciente/book-appointment', query });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (error || !clinic) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
                        {error || 'Clínica não encontrada'}
                    </h2>
                    <Link href="/clinics" className="mt-4 text-cyan-600 hover:underline inline-block">
                        Voltar para lista de clínicas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{clinic.name} | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-r from-cyan-600 to-blue-600 relative">
                        {clinic.is_premium && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold">
                                <Award className="w-4 h-4" />
                                Premium
                            </div>
                        )}
                    </div>

                    <div className="p-6 -mt-12">
                        {/* Logo/Icon */}
                        <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center mb-4">
                            <Building2 className="w-12 h-12 text-cyan-600" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {clinic.name}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    {clinic.address}, {clinic.city} - {clinic.state}
                                </p>
                                
                                {/* Rating */}
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${
                                                    star <= (clinic.average_rating || 0)
                                                        ? 'text-amber-500 fill-current'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {clinic.average_rating?.toFixed(1) || '0.0'}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        ({clinic.total_reviews || 0} avaliações)
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBookAppointment()}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                <Calendar className="w-5 h-5" />
                                Agendar Consulta
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        {clinic.description && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    Sobre a Clínica
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {clinic.description}
                                </p>
                            </div>
                        )}

                        {/* Specialties */}
                        {clinic.specialties && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-cyan-600" />
                                    Especialidades
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        try {
                                            const specs = JSON.parse(clinic.specialties);
                                            return Array.isArray(specs) ? specs.map((spec: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium"
                                                >
                                                    {spec}
                                                </span>
                                            )) : null;
                                        } catch {
                                            return (
                                                <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium">
                                                    {clinic.specialties}
                                                </span>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Doctors */}
                        {doctors.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-600" />
                                    Médicos ({doctors.length})
                                </h2>
                                <div className="space-y-3">
                                    {doctors.map((doctor) => (
                                        <div
                                            key={doctor.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {doctor.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {doctor.full_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {doctor.specialty}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBookAppointment(doctor.id)}
                                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Agendar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-cyan-600" />
                                    Avaliações ({reviews.length})
                                </h2>
                                {isAuthenticated && !showReviewForm && (
                                    <button
                                        onClick={() => setShowReviewForm(true)}
                                        className="text-cyan-600 hover:underline text-sm font-medium"
                                    >
                                        Avaliar
                                    </button>
                                )}
                            </div>

                            {/* Review Form */}
                            {showReviewForm && (
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sua avaliação
                                        </label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setReviewRating(star)}
                                                    className="p-1"
                                                >
                                                    <Star
                                                        className={`w-8 h-8 transition-colors ${
                                                            star <= reviewRating
                                                                ? 'text-amber-500 fill-current'
                                                                : 'text-gray-300 hover:text-amber-300'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Comentário (opcional)
                                        </label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Conte sua experiência..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSubmitReview}
                                            disabled={submittingReview}
                                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                                        >
                                            {submittingReview ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            Enviar
                                        </button>
                                        <button
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            {reviews.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                                                        {review.patient?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {review.patient?.full_name || 'Usuário'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-4 h-4 ${
                                                                star <= review.rating
                                                                    ? 'text-amber-500 fill-current'
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                                    {review.comment}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(review.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                                Contato
                            </h2>
                            <div className="space-y-3">
                                {clinic.phone && (
                                    <a
                                        href={`tel:${clinic.phone}`}
                                        className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-cyan-600 transition-colors"
                                    >
                                        <Phone className="w-5 h-5" />
                                        {clinic.phone}
                                    </a>
                                )}
                                {clinic.email && (
                                    <a
                                        href={`mailto:${clinic.email}`}
                                        className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-cyan-600 transition-colors"
                                    >
                                        <Mail className="w-5 h-5" />
                                        {clinic.email}
                                    </a>
                                )}
                                {clinic.website && (
                                    <a
                                        href={clinic.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-cyan-600 transition-colors"
                                    >
                                        <Globe className="w-5 h-5" />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Operating Hours */}
                        {clinic.opening_hours && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-cyan-600" />
                                    Horário de Funcionamento
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line">
                                    {clinic.opening_hours}
                                </p>
                            </div>
                        )}

                        {/* Map Placeholder */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-cyan-600" />
                                Localização
                            </h2>
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        `${clinic.address}, ${clinic.city}, ${clinic.state}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-600 hover:underline text-sm"
                                >
                                    Ver no Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
