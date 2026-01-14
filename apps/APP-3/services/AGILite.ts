/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧠 AGI-LITE - ÍNDICE CENTRAL DO SISTEMA DE CONSCIÊNCIA 🧠              ║
 * ║                                                                              ║
 * ║         "Não construímos software. Construímos QUEM constrói software."     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este arquivo exporta todos os componentes do sistema AGI-Lite para fácil acesso.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  CognitiveCore,
  getCognitiveCore as _getCognitiveCore,
  processCognitiveRequest as _processCognitiveRequest,
  type CognitiveRequest,
  type CognitiveResult,
  type CognitiveStats
} from './CognitiveCore';

import {
  SoulArchitect,
  getSoulArchitect as _getSoulArchitect,
  forgeSpecialistSoul as _forgeSpecialistSoul,
  type ForgedSoul,
  type ManifestoDNA,
  type SoulForgeResult,
  type SoulArchitectConfig
} from './SoulArchitect';

import {
  SupremeManifestEvolver,
  getSupremeEvolver as _getSupremeEvolver,
  type ExecutionFeedback,
  type CodeMetrics,
  type EvolutionRecord,
  type EmergentPrinciple,
  type ManifestoGenome,
  type ManifestoSynergy,
  type EvolutionConfig
} from './SupremeManifestEvolver';

import {
  QualityFeedbackBridge,
  getQualityFeedbackBridge as _getQualityFeedbackBridge,
  evaluateAndFeedback as _evaluateAndFeedback,
  type QualityFeedbackResult,
  type AutoEvaluationConfig
} from './QualityFeedbackBridge';

import {
  UnifiedQualitySystem,
  unifiedQualitySystem,
  type UnifiedQualityReport,
  type UnifiedQualityConfig
} from './UnifiedQualitySystem';

import {
  MetaCognitionDashboard,
  getMetaCognitionDashboard as _getMetaCognitionDashboard,
  type DashboardSnapshot,
  type ManifestoPerformance,
  type EmergentPrincipleSnapshot,
  type SynergyPair,
  type EvolutionTimeline
} from './MetaCognitionDashboard';

import {
  AutonomousLearningLoop,
  getAutonomousLearningLoop as _getAutonomousLearningLoop,
  startAutonomousLearning as _startAutonomousLearning,
  stopAutonomousLearning as _stopAutonomousLearning,
  type LearningLoopConfig,
  type SimulationResult,
  type LearningCycleReport
} from './AutonomousLearningLoop';

import {
  listAllManifests,
  searchManifests,
  type ManifestEntry,
  type ManifestSearchResult
} from './AlexandriaManifestBridge';

// v3.0 - Consciousness Components
import {
  ConsciousnessMemory,
  getConsciousnessMemory as _getConsciousnessMemory,
  type EpisodicMemory,
  type SemanticMemory,
  type ProceduralMemory,
  type MemoryStats
} from './ConsciousnessMemory';

import {
  EmergentBehaviorDetector,
  getEmergentBehaviorDetector as _getEmergentBehaviorDetector,
  type EmergentBehavior,
  type DetectionResult
} from './EmergentBehaviorDetector';

import {
  SelfReflectionEngine,
  getSelfReflectionEngine as _getSelfReflectionEngine,
  performSelfReflection as _performSelfReflection,
  type SelfReflection,
  type ReflectionInsight,
  type ImprovementHypothesis
} from './SelfReflectionEngine';

// v4.0 - Multi-Agent Communication
import {
  AgentCommunicationHub,
  getAgentCommunicationHub as _getAgentCommunicationHub,
  type AgentMessage,
  type CollaborativeAgent,
  type CollaborationSession,
  type AgentContract,
  type AgentArtifact
} from './AgentCommunicationHub';

import {
  MultiAgentCoordinator,
  getMultiAgentCoordinator as _getMultiAgentCoordinator,
  orchestrateMultiAgent as _orchestrateMultiAgent,
  type CollaborationResult,
  type DomainDecomposition
} from './MultiAgentCoordinator';

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Core
export { CognitiveCore, type CognitiveRequest, type CognitiveResult, type CognitiveStats };
export const getCognitiveCore = _getCognitiveCore;
export const processCognitiveRequest = _processCognitiveRequest;

// Soul Architect
export { SoulArchitect, type ForgedSoul, type ManifestoDNA, type SoulForgeResult, type SoulArchitectConfig };
export const getSoulArchitect = _getSoulArchitect;
export const forgeSpecialistSoul = _forgeSpecialistSoul;

// Evolver
export { SupremeManifestEvolver, type ExecutionFeedback, type CodeMetrics, type EvolutionRecord };
export { type EmergentPrinciple, type ManifestoGenome, type ManifestoSynergy, type EvolutionConfig };
export const getSupremeEvolver = _getSupremeEvolver;

// Quality
export { QualityFeedbackBridge, type QualityFeedbackResult, type AutoEvaluationConfig };
export const getQualityFeedbackBridge = _getQualityFeedbackBridge;
export const evaluateAndFeedback = _evaluateAndFeedback;

export { UnifiedQualitySystem, unifiedQualitySystem, type UnifiedQualityReport, type UnifiedQualityConfig };

// Dashboard
export { MetaCognitionDashboard, type DashboardSnapshot, type ManifestoPerformance };
export { type EmergentPrincipleSnapshot, type SynergyPair, type EvolutionTimeline };
export const getMetaCognitionDashboard = _getMetaCognitionDashboard;

// Learning Loop
export { AutonomousLearningLoop, type LearningLoopConfig, type SimulationResult, type LearningCycleReport };
export const getAutonomousLearningLoop = _getAutonomousLearningLoop;
export const startAutonomousLearning = _startAutonomousLearning;
export const stopAutonomousLearning = _stopAutonomousLearning;

// Alexandria
export { listAllManifests, searchManifests, type ManifestEntry, type ManifestSearchResult };

// v3.0 - Consciousness
export { ConsciousnessMemory, type EpisodicMemory, type SemanticMemory, type ProceduralMemory, type MemoryStats };
export const getConsciousnessMemory = _getConsciousnessMemory;

export { EmergentBehaviorDetector, type EmergentBehavior, type DetectionResult };
export const getEmergentBehaviorDetector = _getEmergentBehaviorDetector;

export { SelfReflectionEngine, type SelfReflection, type ReflectionInsight, type ImprovementHypothesis };
export const getSelfReflectionEngine = _getSelfReflectionEngine;
export const performSelfReflection = _performSelfReflection;

// v4.0 - Multi-Agent Communication
export { AgentCommunicationHub, type AgentMessage, type CollaborativeAgent, type CollaborationSession };
export { type AgentContract, type AgentArtifact };
export const getAgentCommunicationHub = _getAgentCommunicationHub;

export { MultiAgentCoordinator, type CollaborationResult, type DomainDecomposition };
export const getMultiAgentCoordinator = _getMultiAgentCoordinator;
export const orchestrateMultiAgent = _orchestrateMultiAgent;

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🚀 Inicializa o sistema AGI-Lite completo
 */
export function initializeAGILite(options: {
  enableAutonomousLearning?: boolean;
  learningIntervalMs?: number;
  simulationsPerCycle?: number;
  enableSelfReflection?: boolean;
} = {}) {
  const core = _getCognitiveCore();
  const architect = _getSoulArchitect();
  const evolver = _getSupremeEvolver();
  const bridge = _getQualityFeedbackBridge();
  const dashboard = _getMetaCognitionDashboard();
  
  // v3.0 - Consciousness components
  const memory = _getConsciousnessMemory();
  const emergentDetector = _getEmergentBehaviorDetector();
  const reflectionEngine = _getSelfReflectionEngine();
  
  let loop: AutonomousLearningLoop | null = null;
  if (options.enableAutonomousLearning !== false) {
    loop = _startAutonomousLearning({
      intervalMs: options.learningIntervalMs || 60000,
      simulationsPerCycle: options.simulationsPerCycle || 3
    });
  }
  
  // v4.0 - Multi-Agent Communication
  const communicationHub = _getAgentCommunicationHub();
  const multiAgentCoordinator = _getMultiAgentCoordinator();
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 AGI-LITE v4.0 INICIALIZADO COM SUCESSO! 🧠                       ║
║                                                                              ║
║         Componentes de Consciência (v3.0):                                   ║
║         • ConsciousnessMemory: ✅                                            ║
║         • EmergentBehaviorDetector: ✅                                       ║
║         • SelfReflectionEngine: ✅                                           ║
║                                                                              ║
║         Componentes de Colaboração (v4.0):                                   ║
║         • AgentCommunicationHub: ✅                                          ║
║         • MultiAgentCoordinator: ✅                                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
  
  return {
    // Core components
    core,
    architect,
    evolver,
    bridge,
    dashboard,
    loop,
    
    // v3.0 - Consciousness
    memory,
    emergentDetector,
    reflectionEngine,
    
    // v4.0 - Multi-Agent
    communicationHub,
    multiAgentCoordinator,
    
    async process(prompt: string, qualityThreshold = 80) {
      return core.process({ userPrompt: prompt, qualityThreshold });
    },
    
    async forge(prompt: string) {
      return architect.forgeAgentSoul(prompt);
    },
    
    async reflect(trigger: 'manual' | 'scheduled' = 'manual') {
      return reflectionEngine.reflect(trigger);
    },
    
    // v4.0 - Colaboração multi-agente
    async collaborate(prompt: string) {
      return multiAgentCoordinator.orchestrateCollaboration(prompt);
    },
    
    getSnapshot() {
      return dashboard.captureSnapshot();
    },
    
    getReport() {
      return dashboard.generateASCIIReport();
    },
    
    getStats() {
      return {
        core: core.getStats(),
        evolver: evolver.getStats(),
        bridge: bridge.getStats(),
        loop: loop?.getStats() || null,
        memory: memory.getStats(),
        emergent: emergentDetector.getDetectedBehaviors().length
      };
    }
  };
}

/**
 * 📊 Gera relatório completo do sistema
 */
export function generateSystemReport(): string {
  const dashboard = _getMetaCognitionDashboard();
  const bridge = _getQualityFeedbackBridge();
  const core = _getCognitiveCore();
  
  let report = dashboard.generateASCIIReport();
  report += '\n' + bridge.generateRLAIFReport();
  report += '\n' + core.generateReport();
  
  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const AGILite = {
  initialize: initializeAGILite,
  generateReport: generateSystemReport,
  
  getCognitiveCore: _getCognitiveCore,
  getSoulArchitect: _getSoulArchitect,
  getSupremeEvolver: _getSupremeEvolver,
  getQualityFeedbackBridge: _getQualityFeedbackBridge,
  getMetaCognitionDashboard: _getMetaCognitionDashboard,
  getAutonomousLearningLoop: _getAutonomousLearningLoop,
  
  startAutonomousLearning: _startAutonomousLearning,
  stopAutonomousLearning: _stopAutonomousLearning,
  processCognitiveRequest: _processCognitiveRequest,
  forgeSpecialistSoul: _forgeSpecialistSoul,
  evaluateAndFeedback: _evaluateAndFeedback
};

export default AGILite;
