
import React, { useState, useEffect } from 'react';
import { Paciente, Medico } from '../types';
import { realizarMatchInteligente } from '../services/geminiService';
import { repository } from '../services/dataRepository'; // Importa o singleton

interface MatchSystemProps {
  paciente: Paciente;
  onMedicoSelect: (medico: Medico) => void;
}

// Mock de nós da rede para visualização
const REDE_PARCEIRA = [
    { id: 'NODE_01', nome: 'Hospital Israelita A.E. (Plantão)', lat: '10ms', status: 'Conectado' },
    { id: 'NODE_02', nome: 'Rede D\'Or - Núcleo Cardiológico', lat: '24ms', status: 'Conectado' },
    { id: 'NODE_03', nome: 'Clínica São Vicente (Especialistas)', lat: '45ms', status: 'Ocupado' },
    { id: 'NODE_04', nome: 'Base de Dados: Médicos Remotos', lat: '12ms', status: 'Verificando...' }
];

export const MatchSystem: React.FC<MatchSystemProps> = ({ paciente, onMedicoSelect }) => {
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ razao: string, medicos: Medico[] } | null>(null);
  const [availableDocs, setAvailableDocs] = useState<Medico[]>([]);
  
  // Estados visuais do scanner
  const [scanStep, setScanStep] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
      setAvailableDocs(repository.getMedicosDisponiveis());
  }, []);

  // Efeito de log visual durante o loading
  useEffect(() => {
      if (loading) {
          const steps = [
              "Iniciando handshake criptografado com a rede...",
              `Analisando telemetria de ${paciente.nome} (SPO2/FC)...`,
              "Calculando Risco Manchester...",
              "Querying NODE_01: Especialistas disponíveis...",
              "Querying NODE_02: Verificando plantão...",
              "Filtrando por especialidade e score de competência...",
              "Gerando justificativa clínica via Gemini Pro..."
          ];
          
          let current = 0;
          const interval = setInterval(() => {
              if (current < steps.length) {
                  setLogLines(prev => [...prev.slice(-4), steps[current]]); // Mantém apenas as últimas 5 linhas
                  setScanStep(current);
                  current++;
              }
          }, 800);

          return () => clearInterval(interval);
      } else {
          setLogLines([]);
          setScanStep(0);
      }
  }, [loading, paciente.nome]);

  const handleRunMatch = async () => {
    setLoading(true);
    setMatchResult(null); // Limpa resultado anterior
    
    // Simula um delay de rede para mostrar a animação de "scanning"
    // Isso dá peso à ação e mostra ao usuário que o sistema está "trabalhando"
    await new Promise(resolve => setTimeout(resolve, 5000));

    const snapshotRede = repository.getMedicosDisponiveis();
    const result = await realizarMatchInteligente(paciente, snapshotRede);
    
    const medicosSugeridos: Medico[] = [];
    result.medicosIds.forEach(id => {
        const found = repository.getAllMedicos().find(m => m.id === id);
        if (found) medicosSugeridos.push(found);
    });

    setMatchResult({
        razao: result.razao,
        medicos: medicosSugeridos
    });
    setLoading(false);
  };

  const handleConnect = (medico: Medico) => {
      const success = repository.alocarMedico(medico.id);
      if (success) {
          onMedicoSelect(medico);
      } else {
          alert("Conflito de alocação: Este médico foi capturado por outro processo.");
          setAvailableDocs(repository.getMedicosDisponiveis());
          handleRunMatch(); // Tenta de novo
      }
  };

  // TELA 1: ESTADO INICIAL (READY)
  if (!matchResult && !loading) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 border border-slate-200 rounded-lg border-dashed">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] animate-pulse-slow relative group">
                <svg className="w-10 h-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <div className="absolute inset-0 border border-blue-200 rounded-full scale-125 opacity-0 group-hover:scale-150 group-hover:opacity-100 transition-all duration-700"></div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Protocolo de Busca Especializada</h3>
            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                O sistema irá varrer a rede de parceiros (Hospitais, Clínicas e Especialistas Remotos) buscando o perfil ideal para o quadro clínico de <strong>{paciente.nome}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                {REDE_PARCEIRA.map((node, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'Conectado' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-slate-600 font-medium truncate max-w-[120px]">{node.nome}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">{node.lat}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={handleRunMatch}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Iniciar Varredura de Rede
            </button>
        </div>
    );
  }

  // TELA 2: LOADING (SCANNER VISUAL)
  if (loading) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 rounded-lg overflow-hidden relative">
              {/* Background Grid Animation */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              <div className="relative z-10 w-full max-w-lg">
                  <div className="flex items-center justify-between mb-8">
                      <h3 className="text-cyan-400 font-mono text-lg animate-pulse">SEARCHING_NEURAL_NETWORK...</h3>
                      <span className="text-xs text-slate-500 font-mono">{Math.round((scanStep / 6) * 100)}%</span>
                  </div>

                  {/* Visualização dos Nós */}
                  <div className="flex justify-between items-center mb-10 px-4">
                      {REDE_PARCEIRA.map((node, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 transition-all duration-500" style={{ opacity: scanStep >= i ? 1 : 0.3 }}>
                              <div className={`w-3 h-3 rounded-full ${scanStep === i ? 'bg-white shadow-[0_0_15px_white]' : 'bg-cyan-600'}`}></div>
                              <div className={`h-1 w-full absolute top-1/2 left-0 -z-10 bg-cyan-900 ${i === 0 ? 'hidden' : ''}`}></div>
                              <span className="text-[9px] text-cyan-200 font-mono uppercase">{node.id}</span>
                          </div>
                      ))}
                  </div>

                  {/* Terminal Log */}
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-xs h-32 flex flex-col justify-end border border-slate-700 shadow-inner">
                      {logLines.map((line, idx) => (
                          <div key={idx} className="text-green-400 mb-1 opacity-90 truncate">
                              <span className="text-slate-500 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                              {`> ${line}`}
                          </div>
                      ))}
                      <div className="flex gap-1 mt-1">
                          <span className="w-2 h-4 bg-green-500 animate-pulse"></span>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // TELA 3: RESULTADOS (MATCH FOUND)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col h-full animate-fade-in">
        <div className="mb-6 border-b border-slate-100 pb-4">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    {matchResult?.medicos.length} Especialistas Identificados
                </h3>
                <button onClick={handleRunMatch} className="text-xs text-blue-600 hover:text-blue-800 font-medium underline">
                    Reiniciar Busca
                </button>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 rounded-lg text-sm border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-200 rounded-full blur-2xl opacity-50 -mr-8 -mt-8"></div>
                <strong className="block text-indigo-700 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Análise de Compatibilidade (AI Reason):
                </strong> 
                <p className="leading-relaxed">{matchResult?.razao}</p>
            </div>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {matchResult?.medicos.length === 0 && (
                 <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                     <p className="text-slate-500 text-sm mb-2">A rede externa não retornou candidatos com 100% de match.</p>
                     <button className="text-blue-600 font-bold text-sm hover:underline">Solicitar Supervisor Humano</button>
                 </div>
            )}

            {matchResult?.medicos.map(medico => (
                <div key={medico.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all group bg-white relative">
                    <div className="relative shrink-0">
                        <img src={medico.fotoUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-100" alt={medico.nome} />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white">
                            98%
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex justify-between items-start mb-1">
                            <h5 className="font-bold text-slate-900 text-base">{medico.nome}</h5>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{medico.crm}</span>
                        </div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">{medico.especialidade}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {medico.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500 font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <button 
                            onClick={() => handleConnect(medico)}
                            className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                        >
                            INICIAR SESSÃO AGORA
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
