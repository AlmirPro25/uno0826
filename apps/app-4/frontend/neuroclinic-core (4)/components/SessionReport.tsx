import React from 'react';
import { MedicalRecord } from '../types';

interface SessionReportProps {
  report: MedicalRecord | null;
  onReset: () => void;
}

const SessionReport: React.FC<SessionReportProps> = ({ report, onReset }) => {
  if (!report) {
      return (
          <div className="text-red-500 font-mono text-center mt-10">
              ERROR: DATA CORRUPTION. UNABLE TO GENERATE MEDICAL RECORD.
              <br/>
              <button onClick={onReset} className="mt-4 underline">RESET SYSTEM</button>
          </div>
      );
  }

  const riskColors = {
      'LOW': 'text-emerald-400 border-emerald-500',
      'MODERATE': 'text-yellow-400 border-yellow-500',
      'HIGH': 'text-orange-500 border-orange-500',
      'CRITICAL': 'text-red-500 border-red-500 animate-pulse'
  };

  return (
    <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 p-8 rounded-sm shadow-2xl overflow-hidden relative font-mono text-slate-300">
         {/* WATERMARK */}
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
             <div className="text-9xl font-black text-slate-500">CONFIDENTIAL</div>
         </div>

         {/* Header */}
         <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8 relative z-10">
             <div>
                 <h2 className="text-3xl font-bold text-slate-100 tracking-tighter flex items-center gap-3">
                     <span className="w-8 h-8 bg-cyan-500 rounded-sm inline-block"></span>
                     MEDICAL RECORD
                 </h2>
                 <p className="text-xs text-cyan-600 mt-2 tracking-[0.2em] uppercase">NEUROCLINIC COGNITIVE CORE // ID: {report.patientId || 'UNK-001'}</p>
             </div>
             <div className="text-right">
                 <div className="text-xs text-slate-500 mb-1">RISK ASSESSMENT</div>
                 <div className={`text-xl font-bold border-2 px-4 py-1 inline-block rounded ${riskColors[report.riskAssessment?.level || 'LOW']}`}>
                     {report.riskAssessment?.level}
                 </div>
             </div>
         </div>

         {/* Content Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             
             {/* LEFT COLUMN */}
             <div className="space-y-8">
                 <div className="bg-slate-900/50 p-6 rounded border border-slate-800">
                     <h3 className="text-cyan-400 font-bold tracking-widest text-sm mb-4 border-b border-cyan-900/50 pb-2">SUBJECTIVE</h3>
                     <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.subjective}</p>
                 </div>

                 <div className="bg-slate-900/50 p-6 rounded border border-slate-800">
                     <h3 className="text-cyan-400 font-bold tracking-widest text-sm mb-4 border-b border-cyan-900/50 pb-2">OBJECTIVE</h3>
                     <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.objective}</p>
                 </div>
             </div>

             {/* RIGHT COLUMN */}
             <div className="space-y-8">
                <div className="bg-slate-900/50 p-6 rounded border border-slate-800">
                     <h3 className="text-violet-400 font-bold tracking-widest text-sm mb-4 border-b border-violet-900/50 pb-2">ASSESSMENT</h3>
                     <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.assessment}</p>
                     
                     <div className="mt-4 p-3 bg-slate-950 border border-slate-800 text-xs text-slate-400 italic">
                         Justification: {report.riskAssessment?.justification}
                     </div>
                 </div>

                 <div className="bg-slate-900/50 p-6 rounded border border-slate-800">
                     <h3 className="text-emerald-400 font-bold tracking-widest text-sm mb-4 border-b border-emerald-900/50 pb-2">CLINICAL PLAN</h3>
                     <ul className="space-y-3">
                         {report.plan?.map((item, idx) => (
                             <li key={idx} className="flex gap-3 text-sm group">
                                 <span className="text-emerald-600 font-bold group-hover:text-emerald-400 transition-colors">{idx + 1}.</span>
                                 <span className="text-slate-300">{item}</span>
                             </li>
                         ))}
                     </ul>
                 </div>
             </div>

         </div>

         {/* Footer / Actions */}
         <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between items-center relative z-10">
             <div className="text-[10px] text-slate-600 max-w-md">
                 DIGITAL SIGNATURE: DR. NEXUS (AI-ID: {crypto.randomUUID().split('-')[0]})
                 <br/>
                 TIMESTAMP: {new Date().toISOString()}
             </div>
             <button 
                onClick={onReset}
                className="bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-800 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
             >
                Initialize New Patient
             </button>
         </div>
    </div>
  );
};

export default SessionReport;
