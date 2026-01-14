import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { axiosInstance } from '@/api/axios';
import { Search, User, Loader2, X, FileText, Calendar, Activity } from 'lucide-react';

interface Patient {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    cpf?: string;
}

interface SearchResult {
    patients: Patient[];
    triages: any[];
    appointments: any[];
}

export function PatientSearch() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Search with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                // Search patients
                const patientsRes = await axiosInstance.get(`/users/search?q=${encodeURIComponent(query)}&role=PACIENTE&limit=5`).catch(() => ({ data: [] }));
                
                // Search triages
                const triagesRes = await axiosInstance.get(`/triage-reports/search?q=${encodeURIComponent(query)}&limit=3`).catch(() => ({ data: [] }));

                setResults({
                    patients: patientsRes.data || [],
                    triages: triagesRes.data || [],
                    appointments: []
                });
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handlePatientClick = (patientId: number) => {
        setIsOpen(false);
        router.push(`/medico/patients/${patientId}`);
    };

    const handleTriageClick = (triageId: number) => {
        setIsOpen(false);
        router.push(`/medico/triagens/${triageId}`);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-500 dark:text-gray-400 transition-colors"
            >
                <Search className="w-4 h-4" />
                <span className="text-sm">Buscar paciente...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">
                    Ctrl+K
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
            <div
                ref={containerRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar paciente por nome, CPF ou email..."
                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
                        autoFocus
                    />
                    {loading && <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {!query.trim() ? (
                        <div className="p-8 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Digite para buscar pacientes</p>
                            <p className="text-sm mt-1">Busque por nome, CPF ou email</p>
                        </div>
                    ) : results && (results.patients.length > 0 || results.triages.length > 0) ? (
                        <div className="p-2">
                            {/* Patients */}
                            {results.patients.length > 0 && (
                                <div className="mb-4">
                                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Pacientes
                                    </p>
                                    {results.patients.map((patient) => (
                                        <button
                                            key={patient.id}
                                            onClick={() => handlePatientClick(patient.id)}
                                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-cyan-600" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {patient.full_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {patient.email}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Triages */}
                            {results.triages.length > 0 && (
                                <div>
                                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Triagens
                                    </p>
                                    {results.triages.map((triage: any) => (
                                        <button
                                            key={triage.id}
                                            onClick={() => handleTriageClick(triage.id)}
                                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {triage.patient_complaint?.substring(0, 50)}...
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {triage.recommended_specialty} • {triage.priority}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : query.trim() && !loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum resultado encontrado</p>
                            <p className="text-sm mt-1">Tente outro termo de busca</p>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                            selecionar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
                            fechar
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
