import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, User, Calendar, Loader2,
    ArrowLeft, Printer, Trash2, AlertCircle
} from 'lucide-react';

interface Certificate {
    id: number;
    patientId: number;
    doctorId: number;
    type: string;
    days: number;
    startDate: string;
    endDate: string;
    reason: string;
    cid?: string;
    restrictions?: string;
    notes?: string;
    issuedAt: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
        cpf?: string;
    };
    doctor?: {
        id: number;
        fullName: string;
        specialty?: string;
        crm?: string;
    };
}

export default function CertificateDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated } = useAuthStore();
    
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (id) {
            loadCertificate();
        }
    }, [isAuthenticated, id]);

    const loadCertificate = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/certificates/${id}`);
            setCertificate(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar atestado');
        } finally {
            setLoading(false);
        }
    };

    const deleteCertificate = async () => {
        if (!confirm('Tem certeza que deseja excluir este atestado?')) return;
        
        try {
            await axiosInstance.delete(`/certificates/${id}`);
            router.push('/medico/certificates');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir atestado');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'medical_leave': return 'Atestado Médico';
            case 'absence': return 'Declaração de Comparecimento';
            case 'fitness': return 'Atestado de Aptidão';
            default: return type;
        }
    };

    const getCertificateContent = () => {
        if (!certificate) return '';
        const patientName = certificate.patient?.fullName || '_______________';
        const dateFormatted = new Date(certificate.startDate).toLocaleDateString('pt-BR');
        
        switch (certificate.type) {
            case 'medical_leave':
                return `esteve sob meus cuidados médicos e necessita de afastamento de suas atividades por um período de ${certificate.days} dia(s), a partir de ${dateFormatted}.`;
            case 'absence':
                return `compareceu a esta unidade de saúde na data de ${dateFormatted} para consulta médica.`;
            case 'fitness':
                return `encontra-se apto(a) para exercer suas atividades normais, conforme avaliação realizada em ${dateFormatted}.`;
            default:
                return '';
        }
    };

    const handlePrint = () => {
        if (!certificate) return;
        
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
    <title>Atestado Médico - MediSync</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', serif;
            padding: 60px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.8;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header p { font-size: 14px; color: #666; }
        .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 40px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            text-align: justify;
            font-size: 16px;
            margin-bottom: 40px;
        }
        .content p { margin-bottom: 20px; text-indent: 40px; }
        .signature {
            margin-top: 80px;
            text-align: center;
        }
        .signature-line {
            width: 300px;
            border-top: 1px solid #000;
            margin: 0 auto 10px;
            padding-top: 10px;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print { body { padding: 40px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>MediSync - Sistema de Saúde</h1>
        <p>Atestado Médico Digital</p>
    </div>
    <div class="title">${getTypeLabel(certificate.type)}</div>
    <div class="content">
        <p>
            Atesto para os devidos fins que o(a) paciente <strong>${certificate.patient?.fullName || '_______________'}</strong>
            ${certificate.patient?.cpf ? `, portador(a) do CPF ${certificate.patient.cpf},` : ''}
            ${getCertificateContent()}
        </p>
        ${certificate.reason ? `<p><strong>Motivo:</strong> ${certificate.reason}</p>` : ''}
        ${certificate.cid ? `<p><strong>CID-10:</strong> ${certificate.cid}</p>` : ''}
        ${certificate.restrictions ? `<p><strong>Restrições:</strong> ${certificate.restrictions}</p>` : ''}
        ${certificate.notes ? `<p><strong>Observações:</strong> ${certificate.notes}</p>` : ''}
    </div>
    <div class="signature">
        <div class="signature-line">
            <strong>Dr(a). ${certificate.doctor?.fullName || user?.fullName || '_______________'}</strong><br>
            CRM: ${certificate.doctor?.crm || user?.crm || '_______________'}<br>
            ${certificate.doctor?.specialty || user?.specialty || 'Médico(a)'}
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

    if (error || !certificate) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-200 mb-2">
                        {error || 'Atestado não encontrado'}
                    </h2>
                    <button
                        onClick={() => router.push('/medico/certificates')}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Atestado #{certificate.id} | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/medico/certificates')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-cyan-600" />
                            {getTypeLabel(certificate.type)}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Emitido em {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimir
                        </button>
                        <button
                            onClick={deleteCertificate}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
                        >
                            <Trash2 className="w-5 h-5" />
                            Excluir
                        </button>
                    </div>
                </div>

                {/* Certificate Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                    {/* Patient Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
                        <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-cyan-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                {certificate.patient?.fullName}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                                {certificate.patient?.email}
                            </p>
                            {certificate.patient?.cpf && (
                                <p className="text-sm text-gray-500">CPF: {certificate.patient.cpf}</p>
                            )}
                        </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tipo</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {getTypeLabel(certificate.type)}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Período</p>
                                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(certificate.startDate).toLocaleDateString('pt-BR')}
                                    {certificate.type === 'medical_leave' && certificate.endDate && (
                                        <> até {new Date(certificate.endDate).toLocaleDateString('pt-BR')}</>
                                    )}
                                </p>
                            </div>
                        </div>

                        {certificate.type === 'medical_leave' && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Dias de Afastamento</p>
                                <p className="font-bold text-2xl text-blue-700 dark:text-blue-300">
                                    {certificate.days} dia(s)
                                </p>
                            </div>
                        )}

                        {certificate.reason && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Motivo</p>
                                <p className="text-gray-900 dark:text-white">{certificate.reason}</p>
                            </div>
                        )}

                        {certificate.cid && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">CID-10</p>
                                <p className="font-mono text-gray-900 dark:text-white">{certificate.cid}</p>
                            </div>
                        )}

                        {certificate.restrictions && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Restrições</p>
                                <p className="text-amber-800 dark:text-amber-200">{certificate.restrictions}</p>
                            </div>
                        )}

                        {certificate.notes && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Observações</p>
                                <p className="text-gray-900 dark:text-white">{certificate.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Doctor Signature */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <div className="inline-block border-t-2 border-gray-400 pt-2 px-8">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Dr(a). {certificate.doctor?.fullName || user?.fullName}
                            </p>
                            <p className="text-sm text-gray-500">
                                CRM: {certificate.doctor?.crm || user?.crm || '_______________'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {certificate.doctor?.specialty || user?.specialty || 'Médico(a)'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
