import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, User, Calendar, Loader2, ArrowLeft,
    Plus, Search, Eye, Edit2, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicalRecord {
    id: number;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    notes?: string;
    createdAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
    };
}

export default function MedicalRecordsPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadRecords();
    }, [isAuthenticated]);

    const loadRecords = async () => {
        try {
            setLoading(true);
            // Get records from recent patients
            const response = await axiosInstance.get('/appointments/my-appointments?status=completed&limit=50');
            const appointments = response.data || [];
            
            // Extract unique patients and get their records
            const patientIds = appointments.map((a: any) => a.patientId as number).filter((id: number, index: number, self: number[]) => self.indexOf(id) === index);
            const recordsPromises = patientIds.slice(0, 10).map((id: number) => 
                axiosInstance.get(`/patients/${id}/records`).catch(() => ({ data: [] }))
            );
            
            const recordsResponses = await Promise.all(recordsPromises);
            const allRecords = recordsResponses.flatMap(r => r.data || []);
            setRecords(allRecords);
        } catch (err) {
            // Mock data for demo
            setRecords([
                {
                    id: 1,
                    diagnosis: 'Infecção respiratória aguda',
                    symptoms: 'Tosse, febre, dor de garganta',
                    treatment: 'Antibiótico por 7 dias, repouso',
                    notes: 'Retorno em 7 dias se não melhorar',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    patient: { id: 1, fullName: 'Maria Silva', email: 'maria@email.com' }
                },
                {
                    id: 2,
                    diagnosis: 'Hipertensão arterial',
                    symptoms: 'Dor de cabeça, tontura',
                    treatment: 'Losartana 50mg 1x ao dia',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    patient: { id: 2, fullName: 'João Santos', email: 'joao@email.com' }
                },
                {
                    id: 3,
                    diagnosis: 'Ansiedade generalizada',
                    symptoms: 'Insônia, palpitações, preocupação excessiva',
                    treatment: 'Psicoterapia + Sertralina 50mg',
                    notes: 'Encaminhado para psicólogo',
                    createdAt: new Date(Date.now() - 259200000).toISOString(),
                    patient: { id: 3, fullName: 'Ana Oliveira', email: 'ana@email.com' }
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = records.filter(record => 
        !searchQuery ||
        record.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <title>Prontuários | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/medico/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-cyan-600" />
                            Prontuários
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {records.length} prontuário(s) registrado(s)
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/medico/medical-records/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Prontuário
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por paciente ou diagnóstico..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Records List */}
                {filteredRecords.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhum prontuário encontrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'Tente ajustar a busca' : 'Os prontuários dos seus pacientes aparecerão aqui.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => router.push(`/medico/patients/${record.patient?.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {record.patient?.fullName}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {record.patient?.email}
                                            </p>
                                            <div className="mt-2">
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                    {record.diagnosis}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(record.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Sintomas</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{record.symptoms}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tratamento</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{record.treatment}</p>
                                    </div>
                                </div>
                                
                                {record.notes && (
                                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            <strong>Obs:</strong> {record.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
