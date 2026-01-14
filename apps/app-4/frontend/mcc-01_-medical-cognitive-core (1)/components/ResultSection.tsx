import React from 'react';
import { TriageOutput } from '../types';
import RiskBadge from './RiskBadge';

interface ResultSectionProps {
  data: TriageOutput;
  onReset: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ data, onReset }) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Risk Header */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800">Resultado da Triagem</h2>
          <RiskBadge level={data.risk_level} />
        </div>
        <p className="text-slate-600 italic border-l-4 border-slate-300 pl-4 py-1 bg-slate-50 rounded-r">
          "{data.risk_reasoning}"
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Clinical Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Resumo Clínico (HDA)
          </h3>
          <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{data.summary}</p>
        </div>

        {/* Hypotheses */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Hipóteses Diagnósticas
          </h3>
          <ul className="space-y-2">
            {data.hypotheses.map((item, idx) => (
              <li key={idx} className="flex items-start text-slate-700 text-sm">
                <span className="text-purple-500 font-bold mr-2">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Conduta Sugerida
          </h3>
          <ul className="space-y-2">
            {data.immediate_actions.map((item, idx) => (
              <li key={idx} className="bg-emerald-50 text-emerald-900 px-3 py-2 rounded text-sm border-l-4 border-emerald-400">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Exams */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            Exames Recomendados
          </h3>
           <div className="flex flex-wrap gap-2">
            {data.suggested_exams.map((item, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
        
      {/* Disclaimer Panel */}
      <div className="bg-slate-800 text-slate-300 p-4 rounded-lg text-xs leading-relaxed border border-slate-700">
        <p className="font-bold text-slate-100 mb-1">⚠️ AVISO DE SEGURANÇA (MCC-01):</p>
        <p>{data.disclaimer}</p>
        <p className="mt-2 text-slate-400">O MCC-01 é um sistema de apoio à decisão clínica. Ele não substitui o julgamento profissional. Em caso de emergência real, ignore este sistema e acione os protocolos de urgência imediatamente.</p>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onReset}
          className="text-blue-600 font-semibold hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Nova Triagem
        </button>
      </div>
    </div>
  );
};

export default ResultSection;