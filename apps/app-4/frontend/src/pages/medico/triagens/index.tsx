import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    getPendingTriageReports, 
    getAssignedTriageReports,
    acceptTriageReport,
    TriageReport, 
    getPriorityColor, 
    getStatusLabel 
} from '../../../api/triage';
import { useAuthStore } from '@/hooks/useAuthStore';
import { 
    Activity, 
    Clock, 
    User, 
    Stethoscope, 
    AlertCircle,
    CheckCircle,
    ChevronRight,
    Calendar,
    Loader2,
    Filter,
    Bell,
    UserCheck
} from 'lucide-react';

type TabType = 'pending' | 'assigned';

export default function DoctorTriagePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [pendingReports, setPendingReports] = useState<TriageReport[]>([]);
    const [assignedReports, setAssignedReports] = useState<TriageReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState<number | null>(null);

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
            const [pending, assigned] = await Promise.all([
                getPendingTriageReports(),
                getAssignedTriageReports()
            ]);
            setPendingReports(pending);
            setAssignedReports(assigned);
        } catch (err) {
            setError('Erro ao carregar triagens');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (reportId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setAccepting(reportId);
            await acceptTriageReport(reportId);
            await loadReports();
        } catch (err) {
            console.error('Error accepting report:', err);
        } finally {
            setAccepting(null);
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
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}min atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    const reports = activeTab === 'pending' ? pendingReports : assignedReports;

    return (
        <>
            <Head>
                <title>Fila de Triagem | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Activity className="w-7 h-7 text-cyan-600" />
                            Fila de Triagem IA
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Pacientes aguardando atendimento
                        </p>
                    </div>
                    <button
                        onClick={loadReports}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Bell className="w-4 h-4" />
                        Atualizar
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'pending'
                                ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Pendentes
                        {pendingReports.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {pendingReports.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'assigned'
                                ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        Meus Casos
                        {assignedReports.length > 0 && (
                            <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                                {assignedReports.length}
                            </span>
                        )}
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
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {activeTab === 'pending' ? 'Nenhuma triagem pendente' : 'Nenhum caso atribuído'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'pending' 
                                ? 'Todos os pacientes foram atendidos!' 
                                : 'Aceite casos da fila pendente para começar'}
                        </p>
                    </div>
                )}

                {/* Reports List */}
                {!loading && reports.length > 0 && (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div 
                                        className="flex-1 cursor-pointer"
                                        onClick={() => router.push(`/medico/triagens/${report.id}`)}
                                    >
                                        {/* Priority & Time */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(report.priority)}`}>
                                                {report.priority}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {getTimeAgo(report.created_at)}
                                            </span>
                                        </div>

                                        {/* Patient Info */}
                                        {report.patient && (
                                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                                                <User className="w-4 h-4" />
                                                <span className="font-medium">{report.patient.full_name}</span>
                                            </div>
                                        )}

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
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-4">
                                        {activeTab === 'pending' && (
                                            <button
                                                onClick={(e) => handleAccept(report.id, e)}
                                                disabled={accepting === report.id}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                            >
                                                {accepting === report.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Aceitar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/medico/triagens/${report.id}`)}
                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
