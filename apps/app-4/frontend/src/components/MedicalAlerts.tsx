import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, AlertCircle, Info, X, Plus,
    Pill, Heart, Syringe, ShieldAlert, ChevronDown,
    ChevronUp, Edit2, Trash2, Check
} from 'lucide-react';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertCategory = 'allergy' | 'condition' | 'medication' | 'other';

interface MedicalAlert {
    id: number;
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    description?: string;
    dateAdded?: Date;
    addedBy?: string;
}

interface MedicalAlertsProps {
    alerts: MedicalAlert[];
    editable?: boolean;
    compact?: boolean;
    onAdd?: (alert: Omit<MedicalAlert, 'id'>) => void;
    onEdit?: (alert: MedicalAlert) => void;
    onDelete?: (alertId: number) => void;
}

const severityConfig: Record<AlertSeverity, { icon: any; color: string; bgColor: string; borderColor: string }> = {
    critical: {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
    },
    warning: {
        icon: AlertCircle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800'
    },
    info: {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
    }
};

const categoryConfig: Record<AlertCategory, { icon: any; label: string; color: string }> = {
    allergy: { icon: ShieldAlert, label: 'Alergia', color: 'text-red-600' },
    condition: { icon: Heart, label: 'Condição', color: 'text-purple-600' },
    medication: { icon: Pill, label: 'Medicamento', color: 'text-emerald-600' },
    other: { icon: Info, label: 'Outro', color: 'text-gray-600' }
};

export function MedicalAlerts({ 
    alerts, 
    editable = false,
    compact = false,
    onAdd,
    onEdit,
    onDelete 
}: MedicalAlertsProps) {
    const [expanded, setExpanded] = useState(!compact);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newAlert, setNewAlert] = useState<Partial<MedicalAlert>>({
        category: 'allergy',
        severity: 'warning',
        title: '',
        description: ''
    });

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');
    const infoAlerts = alerts.filter(a => a.severity === 'info');

    const handleAdd = () => {
        if (newAlert.title && onAdd) {
            onAdd({
                category: newAlert.category || 'other',
                severity: newAlert.severity || 'info',
                title: newAlert.title,
                description: newAlert.description,
                dateAdded: new Date()
            });
            setNewAlert({ category: 'allergy', severity: 'warning', title: '', description: '' });
            setShowAddForm(false);
        }
    };

    if (compact) {
        const hasAlerts = alerts.length > 0;
        const hasCritical = criticalAlerts.length > 0;

        return (
            <div className={`rounded-xl border p-3 ${
                hasCritical 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : hasAlerts 
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-2">
                        {hasCritical ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : hasAlerts ? (
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        ) : (
                            <Check className="w-5 h-5 text-emerald-600" />
                        )}
                        <span className={`font-medium ${
                            hasCritical ? 'text-red-700 dark:text-red-400' : 
                            hasAlerts ? 'text-amber-700 dark:text-amber-400' : 
                            'text-emerald-700 dark:text-emerald-400'
                        }`}>
                            {hasCritical 
                                ? `${criticalAlerts.length} alerta(s) crítico(s)` 
                                : hasAlerts 
                                    ? `${alerts.length} alerta(s)` 
                                    : 'Sem alertas'}
                        </span>
                    </div>
                    {hasAlerts && (
                        expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>

                <AnimatePresence>
                    {expanded && hasAlerts && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 space-y-2">
                                {alerts.slice(0, 5).map(alert => {
                                    const severity = severityConfig[alert.severity];
                                    const category = categoryConfig[alert.category];
                                    const CategoryIcon = category.icon;

                                    return (
                                        <div 
                                            key={alert.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <CategoryIcon className={`w-4 h-4 ${category.color}`} />
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {alert.title}
                                            </span>
                                        </div>
                                    );
                                })}
                                {alerts.length > 5 && (
                                    <p className="text-xs text-gray-500">
                                        +{alerts.length - 5} mais
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Alertas Médicos
                    </h3>
                    {alerts.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            criticalAlerts.length > 0 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                            {alerts.length}
                        </span>
                    )}
                </div>
                {editable && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {alerts.length === 0 && !showAddForm ? (
                    <div className="text-center py-6 text-gray-500">
                        <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                        <p>Nenhum alerta médico registrado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Critical Alerts */}
                        {criticalAlerts.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                    Críticos
                                </h4>
                                {criticalAlerts.map(alert => (
                                    <AlertCard 
                                        key={alert.id} 
                                        alert={alert} 
                                        editable={editable}
                                        isEditing={editingId === alert.id}
                                        onEdit={() => setEditingId(alert.id)}
                                        onSave={(updated) => {
                                            onEdit?.(updated);
                                            setEditingId(null);
                                        }}
                                        onDelete={() => onDelete?.(alert.id)}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Warning Alerts */}
                        {warningAlerts.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                                    Atenção
                                </h4>
                                {warningAlerts.map(alert => (
                                    <AlertCard 
                                        key={alert.id} 
                                        alert={alert} 
                                        editable={editable}
                                        isEditing={editingId === alert.id}
                                        onEdit={() => setEditingId(alert.id)}
                                        onSave={(updated) => {
                                            onEdit?.(updated);
                                            setEditingId(null);
                                        }}
                                        onDelete={() => onDelete?.(alert.id)}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Info Alerts */}
                        {infoAlerts.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                    Informações
                                </h4>
                                {infoAlerts.map(alert => (
                                    <AlertCard 
                                        key={alert.id} 
                                        alert={alert} 
                                        editable={editable}
                                        isEditing={editingId === alert.id}
                                        onEdit={() => setEditingId(alert.id)}
                                        onSave={(updated) => {
                                            onEdit?.(updated);
                                            setEditingId(null);
                                        }}
                                        onDelete={() => onDelete?.(alert.id)}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Form */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        Novo Alerta
                                    </h4>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Categoria
                                            </label>
                                            <select
                                                value={newAlert.category}
                                                onChange={(e) => setNewAlert({ ...newAlert, category: e.target.value as AlertCategory })}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                            >
                                                {Object.entries(categoryConfig).map(([key, config]) => (
                                                    <option key={key} value={key}>{config.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Severidade
                                            </label>
                                            <select
                                                value={newAlert.severity}
                                                onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as AlertSeverity })}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                            >
                                                <option value="critical">Crítico</option>
                                                <option value="warning">Atenção</option>
                                                <option value="info">Informação</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Título *
                                        </label>
                                        <input
                                            type="text"
                                            value={newAlert.title}
                                            onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                                            placeholder="Ex: Alergia a Penicilina"
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Descrição
                                        </label>
                                        <textarea
                                            value={newAlert.description}
                                            onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                                            placeholder="Detalhes adicionais..."
                                            rows={2}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setShowAddForm(false)}
                                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleAdd}
                                            disabled={!newAlert.title}
                                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Alert Card Component
function AlertCard({ 
    alert, 
    editable,
    isEditing,
    onEdit,
    onSave,
    onDelete,
    onCancel
}: { 
    alert: MedicalAlert;
    editable: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (alert: MedicalAlert) => void;
    onDelete: () => void;
    onCancel: () => void;
}) {
    const [editedAlert, setEditedAlert] = useState(alert);
    const severity = severityConfig[alert.severity];
    const category = categoryConfig[alert.category];
    const SeverityIcon = severity.icon;
    const CategoryIcon = category.icon;

    if (isEditing) {
        return (
            <div className={`p-3 rounded-xl border ${severity.borderColor} ${severity.bgColor}`}>
                <div className="space-y-2">
                    <input
                        type="text"
                        value={editedAlert.title}
                        onChange={(e) => setEditedAlert({ ...editedAlert, title: e.target.value })}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm"
                    />
                    <textarea
                        value={editedAlert.description || ''}
                        onChange={(e) => setEditedAlert({ ...editedAlert, description: e.target.value })}
                        rows={2}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm resize-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={onCancel} className="px-2 py-1 text-xs text-gray-500">
                            Cancelar
                        </button>
                        <button 
                            onClick={() => onSave(editedAlert)}
                            className="px-2 py-1 text-xs bg-cyan-600 text-white rounded"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl border ${severity.borderColor} ${severity.bgColor} group`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${severity.color}`}>
                    <CategoryIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            {alert.title}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${severity.bgColor} ${severity.color}`}>
                            {category.label}
                        </span>
                    </div>
                    {alert.description && (
                        <p className="text-sm text-gray-500 mt-1">
                            {alert.description}
                        </p>
                    )}
                </div>
                {editable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onEdit}
                            className="p-1 text-gray-400 hover:text-cyan-600"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1 text-gray-400 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default MedicalAlerts;
