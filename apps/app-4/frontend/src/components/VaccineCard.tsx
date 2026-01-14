import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Syringe, Calendar, CheckCircle, AlertTriangle, Clock,
    Plus, X, ChevronRight, Shield, Bell, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { getVaccines, createVaccine, Vaccine as APIVaccine } from '@/api/health-profile';

interface Vaccine {
    id: string;
    name: string;
    date: string;
    nextDose?: string;
    doses: number;
    totalDoses: number;
    manufacturer?: string;
    lot?: string;
    location?: string;
    status: 'complete' | 'pending' | 'overdue';
}

interface VaccineCardProps {
    onClose?: () => void;
    compact?: boolean;
}

export function VaccineCard({ onClose, compact = false }: VaccineCardProps) {
    const [vaccines, setVaccines] = useState<Vaccine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVaccines();
    }, []);

    const loadVaccines = async () => {
        try {
            const apiVaccines = await getVaccines();
            const mapped = apiVaccines.map((v: APIVaccine) => {
                const now = new Date();
                const nextDoseDate = v.next_dose_at ? new Date(v.next_dose_at) : null;
                let status: 'complete' | 'pending' | 'overdue' = 'complete';
                
                if (v.dose_number < v.total_doses) {
                    status = nextDoseDate && nextDoseDate < now ? 'overdue' : 'pending';
                } else if (nextDoseDate && nextDoseDate < now) {
                    status = 'overdue';
                }

                return {
                    id: v.id.toString(),
                    name: v.name,
                    date: v.applied_at,
                    nextDose: v.next_dose_at,
                    doses: v.dose_number,
                    totalDoses: v.total_doses,
                    manufacturer: v.manufacturer,
                    lot: v.batch,
                    location: v.location,
                    status
                };
            });
            setVaccines(mapped);
        } catch (error) {
            console.error('Error loading vaccines:', error);
        } finally {
            setLoading(false);
        }
    };

    const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const completeCount = vaccines.filter(v => v.status === 'complete').length;
    const pendingCount = vaccines.filter(v => v.status === 'pending').length;
    const overdueCount = vaccines.filter(v => v.status === 'overdue').length;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'complete':
                return { label: 'Completa', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
            case 'pending':
                return { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock };
            case 'overdue':
                return { label: 'Atrasada', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
            default:
                return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };


    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Syringe className="w-5 h-5 text-emerald-500" />
                        Vacinas
                    </h3>
                    {overdueCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Carteira de Vacinação</span>
                            <span>{completeCount}/{vaccines.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(completeCount / vaccines.length) * 100}%` }}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {overdueCount > 0 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400">
                            Você tem vacinas atrasadas. Procure uma UBS.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Syringe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Carteira de Vacinação</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Histórico de vacinas</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                        <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-emerald-600">{completeCount}</p>
                        <p className="text-xs text-gray-500">Completas</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                        <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                        <p className="text-xs text-gray-500">Pendentes</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                        <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                        <p className="text-xs text-gray-500">Atrasadas</p>
                    </div>
                </div>

                {/* Overdue Alert */}
                {overdueCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-700 dark:text-red-300">Atenção!</p>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Você tem {overdueCount} vacina{overdueCount > 1 ? 's' : ''} atrasada{overdueCount > 1 ? 's' : ''}. 
                                    Procure uma Unidade Básica de Saúde para atualizar sua carteira.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Vaccines List */}
                <div className="space-y-3">
                    {vaccines.map(vaccine => {
                        const statusConfig = getStatusConfig(vaccine.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <motion.div
                                key={vaccine.id}
                                layout
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                            >
                                <div 
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setSelectedVaccine(selectedVaccine?.id === vaccine.id ? null : vaccine)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            vaccine.status === 'complete' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                            vaccine.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                            'bg-red-100 dark:bg-red-900/30'
                                        }`}>
                                            <Syringe className={`w-6 h-6 ${
                                                vaccine.status === 'complete' ? 'text-emerald-500' :
                                                vaccine.status === 'pending' ? 'text-amber-500' :
                                                'text-red-500'
                                            }`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{vaccine.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {vaccine.doses}/{vaccine.totalDoses} dose{vaccine.totalDoses > 1 ? 's' : ''} • 
                                                Última: {formatDate(vaccine.date)}
                                            </p>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                                            selectedVaccine?.id === vaccine.id ? 'rotate-90' : ''
                                        }`} />
                                    </div>
                                </div>


                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {selectedVaccine?.id === vaccine.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                                        >
                                            <div className="p-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    {vaccine.manufacturer && (
                                                        <div>
                                                            <p className="text-gray-500">Fabricante</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vaccine.manufacturer}</p>
                                                        </div>
                                                    )}
                                                    {vaccine.lot && (
                                                        <div>
                                                            <p className="text-gray-500">Lote</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">{vaccine.lot}</p>
                                                        </div>
                                                    )}
                                                    {vaccine.location && (
                                                        <div>
                                                            <p className="text-gray-500">Local</p>
                                                            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {vaccine.location}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {vaccine.nextDose && (
                                                        <div>
                                                            <p className="text-gray-500">Próxima Dose</p>
                                                            <p className={`font-medium ${
                                                                vaccine.status === 'overdue' ? 'text-red-600' : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                                {formatDate(vaccine.nextDose)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Progress */}
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Progresso</span>
                                                        <span>{vaccine.doses}/{vaccine.totalDoses} doses</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                vaccine.status === 'complete' ? 'bg-emerald-500' :
                                                                vaccine.status === 'pending' ? 'bg-amber-500' :
                                                                'bg-red-500'
                                                            }`}
                                                            style={{ width: `${(vaccine.doses / vaccine.totalDoses) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {vaccine.status !== 'complete' && (
                                                    <button className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center justify-center gap-2">
                                                        <Bell className="w-4 h-4" />
                                                        Lembrar-me
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Vacina
                </button>

                {/* Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-700 dark:text-blue-300">Mantenha sua carteira atualizada</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Vacinas são essenciais para sua proteção e da comunidade. 
                                Consulte o calendário nacional de vacinação.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VaccineCard;
