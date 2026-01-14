export enum RiscoClinico {
  BAIXO = 'BAIXO',
  MODERADO = 'MODERADO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
}

export enum Especialidade {
  CLINICA_GERAL = 'Clínica Geral',
  CARDIOLOGIA = 'Cardiologia',
  DERMATOLOGIA = 'Dermatologia',
  PEDIATRIA = 'Pediatria',
  NEUROLOGIA = 'Neurologia',
  ORTOPEDIA = 'Ortopedia'
}

export interface Telemetria {
  fc: number; // Frequência Cardíaca
  spo2: number; // Saturação
  pa: string; // Pressão Arterial
  temp: number; // Temperatura
  timestamp: string;
  analiseIA?: string; // Análise prévia da IA sobre a telemetria
}

export interface Paciente {
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
  resumoIA: string; // A "Pasta Viva" sumarizada
}

export interface Medico {
  id: string;
  nome: string;
  especialidade: Especialidade;
  crm: string;
  disponivel: boolean;
  scoreMatch: number; // Calculado pela IA para o caso específico
  tags: string[]; // Ex: "Especialista em Hipertensão", "Empático", "Direto"
  fotoUrl: string;
}

export interface ArquivoAnexo {
  nome: string;
  tipo: 'imagem' | 'audio' | 'arquivo';
  mimeType: string;
  dadosBase64: string; // Dados brutos para envio à IA e renderização (src)
}

export interface MensagemChat {
  id: string;
  remetente: 'user' | 'ai' | 'system';
  conteudo: string;
  anexos?: ArquivoAnexo[]; // Agora suporta múltiplos anexos
  timestamp: Date;
  tipo?: 'texto' | 'alerta' | 'sugestao_match';
}

export interface MatchResult {
  razao: string;
  medicosSugeridos: Medico[];
}

export interface RegistroMedico {
  id: string;
  pacienteId: string;
  medicoId: string;
  data: string;
  soap: {
    s: string; // Subjetivo
    o: string; // Objetivo
    a: string; // Avaliação
    p: string; // Plano
  };
  resumoGeral: string;
}

// --- CONTRATO DE INTEGRAÇÃO ---

/**
 * Props que o Sistema Principal deve passar para iniciar o Módulo SNDT.
 */
export interface SNDTIntegrationProps {
  /** Médico logado no sistema principal. Se fornecido, pula a etapa de login/match. */
  doctorContext?: Medico;
  
  /** ID do paciente selecionado no sistema principal. Se fornecido, abre direto o workspace. */
  initialPatientId?: string;
  
  /** Lista de pacientes reais vinda do backend principal (Hydration). */
  externalPatientList?: Paciente[];
  
  /** Callback quando o médico clica em "Sair" ou "Encerrar Módulo". */
  onExit?: () => void;
  
  /** Callback crítico: Retorna o SOAP assinado para o sistema principal salvar no DB real. */
  onSessionComplete?: (registro: RegistroMedico) => void;
}