import { Paciente, Medico, RegistroMedico } from '../types';
import { MOCK_PACIENTES, MOCK_MEDICOS } from '../constants';

// Em produção, isso seria substituído por chamadas a um backend (PostgreSQL/Redis)
// Aqui, mantemos o estado em memória (Singleton Pattern) para persistência durante a sessão.

class DataRepository {
  private pacientes: Paciente[];
  private medicos: Medico[];
  private registrosMedicos: RegistroMedico[];

  constructor() {
    this.pacientes = [...MOCK_PACIENTES];
    this.medicos = [...MOCK_MEDICOS];
    this.registrosMedicos = [];
  }

  // --- MÉTODOS DE INTEGRAÇÃO (HYDRATION) ---
  
  /**
   * Substitui os dados mockados pelos dados reais vindos do Sistema Principal.
   */
  hydrate(externalPacientes?: Paciente[], externalMedicos?: Medico[]) {
      if (externalPacientes && externalPacientes.length > 0) {
          console.log(`[SNDT Core] Hidratando com ${externalPacientes.length} pacientes externos.`);
          this.pacientes = [...externalPacientes];
      }
      if (externalMedicos && externalMedicos.length > 0) {
          this.medicos = [...externalMedicos];
      }
  }

  // --- PACIENTES ---
  getAllPacientes(): Paciente[] {
    return this.pacientes;
  }

  getPacienteById(id: string): Paciente | undefined {
    return this.pacientes.find(p => p.id === id);
  }

  // --- MÉDICOS ---
  getAllMedicos(): Medico[] {
    return this.medicos;
  }

  getMedicosDisponiveis(): Medico[] {
    return this.medicos.filter(m => m.disponivel);
  }

  // --- REGISTROS MÉDICOS ---
  adicionarRegistro(registro: RegistroMedico): void {
    this.registrosMedicos.push(registro);
    console.log("Registro médico salvo localmente (Buffer):", registro.id);
  }

  getRegistrosDoPaciente(pacienteId: string): RegistroMedico[] {
    return this.registrosMedicos.filter(r => r.pacienteId === pacienteId);
  }

  getTotalAtendimentos(): number {
    return this.registrosMedicos.length;
  }

  // --- AÇÕES TRANSACIONAIS ---
  
  // Realiza a alocação (lock) do médico para um atendimento
  alocarMedico(medicoId: string): boolean {
    const index = this.medicos.findIndex(m => m.id === medicoId);
    if (index !== -1 && this.medicos[index].disponivel) {
      this.medicos[index].disponivel = false;
      this.medicos[index].scoreMatch = 0; // Reset score
      // Em um sistema real, aqui criaríamos o registro da consulta na tabela de atendimentos
      return true;
    }
    return false;
  }

  liberarMedico(medicoId: string): void {
    const index = this.medicos.findIndex(m => m.id === medicoId);
    if (index !== -1) {
      this.medicos[index].disponivel = true;
    }
  }

  atualizarTelemetria(pacienteId: string, novaTelemetria: any): void {
      const index = this.pacientes.findIndex(p => p.id === pacienteId);
      if (index !== -1) {
          this.pacientes[index].ultimaTelemetria = {
              ...this.pacientes[index].ultimaTelemetria,
              ...novaTelemetria,
              timestamp: new Date().toISOString()
          };
      }
  }
}

export const repository = new DataRepository();