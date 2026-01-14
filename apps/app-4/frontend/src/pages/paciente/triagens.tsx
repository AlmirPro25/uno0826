import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getMyTriageReports, TriageReport, getPriorityColor, getStatusLabel } from '../../api/triage';
import { useAuthStore } from '@/hooks/useAuthStore';
import { 
    FileText, 
    Clock, 
    User, 
    Stethoscope, 
    AlertCircle,
    ChevronRight,
    Activity,
    Calendar,
    Loader2
} from 'lucide-react';

export default function PatientTriagePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [reports, setReports] = useState<TriageReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadReports();
    }, [isAuthenticated]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const data = await getMyTriageReports();
            setReports(data);
        } catch (err) {
            setError('Erro ao carregar triagens');
            console.error(err);
        } finally {
            setLoading(false);
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
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Head>
                <title>Minhas Triagens | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Activity className="w-7 h-7 text-cyan-600" />
                            Minhas Triagens
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Histórico de triagens realizadas com IA
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/ai/medicore')}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Stethoscope className="w-4 h-4" />
                        Nova Triagem
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && reports.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nenhuma triagem realizada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Faça sua primeira triagem com nossa IA para receber orientações médicas
                        </p>
                        <button
                            onClick={() => router.push('/ai/medicore')}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Iniciar Triagem
                        </button>
                    </div>
                )}

                {/* Reports List */}
                {!loading && reports.length > 0 && (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => router.push(`/paciente/triagens/${report.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Priority Badge */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(report.priority)}`}>
                                                {report.priority}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {getStatusLabel(report.status)}
                                            </span>
                                        </div>

                                        {/* Complaint */}
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {report.patient_complaint}
                                        </h3>

                                        {/* Diagnosis */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {parseDiagnosis(report.suspected_diagnosis).slice(0, 3).map((diag, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                                    {diag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Stethoscope className="w-4 h-4" />
                                                {report.recommended_specialty}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(report.created_at)}
                                            </span>
                                            {report.doctor && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {report.doctor.full_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
