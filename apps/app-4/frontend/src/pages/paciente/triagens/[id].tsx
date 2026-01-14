import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { 
    getTriageReport, 
    updateTriageStatus,
    TriageReport, 
    getPriorityColor, 
    getStatusLabel,
    TRIAGE_STATUS
} from '@/api/triage';
import { useAuthStore } from '@/hooks/useAuthStore';
import { 
    Activity, 
    User, 
    Stethoscope, 
    AlertCircle,
    ArrowLeft,
    Calendar,
    Loader2,
    FileText,
    MessageSquare,
    Brain,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';

export default function PatientTriageDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { isAuthenticated } = useAuthStore();
    const [report, setReport] = useState<TriageReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);

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

    const handleCancel = async () => {
        if (!report) return;
        if (!confirm('Tem certeza que deseja cancelar esta triagem?')) return;
        
        try {
            setCancelling(true);
            await updateTriageStatus(report.id, TRIAGE_STATUS.CANCELLED);
            await loadReport();
        } catch (err) {
            console.error(err);
        } finally {
            setCancelling(false);
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

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/paciente/triagens')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Minhas Triagens
                </button>

                {/* Header Card */}
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

                        {/* Cancel Button (only for pending) */}
                        {report.status === TRIAGE_STATUS.PENDING && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center gap-2"
                            >
                                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Cancelar
                            </button>
                        )}
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Status do Atendimento
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 ${report.status !== TRIAGE_STATUS.CANCELLED ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Triagem Realizada</span>
                            </div>
                            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
                            <div className={`flex items-center gap-2 ${
                                report.status === TRIAGE_STATUS.ACCEPTED || report.status === TRIAGE_STATUS.COMPLETED 
                                    ? 'text-green-600' 
                                    : 'text-gray-400'
                            }`}>
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Médico Aceitou</span>
                            </div>
                            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
                            <div className={`flex items-center gap-2 ${report.status === TRIAGE_STATUS.COMPLETED ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Concluído</span>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Info */}
                    {report.doctor && (
                        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Médico Responsável
                            </h3>
                            <p className="text-emerald-700 dark:text-emerald-200 font-medium">
                                {report.doctor.full_name}
                            </p>
                            {report.doctor.specialty && (
                                <p className="text-emerald-600 dark:text-emerald-300 text-sm">
                                    {report.doctor.specialty}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-6">
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

                    {/* Diagnosis */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-cyan-600" />
                            Hipóteses Diagnósticas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {parseDiagnosis(report.suspected_diagnosis).map((diag, i) => (
                                <span key={i} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                                    {diag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Specialty */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Especialidade Recomendada
                        </h3>
                        <div className="px-4 py-3 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg font-medium inline-block">
                            {report.recommended_specialty}
                        </div>
                    </div>

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

                    {/* Doctor Notes */}
                    {report.review_notes && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-6">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Notas do Médico
                            </h3>
                            <p className="text-emerald-700 dark:text-emerald-200 whitespace-pre-wrap">
                                {report.review_notes}
                            </p>
                            {report.reviewed_at && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                                    Revisado em {formatDate(report.reviewed_at)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* CTA */}
                {report.status === TRIAGE_STATUS.PENDING && (
                    <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                            Aguardando Médico
                        </h3>
                        <p className="text-amber-700 dark:text-amber-200 text-sm">
                            Médicos da especialidade {report.recommended_specialty} foram notificados. 
                            Você receberá uma notificação quando um médico aceitar seu caso.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
