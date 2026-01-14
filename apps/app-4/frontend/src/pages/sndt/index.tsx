/**
 * SNDT - Sistema Nervoso Digital de Telemedicina
 * Integrado ao MediSync
 * 
 * Este módulo permite que médicos atendam pacientes com suporte de IA,
 * incluindo match inteligente, copiloto clínico e geração de SOAP.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ArrowLeft, Users, Activity, MessageSquare, FileText, Search, Shield, X } from 'lucide-react';

// ============ TYPES ============
enum RiscoClinico {
  BAIXO = 'BAIXO',
  MODERADO = 'MODERADO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
}

interface Telemetria {
  fc: number;
  spo2: number;
  pa: string;
  temp: number;
  timestamp: string;
}

interface Paciente {
  id: string;
  nome: string;
  idade: number;
  genero: string;
  fotoUrl: string;
  risco: RiscoClinico;
  queixaPrincipal: string;
  historico: string[];
  alergias: string[];
  medicamentos: string[];
  ultimaTelemetria: Telemetria;
  resumoIA: string;
}

interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  disponivel: boolean;
  scoreMatch: number;
  tags: string[];
  fotoUrl: string;
}

interface MensagemChat {
  id: string;
  remetente: 'user' | 'ai' | 'system';
  conteudo: string;
  timestamp: Date;
}

type ViewState = 'dashboard' | 'match' | 'clinical_workspace';

// ============ MOCK DATA ============
const MOCK_PACIENTES: Paciente[] = [
  {
    id: 'P001',
    nome: 'Carlos Mendes',
    idade: 58,
    genero: 'Masculino',
    fotoUrl: 'https://picsum.photos/id/1012/200/200',
    risco: RiscoClinico.ALTO,
    queixaPrincipal: "Dor torácica irradiando para o braço esquerdo, iniciada há 2 horas.",
    historico: ['Hipertensão', 'Ex-tabagista', 'Pai faleceu de IAM'],
    alergias: ['Dipirona'],
    medicamentos: ['Losartana 50mg', 'AAS 100mg'],
    ultimaTelemetria: { fc: 110, spo2: 96, pa: '160/100', temp: 36.5, timestamp: new Date().toISOString() },
    resumoIA: "Paciente de alto risco cardiovascular apresentando sintomas clássicos de angina instável."
  },
  {
    id: 'P002',
    nome: 'Ana Souza',
    idade: 29,
    genero: 'Feminino',
    fotoUrl: 'https://picsum.photos/id/1027/200/200',
    risco: RiscoClinico.MODERADO,
    queixaPrincipal: "Manchas vermelhas na pele e coceira intensa após ingerir frutos do mar.",
    historico: ['Rinite Alérgica'],
    alergias: ['Camarão (suspeita)'],
    medicamentos: ['Anticoncepcional'],
    ultimaTelemetria: { fc: 88, spo2: 98, pa: '120/80', temp: 37.0, timestamp: new Date().toISOString() },
    resumoIA: "Provável reação alérgica aguda (Urticária). Monitorar sinais de anafilaxia."
  },
  {
    id: 'P003',
    nome: 'Julia Roberto',
    idade: 8,
    genero: 'Feminino',
    fotoUrl: 'https://picsum.photos/id/342/200/200',
    risco: RiscoClinico.BAIXO,
    queixaPrincipal: "Febre baixa e dor de garganta.",
    historico: ['Asma leve'],
    alergias: [],
    medicamentos: ['Bombinha SOS'],
    ultimaTelemetria: { fc: 100, spo2: 97, pa: '100/60', temp: 37.8, timestamp: new Date().toISOString() },
    resumoIA: "Quadro infeccioso de vias aéreas superiores, provável etiologia viral."
  }
];

// ============ COMPONENTS ============
function PatientCard({ paciente, isSelected, onClick }: { paciente: Paciente; isSelected: boolean; onClick: () => void }) {
  const riskColors: Record<RiscoClinico, string> = {
    [RiscoClinico.BAIXO]: 'bg-green-100 text-green-700 border-green-200',
    [RiscoClinico.MODERADO]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [RiscoClinico.ALTO]: 'bg-orange-100 text-orange-700 border-orange-200',
    [RiscoClinico.CRITICO]: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all mb-3 ${
        isSelected 
          ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' 
          : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <img src={paciente.fotoUrl} alt={paciente.nome} className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-slate-900 truncate">{paciente.nome}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColors[paciente.risco]}`}>
              {paciente.risco}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">{paciente.idade} anos • {paciente.genero}</p>
          <p className="text-xs text-slate-600 line-clamp-2">{paciente.queixaPrincipal}</p>
        </div>
      </div>
    </div>
  );
}

function TelemetryPanel({ telemetria }: { telemetria: Telemetria }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-red-50 p-3 rounded-lg text-center">
        <p className="text-2xl font-bold text-red-600">{telemetria.fc}</p>
        <p className="text-xs text-red-500">FC (bpm)</p>
      </div>
      <div className="bg-blue-50 p-3 rounded-lg text-center">
        <p className="text-2xl font-bold text-blue-600">{telemetria.spo2}%</p>
        <p className="text-xs text-blue-500">SpO2</p>
      </div>
      <div className="bg-purple-50 p-3 rounded-lg text-center">
        <p className="text-2xl font-bold text-purple-600">{telemetria.pa}</p>
        <p className="text-xs text-purple-500">PA</p>
      </div>
      <div className="bg-orange-50 p-3 rounded-lg text-center">
        <p className="text-2xl font-bold text-orange-600">{telemetria.temp}°</p>
        <p className="text-xs text-orange-500">Temp</p>
      </div>
    </div>
  );
}

function AIChatPanel({ paciente, chatHistory, onNewMessage }: { 
  paciente: Paciente; 
  chatHistory: MensagemChat[]; 
  onNewMessage: (msg: MensagemChat) => void;
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: MensagemChat = {
      id: Date.now().toString(),
      remetente: 'user',
      conteudo: input,
      timestamp: new Date()
    };
    onNewMessage(userMsg);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: MensagemChat = {
        id: (Date.now() + 1).toString(),
        remetente: 'ai',
        conteudo: `Analisando o caso de ${paciente.nome}... Com base na queixa "${paciente.queixaPrincipal}" e telemetria atual (FC: ${paciente.ultimaTelemetria.fc}, SpO2: ${paciente.ultimaTelemetria.spo2}%), sugiro investigar possíveis causas relacionadas ao histórico: ${paciente.historico.join(', ')}.`,
        timestamp: new Date()
      };
      onNewMessage(aiMsg);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="font-semibold text-slate-700 text-sm">Copiloto Clínico</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {chatHistory.length === 0 && (
          <div className="text-center p-8 text-slate-400 text-sm">
            <p>O Copiloto analisou a Pasta Viva de <strong>{paciente.nome}</strong>.</p>
            <p className="mt-2">Faça perguntas sobre o caso clínico.</p>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.remetente === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              {msg.remetente === 'ai' && (
                <div className="text-[10px] font-bold text-indigo-500 mb-1 uppercase">SNDT AI</div>
              )}
              <div className="text-sm whitespace-pre-wrap">{msg.conteudo}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua pergunta..."
            className="flex-1 bg-slate-100 text-slate-800 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-3"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}


// ============ MAIN APP ============
function SNDTApp({ doctorName }: { doctorName: string }) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, MensagemChat[]>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const pacientes = MOCK_PACIENTES;
  const pacientesCriticos = pacientes.filter(p => p.risco === RiscoClinico.ALTO || p.risco === RiscoClinico.CRITICO).length;

  const handlePatientSelect = (paciente: Paciente) => {
    setSelectedPatient(paciente);
    setActiveTab('overview');
    setCurrentView('clinical_workspace');
  };

  const handleNewChatMessage = (msg: MensagemChat) => {
    if (!selectedPatient) return;
    setChatHistory(prev => ({
      ...prev,
      [selectedPatient.id]: [...(prev[selectedPatient.id] || []), msg]
    }));
  };

  const handleCloseConsultation = () => {
    setSelectedPatient(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white h-14 flex items-center px-6 justify-between shadow-md z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/medico/dashboard')}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
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
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
              {doctorName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold leading-none">{doctorName}</span>
              <span className="text-[10px] text-green-400 leading-none mt-0.5">● Conectado</span>
            </div>
          </div>
          {selectedPatient && (
            <button
              onClick={handleCloseConsultation}
              className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded hover:bg-red-500 hover:text-white transition"
            >
              Encerrar
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Patient Queue */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm shrink-0">
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
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="p-8 h-full overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900">Visão Geral da Rede</h2>
                  <p className="text-slate-500 mt-1">Selecione um paciente para iniciar o atendimento.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pacientes na Fila</div>
                    <div className="text-4xl font-bold text-slate-900">{pacientes.length}</div>
                    <div className="mt-2 text-xs text-slate-500">{pacientesCriticos} críticos</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Atendimentos Hoje</div>
                    <div className="text-4xl font-bold text-slate-900">12</div>
                    <div className="mt-2 text-xs text-green-600">+3 vs ontem</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Tempo Médio</div>
                    <div className="text-4xl font-bold text-slate-900">18min</div>
                    <div className="mt-2 text-xs text-slate-500">por consulta</div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Aguardando Seleção de Caso</h3>
                    <p className="text-slate-300 max-w-lg mb-6 leading-relaxed">
                      Selecione um paciente na barra lateral para iniciar o atendimento.
                      O sistema carregará automaticamente a "Pasta Viva" e iniciará o copiloto clínico.
                    </p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> IA Ativa
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Copiloto Pronto
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Workspace View */}
          {currentView === 'clinical_workspace' && selectedPatient && (
            <div className="h-full flex flex-col md:flex-row overflow-hidden bg-white">
              {/* Left Panel - Patient Info */}
              <div className="w-full md:w-5/12 p-0 overflow-hidden border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-5 pb-0">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.nome}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedPatient.risco === RiscoClinico.ALTO || selectedPatient.risco === RiscoClinico.CRITICO
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          RISCO {selectedPatient.risco}
                        </span>
                        <span className="text-xs text-slate-500 border-l border-slate-300 pl-2 ml-1">
                          {selectedPatient.idade} anos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-slate-200">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                        activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Visão Geral
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                        activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Histórico
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {activeTab === 'overview' && (
                    <>
                      <div className="mb-6">
                        <TelemetryPanel telemetria={selectedPatient.ultimaTelemetria} />
                      </div>

                      <div className="mb-6 bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                        <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3 tracking-wider flex items-center gap-2">
                          🧠 Insight Clínico (IA)
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">{selectedPatient.resumoIA}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Queixa Principal</h4>
                          <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                            {selectedPatient.queixaPrincipal}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Histórico</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.historico.map(h => (
                              <span key={h} className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Alergias</h4>
                            {selectedPatient.alergias.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {selectedPatient.alergias.map(a => (
                                  <span key={a} className="text-xs text-red-600 font-medium">• {a}</span>
                                ))}
                              </div>
                            ) : <span className="text-xs text-slate-400 italic">Negativo</span>}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Medicamentos</h4>
                            <div className="flex flex-col gap-1">
                              {selectedPatient.medicamentos.map(m => (
                                <span key={m} className="text-xs text-slate-600 font-medium">• {m}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'history' && (
                    <div className="text-center py-8 text-slate-400">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Histórico de atendimentos anteriores</p>
                      <p className="text-xs mt-2">Integração com prontuário em desenvolvimento</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - AI Chat */}
              <div className="w-full md:w-7/12 p-0 h-full">
                <AIChatPanel
                  paciente={selectedPatient}
                  chatHistory={chatHistory[selectedPatient.id] || []}
                  onNewMessage={handleNewChatMessage}
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ============ PAGE EXPORT ============
export default function SNDTPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>SNDT - Sistema Nervoso Digital | MediSync</title>
        <meta name="description" content="Sistema de Telemedicina com IA para Médicos" />
      </Head>
      <SNDTApp doctorName={user?.fullName || 'Médico'} />
    </>
  );
}
