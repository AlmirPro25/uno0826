import { Paciente, Medico, RiscoClinico, Especialidade } from './types';

export const MOCK_PACIENTES: Paciente[] = [
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
    ultimaTelemetria: {
      fc: 110,
      spo2: 96,
      pa: '160/100',
      temp: 36.5,
      timestamp: new Date().toISOString()
    },
    resumoIA: "Paciente de alto risco cardiovascular apresentando sintomas clássicos de angina instável. Necessita de avaliação cardiológica imediata e monitoramento contínuo."
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
    ultimaTelemetria: {
      fc: 88,
      spo2: 98,
      pa: '120/80',
      temp: 37.0,
      timestamp: new Date().toISOString()
    },
    resumoIA: "Provável reação alérgica aguda (Urticária). Monitorar sinais de anafilaxia (edema de glote, dispneia)."
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
    ultimaTelemetria: {
      fc: 100,
      spo2: 97,
      pa: '100/60',
      temp: 37.8,
      timestamp: new Date().toISOString()
    },
    resumoIA: "Quadro infeccioso de vias aéreas superiores, provável etiologia viral. Monitorar febre."
  }
];

export const MOCK_MEDICOS: Medico[] = [
  {
    id: 'M001',
    nome: 'Dr. Roberto Campos',
    especialidade: Especialidade.CARDIOLOGIA,
    crm: 'SP-123456',
    disponivel: true,
    scoreMatch: 0,
    tags: ['Emergencista', 'Experiente em IAM', 'Direto'],
    fotoUrl: 'https://picsum.photos/id/1062/200/200'
  },
  {
    id: 'M002',
    nome: 'Dra. Elena Fisher',
    especialidade: Especialidade.DERMATOLOGIA,
    crm: 'SP-654321',
    disponivel: true,
    scoreMatch: 0,
    tags: ['Alergias', 'Pediátrica', 'Empática'],
    fotoUrl: 'https://picsum.photos/id/338/200/200'
  },
  {
    id: 'M003',
    nome: 'Dr. House Silva',
    especialidade: Especialidade.CLINICA_GERAL,
    crm: 'RJ-999888',
    disponivel: false, // Ocupado
    scoreMatch: 0,
    tags: ['Diagnóstico Difícil', 'Rabugento', 'Brilhante'],
    fotoUrl: 'https://picsum.photos/id/1005/200/200'
  },
  {
    id: 'M004',
    nome: 'Dra. Sofia Luz',
    especialidade: Especialidade.PEDIATRIA,
    crm: 'MG-111222',
    disponivel: true,
    scoreMatch: 0,
    tags: ['Asma', 'Puericultura', 'Atenciosa'],
    fotoUrl: 'https://picsum.photos/id/64/200/200'
  }
];