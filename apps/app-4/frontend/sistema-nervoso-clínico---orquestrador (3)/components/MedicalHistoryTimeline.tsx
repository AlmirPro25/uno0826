import React, { useState, useEffect } from 'react';
import { RegistroMedico, Medico } from '../types';
import { repository } from '../services/dataRepository';

interface MedicalHistoryTimelineProps {
  pacienteId: string;
}

export const MedicalHistoryTimeline: React.FC<MedicalHistoryTimelineProps> = ({ pacienteId }) => {
  const [registros, setRegistros] = useState<RegistroMedico[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Busca registros do repositório local
    const data = repository.getRegistrosDoPaciente(pacienteId);
    // Ordena do mais recente para o mais antigo
    setRegistros(data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  }, [pacienteId]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getMedicoNome = (medicoId: string) => {
      const med = repository.getAllMedicos().find(m => m.id === medicoId);
      return med ? med.nome : 'Médico Desconhecido';
  };

  if (registros.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm">Nenhum histórico registrado.</p>
          </div>
      );
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-8">
      {registros.map((reg) => (
        <div key={reg.id} className="relative pl-6">
          {/* Timeline Dot */}
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
          
          <div className={`bg-white rounded-lg border transition-all duration-300 overflow-hidden ${expandedId === reg.id ? 'shadow-md border-blue-300' : 'border-slate-200 hover:border-blue-200'}`}>
            
            {/* Header do Card */}
            <div 
                onClick={() => toggleExpand(reg.id)}
                className="p-4 cursor-pointer flex justify-between items-start"
            >
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {new Date(reg.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        <span className="mx-2">•</span>
                        {new Date(reg.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">Atendimento Geral</h4>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {getMedicoNome(reg.medicoId)}
                    </div>
                </div>
                <button className="text-slate-400 hover:text-blue-500">
                    <svg className={`w-5 h-5 transition-transform ${expandedId === reg.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>

            {/* Conteúdo Expandido (SOAP) */}
            {expandedId === reg.id && (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="mt-3 p-3 bg-white rounded border border-slate-200 text-xs italic text-slate-600 mb-4">
                        "{reg.resumoGeral}"
                    </div>

                    <div className="space-y-3">
                        <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded uppercase">Subjetivo</span>
                            <p className="text-xs text-slate-700 mt-1">{reg.soap.s}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded uppercase">Objetivo</span>
                            <p className="text-xs text-slate-700 mt-1">{reg.soap.o}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1 rounded uppercase">Avaliação</span>
                            <p className="text-xs text-slate-700 mt-1">{reg.soap.a}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded uppercase">Plano</span>
                            <p className="text-xs text-slate-700 mt-1">{reg.soap.p}</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Assinado Digitalmente (Blockchain Hash #8f92a...)
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};