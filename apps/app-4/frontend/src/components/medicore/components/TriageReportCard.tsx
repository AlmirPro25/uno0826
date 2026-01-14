import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { TriageReport, TriagePriority } from '../types';
import { Activity, AlertTriangle, FileText, Stethoscope, BookOpen, MapPin, Sparkles, Ticket, Brain } from 'lucide-react';
import { SmartScheduler } from '@/components/scheduling/SmartScheduler';

interface Props {
    report: TriageReport;
    triageReportId?: number;
    onReset: () => void;
}

const PriorityBadge: React.FC<{ priority: TriagePriority }> = ({ priority }) => {
    let colorClass = "bg-gray-100 text-gray-800";
    if (priority.includes("Vermelho")) colorClass = "bg-red-100 text-red-800 border-red-200";
    if (priority.includes("Laranja")) colorClass = "bg-orange-100 text-orange-800 border-orange-200";
    if (priority.includes("Amarelo")) colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (priority.includes("Verde")) colorClass = "bg-green-100 text-green-800 border-green-200";
    if (priority.includes("Azul")) colorClass = "bg-blue-100 text-blue-800 border-blue-200";

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colorClass}`}>
            {priority}
        </span>
    );
};

const TriageReportCard: React.FC<Props> = ({ report, triageReportId, onReset }) => {
    const router = useRouter();
    const [showSmartScheduler, setShowSmartScheduler] = useState(false);
    const [patientLocation, setPatientLocation] = useState<{ lat: number; lng: number } | undefined>();

    const handleFindClinics = () => {
        // Get user location and redirect to clinics page with specialty filter
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    router.push({
                        pathname: '/clinics',
                        query: {
                            specialty: report.recommendedSpecialty,
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    });
                },
                () => {
                    // If location fails, just go with specialty
                    router.push({
                        pathname: '/clinics',
                        query: { specialty: report.recommendedSpecialty }
                    });
                }
            );
        } else {
            router.push({
                pathname: '/clinics',
                query: { specialty: report.recommendedSpecialty }
            });
        }
    };

    const handleBookAppointment = () => {
        // Get user location for smart scheduling
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setPatientLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setShowSmartScheduler(true);
                },
                () => {
                    // If location fails, still show scheduler
                    setShowSmartScheduler(true);
                }
            );
        } else {
            setShowSmartScheduler(true);
        }
    };

    const handleScheduled = (appointmentId: number) => {
        setShowSmartScheduler(false);
        // Redirect to appointment details or show success
        router.push(`/paciente/appointments/${appointmentId}`);
    };

    const handleJoinQueue = () => {
        // Map Manchester priority to queue priority
        let queuePriority = 'not_urgent';
        if (report.priority.includes('Vermelho')) queuePriority = 'emergency';
        else if (report.priority.includes('Laranja')) queuePriority = 'very_urgent';
        else if (report.priority.includes('Amarelo')) queuePriority = 'urgent';
        else if (report.priority.includes('Verde')) queuePriority = 'less_urgent';
        else if (report.priority.includes('Azul')) queuePriority = 'not_urgent';

        router.push({
            pathname: '/queue/join',
            query: {
                specialty: report.recommendedSpecialty,
                priority: queuePriority,
                triage_id: triageReportId
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold">Relatório de Triagem - MediCore</h2>
                </div>
                <PriorityBadge priority={report.priority} />
            </div>

            <div className="p-6 space-y-6">

                {/* Main Complaint */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queixa Principal</label>
                    <p className="text-lg font-medium text-slate-800">{report.patientComplaint}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-2 mb-3 text-slate-600">
                            <Activity className="w-4 h-4" />
                            <h3 className="font-semibold text-sm">Histórico e Sinais</h3>
                        </div>
                        <p className="text-sm text-slate-700 mb-2"><strong className="text-slate-900">HMA:</strong> {report.historyOfPresentIllness}</p>
                        <p className="text-sm text-slate-700"><strong className="text-slate-900">Sinais Vitais (Obs):</strong> {report.vitalSignsNote}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-2 mb-3 text-slate-600">
                            <Stethoscope className="w-4 h-4" />
                            <h3 className="font-semibold text-sm">Análise Clínica</h3>
                        </div>
                        <div className="mb-2">
                            <span className="text-xs text-slate-500 block mb-1">Hipóteses Diagnósticas:</span>
                            <div className="flex flex-wrap gap-2">
                                {report.suspectedDiagnosis.map((diag, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 shadow-sm">{diag}</span>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 mt-3"><strong className="text-slate-900">Especialidade:</strong> {report.recommendedSpecialty}</p>
                    </div>
                </div>

                {/* Reasoning */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h3 className="font-semibold text-sm text-amber-800">Justificativa da Classificação</h3>
                    </div>
                    <p className="text-sm leading-relaxed">{report.reasoning}</p>
                </div>

                {/* References */}
                {report.externalReferences && report.externalReferences.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3 text-slate-500">
                            <BookOpen className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">Fontes e Referências (Pesquisa)</h3>
                        </div>
                        <ul className="space-y-1">
                            {report.externalReferences.map((ref, idx) => (
                                <li key={idx}>
                                    <a href={ref.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-600 hover:underline flex items-center">
                                        • {ref.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                    {/* Primary Action - Consult with AI Doctor */}
                    <button
                        onClick={() => router.push(`/ai/neuroclinic?triage_id=${triageReportId}`)}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-blue-600 text-white hover:from-purple-500 hover:via-cyan-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Brain className="w-6 h-6" />
                        <div className="text-left">
                            <div className="text-lg">Consultar com Dr. Nexus</div>
                            <div className="text-xs font-normal opacity-80">Médico Virtual IA - Aprofundar diagnóstico</div>
                        </div>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={handleFindClinics}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                        >
                            <MapPin className="w-4 h-4" />
                            Clínicas Próximas
                        </button>
                        <button
                            onClick={handleBookAppointment}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Agendar Consulta
                        </button>
                        <button
                            onClick={handleJoinQueue}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                            <Ticket className="w-4 h-4" />
                            Entrar na Fila
                        </button>
                    </div>
                    <button
                        onClick={onReset}
                        className="w-full py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Iniciar Nova Triagem
                    </button>
                </div>
            </div>

            {/* Smart Scheduler Modal */}
            {showSmartScheduler && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="relative">
                        <SmartScheduler
                            specialty={report.recommendedSpecialty}
                            priority={report.priority}
                            patientLocation={patientLocation}
                            triageReportId={triageReportId}
                            onScheduled={handleScheduled}
                            onClose={() => setShowSmartScheduler(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TriageReportCard;
