import React, { useEffect, useState } from 'react';
import { Paciente, MensagemChat, Medico } from '../types';
import { gerarRelatorioClinico } from '../services/geminiService';

interface ConsultationReportProps {
  paciente: Paciente;
  medico: Medico;
  historicoChat: MensagemChat[];
  onConfirm: (report: any) => void;
  onCancel: () => void;
}

export const ConsultationReport: React.FC<ConsultationReportProps> = ({ 
    paciente, 
    medico, 
    historicoChat, 
    onConfirm, 
    onCancel 
}) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
        const result = await gerarRelatorioClinico(paciente, historicoChat);
        setReport(result);
        setLoading(false);
    };
    generate();
  }, [paciente, historicoChat]);

  if (loading) {
      return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-xl font-bold text-slate-800">Gerando Prontuário Inteligente</h3>
                  <p className="text-slate-500 mt-2 text-sm">A IA está compilando o SOAP, analisando o chat e a telemetria final...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur flex items-center justify-center z-50 p-4">
        <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-700">
            {/* Header */}
            <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Encerramento de Consulta</h2>
                    <p className="text-sm text-slate-500">Revisão do Prontuário Gerado Automaticamente</p>
                </div>
                <div className="text-right">
                     <div className="text-xs text-slate-400 uppercase tracking-wider">Médico Responsável</div>
                     <div className="font-bold text-slate-800">{medico.nome}</div>
                     <div className="text-xs text-slate-500">{medico.crm}</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SOAP Format */}
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-lg border-l-4 border-blue-500 shadow-sm">
                            <h4 className="text-xs font-bold text-blue-500 uppercase mb-2">S - Subjetivo</h4>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{report?.s}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg border-l-4 border-red-500 shadow-sm">
                            <h4 className="text-xs font-bold text-red-500 uppercase mb-2">O - Objetivo</h4>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{report?.o}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg border-l-4 border-yellow-500 shadow-sm">
                            <h4 className="text-xs font-bold text-yellow-600 uppercase mb-2">A - Avaliação</h4>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{report?.a}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg border-l-4 border-green-500 shadow-sm">
                            <h4 className="text-xs font-bold text-green-600 uppercase mb-2">P - Plano</h4>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{report?.p}</p>
                        </div>
                    </div>

                    {/* Resumo e Ações */}
                    <div className="flex flex-col">
                        <div className="bg-slate-200 p-6 rounded-lg mb-6">
                            <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Resumo para o Paciente</h4>
                            <p className="text-slate-800 text-sm italic">"{report?.resumoGeral}"</p>
                        </div>

                        <div className="mt-auto">
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span className="text-xs font-bold text-yellow-700 uppercase">Declaração de Responsabilidade</span>
                                </div>
                                <p className="text-[10px] text-yellow-800 text-justify">
                                    Ao confirmar, este registro será criptografado e salvo imutavelmente no histórico do paciente. A IA auxiliou na redação, mas a responsabilidade clínica é inteiramente do médico logado.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition"
                                >
                                    Voltar / Editar
                                </button>
                                <button 
                                    onClick={() => onConfirm(report)}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition flex justify-center items-center gap-2"
                                >
                                    Assinar e Finalizar
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};