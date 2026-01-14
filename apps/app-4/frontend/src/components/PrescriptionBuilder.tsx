import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Pill, Plus, X, Search, Clock,
    AlertTriangle, Info, Printer, Save,
    ChevronDown, ChevronUp
} from 'lucide-react';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity?: string;
}

interface PrescriptionBuilderProps {
    patientName?: string;
    onSave?: (medications: Medication[]) => void;
    onPrint?: () => void;
}

export function PrescriptionBuilder({ 
    patientName = 'Paciente',
    onSave,
    onPrint 
}: PrescriptionBuilderProps) {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [search, setSearch] = useState('');
    const [newMed, setNewMed] = useState<Partial<Medication>>({
        name: '',
        dosage: '',
        frequency: '8/8h',
        duration: '7 dias',
        instructions: ''
    });

    // Common medications database
    const commonMedications = [
        { name: 'Dipirona 500mg', defaultDosage: '1 comprimido', defaultFrequency: '6/6h' },
        { name: 'Paracetamol 750mg', defaultDosage: '1 comprimido', defaultFrequency: '6/6h' },
        { name: 'Ibuprofeno 600mg', defaultDosage: '1 comprimido', defaultFrequency: '8/8h' },
        { name: 'Amoxicilina 500mg', defaultDosage: '1 cápsula', defaultFrequency: '8/8h' },
        { name: 'Azitromicina 500mg', defaultDosage: '1 comprimido', defaultFrequency: '1x/dia' },
        { name: 'Omeprazol 20mg', defaultDosage: '1 cápsula', defaultFrequency: '1x/dia (jejum)' },
        { name: 'Losartana 50mg', defaultDosage: '1 comprimido', defaultFrequency: '1x/dia' },
        { name: 'Metformina 850mg', defaultDosage: '1 comprimido', defaultFrequency: '2x/dia' },
        { name: 'Loratadina 10mg', defaultDosage: '1 comprimido', defaultFrequency: '1x/dia' },
        { name: 'Dexametasona 4mg', defaultDosage: '1 comprimido', defaultFrequency: '1x/dia' },
    ];

    const frequencies = [
        '1x/dia', '2x/dia', '3x/dia', '4x/dia',
        '6/6h', '8/8h', '12/12h', '24/24h',
        'Se necessário', 'Uso contínuo'
    ];

    const durations = [
        '3 dias', '5 dias', '7 dias', '10 dias', '14 dias',
        '21 dias', '30 dias', '60 dias', '90 dias', 'Uso contínuo'
    ];

    const filteredMedications = commonMedications.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectMedication = (med: typeof commonMedications[0]) => {
        setNewMed({
            name: med.name,
            dosage: med.defaultDosage,
            frequency: med.defaultFrequency,
            duration: '7 dias',
            instructions: ''
        });
        setSearch('');
    };

    const addMedication = () => {
        if (!newMed.name || !newMed.dosage) return;
        
        const medication: Medication = {
            id: Date.now().toString(),
            name: newMed.name || '',
            dosage: newMed.dosage || '',
            frequency: newMed.frequency || '8/8h',
            duration: newMed.duration || '7 dias',
            instructions: newMed.instructions || '',
            quantity: newMed.quantity
        };
        
        setMedications(prev => [...prev, medication]);
        setNewMed({
            name: '',
            dosage: '',
            frequency: '8/8h',
            duration: '7 dias',
            instructions: ''
        });
        setShowAddForm(false);
    };

    const removeMedication = (id: string) => {
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const handleSave = () => {
        onSave?.(medications);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Pill className="w-5 h-5 text-pink-500" />
                            Receita Médica
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Paciente: {patientName}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {medications.length > 0 && (
                            <>
                                <button
                                    onClick={onPrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Imprimir
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Salvar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Medications List */}
            <div className="p-4">
                {medications.length === 0 && !showAddForm ? (
                    <div className="text-center py-8">
                        <Pill className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Nenhum medicamento adicionado
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Medicamento
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {medications.map((med, index) => (
                            <motion.div
                                key={med.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center text-pink-600 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {med.name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {med.dosage} • {med.frequency} • {med.duration}
                                            </p>
                                            {med.instructions && (
                                                <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">
                                                    📝 {med.instructions}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeMedication(med.id)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {!showAddForm && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-cyan-500 hover:text-cyan-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar outro medicamento
                            </button>
                        )}
                    </div>
                )}

                {/* Add Form */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 border border-cyan-200 dark:border-cyan-800 rounded-xl bg-cyan-50/50 dark:bg-cyan-900/10"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    Novo Medicamento
                                </h4>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search || newMed.name}
                                        onChange={e => {
                                            setSearch(e.target.value);
                                            setNewMed(prev => ({ ...prev, name: e.target.value }));
                                        }}
                                        placeholder="Buscar medicamento..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    
                                    {search && filteredMedications.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10">
                                            {filteredMedications.map(med => (
                                                <button
                                                    key={med.name}
                                                    onClick={() => selectMedication(med)}
                                                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                                                >
                                                    {med.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Dosage */}
                                <input
                                    type="text"
                                    value={newMed.dosage}
                                    onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                                    placeholder="Dosagem (ex: 1 comprimido)"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />

                                {/* Frequency & Duration */}
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={newMed.frequency}
                                        onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}
                                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        {frequencies.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={newMed.duration}
                                        onChange={e => setNewMed(prev => ({ ...prev, duration: e.target.value }))}
                                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        {durations.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Instructions */}
                                <input
                                    type="text"
                                    value={newMed.instructions}
                                    onChange={e => setNewMed(prev => ({ ...prev, instructions: e.target.value }))}
                                    placeholder="Instruções especiais (opcional)"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />

                                <button
                                    onClick={addMedication}
                                    disabled={!newMed.name || !newMed.dosage}
                                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                                >
                                    Adicionar à Receita
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Warning */}
            {medications.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            Verifique possíveis interações medicamentosas e alergias do paciente antes de finalizar a receita.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PrescriptionBuilder;
