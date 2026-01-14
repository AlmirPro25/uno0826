import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Pill, User, Calendar, Loader2, ArrowLeft,
    Printer, AlertCircle, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { format, isPast, isFuture, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Prescription {
    id: number;
    medications: string;
    instructions: string;
    validUntil: string;
    createdAt: string;
    doctor?: {
        id: number;
        fullName: string;
        specialty?: string;
        crm?: string;
    };
}

export default function PatientPrescriptionsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'valid' | 'expired'>('all');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadPrescriptions();
    }, [isAuthenticated]);

    const loadPrescriptions = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/prescriptions/my-prescriptions');
            setPrescriptions(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar receitas');
        } finally {
            setLoading(false);
        }
    };

    const isExpired = (validUntil: string) => isPast(new Date(validUntil));
    const isExpiringSoon = (validUntil: string) => {
        const date = new Date(validUntil);
        return isFuture(date) && isPast(addDays(new Date(), -7));
    };

    const filteredPrescriptions = prescriptions.filter(p => {
        if (filter === 'valid') return !isExpired(p.validUntil);
        if (filter === 'expired') return isExpired(p.validUntil);
        return true;
    });

    const handlePrint = (prescription: Prescription) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const today = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receita Médica - MediSync</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.8; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header p { font-size: 14px; color: #666; }
        .title { text-align: center; font-size: 20px; font-weight: bold; margin: 40px 0; text-transform: uppercase; letter-spacing: 2px; }
        .patient-info { margin-bottom: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .content { font-size: 16px; margin-bottom: 40px; }
        .medications { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; white-space: pre-line; }
        .instructions { margin-top: 20px; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; }
        .validity { margin-top: 20px; padding: 10px; background: #ecfdf5; border-radius: 8px; text-align: center; }
        .signature { margin-top: 80px; text-align: center; }
        .signature-line { width: 300px; border-top: 1px solid #000; margin: 0 auto 10px; padding-top: 10px; }
        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; }
        @media print { body { padding: 40px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>MediSync - Sistema de Saúde</h1>
        <p>Receita Médica Digital</p>
    </div>
    <div class="title">Receita Médica</div>
    <div class="patient-info">
        <strong>Paciente:</strong> ${user?.fullName || '_______________'}<br>
        <strong>Data:</strong> ${format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: ptBR })}
    </div>
    <div class="content">
        <div class="medications">
            ${prescription.medications}
        </div>
        ${prescription.instructions ? `
        <div class="instructions">
            <strong>Instruções:</strong><br>
            ${prescription.instructions}
        </div>
        ` : ''}
        <div class="validity">
            <strong>Válida até:</strong> ${format(new Date(prescription.validUntil), "dd/MM/yyyy", { locale: ptBR })}
        </div>
    </div>
    <div class="signature">
        <div class="signature-line">
            <strong>Dr(a). ${prescription.doctor?.fullName || '_______________'}</strong><br>
            CRM: ${prescription.doctor?.crm || '_______________'}<br>
            ${prescription.doctor?.specialty || 'Médico(a)'}
        </div>
    </div>
    <div class="footer">
        <p>Documento gerado em ${today}</p>
        <p>MediSync - Sistema de Saúde Digital</p>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    };

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
                <title>Minhas Receitas | MediSync</title>
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Pill className="w-7 h-7 text-cyan-600" />
                        Minhas Receitas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {prescriptions.length} receita(s) disponível(is)
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Todas ({prescriptions.length})
                    </button>
                    <button
                        onClick={() => setFilter('valid')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            filter === 'valid'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Válidas ({prescriptions.filter(p => !isExpired(p.validUntil)).length})
                    </button>
                    <button
                        onClick={() => setFilter('expired')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            filter === 'expired'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <XCircle className="w-4 h-4" />
                        Vencidas ({prescriptions.filter(p => isExpired(p.validUntil)).length})
                    </button>
                </div>

                {/* Prescriptions List */}
                {filteredPrescriptions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Pill className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma receita encontrada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter !== 'all' 
                                ? 'Tente ajustar o filtro'
                                : 'Suas receitas médicas aparecerão aqui quando prescritas pelo seu médico.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPrescriptions.map((prescription) => {
                            const expired = isExpired(prescription.validUntil);
                            
                            return (
                                <div
                                    key={prescription.id}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
                                        expired 
                                            ? 'border-red-200 dark:border-red-800 opacity-75' 
                                            : 'border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                expired 
                                                    ? 'bg-red-100 dark:bg-red-900/30' 
                                                    : 'bg-emerald-100 dark:bg-emerald-900/30'
                                            }`}>
                                                <Pill className={`w-6 h-6 ${expired ? 'text-red-600' : 'text-emerald-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    Dr(a). {prescription.doctor?.fullName}
                                                    {prescription.doctor?.specialty && ` - ${prescription.doctor.specialty}`}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Emitida em {format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                                expired
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            }`}>
                                                <Clock className="w-3 h-3" />
                                                {expired ? 'Vencida' : 'Válida'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Medications */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                                        <p className="text-gray-900 dark:text-white whitespace-pre-line">
                                            {prescription.medications}
                                        </p>
                                    </div>

                                    {/* Instructions */}
                                    {prescription.instructions && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-xl p-4 mb-4">
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                                Instruções
                                            </p>
                                            <p className="text-amber-700 dark:text-amber-300">
                                                {prescription.instructions}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <p className={`text-sm ${expired ? 'text-red-600' : 'text-gray-500'}`}>
                                            {expired ? 'Venceu em' : 'Válida até'}: {format(new Date(prescription.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                        <button
                                            onClick={() => handlePrint(prescription)}
                                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium text-sm"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Imprimir
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
