import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, User, Calendar, Loader2,
    ArrowLeft, Printer, Download, AlertCircle
} from 'lucide-react';

interface Certificate {
    id: number;
    type: string;
    days: number;
    startDate: string;
    endDate: string;
    reason: string;
    cid?: string;
    restrictions?: string;
    notes?: string;
    issuedAt: string;
    doctor?: {
        id: number;
        fullName: string;
        specialty?: string;
        crm?: string;
    };
}

export default function PatientCertificatesPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadCertificates();
    }, [isAuthenticated]);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/certificates/my-certificates');
            setCertificates(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar atestados');
        } finally {
            setLoading(false);
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

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'medical_leave': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'absence': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'fitness': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handlePrint = (cert: Certificate) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const today = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const getCertContent = () => {
            const dateFormatted = new Date(cert.startDate).toLocaleDateString('pt-BR');
            switch (cert.type) {
                case 'medical_leave':
                    return `esteve sob cuidados médicos e necessita de afastamento de suas atividades por um período de ${cert.days} dia(s), a partir de ${dateFormatted}.`;
                case 'absence':
                    return `compareceu a esta unidade de saúde na data de ${dateFormatted} para consulta médica.`;
                case 'fitness':
                    return `encontra-se apto(a) para exercer suas atividades normais, conforme avaliação realizada em ${dateFormatted}.`;
                default:
                    return '';
            }
        };

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Atestado Médico - MediSync</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.8; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header p { font-size: 14px; color: #666; }
        .title { text-align: center; font-size: 20px; font-weight: bold; margin: 40px 0; text-transform: uppercase; letter-spacing: 2px; }
        .content { text-align: justify; font-size: 16px; margin-bottom: 40px; }
        .content p { margin-bottom: 20px; text-indent: 40px; }
        .signature { margin-top: 80px; text-align: center; }
        .signature-line { width: 300px; border-top: 1px solid #000; margin: 0 auto 10px; padding-top: 10px; }
        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; }
        @media print { body { padding: 40px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>MediSync - Sistema de Saúde</h1>
        <p>Atestado Médico Digital</p>
    </div>
    <div class="title">${getTypeLabel(cert.type)}</div>
    <div class="content">
        <p>Atesto para os devidos fins que o(a) paciente <strong>${user?.fullName || '_______________'}</strong> ${getCertContent()}</p>
        ${cert.reason ? `<p><strong>Motivo:</strong> ${cert.reason}</p>` : ''}
        ${cert.cid ? `<p><strong>CID-10:</strong> ${cert.cid}</p>` : ''}
        ${cert.restrictions ? `<p><strong>Restrições:</strong> ${cert.restrictions}</p>` : ''}
        ${cert.notes ? `<p><strong>Observações:</strong> ${cert.notes}</p>` : ''}
    </div>
    <div class="signature">
        <div class="signature-line">
            <strong>Dr(a). ${cert.doctor?.fullName || '_______________'}</strong><br>
            CRM: ${cert.doctor?.crm || '_______________'}<br>
            ${cert.doctor?.specialty || 'Médico(a)'}
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
                <title>Meus Atestados | MediSync</title>
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
                        <FileText className="w-7 h-7 text-cyan-600" />
                        Meus Atestados
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {certificates.length} atestado(s) disponível(is)
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Certificates List */}
                {certificates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhum atestado encontrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Seus atestados médicos aparecerão aqui quando emitidos pelo seu médico.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {certificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(cert.type)}`}>
                                                    {getTypeLabel(cert.type)}
                                                </span>
                                                {cert.type === 'medical_leave' && (
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {cert.days} dia(s)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-2">
                                                <User className="w-4 h-4" />
                                                Dr(a). {cert.doctor?.fullName}
                                                {cert.doctor?.specialty && ` - ${cert.doctor.specialty}`}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(cert.startDate).toLocaleDateString('pt-BR')}
                                                {cert.type === 'medical_leave' && cert.endDate && (
                                                    <> até {new Date(cert.endDate).toLocaleDateString('pt-BR')}</>
                                                )}
                                            </p>
                                            {cert.reason && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                    {cert.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePrint(cert)}
                                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium text-sm"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
