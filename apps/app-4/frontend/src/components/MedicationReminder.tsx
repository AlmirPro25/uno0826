import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pill, Clock, Bell, Plus, X, Check, AlertCircle,
    Calendar, Repeat, Trash2, Edit2, ChevronRight
} from 'lucide-react';
import { getMedications, createMedication, logMedication, Medication as APIMedication } from '@/api/health-profile';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    startDate: string;
    endDate?: string;
    notes?: string;
    taken: { date: string; time: string }[];
    color: string;
}

interface MedicationReminderProps {
    onClose?: () => void;
    compact?: boolean;
}

const medicationColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-amber-500'
];

export function MedicationReminder({ onClose, compact = false }: MedicationReminderProps) {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMedications();
    }, []);

    const loadMedications = async () => {
        try {
            const apiMeds = await getMedications();
            const mapped = apiMeds.map((m: APIMedication, index: number) => {
                let times: string[] = ['08:00'];
                try {
                    if (m.times) times = JSON.parse(m.times);
                } catch { /* use default */ }

                return {
                    id: m.id.toString(),
                    name: m.name,
                    dosage: m.dosage,
                    frequency: m.frequency || 'Diário',
                    times,
                    startDate: m.start_date,
                    endDate: m.end_date,
                    notes: m.instructions,
                    taken: [],
                    color: medicationColors[index % medicationColors.length]
                };
            });
            setMedications(mapped);
        } catch (error) {
            console.error('Error loading medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMed, setEditingMed] = useState<Medication | null>(null);
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: 'Diário',
        times: ['08:00'],
        notes: ''
    });

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const getNextDose = (med: Medication): string | null => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        for (const time of med.times.sort()) {
            const [hours, mins] = time.split(':').map(Number);
            const timeMinutes = hours * 60 + mins;
            if (timeMinutes > currentMinutes) {
                return time;
            }
        }
        return med.times[0]; // Next day
    };

    const isDoseTaken = (med: Medication, time: string): boolean => {
        return med.taken.some(t => t.date === today && t.time === time);
    };

    const markAsTaken = async (medId: string, time: string) => {
        const med = medications.find(m => m.id === medId);
        if (!med) return;

        const alreadyTaken = isDoseTaken(med, time);
        
        if (!alreadyTaken) {
            // Log to API
            try {
                await logMedication({
                    medication_id: parseInt(medId),
                    scheduled_for: `${today}T${time}:00`,
                    status: 'taken'
                });
            } catch (error) {
                console.error('Error logging medication:', error);
            }
        }

        setMedications(prev => prev.map(m => {
            if (m.id === medId) {
                if (alreadyTaken) {
                    return {
                        ...m,
                        taken: m.taken.filter(t => !(t.date === today && t.time === time))
                    };
                }
                return {
                    ...m,
                    taken: [...m.taken, { date: today, time }]
                };
            }
            return m;
        }));
    };

    const addMedication = async () => {
        if (!newMed.name || !newMed.dosage) return;
        
        try {
            const created = await createMedication({
                name: newMed.name,
                dosage: newMed.dosage,
                frequency: newMed.frequency,
                times: JSON.stringify(newMed.times),
                instructions: newMed.notes,
                start_date: today,
                is_active: true
            });

            const medication: Medication = {
                id: created.id.toString(),
                name: newMed.name,
                dosage: newMed.dosage,
                frequency: newMed.frequency,
                times: newMed.times,
                startDate: today,
                notes: newMed.notes,
                taken: [],
                color: medicationColors[Math.floor(Math.random() * medicationColors.length)]
            };
            
            setMedications(prev => [...prev, medication]);
        } catch (error) {
            console.error('Error creating medication:', error);
        }
        
        setNewMed({ name: '', dosage: '', frequency: 'Diário', times: ['08:00'], notes: '' });
        setShowAddModal(false);
    };

    const deleteMedication = (id: string) => {
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const getTodayProgress = (): number => {
        let total = 0;
        let taken = 0;
        medications.forEach(med => {
            total += med.times.length;
            taken += med.times.filter(t => isDoseTaken(med, t)).length;
        });
        return total > 0 ? Math.round((taken / total) * 100) : 0;
    };


    if (compact) {
        const progress = getTodayProgress();
        const pendingMeds = medications.filter(med => 
            med.times.some(t => !isDoseTaken(med, t))
        );

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Pill className="w-5 h-5 text-pink-500" />
                        Medicamentos
                    </h3>
                    <span className="text-sm text-gray-500">{progress}% hoje</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                    />
                </div>

                {pendingMeds.length > 0 ? (
                    <div className="space-y-2">
                        {pendingMeds.slice(0, 2).map(med => {
                            const nextTime = getNextDose(med);
                            return (
                                <div key={med.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className={`w-3 h-3 rounded-full ${med.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {med.name} {med.dosage}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">{nextTime}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Todos os medicamentos tomados!
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                            <Pill className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Meus Medicamentos</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Controle suas doses diárias</p>
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
                {/* Today's Progress */}
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-pink-100 text-sm">Progresso de Hoje</p>
                            <p className="text-3xl font-bold">{getTodayProgress()}%</p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                            <Bell className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getTodayProgress()}%` }}
                            className="bg-white h-3 rounded-full"
                        />
                    </div>
                </div>

                {/* Medications List */}
                <div className="space-y-4">
                    {medications.map(med => (
                        <motion.div
                            key={med.id}
                            layout
                            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-4 h-full min-h-[60px] rounded-full ${med.color}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {med.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                                            </div>
                                            <button
                                                onClick={() => deleteMedication(med.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        {med.notes && (
                                            <p className="text-xs text-gray-400 mt-1">{med.notes}</p>
                                        )}

                                        {/* Times */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {med.times.map(time => {
                                                const taken = isDoseTaken(med, time);
                                                return (
                                                    <button
                                                        key={time}
                                                        onClick={() => markAsTaken(med.id, time)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                                                            taken
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/30'
                                                        }`}
                                                    >
                                                        {taken ? (
                                                            <Check className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Clock className="w-3.5 h-3.5" />
                                                        )}
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Medicamento
                </button>
            </div>


            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Novo Medicamento
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nome do Medicamento
                                    </label>
                                    <input
                                        type="text"
                                        value={newMed.name}
                                        onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                        placeholder="Ex: Losartana"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Dosagem
                                    </label>
                                    <input
                                        type="text"
                                        value={newMed.dosage}
                                        onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                        placeholder="Ex: 50mg"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Frequência
                                    </label>
                                    <select
                                        value={newMed.frequency}
                                        onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                                    >
                                        <option value="Diário">Diário</option>
                                        <option value="12 em 12h">12 em 12h</option>
                                        <option value="8 em 8h">8 em 8h</option>
                                        <option value="Semanal">Semanal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Horários
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {newMed.times.map((time, i) => (
                                            <div key={i} className="flex items-center gap-1">
                                                <input
                                                    type="time"
                                                    value={time}
                                                    onChange={e => {
                                                        const times = [...newMed.times];
                                                        times[i] = e.target.value;
                                                        setNewMed({ ...newMed, times });
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                />
                                                {newMed.times.length > 1 && (
                                                    <button
                                                        onClick={() => setNewMed({ ...newMed, times: newMed.times.filter((_, idx) => idx !== i) })}
                                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setNewMed({ ...newMed, times: [...newMed.times, '12:00'] })}
                                            className="px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-pink-500 hover:text-pink-500 text-sm"
                                        >
                                            + Horário
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Observações (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newMed.notes}
                                        onChange={e => setNewMed({ ...newMed, notes: e.target.value })}
                                        placeholder="Ex: Tomar com água"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={addMedication}
                                        disabled={!newMed.name || !newMed.dosage}
                                        className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MedicationReminder;
