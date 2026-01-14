import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Pill, User, Calendar, Loader2, ArrowLeft,
    Plus, Search, Printer, Eye, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Prescription {
    id: number;
    medications: string;
    instructions: string;
    validUntil: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
    };
}

export default function DoctorPrescriptionsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
        } catch (err) {
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const deletePrescription = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
        try {
            await axiosInstance.delete(`/prescriptions/${id}`);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir receita');
        }
    };

    const handlePrint = (prescription: Prescription) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

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
        .title { text-align: center; font-size: 20px; font-weight: bold; margin: 40px 0; text-transform: uppercase; }
        .patient-info { margin-bottom: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .medications { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; white-space: pre-line; }
        .validity { margin-top: 20px; padding: 10px; background: #ecfdf5; border-radius: 8px; text-align: center; }
        .signature { margin-top: 80px; text-align: center; }
        .signature-line { width: 300px; border-top: 1px solid #000; margin: 0 auto 10px; padding-top: 10px; }
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
        <strong>Paciente:</strong> ${prescription.patient?.fullName || '_______________'}<br>
        <strong>Data:</strong> ${format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: ptBR })}
    </div>
    <div class="medications">${prescription.medications}</div>
    ${prescription.instructions ? `<p><strong>Instruções:</strong> ${prescription.instructions}</p>` : ''}
    <div class="validity"><strong>Válida até:</strong> ${format(new Date(prescription.validUntil), "dd/MM/yyyy", { locale: ptBR })}</div>
    <div class="signature">
        <div class="signature-line">
            <strong>Dr(a). ${user?.fullName || '_______________'}</strong><br>
            CRM: ${user?.crm || '_______________'}
        </div>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const filteredPrescriptions = prescriptions.filter(p =>
        !searchQuery ||
        p.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.medications?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <title>Receitas | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                <button
                    onClick={() => router.push('/medico/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Pill className="w-7 h-7 text-cyan-600" />
                            Receitas Médicas
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {prescriptions.length} receita(s) emitida(s)
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/medico/prescriptions/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Receita
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por paciente ou medicamento..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {filteredPrescriptions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Pill className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma receita encontrada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery ? 'Tente ajustar a busca' : 'Suas receitas emitidas aparecerão aqui.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPrescriptions.map((prescription) => (
                            <div
                                key={prescription.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-pink-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {prescription.patient?.fullName}
                                            </h3>
                                            <p className="text-sm text-gray-500">{prescription.patient?.email}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePrint(prescription)}
                                            className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        >
                                            <Printer className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deletePrescription(prescription.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-gray-900 dark:text-white whitespace-pre-line">{prescription.medications}</p>
                                </div>
                                <p className="mt-2 text-sm text-amber-600">
                                    Válida até: {format(new Date(prescription.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
