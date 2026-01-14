
import React, { useState, useEffect } from 'react';
import { repository } from './services/dataRepository'; 
import { Paciente, Medico, MensagemChat, SNDTIntegrationProps, RegistroMedico } from './types';
import { PatientCard } from './components/PatientCard';
import { TelemetryPanel } from './components/TelemetryPanel';
import { AIChatPanel } from './components/AIChatPanel';
import { MatchSystem } from './components/MatchSystem';
import { ConsultationReport } from './components/ConsultationReport';
import { MedicalHistoryTimeline } from './components/MedicalHistoryTimeline';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TourOverlay, TourStep } from './components/TourOverlay';

type ViewState = 'dashboard' | 'match' | 'clinical_workspace';
type PatientPanelTab = 'overview' | 'history';

const TelemedicineModule: React.FC<SNDTIntegrationProps> = ({
    doctorContext,
    initialPatientId,
    externalPatientList,
    onExit,
    onSessionComplete
}) => {
  // Inicialização de Estado Baseado em Props (Integration Logic)
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [activeDoctor, setActiveDoctor] = useState<Medico | null>(doctorContext || null);
  
  const [chatHistory, setChatHistory] = useState<Record<string, MensagemChat[]>>({});
  const [activeTab, setActiveTab] = useState<PatientPanelTab>('overview');
  const [showReportModal, setShowReportModal] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- LÓGICA DO TUTORIAL ---
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Definição dos passos do tutorial
  const tourSteps: TourStep[] = [
      {
          targetId: 'nav-logo',
          title: 'Sistema Nervoso Digital',
          content: 'Bem-vindo ao SNDT. Esta é a sua interface central de comando. O sistema orquestra dados em tempo real.',
          position: 'bottom'
      },
      {
          targetId: 'sidebar-panel',
          title: 'Fila de Triagem Neural',
          content: 'Aqui a IA prioriza pacientes automaticamente baseado em gravidade clínica. Selecione um paciente para iniciar.',
          position: 'right',
          actionRequired: true // O usuário PRECISA clicar num paciente para avançar
      },
      {
          targetId: 'workspace-header',
          title: 'Pasta Viva do Paciente',
          content: 'Diferente de um prontuário estático, esta área respira dados. Veja risco, idade e alertas imediatos.',
          position: 'bottom'
      },
      {
          targetId: 'telemetry-panel',
          title: 'Telemetria IoT em Tempo Real',
          content: 'Dados vitais transmitidos via wearables ou monitores. A IA monitora padrões anômalos aqui.',
          position: 'right'
      },
      {
          targetId: 'chat-panel',
          title: 'Copiloto Clínico Multimodal',
          content: 'Este não é um chat comum. Ele "vê" exames enviados e "escuta" o contexto. Use-o para segunda opinião e suporte à decisão.',
          position: 'left'
      },
      {
          targetId: 'action-bar',
          title: 'Encerramento Inteligente',
          content: 'Ao finalizar, o sistema gera o SOAP automaticamente baseado na conversa e nos dados. Você apenas valida e assina.',
          position: 'bottom'
      }
  ];

  // Verifica se é a primeira vez do usuário
  useEffect(() => {
      const hasSeenTour = localStorage.getItem('sndt_tour_completed');
      if (!hasSeenTour && !initialPatientId) {
          setIsTourOpen(true);
      }
  }, [initialPatientId]);

  const handleStartTutorial = () => {
      // Reseta o estado da UI para o início
      setCurrentView('dashboard');
      setSelectedPatient(null);
      setTourStepIndex(0);
      setIsTourOpen(true);
  };

  const handleTourNext = () => {
      if (tourStepIndex < tourSteps.length - 1) {
          setTourStepIndex(prev => prev + 1);
      } else {
          setIsTourOpen(false);
          localStorage.setItem('sndt_tour_completed', 'true');
      }
  };

  const handleTourPrev = () => {
      if (tourStepIndex > 0) setTourStepIndex(prev => prev - 1);
  };

  // --- FIM LÓGICA TUTORIAL ---

  // Efeito de Hidratação: Sincroniza com o Sistema Principal
  useEffect(() => {
      // 1. Injeta dados externos no repositório se existirem
      if (externalPatientList) {
          repository.hydrate(externalPatientList);
      }
      
      // 2. Atualiza estado local
      setPacientes(repository.getAllPacientes());

      // 3. Verifica Deep Linking (abrir direto no paciente)
      if (initialPatientId) {
          const target = repository.getPacienteById(initialPatientId);
          if (target) {
              setSelectedPatient(target);
              // Se já temos médico (contexto), vai direto pro workspace
              if (doctorContext) {
                  setCurrentView('clinical_workspace');
              } else {
                  setCurrentView('match');
              }
          }
      } else if (doctorContext) {
          // Se só temos o médico mas não paciente, mostra o Dashboard
          setCurrentView('dashboard');
      }

  }, [initialPatientId, doctorContext, externalPatientList]);

  // Atualização de médico ativo se a prop mudar
  useEffect(() => {
      if (doctorContext) setActiveDoctor(doctorContext);
  }, [doctorContext]);

  const handlePatientSelect = (paciente: Paciente) => {
    const pacienteAtualizado = repository.getPacienteById(paciente.id);
    if (!pacienteAtualizado) return;

    setSelectedPatient(pacienteAtualizado);
    setActiveTab('overview');
    
    // Lógica do Tutorial: Se estiver no passo de selecionar paciente, avança
    if (isTourOpen && tourSteps[tourStepIndex].targetId === 'sidebar-panel') {
        setTourStepIndex(prev => prev + 1);
    }
    
    if (!activeDoctor) {
        setCurrentView('match');
    } else {
        setCurrentView('clinical_workspace');
    }
  };

  const handleMedicoSelectedViaMatch = (medico: Medico) => {
      setActiveDoctor(medico);
      setCurrentView('clinical_workspace');
  };

  const handleNewChatMessage = (msg: MensagemChat) => {
      if (!selectedPatient) return;
      setChatHistory(prev => ({
          ...prev,
          [selectedPatient.id]: [...(prev[selectedPatient.id] || []), msg]
      }));
  };

  const handleInitCloseConsultation = () => {
      if (!selectedPatient || !activeDoctor) return;
      setShowReportModal(true);
  };

  const handleConfirmClose = (reportData: any) => {
      if (!selectedPatient || !activeDoctor) return;

      const novoRegistro: RegistroMedico = {
          id: Date.now().toString(),
          pacienteId: selectedPatient.id,
          medicoId: activeDoctor.id,
          data: new Date().toISOString(),
          soap: {
              s: reportData.s,
              o: reportData.o,
              a: reportData.a,
              p: reportData.p
          },
          resumoGeral: reportData.resumoGeral
      };

      // 1. Salva no buffer local (histórico imediato)
      repository.adicionarRegistro(novoRegistro);

      // 2. Callback para o Sistema Principal salvar no DB real
      if (onSessionComplete) {
          onSessionComplete(novoRegistro);
      }

      // 3. Libera o médico apenas se não foi injetado via contexto (se foi injetado, ele continua logado)
      if (!doctorContext) {
          repository.liberarMedico(activeDoctor.id);
          setActiveDoctor(null);
      }
      
      // 4. Limpeza da UI
      setSelectedPatient(null);
      setShowReportModal(false);
      
      // Se tiver deep linking, talvez queira sair, mas por padrão volta ao dashboard
      setCurrentView('dashboard');
      setRefreshTrigger(prev => prev + 1);
  };

  // Cálculos de Dashboard
  const totalMedicos = repository.getAllMedicos().length;
  const disponiveis = repository.getMedicosDisponiveis().length;
  const ocupacao = totalMedicos > 0 ? Math.round(((totalMedicos - disponiveis) / totalMedicos) * 100) : 0;
  const pacientesCriticos = pacientes.filter(p => p.risco === 'ALTO' || p.risco === 'CRITICO').length;
  const totalAtendimentos = repository.getTotalAtendimentos();

  return (
    <ErrorBoundary moduleName="SNDT-Clinical-Core">
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      
      {/* Componente de Tutorial Overlay */}
      <TourOverlay 
        steps={tourSteps}
        currentStepIndex={tourStepIndex}
        isOpen={isTourOpen}
        onNext={handleTourNext}
        onPrev={handleTourPrev}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Modal de Relatório Final */}
      {showReportModal && selectedPatient && activeDoctor && (
          <ConsultationReport 
              paciente={selectedPatient}
              medico={activeDoctor}
              historicoChat={chatHistory[selectedPatient.id] || []}
              onConfirm={handleConfirmClose}
              onCancel={() => setShowReportModal(false)}
          />
      )}

      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white h-14 flex items-center px-6 justify-between shadow-md z-40 shrink-0">
        <div id="nav-logo" className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
            <h1 className="font-bold tracking-tight text-lg">SNDT <span className="font-light opacity-70">| Clinical Module</span></h1>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`transition-colors ${currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
                Torre de Controle
            </button>
            <button 
                onClick={handleStartTutorial}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Ajuda Interativa
            </button>
            {/* Botão de Saída Integrado */}
            {onExit && (
                <button 
                    onClick={onExit}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair do Módulo
                </button>
            )}
        </div>

        <div id="action-bar" className="flex items-center gap-3">
            {activeDoctor ? (
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-lg">
                    <img src={activeDoctor.fotoUrl} className="w-6 h-6 rounded-full border border-slate-600" />
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold leading-none">{activeDoctor.nome}</span>
                        <span className="text-[10px] text-green-400 leading-none mt-0.5">● Conectado</span>
                    </div>
                    <button 
                        onClick={handleInitCloseConsultation} 
                        className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition ml-3 font-medium"
                    >
                        Encerrar
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                    <div className="text-xs text-slate-300 font-mono">SYSTEM READY</div>
                </div>
            )}
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside id="sidebar-panel" className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm shrink-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                    Fila de Triagem
                    <span className="text-slate-900">{pacientes.length} ativos</span>
                </h2>
                <div className="flex gap-2">
                    {pacientesCriticos > 0 && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            {pacientesCriticos} Críticos
                        </span>
                    )}
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded">
                        {pacientes.length - pacientesCriticos} Estáveis
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 bg-slate-100/30">
                {pacientes.map(p => (
                    <PatientCard 
                        key={p.id} 
                        paciente={p} 
                        isSelected={selectedPatient?.id === p.id}
                        onClick={() => handlePatientSelect(p)}
                    />
                ))}
            </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
            
            {/* VIEW: DASHBOARD */}
            {currentView === 'dashboard' && (
                <div className="p-8 h-full overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        <header className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900">Visão Geral da Rede</h2>
                            <p className="text-slate-500 mt-1">
                                {doctorContext 
                                    ? `Bem-vindo, ${doctorContext.nome}. Selecione um paciente para iniciar.`
                                    : "Status operacional em tempo real."}
                            </p>
                        </header>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ocupação Médica</div>
                                <div className="text-4xl font-bold text-slate-900">{ocupacao}%</div>
                                <div className="mt-2 text-xs text-slate-500 font-medium">{disponiveis} Disponíveis</div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-10 -mt-10"></div>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Atendimentos</div>
                                <div className="text-4xl font-bold text-slate-900">{totalAtendimentos}</div>
                                <div className="mt-2 text-xs text-green-600 font-medium">Registros SOAP</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden col-span-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Protocolo de Segurança</div>
                                        <div className="text-2xl font-bold text-slate-900">Ativo / Nível 5</div>
                                        <div className="mt-2 text-xs text-slate-500">Criptografia Ponta-a-Ponta em todas as sessões.</div>
                                    </div>
                                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-8 shadow-2xl relative overflow-hidden border border-slate-800">
                             <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Aguardando Seleção de Caso</h3>
                                <p className="text-slate-300 max-w-lg mb-6 leading-relaxed">
                                    Selecione um paciente na barra lateral para iniciar o protocolo de alocação biprofissional. 
                                    O sistema carregará automaticamente a "Pasta Viva" e iniciará a telemetria.
                                </p>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Match Ativo
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Copiloto Pronto
                                    </div>
                                </div>
                             </div>
                             {/* Abstract Decorative Background */}
                             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-20 -ml-10 -mb-10"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: MATCH SYSTEM */}
            {currentView === 'match' && selectedPatient && (
                <div className="p-6 h-full overflow-y-auto bg-slate-50">
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <button onClick={() => setCurrentView('dashboard')} className="text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                    Cancelar Operação
                                </button>
                                <h2 className="text-2xl font-bold text-slate-900">Alocação de Recurso Especializado</h2>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-slate-400 uppercase">Paciente Alvo</span>
                                <span className="font-bold text-slate-800">{selectedPatient.nome}</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <MatchSystem 
                                paciente={selectedPatient} 
                                onMedicoSelect={handleMedicoSelectedViaMatch} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: CLINICAL WORKSPACE (A "Pasta Viva" + Chat) */}
            {currentView === 'clinical_workspace' && selectedPatient && activeDoctor && (
                <div className="h-full flex flex-col md:flex-row overflow-hidden bg-white">
                    
                    {/* Left Panel: A "Pasta Viva" */}
                    <div className="w-full md:w-5/12 p-0 overflow-hidden border-r border-slate-200 bg-slate-50/50 flex flex-col">
                        {/* Header do Paciente */}
                        <div id="workspace-header" className="p-5 pb-0">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.nome}</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            selectedPatient.risco === 'ALTO' || selectedPatient.risco === 'CRITICO' 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                            RISCO {selectedPatient.risco}
                                        </span>
                                        <span className="text-xs text-slate-500 border-l border-slate-300 pl-2 ml-1">{selectedPatient.idade} anos</span>
                                    </div>
                                </div>
                            </div>

                            {/* Navegação por Abas */}
                            <div className="flex gap-4 border-b border-slate-200">
                                <button 
                                    onClick={() => setActiveTab('overview')}
                                    className={`pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Visão Geral
                                </button>
                                <button 
                                    onClick={() => setActiveTab('history')}
                                    className={`pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Histórico Clínico
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo Scrollável */}
                        <div className="flex-1 overflow-y-auto p-5">
                            
                            {/* ABA: VISÃO GERAL */}
                            {activeTab === 'overview' && (
                                <>
                                    <div id="telemetry-panel" className="mb-6">
                                        <TelemetryPanel telemetria={selectedPatient.ultimaTelemetria} isLive={true} />
                                    </div>

                                    <div className="mb-6 bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                                        <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                            Insight Clínico (Gemini)
                                        </h3>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {selectedPatient.resumoIA}
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Histórico Relevante</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPatient.historico.map(h => (
                                                    <span key={h} className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">{h}</span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Alergias</h4>
                                                {selectedPatient.alergias.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {selectedPatient.alergias.map(a => (
                                                            <span key={a} className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                                • {a}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-xs text-slate-400 italic">Negativo</span>}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Medicamentos</h4>
                                                <div className="flex flex-col gap-1">
                                                    {selectedPatient.medicamentos.map(m => (
                                                        <span key={m} className="text-xs text-slate-600 font-medium flex items-center gap-1">
                                                            • {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ABA: HISTÓRICO */}
                            {activeTab === 'history' && (
                                <div className="animate-fade-in">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Linha do Tempo de Atendimentos</h3>
                                    <MedicalHistoryTimeline pacienteId={selectedPatient.id} />
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right Panel: O Copiloto / Chat */}
                    <div id="chat-panel" className="w-full md:w-7/12 p-0 h-full border-l border-slate-200">
                        <AIChatPanel 
                            paciente={selectedPatient}
                            historicoChat={chatHistory[selectedPatient.id] || []}
                            onNewMessage={handleNewChatMessage}
                        />
                    </div>
                </div>
            )}
            
        </section>
      </main>
    </div>
    </ErrorBoundary>
  );
};

export default TelemedicineModule;
