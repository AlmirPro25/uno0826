import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Pill, ArrowLeft, Search, User, Loader2, CheckCircle,
    Calendar, AlertCircle, Plus, X, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Patient {
    id: number;
    fullName: string;
    email: string;
    cpf?: string;
}

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export default function NewPrescriptionPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { patientId } = router.query;

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Patient search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Medications
    const [medications, setMedications] = useState<Medication[]>([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);

    // Form
    const [generalInstructions, setGeneralInstructions] = useState('');
    const [validDays, setValidDays] = useState(30);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (patientId) {
            loadPatient(Number(patientId));
        }
    }, [patientId]);

    const loadPatient = async (id: number) => {
        try {
            const response = await axiosInstance.get(`/users/${id}`);
            setSelectedPatient(response.data);
        } catch (err) {
            console.error('Error loading patient:', err);
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
            // Mock data for demo
            setSearchResults([
                { id: 1, fullName: 'Maria Silva', email: 'maria@email.com', cpf: '123.456.789-00' },
                { id: 2, fullName: 'João Santos', email: 'joao@email.com', cpf: '987.654.321-00' },
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

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedication = (index: number) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index));
        }
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const formatMedicationsText = (): string => {
        return medications
            .filter(m => m.name)
            .map((m, i) => {
                let text = `${i + 1}. ${m.name}`;
                if (m.dosage) text += ` - ${m.dosage}`;
                if (m.frequency) text += `\n   Posologia: ${m.frequency}`;
                if (m.duration) text += `\n   Duração: ${m.duration}`;
                if (m.instructions) text += `\n   Obs: ${m.instructions}`;
                return text;
            })
            .join('\n\n');
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedPatient) {
            setError('Selecione um paciente');
            return;
        }

        const validMeds = medications.filter(m => m.name);
        if (validMeds.length === 0) {
            setError('Adicione pelo menos um medicamento');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + validDays);

            await axiosInstance.post('/prescriptions', {
                patientId: selectedPatient.id,
                medications: formatMedicationsText(),
                instructions: generalInstructions,
                validUntil: validUntil.toISOString(),
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/medico/prescriptions');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao criar receita');
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
                        Receita Criada!
                    </h2>
                    <p className="text-gray-500">Redirecionando...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Nova Receita | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Pill className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Nova Receita Médica</h1>
                            <p className="text-pink-100">Prescreva medicamentos para seu paciente</p>
                        </div>
                    </div>
                </div>

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
                                <button
                                    type="button"
                                    onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar paciente por nome ou CPF..."
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
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto"
                                        >
                                            {searchResults.map(patient => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    onClick={() => { setSelectedPatient(patient); setSearchResults([]); }}
                                                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                                                >
                                                    <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-cyan-600" />
                                                    </div>
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


                    {/* Medications */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Pill className="w-5 h-5 text-pink-500" />
                            Medicamentos
                        </h2>

                        <div className="space-y-4">
                            {medications.map((med, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500">Medicamento {index + 1}</span>
                                        {medications.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMedication(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={med.name}
                                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                            placeholder="Nome do medicamento *"
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={med.dosage}
                                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                            placeholder="Dosagem (ex: 500mg)"
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            value={med.frequency}
                                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                            placeholder="Posologia (ex: 1 comp. 8/8h)"
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            value={med.duration}
                                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                            placeholder="Duração (ex: 7 dias)"
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={med.instructions}
                                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                        placeholder="Instruções especiais (opcional)"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </motion.div>
                            ))}

                            <button
                                type="button"
                                onClick={addMedication}
                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-pink-500 hover:text-pink-500 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Adicionar Medicamento
                            </button>
                        </div>
                    </div>

                    {/* General Instructions & Validity */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Instruções Gerais (opcional)
                            </label>
                            <textarea
                                value={generalInstructions}
                                onChange={(e) => setGeneralInstructions(e.target.value)}
                                placeholder="Orientações adicionais para o paciente..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Validade da Receita
                            </label>
                            <select
                                value={validDays}
                                onChange={(e) => setValidDays(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value={7}>7 dias</option>
                                <option value={15}>15 dias</option>
                                <option value={30}>30 dias</option>
                                <option value={60}>60 dias</option>
                                <option value={90}>90 dias</option>
                            </select>
                        </div>
                    </div>

                    {/* Preview */}
                    {medications.some(m => m.name) && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Printer className="w-5 h-5 text-gray-500" />
                                Prévia da Receita
                            </h2>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl font-mono text-sm whitespace-pre-line">
                                {formatMedicationsText()}
                            </div>
                        </div>
                    )}

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
                            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Criar Receita
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
