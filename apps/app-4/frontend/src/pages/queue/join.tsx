import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { createTicket, QueueTicket } from '@/api/queue';
import { QRCode } from '@/components/QRCode';
import {
    Ticket, Loader2, CheckCircle, AlertCircle,
    Clock, MapPin, User, ArrowRight, Printer, QrCode
} from 'lucide-react';

const PRIORITY_OPTIONS = [
    { value: 'Emergência', label: 'Emergência', color: 'bg-red-500', description: 'Risco de vida imediato' },
    { value: 'Muito Urgente', label: 'Muito Urgente', color: 'bg-orange-500', description: 'Dor intensa, sangramento' },
    { value: 'Urgente', label: 'Urgente', color: 'bg-yellow-500', description: 'Necessita atendimento rápido' },
    { value: 'Pouco Urgente', label: 'Pouco Urgente', color: 'bg-green-500', description: 'Pode aguardar' },
    { value: 'Não Urgente', label: 'Não Urgente', color: 'bg-blue-500', description: 'Consulta de rotina' },
];

export default function JoinQueuePage() {
    const router = useRouter();
    const { specialty, priority: queryPriority, triage_id } = router.query;
    const { user } = useAuthStore();
    
    const [selectedPriority, setSelectedPriority] = useState<string>('');
    const [patientName, setPatientName] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<QueueTicket | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (queryPriority && typeof queryPriority === 'string') {
            setSelectedPriority(queryPriority);
        }
        if (user?.fullName) {
            setPatientName(user.fullName);
        }
    }, [queryPriority, user]);

    const handleJoinQueue = async () => {
        if (!selectedPriority) {
            setError('Selecione a prioridade');
            return;
        }
        if (!patientName.trim()) {
            setError('Informe o nome do paciente');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newTicket = await createTicket({
                patient_id: user?.id,
                patient_name: patientName,
                priority: selectedPriority,
                specialty: typeof specialty === 'string' ? specialty : undefined,
                triage_report_id: triage_id ? parseInt(triage_id as string) : undefined,
            });
            setTicket(newTicket);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao gerar senha');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getPriorityConfig = (priority: string) => {
        return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[4];
    };

    if (ticket) {
        const priorityConfig = getPriorityConfig(ticket.priority);
        
        return (
            <>
                <Head>
                    <title>Sua Senha | MediSync</title>
                </Head>

                <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden print:shadow-none">
                        {/* Header */}
                        <div className={`${priorityConfig.color} px-6 py-8 text-white text-center`}>
                            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold">Senha Gerada!</h1>
                            <p className="text-white/80 mt-1">Aguarde ser chamado</p>
                        </div>

                        {/* Ticket Number */}
                        <div className="p-8 text-center border-b border-dashed border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Sua Senha
                            </p>
                            <p className="text-6xl font-black text-gray-900 dark:text-white tracking-wider">
                                {ticket.ticket_number}
                            </p>
                            <div className={`inline-block mt-4 px-4 py-2 rounded-full text-white text-sm font-bold ${priorityConfig.color}`}>
                                {priorityConfig.label}
                            </div>
                        </div>

                        {/* QR Code for tracking */}
                        <div className="p-4 flex flex-col items-center border-b border-dashed border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <QrCode className="w-4 h-4" />
                                <span>Escaneie para acompanhar</span>
                            </div>
                            <QRCode 
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/queue/track?ticket=${ticket.ticket_number}`}
                                size={120}
                            />
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <User className="w-5 h-5 text-gray-400" />
                                <span>{ticket.patient_name}</span>
                            </div>
                            {ticket.specialty && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <span>{ticket.specialty}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <span>
                                    {new Date(ticket.created_at).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 space-y-3 print:hidden">
                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir Senha
                            </button>
                            <button
                                onClick={() => router.push(`/queue/track?ticket=${ticket.ticket_number}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Acompanhar Minha Senha
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="p-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
                            MediSync • {new Date().toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Entrar na Fila | MediSync</title>
            </Head>

            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8 text-cyan-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Retirar Senha
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Preencha os dados para entrar na fila de atendimento
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                    {/* Patient Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome do Paciente
                        </label>
                        <input
                            type="text"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Nome completo"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                    </div>

                    {/* Specialty (if from triage) */}
                    {specialty && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Especialidade
                            </label>
                            <div className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {specialty}
                            </div>
                        </div>
                    )}

                    {/* Priority Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Classificação de Risco (Manchester)
                        </label>
                        <div className="space-y-2">
                            {PRIORITY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedPriority(option.value)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                        selectedPriority === option.value
                                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full ${option.color}`} />
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {option.label}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {option.description}
                                        </p>
                                    </div>
                                    {selectedPriority === option.value && (
                                        <CheckCircle className="w-5 h-5 text-cyan-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleJoinQueue}
                        disabled={loading || !selectedPriority || !patientName.trim()}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Ticket className="w-5 h-5" />
                        )}
                        {loading ? 'Gerando...' : 'Gerar Senha'}
                    </button>
                </div>
            </div>
        </>
    );
}
