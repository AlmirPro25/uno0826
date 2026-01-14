import React from 'react';
import { TriageReport, TriagePriority } from '../types';
import { Activity, AlertTriangle, FileText, Stethoscope, BookOpen } from 'lucide-react';

interface Props {
  report: TriageReport;
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

const TriageReportCard: React.FC<Props> = ({ report, onReset }) => {
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

        <div className="pt-4 border-t border-slate-100">
          <button 
            onClick={onReset}
            className="w-full py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Iniciar Nova Triagem
          </button>
        </div>
      </div>
    </div>
  );
};

export default TriageReportCard;