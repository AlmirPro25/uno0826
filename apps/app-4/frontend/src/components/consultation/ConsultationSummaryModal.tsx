import React, { useState } from 'react';
import { 
    X, 
    FileText, 
    Stethoscope, 
    Pill, 
    Calendar,
    Copy,
    Check,
    Download,
    Send,
    Loader2,
    Edit3,
    Save
} from 'lucide-react';

interface ConsultationSummary {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    physicalExamFindings: string;
    assessment: string[];
    plan: string[];
    prescriptions: string[];
    followUp: string;
}

interface ConsultationSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: ConsultationSummary;
    patientName?: string;
    doctorName?: string;
    appointmentId?: number;
    onSave?: (summary: ConsultationSummary) => Promise<void>;
}

export function ConsultationSummaryModal({
    isOpen,
    onClose,
    summary: initialSummary,
    patientName,
    doctorName,
    appointmentId,
    onSave
}: ConsultationSummaryModalProps) {
    const [summary, setSummary] = useState<ConsultationSummary>(initialSummary);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        const text = `
PRONTUÁRIO MÉDICO
================
Paciente: ${patientName || 'N/A'}
Médico: ${doctorName || 'N/A'}
Data: ${new Date().toLocaleDateString('pt-BR')}

QUEIXA PRINCIPAL:
${summary.chiefComplaint}

HISTÓRIA DA DOENÇA ATUAL:
${summary.historyOfPresentIllness}

EXAME FÍSICO:
${summary.physicalExamFindings}

AVALIAÇÃO:
${summary.assessment.map((a, i) => `${i + 1}. ${a}`).join('\n')}

PLANO:
${summary.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}

PRESCRIÇÕES:
${summary.prescriptions.map((p, i) => `${i + 1}. ${p}`).join('\n')}

RETORNO:
${summary.followUp}
        `.trim();

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!onSave) return;
        setIsSaving(true);
        try {
            await onSave(summary);
            setIsEditing(false);
        } catch (e) {
            console.error('Error saving summary:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof ConsultationSummary, value: string | string[]) => {
        setSummary(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Prontuário Gerado por IA</h2>
                            <p className="text-xs text-gray-400">Revise e edite antes de salvar</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Patient Info */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-400">Paciente</p>
                            <p className="text-white font-medium">{patientName || 'N/A'}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-700" />
                        <div>
                            <p className="text-xs text-gray-400">Médico</p>
                            <p className="text-white font-medium">{doctorName || 'N/A'}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-700" />
                        <div>
                            <p className="text-xs text-gray-400">Data</p>
                            <p className="text-white font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    {/* Chief Complaint */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-cyan-400" />
                            Queixa Principal
                        </label>
                        {isEditing ? (
                            <textarea
                                value={summary.chiefComplaint}
                                onChange={(e) => updateField('chiefComplaint', e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                rows={2}
                            />
                        ) : (
                            <p className="p-3 bg-gray-800/50 rounded-lg text-gray-200 text-sm">
                                {summary.chiefComplaint}
                            </p>
                        )}
                    </div>

                    {/* History */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">História da Doença Atual</label>
                        {isEditing ? (
                            <textarea
                                value={summary.historyOfPresentIllness}
                                onChange={(e) => updateField('historyOfPresentIllness', e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                rows={4}
                            />
                        ) : (
                            <p className="p-3 bg-gray-800/50 rounded-lg text-gray-200 text-sm whitespace-pre-wrap">
                                {summary.historyOfPresentIllness}
                            </p>
                        )}
                    </div>

                    {/* Physical Exam */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Exame Físico</label>
                        {isEditing ? (
                            <textarea
                                value={summary.physicalExamFindings}
                                onChange={(e) => updateField('physicalExamFindings', e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                rows={3}
                            />
                        ) : (
                            <p className="p-3 bg-gray-800/50 rounded-lg text-gray-200 text-sm">
                                {summary.physicalExamFindings || 'Não informado'}
                            </p>
                        )}
                    </div>

                    {/* Assessment */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Avaliação / Diagnósticos</label>
                        <div className="space-y-2">
                            {summary.assessment.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    {isEditing ? (
                                        <input
                                            value={item}
                                            onChange={(e) => {
                                                const newAssessment = [...summary.assessment];
                                                newAssessment[index] = e.target.value;
                                                updateField('assessment', newAssessment);
                                            }}
                                            className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                        />
                                    ) : (
                                        <span className="text-gray-200 text-sm">{item}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Plan */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Plano / Conduta</label>
                        <div className="space-y-2">
                            {summary.plan.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    {isEditing ? (
                                        <input
                                            value={item}
                                            onChange={(e) => {
                                                const newPlan = [...summary.plan];
                                                newPlan[index] = e.target.value;
                                                updateField('plan', newPlan);
                                            }}
                                            className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                        />
                                    ) : (
                                        <span className="text-gray-200 text-sm">{item}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Prescriptions */}
                    {summary.prescriptions.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Pill className="w-4 h-4 text-purple-400" />
                                Prescrições
                            </label>
                            <div className="space-y-2">
                                {summary.prescriptions.map((item, index) => (
                                    <div key={index} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        {isEditing ? (
                                            <input
                                                value={item}
                                                onChange={(e) => {
                                                    const newPrescriptions = [...summary.prescriptions];
                                                    newPrescriptions[index] = e.target.value;
                                                    updateField('prescriptions', newPrescriptions);
                                                }}
                                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                            />
                                        ) : (
                                            <span className="text-purple-200 text-sm">{item}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Follow Up */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            Retorno
                        </label>
                        {isEditing ? (
                            <input
                                value={summary.followUp}
                                onChange={(e) => updateField('followUp', e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                        ) : (
                            <p className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm">
                                {summary.followUp || 'Não especificado'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isEditing 
                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <Edit3 className="w-4 h-4" />
                            {isEditing ? 'Editando' : 'Editar'}
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        {onSave && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Salvar Prontuário
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
