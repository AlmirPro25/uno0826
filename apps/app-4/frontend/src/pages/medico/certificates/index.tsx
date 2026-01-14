import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, Plus, User, Calendar, Loader2,
    ArrowLeft, Eye, Trash2, AlertCircle, Search
} from 'lucide-react';

interface Certificate {
    id: number;
    patientId: number;
    type: string;
    days: number;
    startDate: string;
    endDate: string;
    reason: string;
    cid?: string;
    issuedAt: string;
    patient?: {
        id: number;
        fullName: string;
        email: string;
    };
}

export default function CertificatesListPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

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

    const deleteCertificate = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este atestado?')) return;
        
        try {
            await axiosInstance.delete(`/certificates/${id}`);
            setCertificates(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir atestado');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'medical_leave': return 'Atestado Médico';
            case 'absence': return 'Comparecimento';
            case 'fitness': return 'Aptidão';
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

    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = !searchQuery || 
            cert.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.reason?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || cert.type === filterType;
        return matchesSearch && matchesType;
    });

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
                <title>Atestados | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto p-6 space-y-6">
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
                            Atestados Médicos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {certificates.length} atestado(s) emitido(s)
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/medico/certificates/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Atestado
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por paciente ou motivo..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="medical_leave">Atestado Médico</option>
                        <option value="absence">Comparecimento</option>
                        <option value="fitness">Aptidão</option>
                    </select>
                </div>

                {/* Certificates List */}
                {filteredCertificates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhum atestado encontrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery || filterType !== 'all' 
                                ? 'Tente ajustar os filtros de busca'
                                : 'Comece criando um novo atestado'}
                        </p>
                        <button
                            onClick={() => router.push('/medico/certificates/new')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Atestado
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCertificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {cert.patient?.fullName || 'Paciente'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {cert.patient?.email}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(cert.type)}`}>
                                                    {getTypeLabel(cert.type)}
                                                </span>
                                                {cert.type === 'medical_leave' && (
                                                    <span className="text-sm text-gray-500">
                                                        {cert.days} dia(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push(`/medico/certificates/${cert.id}`)}
                                            className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Ver detalhes"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteCertificate(cert.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {new Date(cert.startDate).toLocaleDateString('pt-BR')}
                                            {cert.type === 'medical_leave' && cert.endDate && (
                                                <> até {new Date(cert.endDate).toLocaleDateString('pt-BR')}</>
                                            )}
                                        </span>
                                    </div>
                                    {cert.reason && (
                                        <span className="truncate max-w-xs">
                                            {cert.reason}
                                        </span>
                                    )}
                                    {cert.cid && (
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                            CID: {cert.cid}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
