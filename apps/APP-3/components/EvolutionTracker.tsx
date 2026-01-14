

import React, { useState, useMemo } from 'react';
import type { InteractionLogData } from '@/store/useAppStore'; 

export interface EvolutionSubStep {
  name: string;
  status: "Pendente" | "Em Andamento" | "Concluído (Frontend)" | "Tarefa de Backend" | "Concluído" | "Concluído (Estrutura Gerada)";
  description?: string;
}

export interface EvolutionStep {
  name: string;
  status: "Pendente" | "Em Andamento" | "Concluído";
  subSteps: EvolutionSubStep[];
  progress: number; // Percentage 0-100
  description?: string;
}

interface EvolutionTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgress: EvolutionStep[];
  updateSubStepStatus: (stepName: string, subStepName: string, newStatus: EvolutionSubStep['status']) => void;
  loggedInteractions: InteractionLogData[];
  onToggleGoodForTraining: (interactionId: string) => void;
  onExportSelectedLogs: () => void;
  onUpdateLoggedInteraction: (interactionId: string, updates: Partial<Pick<InteractionLogData, 'userPrompt' | 'finalUserCode'>>) => void;
  onSimulateStartTraining: () => void; 
  onOpenPlayground: () => void; // New prop
}

const getStatusColors = (status: EvolutionSubStep['status'] | EvolutionStep['status']) => {
  switch (status) {
    case "Concluído":
    case "Concluído (Frontend)":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "Em Andamento":
      return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    case "Tarefa de Backend":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "Concluído (Estrutura Gerada)":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Pendente":
    default:
      return "bg-slate-600/30 text-slate-400 border-slate-500/30";
  }
};

const getIconForStatus = (status: EvolutionSubStep['status'] | EvolutionStep['status']) => {
    switch (status) {
        case "Concluído":
        case "Concluído (Frontend)":
            return <i className="fa-solid fa-check-circle text-green-400"></i>;
        case "Em Andamento":
            return <i className="fa-solid fa-spinner fa-spin text-sky-400"></i>;
        case "Tarefa de Backend":
            return <i className="fa-solid fa-server text-amber-400"></i>;
        case "Concluído (Estrutura Gerada)":
            return <i className="fa-solid fa-folder-tree text-purple-400"></i>;
        case "Pendente":
        default:
            return <i className="fa-regular fa-circle text-slate-500"></i>;
    }
};


const EvolutionTracker: React.FC<EvolutionTrackerProps> = ({ 
  isOpen, 
  onClose, 
  currentProgress, 
  loggedInteractions,
  onToggleGoodForTraining,
  onExportSelectedLogs,
  onUpdateLoggedInteraction,
  onSimulateStartTraining,
  onOpenPlayground
}) => {
  if (!isOpen) return null;

  const [showLoggedInteractions, setShowLoggedInteractions] = useState<boolean>(false);
  const [filterIsGoodForTraining, setFilterIsGoodForTraining] = useState<boolean | null>(null);
  const [filterUserRating, setFilterUserRating] = useState<'liked' | 'disliked' | null>(null);
  const [filterFeedbackSignal, setFilterFeedbackSignal] = useState<InteractionLogData['feedbackSignal'] | null>(null);
  const [filterModelVersion, setFilterModelVersion] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [editingDetail, setEditingDetail] = useState<{ logId: string; field: 'userPrompt' | 'finalUserCode'; currentText: string } | null>(null);

  const overallProgress = useMemo(() => {
    if (currentProgress.length === 0) return 0;
    const allSubSteps = currentProgress.flatMap(step => step.subSteps);
    const completableSubSteps = allSubSteps.filter(s => s.status !== "Tarefa de Backend");
    if (completableSubSteps.length === 0) return 100;

    const completedSubSteps = completableSubSteps.filter(s => 
        s.status === "Concluído (Frontend)" || 
        s.status === "Concluído" ||
        s.status === "Concluído (Estrutura Gerada)"
    ).length;
    
    return Math.round((completedSubSteps / completableSubSteps.length) * 100);
  }, [currentProgress]);


  const uniqueModelVersions = useMemo(() => {
    const models = new Set(loggedInteractions.map(log => log.modelVersionUsed));
    return Array.from(models);
  }, [loggedInteractions]);

  const feedbackSignalOptions: Array<NonNullable<InteractionLogData['feedbackSignal']>> = [
    'reset', 'finalized_by_user', 'new_generation_started', 'contextual_edit', 
    'contextual_analysis', 'brainstorm_session', 'theme_applied', 'theme_colors_suggested', 
    'site_critique', 'undo_ai_operation', 'load_url_content', 'code_explanation', 
    'code_refactor_suggestion', 'ai_error_fallback_used', 'github_connection_attempt', 
    'github_publish_attempt', 'vercel_deploy_attempt', 'test_suggestion_generated', 
    'ai_code_debug_attempt'
  ];


  const filteredLogs = useMemo(() => {
    return loggedInteractions.filter(log => {
      if (filterIsGoodForTraining !== null && log.isGoodForTraining !== filterIsGoodForTraining) return false;
      if (filterUserRating !== null && log.userRating !== filterUserRating) return false;
      if (filterFeedbackSignal !== null && log.feedbackSignal !== filterFeedbackSignal) return false;
      if (filterModelVersion !== null && log.modelVersionUsed !== filterModelVersion) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first
  }, [loggedInteractions, filterIsGoodForTraining, filterUserRating, filterFeedbackSignal, filterModelVersion]);

  const canExport = useMemo(() => {
    return loggedInteractions.some(log => log.isGoodForTraining);
  }, [loggedInteractions]);

  const canSimulateTraining = useMemo(() => {
    return loggedInteractions.some(log => log.isGoodForTraining);
  }, [loggedInteractions]);

  const handleEditField = (logId: string, field: 'userPrompt' | 'finalUserCode', currentText: string) => {
    setEditingDetail({ logId, field, currentText });
  };

  const handleSaveEdit = () => {
    if (editingDetail) {
      onUpdateLoggedInteraction(editingDetail.logId, { [editingDetail.field]: editingDetail.currentText });
      setEditingDetail(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingDetail(null);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evolution-tracker-title"
    >
      <div className="bg-slate-800 border border-slate-700 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h2 id="evolution-tracker-title" className="text-xl sm:text-2xl font-semibold text-sky-400">
            <i className="fa-solid fa-rocket mr-2"></i>Evolução Contínua da IA Local
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-sky-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500" aria-label="Fechar painel de evolução">
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm font-medium text-slate-300 mb-1">
            <span>Progresso Geral (Etapas Concretas)</span>
            <span>{overallProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div 
              className="bg-sky-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${overallProgress}%` }}
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 pr-2">
          {currentProgress.map((step, stepIndex) => (
            <div key={stepIndex} className={`p-3 rounded-lg border ${getStatusColors(step.status)} shadow-md`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-slate-100">{getIconForStatus(step.status)} <span className="ml-2">{step.name}</span></h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColors(step.status)}`}>{step.status} - {step.progress.toFixed(0)}%</span>
              </div>
              {step.description && <p className="text-xs text-slate-400 mb-2">{step.description}</p>}
              
              <div className="space-y-1.5 ml-2 pl-3 border-l border-slate-600/70">
                {step.subSteps.map((subStep, subIndex) => (
                  <div key={subIndex} className="flex items-center justify-between text-sm py-0.5">
                    <div className="flex items-center">
                      <span className="mr-2 w-5 h-5 flex items-center justify-center">
                         {getIconForStatus(subStep.status)}
                      </span>
                      <span className={`${subStep.status === "Concluído (Frontend)" || subStep.status === "Concluído" ? "line-through text-slate-500" : "text-slate-300"}`}>
                        {subStep.name}
                        {subStep.name === "UI: Seletor de Modelo (Base vs. Treinado)" && (subStep.status === "Concluído (Frontend)" || subStep.status === "Concluído") && 
                          <span className="text-xs text-sky-300/80 ml-1 italic">(Simulado: modelo 'AIWebWeaver v1' no seletor)</span>
                        }
                      </span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border-opacity-50 ${getStatusColors(subStep.status)}`}>
                        {subStep.status}
                    </span>
                  </div>
                ))}
              </div>

              {step.name === "Treinamento Contínuo e Gestão de Modelos (Simulado)" && (
                <div className="mt-3">
                  <button 
                    onClick={() => setShowLoggedInteractions(prev => !prev)}
                    className="text-xs text-sky-400 hover:text-sky-300 underline focus:outline-none focus:ring-1 focus:ring-sky-400 rounded px-1 py-0.5"
                  >
                    {showLoggedInteractions ? "Ocultar Logs Coletados" : "Mostrar Logs Coletados"} ({loggedInteractions.length})
                    <i className={`fa-solid ${showLoggedInteractions ? 'fa-chevron-up' : 'fa-chevron-down'} ml-1.5 fa-xs`}></i>
                  </button>

                  {showLoggedInteractions && (
                    <div className="mt-2 p-3 bg-slate-700/30 rounded-md border border-slate-600/50 max-h-[400px] overflow-y-auto scrollbar-thin">
                      <div className="sticky top-0 bg-slate-700/50 backdrop-blur-sm z-10 py-2 -mx-1 px-1 mb-2 rounded-t-md border-b border-slate-600">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                            <div className="p-1 border border-slate-600 rounded-md bg-slate-700/40">
                                <label htmlFor="filter-good-for-training" className="block text-xs font-medium text-slate-300 mb-1">Bom p/ Treino:</label>
                                <div className="flex gap-1">
                                    <button onClick={() => setFilterIsGoodForTraining(null)} className={`flex-1 px-2 py-1 text-xs rounded ${filterIsGoodForTraining === null ? 'bg-sky-500 text-white ring-1 ring-sky-400' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}>Todos</button>
                                    <button onClick={() => setFilterIsGoodForTraining(true)} className={`flex-1 px-2 py-1 text-xs rounded ${filterIsGoodForTraining === true ? 'bg-green-500 text-white ring-1 ring-green-400' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}><i className="fa-solid fa-star text-yellow-300 mr-1"></i>Sim</button>
                                    <button onClick={() => setFilterIsGoodForTraining(false)} className={`flex-1 px-2 py-1 text-xs rounded ${filterIsGoodForTraining === false ? 'bg-red-500 text-white ring-1 ring-red-400' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}><i className="fa-regular fa-star text-slate-400 mr-1"></i>Não</button>
                                </div>
                            </div>
                            <div className="p-1 border border-slate-600 rounded-md bg-slate-700/40">
                                <label htmlFor="filter-user-rating" className="block text-xs font-medium text-slate-300 mb-1">Avaliação:</label>
                                <div className="flex gap-1">
                                    <button onClick={() => setFilterUserRating(null)} className={`flex-1 px-2 py-1 text-xs rounded ${filterUserRating === null ? 'bg-sky-500 text-white ring-1 ring-sky-400' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}>Todas</button>
                                    <button onClick={() => setFilterUserRating('liked')} className={`flex-1 px-2 py-1 text-xs rounded ${filterUserRating === 'liked' ? 'bg-green-500 text-white ring-1 ring-green-400' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}><i className="fa-solid fa-thumbs-up text-green-300 mr-1"></i>Gostei</button>
                                    <button onClick={() => setFilterUserRating('disliked')} className={`flex-1 px-2 py-1 text-xs rounded ${filterUserRating === 'disliked' ? 'bg-red-500 text-white ring-1 ring-red-400' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}><i className="fa-solid fa-thumbs-down text-red-300 mr-1"></i>Não</button>
                                </div>
                            </div>
                            <div className="p-1 border border-slate-600 rounded-md bg-slate-700/40">
                                <label htmlFor="filter-feedback-signal" className="block text-xs font-medium text-slate-300 mb-1">Sinal de Feedback:</label>
                                <select 
                                    id="filter-feedback-signal"
                                    value={filterFeedbackSignal || ""}
                                    onChange={(e) => setFilterFeedbackSignal(e.target.value as InteractionLogData['feedbackSignal'] || null)}
                                    className="w-full px-2 py-1.5 text-xs bg-slate-600 text-slate-100 rounded border border-slate-500 focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">Todos os Sinais</option>
                                    {feedbackSignalOptions.map(signal => <option key={signal} value={signal}>{signal || "N/A"}</option>)}
                                </select>
                            </div>
                            <div className="p-1 border border-slate-600 rounded-md bg-slate-700/40">
                                <label htmlFor="filter-model-version" className="block text-xs font-medium text-slate-300 mb-1">Versão do Modelo:</label>
                                <select 
                                    id="filter-model-version"
                                    value={filterModelVersion || ""}
                                    onChange={(e) => setFilterModelVersion(e.target.value || null)}
                                    className="w-full px-2 py-1.5 text-xs bg-slate-600 text-slate-100 rounded border border-slate-500 focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">Todos os Modelos</option>
                                    {uniqueModelVersions.map(version => <option key={version} value={version}>{version}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
                            <button
                                onClick={onExportSelectedLogs}
                                disabled={!canExport}
                                className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                title={canExport ? "Exportar logs marcados como 'Bom para Treinamento' em formato JSONL" : "Nenhum log marcado como 'Bom para Treinamento' para exportar"}
                            >
                                <i className="fa-solid fa-file-arrow-down"></i>
                                Exportar Selecionados (JSONL)
                            </button>
                            <p className="text-xs text-slate-400 flex-shrink-0">Exibindo {filteredLogs.length} de {loggedInteractions.length} logs.</p>
                        </div>
                      </div>
                      <div className="pt-1"> {/* Padding top to account for sticky header */}
                        {filteredLogs.length > 0 ? (
                          <ul className="space-y-2">
                            {filteredLogs.map(log => (
                              <li key={log.interactionId} className="p-2.5 bg-slate-700/70 rounded-md border border-slate-600 text-xs shadow">
                                <div className="flex justify-between items-start">
                                  <div className="flex-grow overflow-hidden">
                                    <p className="text-slate-400"><strong>ID:</strong> {log.interactionId.substring(0, 8)}... <span className="text-slate-500 ml-2">({new Date(log.timestamp).toLocaleString()})</span></p>
                                    <p className="text-slate-300 mt-1 truncate" title={log.userPrompt}><strong>Prompt:</strong> {log.userPrompt}</p>
                                    {log.userRating && (
                                      <p className="mt-0.5"><strong>Avaliação:</strong> 
                                        {log.userRating === 'liked' ? <i className="fa-solid fa-thumbs-up text-green-400 ml-1"></i> : <i className="fa-solid fa-thumbs-down text-red-400 ml-1"></i>}
                                      </p>
                                    )}
                                    <p className="mt-0.5"><strong>Modelo:</strong> {log.modelVersionUsed}</p>
                                    {log.feedbackSignal && <p className="mt-0.5"><strong>Sinal:</strong> {log.feedbackSignal}</p>}
                                  </div>
                                  <div className="flex flex-col items-end ml-2 space-y-1.5 flex-shrink-0">
                                    <button
                                      onClick={() => onToggleGoodForTraining(log.interactionId)}
                                      className={`p-1.5 rounded hover:bg-slate-600 transition-colors ${log.isGoodForTraining ? 'text-yellow-400' : 'text-slate-500'}`}
                                      aria-label={log.isGoodForTraining ? "Desmarcar como bom para treinamento" : "Marcar como bom para treinamento"}
                                      title={log.isGoodForTraining ? "Desmarcar como bom para treinamento" : "Marcar como bom para treinamento"}
                                    >
                                      {log.isGoodForTraining ? <i className="fa-solid fa-star fa-lg"></i> : <i className="fa-regular fa-star fa-lg"></i>}
                                    </button>
                                     <button
                                      onClick={() => {
                                          setExpandedLogId(expandedLogId === log.interactionId ? null : log.interactionId);
                                          if (editingDetail?.logId === log.interactionId) setEditingDetail(null); 
                                      }}
                                      className="p-1.5 rounded text-sky-400 hover:text-sky-300 hover:bg-slate-600 transition-colors"
                                      aria-label={expandedLogId === log.interactionId ? "Ocultar detalhes" : "Ver detalhes"}
                                      title={expandedLogId === log.interactionId ? "Ocultar detalhes" : "Ver detalhes"}
                                    >
                                      <i className={`fa-solid ${expandedLogId === log.interactionId ? 'fa-eye-slash' : 'fa-eye'} fa-lg`}></i>
                                    </button>
                                  </div>
                                </div>
                                {expandedLogId === log.interactionId && (
                                  <div className="mt-2 pt-2 border-t border-slate-600 space-y-2">
                                    <div>
                                      <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="font-semibold text-slate-300 text-xs">Prompt do Usuário:</h4>
                                        {editingDetail?.logId === log.interactionId && editingDetail?.field === 'userPrompt' ? null : (
                                          <button onClick={() => handleEditField(log.interactionId, 'userPrompt', log.userPrompt)} className="text-sky-400 hover:text-sky-300 text-xs px-1 py-0.5 rounded hover:bg-slate-600"><i className="fa-solid fa-pencil mr-1"></i>Editar</button>
                                        )}
                                      </div>
                                      {editingDetail?.logId === log.interactionId && editingDetail?.field === 'userPrompt' ? (
                                        <>
                                          <textarea 
                                            value={editingDetail.currentText}
                                            onChange={(e) => setEditingDetail({...editingDetail, currentText: e.target.value})}
                                            className="w-full p-1.5 bg-slate-800 rounded text-slate-300 text-xs border border-slate-600 focus:ring-sky-500 focus:border-sky-500 min-h-[60px] scrollbar-thin"
                                          />
                                          <div className="flex gap-2 mt-1">
                                            <button onClick={handleSaveEdit} className="px-2 py-0.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs">Salvar</button>
                                            <button onClick={handleCancelEdit} className="px-2 py-0.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs">Cancelar</button>
                                          </div>
                                        </>
                                      ) : (
                                        <pre className="p-1.5 bg-slate-800 rounded text-slate-300 text-xs max-h-24 overflow-auto scrollbar-thin whitespace-pre-wrap break-all">{log.userPrompt}</pre>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-300 text-xs mb-0.5 mt-1.5">Código Inicial (Gemini):</h4>
                                      <pre className="p-2 bg-slate-800 rounded text-slate-300 text-xs max-h-40 overflow-auto scrollbar-thin"><code className="language-html">{log.initialGeminiCode}</code></pre>
                                    </div>
                                    <div>
                                       <div className="flex justify-between items-center mb-0.5 mt-1.5">
                                        <h4 className="font-semibold text-slate-300 text-xs">Código Final (Usuário):</h4>
                                         {editingDetail?.logId === log.interactionId && editingDetail?.field === 'finalUserCode' ? null : (
                                          <button onClick={() => handleEditField(log.interactionId, 'finalUserCode', log.finalUserCode)} className="text-sky-400 hover:text-sky-300 text-xs px-1 py-0.5 rounded hover:bg-slate-600"><i className="fa-solid fa-pencil mr-1"></i>Editar</button>
                                        )}
                                      </div>
                                      {editingDetail?.logId === log.interactionId && editingDetail?.field === 'finalUserCode' ? (
                                        <>
                                          <textarea 
                                            value={editingDetail.currentText}
                                            onChange={(e) => setEditingDetail({...editingDetail, currentText: e.target.value})}
                                            className="w-full p-1.5 bg-slate-800 rounded text-slate-300 text-xs border border-slate-600 focus:ring-sky-500 focus:border-sky-500 min-h-[100px] scrollbar-thin"
                                            spellCheck="false"
                                          />
                                          <div className="flex gap-2 mt-1">
                                            <button onClick={handleSaveEdit} className="px-2 py-0.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs">Salvar</button>
                                            <button onClick={handleCancelEdit} className="px-2 py-0.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs">Cancelar</button>
                                          </div>
                                        </>
                                      ) : (
                                        <pre className="p-2 bg-slate-800 rounded text-slate-300 text-xs max-h-40 overflow-auto scrollbar-thin"><code className="language-html">{log.finalUserCode}</code></pre>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-center text-slate-400 py-3 text-sm">Nenhum log encontrado para os filtros atuais.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {step.name === "Treinamento Contínuo e Gestão de Modelos (Simulado)" && (
                <div className="mt-3 p-3 bg-slate-700/30 rounded-md border border-slate-600/50">
                    <p className="text-xs text-slate-300 mb-2">
                        Esta seção representa a fase de treinamento do modelo. Em um sistema real, um script de backend (Python + Vertex AI) usaria os logs marcados como "Bom para Treinamento" para criar uma nova versão fine-tuned do modelo Gemini.
                    </p>
                    <button
                        onClick={onSimulateStartTraining}
                        disabled={!canSimulateTraining}
                        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        title={!canSimulateTraining ? "Nenhum log marcado como 'Bom para Treinamento' para iniciar a simulação." : "Simular início do processo de fine-tuning na Vertex AI"}
                    >
                        <i className="fa-solid fa-cogs"></i>
                        Simular Início de Treinamento na Vertex AI
                    </button>
                     {!canSimulateTraining && (
                        <p className="text-xs text-amber-400 italic mt-1 text-center">Marque alguns logs como "Bom para Treinamento" para habilitar.</p>
                    )}
                </div>
              )}
              {step.name === "Gerente de Modelos (Model Manager)" && (
                 <div className="mt-3 p-3 bg-slate-700/30 rounded-md border border-slate-600/50">
                    <p className="text-xs text-slate-300 mb-2">
                        Esta seção permite avaliar e gerenciar os modelos treinados. O seletor de modelo na barra de comando agora inclui um modelo fine-tuned simulado. Use o playground abaixo para comparar saídas.
                    </p>
                    <button
                        onClick={onOpenPlayground}
                        className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center justify-center gap-1.5"
                        title="Abrir playground para comparar o modelo base com o modelo fine-tuned simulado"
                    >
                        <i className="fa-solid fa-flask-vial"></i>
                        Abrir Playground de Avaliação de Modelos
                    </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 flex items-center gap-2"
          >
            <i className="fa-solid fa-eye"></i>
            Continuar Editando
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvolutionTracker;
