/**
 * 🌟 PIPELINE EVENTS - SISTEMA ENTERPRISE DE MULTI-CHAMADAS
 * 
 * Sistema de eventos para comunicar o progresso do pipeline
 * entre o GeminiService e a UI.
 * 
 * SUPORTA: 3, 4 ou 5 fases (modo enterprise)
 * 
 * FASES:
 * 1. 🧠 Arquiteto - Blueprint, contratos, schema
 * 2. ⚙️ Backend - APIs, services, auth
 * 3. 🎨 Frontend - UI, componentes, páginas
 * 4. 🔗 Integração - Conexão front-back, estado
 * 5. 📚 DevOps - Docker, CI/CD, docs
 */

export type PipelinePhase = 1 | 2 | 3 | 4 | 5;
export type PipelineMode = 3 | 4 | 5 | 1; // 1 = modo normal (single call)
export type PipelineStatus = 'waiting' | 'running' | 'completed' | 'error' | 'paused';

export interface PipelinePhaseInfo {
  id: PipelinePhase;
  name: string;
  emoji: string;
  description: string;
}

export const PIPELINE_PHASES: PipelinePhaseInfo[] = [
  { id: 1, name: 'Arquiteto', emoji: '🧠', description: 'Blueprint, contratos, schema' },
  { id: 2, name: 'Backend', emoji: '⚙️', description: 'APIs, services, auth' },
  { id: 3, name: 'Frontend', emoji: '🎨', description: 'UI, componentes, páginas' },
  { id: 4, name: 'Integração', emoji: '🔗', description: 'Conexão front-back' },
  { id: 5, name: 'DevOps', emoji: '📚', description: 'Docker, CI/CD, docs' },
];

export interface PipelineEventData {
  phase: PipelinePhase;
  status: PipelineStatus;
  mode: PipelineMode;
  files?: string[];
  manifest?: string;
  error?: string;
  linesGenerated?: number;
  totalPhases?: number;
}

type PipelineEventCallback = (data: PipelineEventData) => void;

class PipelineEventEmitter {
  private listeners: PipelineEventCallback[] = [];
  private isActive = false;
  private currentMode: PipelineMode = 1;
  private currentPhase: PipelinePhase = 1;
  private isPaused = false;

  // Registrar listener
  subscribe(callback: PipelineEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Emitir evento
  emit(data: PipelineEventData): void {
    this.listeners.forEach(callback => callback(data));
  }

  // Iniciar pipeline com modo específico
  start(mode: PipelineMode = 1): void {
    this.isActive = true;
    this.currentMode = mode;
    this.currentPhase = 1;
    this.isPaused = false;
    
    console.log(`🚀 Pipeline iniciado - Modo: ${mode} chamadas`);
    
    // Resetar todas as fases para waiting
    for (let i = 1; i <= 5; i++) {
      this.emit({ 
        phase: i as PipelinePhase, 
        status: 'waiting', 
        mode,
        totalPhases: mode 
      });
    }
    
    // Iniciar primeira fase
    this.emit({ phase: 1, status: 'running', mode, totalPhases: mode });
  }

  // Completar fase e passar para próxima (relay race)
  completePhase(phase: PipelinePhase, files: string[] = [], linesGenerated: number = 0): void {
    this.emit({ 
      phase, 
      status: 'completed', 
      mode: this.currentMode,
      files, 
      linesGenerated,
      totalPhases: this.currentMode
    });
    
    // Calcular próxima fase baseado no modo
    const phasesForMode = this.getPhasesForMode(this.currentMode);
    const currentIndex = phasesForMode.indexOf(phase);
    
    if (currentIndex < phasesForMode.length - 1) {
      const nextPhase = phasesForMode[currentIndex + 1];
      this.currentPhase = nextPhase;
      this.emit({ 
        phase: nextPhase, 
        status: 'running', 
        mode: this.currentMode,
        totalPhases: this.currentMode
      });
    } else {
      // Pipeline completo
      this.isActive = false;
      console.log(`✅ Pipeline completo - ${this.currentMode} fases executadas`);
    }
  }

  // Obter fases ativas para o modo
  getPhasesForMode(mode: PipelineMode): PipelinePhase[] {
    switch (mode) {
      case 1: return [1]; // Modo normal - single call
      case 3: return [1, 2, 5]; // Arquiteto + Fullstack + DevOps
      case 4: return [1, 2, 3, 5]; // Arquiteto + Backend + Frontend + DevOps
      case 5: return [1, 2, 3, 4, 5]; // Todas as fases
      default: return [1];
    }
  }

  // Pausar pipeline (para continuar depois)
  pause(): void {
    if (this.isActive) {
      this.isPaused = true;
      this.emit({ 
        phase: this.currentPhase, 
        status: 'paused', 
        mode: this.currentMode,
        totalPhases: this.currentMode
      });
      console.log(`⏸️ Pipeline pausado na fase ${this.currentPhase}`);
    }
  }

  // Continuar pipeline
  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.emit({ 
        phase: this.currentPhase, 
        status: 'running', 
        mode: this.currentMode,
        totalPhases: this.currentMode
      });
      console.log(`▶️ Pipeline continuando da fase ${this.currentPhase}`);
    }
  }

  // Erro em fase
  errorPhase(phase: PipelinePhase, error: string): void {
    this.emit({ 
      phase, 
      status: 'error', 
      mode: this.currentMode,
      error,
      totalPhases: this.currentMode
    });
    this.isActive = false;
  }

  // Resetar
  reset(): void {
    this.isActive = false;
    this.currentMode = 1;
    this.currentPhase = 1;
    this.isPaused = false;
    
    for (let i = 1; i <= 5; i++) {
      this.emit({ 
        phase: i as PipelinePhase, 
        status: 'waiting', 
        mode: 1,
        totalPhases: 1
      });
    }
  }

  // Getters
  getIsActive(): boolean { return this.isActive; }
  getCurrentMode(): PipelineMode { return this.currentMode; }
  getCurrentPhase(): PipelinePhase { return this.currentPhase; }
  getIsPaused(): boolean { return this.isPaused; }
}

// Singleton global
export const pipelineEvents = new PipelineEventEmitter();

export default pipelineEvents;
