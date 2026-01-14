import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, ArrowLeft, Search, User, Loader2, CheckCircle,
    AlertCircle, Stethoscope, Pill, ClipboardList, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Patient {
    id: number;
    fullName: string;
    email: string;
    cpf?: string;
}

// Common diagnoses for autocomplete
const commonDiagnoses = [
    'Infecção respiratória aguda',
    'Hipertensão arterial',
    'Diabetes mellitus tipo 2',
    'Ansiedade generalizada',
    'Depressão',
    'Lombalgia',
    'Cefaleia tensional',
    'Enxaqueca',
    'Gastrite',
    'Refluxo gastroesofágico',
    'Rinite alérgica',
    'Sinusite',
    'Bronquite',
    'Asma',
    'Dermatite',
    'Infecção urinária',
];

export default function NewMedicalRecordPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { patientId, appointmentId, triageId } = router.query;

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Patient search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Form fields
    const [diagnosis, setDiagnosis] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [treatment, setTreatment] = useState('');
    const [notes, setNotes] = useState('');
    const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false);

    // Triage data (if coming from triage)
    const [triageData, setTriageData] = useState<any>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (patientId) {
            loadPatient(Number(patientId));
        }
        if (triageId) {
            loadTriageData(Number(triageId));
        }
    }, [patientId, triageId]);

    const loadPatient = async (id: number) => {
        try {
            const response = await axiosInstance.get(`/users/${id}`);
            setSelectedPatient(response.data);
        } catch (err) {
            console.error('Error loading patient:', err);
        }
    };

    const loadTriageData = async (id: number) => {
        try {
            const response = await axiosInstance.get(`/triage-reports/${id}`);
            const triage = response.data;
            setTriageData(triage);
            
            // Pre-fill form with triage data
            if (triage.patient_complaint) {
                setSymptoms(triage.patient_complaint);
            }
            if (triage.ai_assessment) {
                setNotes(`Triagem IA: ${triage.ai_assessment}`);
            }
        } catch (err) {
            console.error('Error loading triage:', err);
        }
    };

    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await axiosInstance.get(`/users/search?q=${encodeURIComponent(query)}&role=PACIENTE`);
            setSearchResults(response.data || []);
        } catch (err) {
            setSearchResults([
                { id: 1, fullName: 'Maria Silva', email: 'maria@email.com' },
                { id: 2, fullName: 'João Santos', email: 'joao@email.com' },
            ].filter(p => p.fullName.toLowerCase().includes(query.toLowerCase())));
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery && !selectedPatient) {
                searchPatients(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredDiagnoses = commonDiagnoses.filter(d =>
        d.toLowerCase().includes(diagnosis.toLowerCase())
    );


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedPatient) {
            setError('Selecione um paciente');
            return;
        }

        if (!diagnosis || !symptoms || !treatment) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await axiosInstance.post('/medical-records', {
                patientId: selectedPatient.id,
                diagnosis,
                symptoms,
                treatment,
                notes,
                appointmentId: appointmentId ? Number(appointmentId) : undefined,
                triageReportId: triageId ? Number(triageId) : undefined,
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/medico/medical-records');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao criar prontuário');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Prontuário Criado!
                    </h2>
                    <p className="text-gray-500">Redirecionando...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Novo Prontuário | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Novo Prontuário</h1>
                            <p className="text-cyan-100">Registre o atendimento do paciente</p>
                        </div>
                    </div>
                </div>

                {/* Triage Info Banner */}
                {triageData && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-purple-700 dark:text-purple-300">
                                    Dados da Triagem IA
                                </p>
                                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                    Prioridade: {triageData.priority} | Especialidade: {triageData.recommended_specialty}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Selection */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-cyan-500" />
                            Paciente
                        </h2>

                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {selectedPatient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedPatient.fullName}</p>
                                        <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                                    </div>
                                </div>
                                {!patientId && (
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}
                                        className="text-sm text-cyan-600 hover:underline"
                                    >
                                        Alterar
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar paciente..."
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {searching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                                )}

                                <AnimatePresence>
                                    {searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10"
                                        >
                                            {searchResults.map(patient => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    onClick={() => { setSelectedPatient(patient); setSearchResults([]); }}
                                                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                                                >
                                                    <User className="w-5 h-5 text-cyan-600" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{patient.fullName}</p>
                                                        <p className="text-sm text-gray-500">{patient.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>


                    {/* Clinical Data */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-500" />
                            Dados Clínicos
                        </h2>

                        {/* Symptoms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sintomas / Queixa Principal *
                            </label>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="Descreva os sintomas relatados pelo paciente..."
                                rows={3}
                                required
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            />
                        </div>

                        {/* Diagnosis */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Diagnóstico *
                            </label>
                            <input
                                type="text"
                                value={diagnosis}
                                onChange={(e) => { setDiagnosis(e.target.value); setShowDiagnosisSuggestions(true); }}
                                onFocus={() => setShowDiagnosisSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowDiagnosisSuggestions(false), 200)}
                                placeholder="Digite o diagnóstico..."
                                required
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            
                            <AnimatePresence>
                                {showDiagnosisSuggestions && diagnosis && filteredDiagnoses.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
                                    >
                                        {filteredDiagnoses.slice(0, 5).map((d, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => { setDiagnosis(d); setShowDiagnosisSuggestions(false); }}
                                                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Treatment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Pill className="w-4 h-4" />
                                Tratamento / Conduta *
                            </label>
                            <textarea
                                value={treatment}
                                onChange={(e) => setTreatment(e.target.value)}
                                placeholder="Descreva o tratamento prescrito, medicações, orientações..."
                                rows={4}
                                required
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Observações (opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Observações adicionais, retorno, encaminhamentos..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedPatient}
                            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Salvar Prontuário
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
