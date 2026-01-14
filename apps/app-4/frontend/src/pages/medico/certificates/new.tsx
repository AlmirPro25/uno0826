import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, User, Calendar, Loader2,
    ArrowLeft, Send, Printer, AlertCircle, Search
} from 'lucide-react';

interface Patient {
    id: number;
    fullName: string;
    cpf?: string;
    email?: string;
}

export default function NewCertificatePage() {
    const router = useRouter();
    const { patient_id } = router.query;
    const { user, isAuthenticated } = useAuthStore();
    
    const [patient, setPatient] = useState<Patient | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPatientSearch, setShowPatientSearch] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [createdCertificate, setCreatedCertificate] = useState<any>(null);
    
    // Form fields - using backend types: "absence", "medical_leave", "fitness"
    const [certificateType, setCertificateType] = useState<'medical_leave' | 'absence' | 'fitness'>('medical_leave');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [days, setDays] = useState(1);
    const [reason, setReason] = useState('');
    const [cid, setCid] = useState('');
    const [restrictions, setRestrictions] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (patient_id) {
            loadPatient(Number(patient_id));
        }
    }, [isAuthenticated, patient_id]);

    useEffect(() => {
        // Calculate end date based on days
        if (startDate && days > 0) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + days - 1);
            setEndDate(start.toISOString().split('T')[0]);
        }
    }, [startDate, days]);

    const loadPatient = async (id: number) => {
        try {
            const response = await axiosInstance.get(`/users/${id}`);
            setPatient(response.data);
            setShowPatientSearch(false);
        } catch (err) {
            console.error('Error loading patient:', err);
        }
    };

    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setPatients([]);
            return;
        }
        try {
            const response = await axiosInstance.get(`/admin/users?role=paciente&search=${encodeURIComponent(query)}`);
            setPatients(response.data?.users || response.data || []);
        } catch (err) {
            console.error('Error searching patients:', err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchPatients(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patient) {
            setError('Selecione um paciente');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await axiosInstance.post('/certificates', {
                patientId: patient.id,
                type: certificateType,
                startDate: startDate,
                days,
                reason,
                cid: cid || '',
                restrictions: restrictions || '',
                notes: notes || ''
            });

            setCreatedCertificate(response.data);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao criar atestado');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = generateCertificateHTML();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const getCertificateTitle = () => {
        switch (certificateType) {
            case 'medical_leave': return 'Atestado Médico';
            case 'absence': return 'Declaração de Comparecimento';
            case 'fitness': return 'Atestado de Aptidão';
            default: return 'Atestado Médico';
        }
    };

    const getCertificateContent = () => {
        const patientName = patient?.fullName || '_______________';
        const cpfText = patient?.cpf ? `, portador(a) do CPF ${patient.cpf},` : '';
        const dateFormatted = new Date(startDate).toLocaleDateString('pt-BR');
        
        switch (certificateType) {
            case 'medical_leave':
                return `esteve sob meus cuidados médicos e necessita de afastamento de suas atividades por um período de <strong>${days} dia(s)</strong>, a partir de ${dateFormatted}.`;
            case 'absence':
                return `compareceu a esta unidade de saúde na data de ${dateFormatted} para consulta médica.`;
            case 'fitness':
                return `encontra-se apto(a) para exercer suas atividades normais, conforme avaliação realizada em ${dateFormatted}.`;
            default:
                return '';
        }
    };

    const generateCertificateHTML = () => {
        const today = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        return `
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
        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            color: #666;
        }
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
        .content p {
            margin-bottom: 20px;
            text-indent: 40px;
        }
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
        @media print {
            body { padding: 40px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MediSync - Sistema de Saúde</h1>
        <p>Atestado Médico Digital</p>
    </div>

    <div class="title">
        ${getCertificateTitle()}
    </div>

    <div class="content">
        <p>
            Atesto para os devidos fins que o(a) paciente <strong>${patient?.fullName || '_______________'}</strong>
            ${patient?.cpf ? `, portador(a) do CPF ${patient.cpf},` : ''}
            ${getCertificateContent()}
        </p>
        
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        ${cid ? `<p><strong>CID-10:</strong> ${cid}</p>` : ''}
        ${restrictions ? `<p><strong>Restrições:</strong> ${restrictions}</p>` : ''}
        ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
    </div>

    <div class="signature">
        <div class="signature-line">
            <strong>Dr(a). ${user?.fullName || '_______________'}</strong><br>
            CRM: ${user?.crm || '_______________'}<br>
            ${user?.specialty || 'Médico(a)'}
        </div>
    </div>

    <div class="footer">
        <p>Documento gerado em ${today}</p>
        <p>MediSync - Sistema de Saúde Digital</p>
    </div>

    <script>window.onload = function() { window.print(); }</script>
</body>
</html>
        `;
    };

    if (success) {
        return (
            <>
                <Head>
                    <title>Atestado Criado | MediSync</title>
                </Head>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                            Atestado Criado!
                        </h2>
                        <p className="text-emerald-600 dark:text-emerald-300 mb-6">
                            O atestado foi salvo no sistema e está disponível para o paciente.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir
                            </button>
                            <button
                                onClick={() => router.push('/medico/certificates')}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                            >
                                Ver Todos
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Novo Atestado | MediSync</title>
            </Head>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FileText className="w-7 h-7 text-cyan-600" />
                        Novo Atestado Médico
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Preencha os dados para gerar o atestado
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Selection */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-cyan-600" />
                            Paciente
                        </h2>
                        {patient ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{patient.fullName}</p>
                                        {patient.cpf && <p className="text-sm text-gray-500">CPF: {patient.cpf}</p>}
                                        {patient.email && <p className="text-sm text-gray-500">{patient.email}</p>}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPatient(null);
                                        setShowPatientSearch(true);
                                    }}
                                    className="text-sm text-cyan-600 hover:text-cyan-700"
                                >
                                    Alterar
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowPatientSearch(true);
                                        }}
                                        onFocus={() => setShowPatientSearch(true)}
                                        placeholder="Buscar paciente por nome ou CPF..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                {showPatientSearch && patients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {patients.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setPatient(p);
                                                    setShowPatientSearch(false);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{p.fullName}</p>
                                                    <p className="text-sm text-gray-500">{p.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Certificate Type */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Tipo de Atestado
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => setCertificateType('medical_leave')}
                                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                                    certificateType === 'medical_leave'
                                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <p className="font-medium text-gray-900 dark:text-white">Atestado Médico</p>
                                <p className="text-sm text-gray-500">Afastamento de atividades</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCertificateType('absence')}
                                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                                    certificateType === 'absence'
                                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <p className="font-medium text-gray-900 dark:text-white">Comparecimento</p>
                                <p className="text-sm text-gray-500">Presença em consulta</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCertificateType('fitness')}
                                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                                    certificateType === 'fitness'
                                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <p className="font-medium text-gray-900 dark:text-white">Aptidão</p>
                                <p className="text-sm text-gray-500">Apto para atividades</p>
                            </button>
                        </div>
                    </div>

                    {/* Date and Duration */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-600" />
                            Período
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            {certificateType === 'medical_leave' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Dias de Afastamento
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={days}
                                            onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Data Fim
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            readOnly
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Reason and CID */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Informações Clínicas
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Motivo / Diagnóstico
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ex: Consulta de rotina, Tratamento médico..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        CID-10 (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={cid}
                                        onChange={(e) => setCid(e.target.value)}
                                        placeholder="Ex: J06.9"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Restrições (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={restrictions}
                                        onChange={(e) => setRestrictions(e.target.value)}
                                        placeholder="Ex: Evitar esforço físico..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Observações (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Observações adicionais..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            Visualizar / Imprimir
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !patient}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold transition-colors"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            {submitting ? 'Salvando...' : 'Salvar Atestado'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
