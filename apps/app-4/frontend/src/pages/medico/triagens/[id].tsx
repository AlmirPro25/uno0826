import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    getTriageReport, 
    acceptTriageReport,
    reviewTriageReport,
    updateTriageStatus,
    TriageReport, 
    getPriorityColor, 
    getStatusLabel,
    TRIAGE_STATUS
} from '../../../api/triage';
import { useAuthStore } from '@/hooks/useAuthStore';
import { TriageReportPDFButton } from '@/components/TriageReportPDF';
import { 
    Activity, 
    User, 
    Stethoscope, 
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Calendar,
    Loader2,
    FileText,
    MessageSquare,
    Brain,
    MapPin,
    Mail,
    ClipboardList,
    Send
} from 'lucide-react';
export default function TriageDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { isAuthenticated } = useAuthStore();
    const [report, setReport] = useState<TriageReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (id) {
            loadReport();
        }
    }, [isAuthenticated, id]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const data = await getTriageReport(Number(id));
            setReport(data);
        } catch (err) {
            setError('Erro ao carregar triagem');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!report) return;
        try {
            setSubmitting(true);
            await acceptTriageReport(report.id);
            await loadReport();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReview = async () => {
        if (!report || !reviewNotes.trim()) return;
        try {
            setSubmitting(true);
            await reviewTriageReport(report.id, reviewNotes);
            await loadReport();
            setReviewNotes('');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!report) return;
        try {
            setSubmitting(true);
            await updateTriageStatus(report.id, TRIAGE_STATUS.COMPLETED);
            await loadReport();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const parseDiagnosis = (diagnosisJson: string): string[] => {
        try {
            return JSON.parse(diagnosisJson);
        } catch {
            return [diagnosisJson];
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error || 'Triagem não encontrada'}
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Triagem #{report.id} | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getPriorityColor(report.priority)}`}>
                                    {report.priority}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                                    {getStatusLabel(report.status)}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Triagem #{report.id}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(report.created_at)}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <TriageReportPDFButton report={report} />
                            {report.status === TRIAGE_STATUS.PENDING && (
                                <button
                                    onClick={handleAccept}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Aceitar Caso
                                </button>
                            )}
                            {report.status === TRIAGE_STATUS.ACCEPTED && (
                                <button
                                    onClick={handleComplete}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Concluir
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Patient Info */}
                    {report.patient && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Paciente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{report.patient.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {report.patient.email}
                                    </p>
                                </div>
                                {report.latitude && report.longitude && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Localização</p>
                                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Complaint */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-cyan-600" />
                                Queixa Principal
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 text-lg">
                                {report.patient_complaint}
                            </p>
                        </div>

                        {/* History */}
                        {report.history_of_present_illness && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                    História da Moléstia Atual
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {report.history_of_present_illness}
                                </p>
                            </div>
                        )}

                        {/* Vital Signs */}
                        {report.vital_signs_note && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-cyan-600" />
                                    Observações Visuais / Sinais Vitais
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    {report.vital_signs_note}
                                </p>
                            </div>
                        )}

                        {/* AI Reasoning */}
                        {report.reasoning && (
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-6">
                                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Raciocínio Clínico (IA)
                                </h3>
                                <p className="text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                                    {report.reasoning}
                                </p>
                            </div>
                        )}

                        {/* Review Notes */}
                        {(report.status === TRIAGE_STATUS.ACCEPTED || report.status === TRIAGE_STATUS.REVIEWED) && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-cyan-600" />
                                    Notas do Médico
                                </h3>
                                
                                {report.review_notes && (
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {report.review_notes}
                                        </p>
                                        {report.reviewed_at && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                Revisado em {formatDate(report.reviewed_at)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Adicionar notas sobre o caso..."
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                        rows={3}
                                    />
                                    <button
                                        onClick={handleReview}
                                        disabled={!reviewNotes.trim() || submitting}
                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-lg font-medium self-end"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Diagnosis */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-cyan-600" />
                                Hipóteses Diagnósticas
                            </h3>
                            <div className="space-y-2">
                                {parseDiagnosis(report.suspected_diagnosis).map((diag, i) => (
                                    <div key={i} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                                        {diag}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Specialty */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                Especialidade Recomendada
                            </h3>
                            <div className="px-4 py-3 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg font-medium text-center">
                                {report.recommended_specialty}
                            </div>
                        </div>

                        {/* Session Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                Informações da Sessão
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Tipo</span>
                                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                                        {report.session_type}
                                    </span>
                                </div>
                                {report.ai_model && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Modelo IA</span>
                                        <span className="font-medium text-gray-900 dark:text-white text-xs">
                                            {report.ai_model}
                                        </span>
                                    </div>
                                )}
                                {report.session_length && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Duração</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {Math.floor(report.session_length / 60)}min
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
