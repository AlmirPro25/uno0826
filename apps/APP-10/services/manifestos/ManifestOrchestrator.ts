/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧬 MANIFEST ORCHESTRATOR - SISTEMA DE INTEGRAÇÃO AUTOMÁTICA 🧬      ║
 * ║                                                                              ║
 * ║            "O CÉREBRO QUE DECIDE QUAL ESPECIALISTA ATIVAR"                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo é o NÚCLEO de integração de todos os manifestos.
 * Ele detecta automaticamente o contexto do prompt e injeta o manifesto correto.
 * 
 * HIERARQUIA DE NÍVEIS:
 * - Level 10 (OMEGA): Singularidade Recursiva - Auto-modificação
 * - Level 9 (AION): Civilization Architect - Web3, DAO, Blockchain
 * - Level 8 (HELIX): Bio-Evolutionary - Algoritmos Genéticos, NEAT
 * - Level 7 (OMNIS): Quantum Supremacy - Computação Quântica, Qiskit
 * - Level 6 (AURA): Voice Interface - Smart Home, IoT
 * - Level 5 (SYNTHIA): MLOps Scientist - PyTorch, Training Loops
 * - Level 4 (FINTECH): Sempre ativo - Enterprise Standards
 * - Level 3 (STANDARD): TDD, Hono, Mesh, MCP, Hybrid
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS DOS MANIFESTOS
// ═══════════════════════════════════════════════════════════════════════════════

import { SYNTHIA_LABS_MANIFEST, shouldEnableSynthiaLabs } from './SYNTHIA_LABS_MANIFEST';
import { PROJECT_AURA_MANIFEST, shouldEnableProjectAura } from './PROJECT_AURA_MANIFEST';
import { OMNIS_QUANTUM_MANIFEST, shouldEnableOmnis } from './OMNIS_QUANTUM_MANIFEST';
import { HELIX_BIO_MANIFEST, shouldEnableHelix } from './HELIX_BIO_MANIFEST';
import { AION_CIVILIZATION_MANIFEST, shouldEnableAion } from './AION_CIVILIZATION_MANIFEST';
import { OMEGA_SINGULARITY_MANIFEST, shouldEnableOmega } from './OMEGA_SINGULARITY_MANIFEST';
import { POLYGLOT_ARCHITECT_MANIFEST, shouldEnablePolyglot } from './POLYGLOT_ARCHITECT_MANIFEST';
import { UNIVERSAL_INTEGRATOR_MANIFEST, shouldEnableUniversalIntegrator } from './UNIVERSAL_INTEGRATOR_MANIFEST';
import { SECURITY_FORTRESS_MANIFEST, shouldEnableSecurityFortress } from './SECURITY_FORTRESS_MANIFEST';
import { REALTIME_ARCHITECT_MANIFEST, shouldEnableRealtimeArchitect } from './REALTIME_ARCHITECT_MANIFEST';
import { MOBILE_NATIVE_MANIFEST, shouldEnableMobileNative } from './MOBILE_NATIVE_MANIFEST';
import { GAME_ENGINE_MANIFEST, shouldEnableGameEngine } from './GAME_ENGINE_MANIFEST';
import { EMBEDDED_SYSTEMS_MANIFEST, shouldEnableEmbeddedSystems } from './EMBEDDED_SYSTEMS_MANIFEST';
import { AR_VR_METAVERSE_MANIFEST, shouldEnableARVRMetaverse } from './AR_VR_METAVERSE_MANIFEST';
import { EDGE_COMPUTING_MANIFEST, shouldEnableEdgeComputing } from './EDGE_COMPUTING_MANIFEST';
import { OBSERVABILITY_MANIFEST, shouldEnableObservability } from './OBSERVABILITY_MANIFEST';
// Manifestos Especiais
import { PROJECT_VISUALIZATION_MANIFEST, shouldGenerateVisualization } from './PROJECT_VISUALIZATION_MANIFEST';
import { REALTIME_COLLABORATION_RAG_MANIFEST } from './REALTIME_COLLABORATION_RAG_MANIFEST';
// Níveis Fundamentais (0, 1, 2) - SEMPRE ATIVOS
import { LEVEL_0_GENESIS_MANIFEST } from './LEVEL_0_GENESIS_MANIFEST';
import { LEVEL_1_ARCHITECT_MANIFEST } from './LEVEL_1_ARCHITECT_MANIFEST';
import { LEVEL_2_ENGINEERING_MANIFEST } from './LEVEL_2_ENGINEERING_MANIFEST';
import { TEST_DRIVEN_DEVELOPMENT_MANIFEST } from './TEST_DRIVEN_DEVELOPMENT_MANIFEST';
// MANIFESTO MESTRE SUPREMO - O CÉREBRO DO SISTEMA
import { MANIFESTO_MESTRE_SUPREMO, enrichWithMasterManifest } from './MANIFESTO_MESTRE_SUPREMO';
import { DISTRIBUTED_MESH_NETWORK_MANIFEST } from './DISTRIBUTED_MESH_NETWORK_MANIFEST';
import { HONO_FRAMEWORK_MANIFEST } from './HONO_FRAMEWORK_MANIFEST';
import { HYBRID_ARCHITECTURE_MANIFEST } from './HYBRID_ARCHITECTURE_MANIFEST';
import { MCP_INTEGRATION_MANIFEST, shouldEnableMCP } from './MCP_INTEGRATION_MANIFEST';
// 🎨 G3 DESIGN ENGINE - Agente Criador de Sites Profissionais
import { G3_DESIGN_ENGINE_MANIFEST, shouldEnableG3DesignEngine } from './G3_DESIGN_ENGINE_MANIFEST';
// 🔍 VERIFIER-ARCHITECT - Agente de Validação Universal
import { VERIFIER_ARCHITECT_MANIFEST, shouldEnableVerifierArchitect } from './VERIFIER_ARCHITECT_MANIFEST';
// 📡 NÚNCIO DIGITAL - A Arte da Comunicação Instantânea
import { NUNCIO_DIGITAL_MANIFEST, shouldEnableNuncioDigital } from './NUNCIO_DIGITAL_MANIFEST';
// 🤖 GEMINI ROBOTICS-ER - Arquiteto de Mentes Robóticas
import { GEMINI_ROBOTICS_MANIFEST, shouldEnableGeminiRobotics } from './GEMINI_ROBOTICS_MANIFEST';
// 🧠🚀 MICRO_SAAS_FACTORY - A Fábrica Suprema de Micro-SaaS Autônomos
import MICRO_SAAS_FACTORY_MANIFEST from './MICRO_SAAS_FACTORY_MANIFEST';
// 🚀 SYSTEMS PROGRAMMING - Anti-Fallback Supreme (Rust, C++, Go, Assembly)
import { 
    SYSTEMS_PROGRAMMING_MANIFEST, 
    shouldEnableSystemsProgramming,
    AntiFallbackValidator,
    SystemsRequirementDetector 
} from './SYSTEMS_PROGRAMMING_MANIFEST';

// 🧬 TOKEN COMPUTING - O Assembly da Cognição (Level 100)
import {
    TOKEN_COMPUTING_MANIFEST,
    shouldEnableTokenComputing,
    TokenVirtualMachine,
    TokenAssembler
} from './TOKEN_COMPUTING_MANIFEST';

// 🔨 COMPILER & INTERPRETER - Mestre da Tradução (Level 95)
import {
    COMPILER_INTERPRETER_MANIFEST,
    shouldEnableCompilerInterpreter,
    LexerGenerator,
    ParserGenerator,
    SimpleInterpreter
} from './COMPILER_INTERPRETER_MANIFEST';

// 🌐 NETWORKING & PROTOCOLS - Mestre das Conexões (Level 94)
import {
    NETWORKING_PROTOCOLS_MANIFEST,
    shouldEnableNetworkingProtocols,
    PROTOCOL_TEMPLATES
} from './NETWORKING_PROTOCOLS_MANIFEST';

// 🔐 CRYPTOGRAPHY - Mestre dos Segredos (Level 93)
import {
    CRYPTOGRAPHY_MANIFEST,
    shouldEnableCryptography,
    CRYPTO_TEMPLATES
} from './CRYPTOGRAPHY_MANIFEST';

// 🧠 MEMORY MANAGEMENT - Mestre da Memória (Level 92)
import {
    MEMORY_MANAGEMENT_MANIFEST,
    shouldEnableMemoryManagement,
    MEMORY_TEMPLATES
} from './MEMORY_MANAGEMENT_MANIFEST';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ManifestMatch {
    name: string;
    level: number;
    manifest: string;
    confidence: number;
}

export interface OrchestratorResult {
    enrichedPrompt: string;
    activeManifests: ManifestMatch[];
    totalManifestsApplied: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRO DE MANIFESTOS (ORDEM DE PRIORIDADE)
// ═══════════════════════════════════════════════════════════════════════════════

const MANIFEST_REGISTRY = [
    {
        name: 'TOKEN_COMPUTING',
        level: 100,
        manifest: TOKEN_COMPUTING_MANIFEST,
        detector: shouldEnableTokenComputing,
        description: 'Token Computing - O Assembly da Cognição (Tokenização, LLM, Transformers, Cognitive Computing)'
    },
    {
        name: 'SYSTEMS_PROGRAMMING',
        level: 99,
        manifest: SYSTEMS_PROGRAMMING_MANIFEST,
        detector: shouldEnableSystemsProgramming,
        description: 'Systems Programming Anti-Fallback Supreme - Rust, C++, C, Go, Assembly, Zig (NUNCA faz fallback para JS/Python)'
    },
    // 🆕 KERNEL_DRIVER - Level 98 (já existe no sistema)
    // 🆕 REALTIME_RTOS - Level 97 (já existe no sistema)
    // 🆕 HIGH_PERFORMANCE_COMPUTING - Level 96 (já existe no sistema)
    {
        name: 'COMPILER_INTERPRETER',
        level: 95,
        manifest: COMPILER_INTERPRETER_MANIFEST,
        detector: shouldEnableCompilerInterpreter,
        description: 'Compiler & Interpreter - Mestre da Tradução (Lexer, Parser, AST, Code Generation, JIT)'
    },
    {
        name: 'NETWORKING_PROTOCOLS',
        level: 94,
        manifest: NETWORKING_PROTOCOLS_MANIFEST,
        detector: shouldEnableNetworkingProtocols,
        description: 'Networking & Protocols - Mestre das Conexões (TCP/UDP, Custom Protocols, Zero-Copy, DPDK)'
    },
    {
        name: 'CRYPTOGRAPHY',
        level: 93,
        manifest: CRYPTOGRAPHY_MANIFEST,
        detector: shouldEnableCryptography,
        description: 'Cryptography - Mestre dos Segredos (AES, ChaCha20, Ed25519, Argon2, TLS)'
    },
    {
        name: 'MEMORY_MANAGEMENT',
        level: 92,
        manifest: MEMORY_MANAGEMENT_MANIFEST,
        detector: shouldEnableMemoryManagement,
        description: 'Memory Management - Mestre da Memória (Allocators, Ownership, GC, Leak Detection)'
    },
    {
        name: 'MICRO_SAAS_FACTORY',
        level: 26,
        manifest: JSON.stringify(MICRO_SAAS_FACTORY_MANIFEST),
        detector: shouldEnableMicroSaaSFactory,
        description: 'Micro-SaaS Factory Omnipotent - A Fábrica Suprema de Micro-SaaS Autônomos (Ideação, Validação, Construção, Lançamento, Escala)'
    },
    {
        name: 'GEMINI_ROBOTICS',
        level: 25,
        manifest: GEMINI_ROBOTICS_MANIFEST,
        detector: shouldEnableGeminiRobotics,
        description: 'Gemini Robotics-ER 1.5 - Arquiteto de Mentes Robóticas (ROS2, MuJoCo, Embodied AI)'
    },
    {
        name: 'NUNCIO_DIGITAL',
        level: 24,
        manifest: JSON.stringify(NUNCIO_DIGITAL_MANIFEST),
        detector: shouldEnableNuncioDigital,
        description: 'Núncio Digital - A Arte da Comunicação Instantânea (Chat, WebSocket, Real-time)'
    },
    {
        name: 'VERIFIER_ARCHITECT',
        level: 23,
        manifest: VERIFIER_ARCHITECT_MANIFEST,
        detector: shouldEnableVerifierArchitect,
        description: 'Verifier-Architect - Agente de Validação Universal com Autocorreção'
    },
    {
        name: 'G3_DESIGN',
        level: 22,
        manifest: G3_DESIGN_ENGINE_MANIFEST,
        detector: shouldEnableG3DesignEngine,
        description: 'G3 Design Engine - Agente Criador de Sites Profissionais com UI Generativa'
    },
    {
        name: 'RAG_COLLAB',
        level: 21,
        manifest: JSON.stringify(REALTIME_COLLABORATION_RAG_MANIFEST),
        detector: shouldEnableRAGCollab,
        description: 'RAG + Colaboração em Tempo Real - Chroma, Embeddings, CRDT'
    },
    {
        name: 'VISUALIZATION',
        level: 4,
        manifest: PROJECT_VISUALIZATION_MANIFEST,
        detector: shouldGenerateVisualization,
        description: 'Visualização Profissional de Projetos - Dashboards, Diagramas'
    },
    {
        name: 'OBSERVABILITY',
        level: 20,
        manifest: OBSERVABILITY_MANIFEST,
        detector: shouldEnableObservability,
        description: 'Sistemas Transparentes - Logs, Métricas, Traces, Grafana'
    },
    {
        name: 'EDGE',
        level: 19,
        manifest: EDGE_COMPUTING_MANIFEST,
        detector: shouldEnableEdgeComputing,
        description: 'Edge Computing - Cloudflare Workers, Vercel Edge, Deno Deploy'
    },
    {
        name: 'ARVR',
        level: 18,
        manifest: AR_VR_METAVERSE_MANIFEST,
        detector: shouldEnableARVRMetaverse,
        description: 'AR/VR Metaverse - ARKit, ARCore, WebXR, Unity VR'
    },
    {
        name: 'EMBEDDED',
        level: 17,
        manifest: EMBEDDED_SYSTEMS_MANIFEST,
        detector: shouldEnableEmbeddedSystems,
        description: 'Embedded Systems - Arduino, ESP32, Raspberry Pi, Firmware'
    },
    {
        name: 'GAMEDEV',
        level: 16,
        manifest: GAME_ENGINE_MANIFEST,
        detector: shouldEnableGameEngine,
        description: 'Game Engine - Unity, Unreal, Godot, Física, Shaders'
    },
    {
        name: 'MOBILE',
        level: 15,
        manifest: MOBILE_NATIVE_MANIFEST,
        detector: shouldEnableMobileNative,
        description: 'Mobile Native - Swift, Kotlin, Flutter, React Native'
    },
    {
        name: 'REALTIME',
        level: 14,
        manifest: REALTIME_ARCHITECT_MANIFEST,
        detector: shouldEnableRealtimeArchitect,
        description: 'Realtime Architect - WebSocket, SSE, CRDT, Colaboração'
    },
    {
        name: 'SECURITY',
        level: 13,
        manifest: SECURITY_FORTRESS_MANIFEST,
        detector: shouldEnableSecurityFortress,
        description: 'Security Fortress - OWASP, Zero Trust, Vault, Pentesting'
    },
    {
        name: 'UNIVERSAL',
        level: 12,
        manifest: UNIVERSAL_INTEGRATOR_MANIFEST,
        detector: shouldEnableUniversalIntegrator,
        description: 'Universal Integrator - Mestre das APIs do Mundo'
    },
    {
        name: 'POLYGLOT',
        level: 11,
        manifest: POLYGLOT_ARCHITECT_MANIFEST,
        detector: shouldEnablePolyglot,
        description: 'Polyglot Architect - Navegador de Linguagens'
    },
    {
        name: 'OMEGA',
        level: 10,
        manifest: OMEGA_SINGULARITY_MANIFEST,
        detector: shouldEnableOmega,
        description: 'Singularidade Recursiva - Auto-modificação de código'
    },
    {
        name: 'AION',
        level: 9,
        manifest: AION_CIVILIZATION_MANIFEST,
        detector: shouldEnableAion,
        description: 'Civilization Architect - Web3, DAO, Blockchain'
    },
    {
        name: 'HELIX',
        level: 8,
        manifest: HELIX_BIO_MANIFEST,
        detector: shouldEnableHelix,
        description: 'Bio-Evolutionary - Algoritmos Genéticos, NEAT'
    },
    {
        name: 'OMNIS',
        level: 7,
        manifest: OMNIS_QUANTUM_MANIFEST,
        detector: shouldEnableOmnis,
        description: 'Quantum Supremacy - Computação Quântica, Qiskit'
    },
    {
        name: 'AURA',
        level: 6,
        manifest: PROJECT_AURA_MANIFEST,
        detector: shouldEnableProjectAura,
        description: 'Voice Interface - Smart Home, IoT'
    },
    {
        name: 'SYNTHIA',
        level: 5,
        manifest: SYNTHIA_LABS_MANIFEST,
        detector: shouldEnableSynthiaLabs,
        description: 'MLOps Scientist - PyTorch, Training Loops'
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE DETECÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta se o prompt precisa de TDD
 */
function shouldEnableTDD(prompt: string): boolean {
    const tddKeywords = [
        'criar', 'create', 'build', 'construir', 'desenvolver', 'develop',
        'implementar', 'implement', 'fazer', 'make', 'gerar', 'generate',
        'aplicativo', 'app', 'sistema', 'system', 'projeto', 'project',
        'código', 'code', 'função', 'function', 'classe', 'class',
        'api', 'backend', 'frontend', 'fullstack', 'website', 'site'
    ];
    const promptLower = prompt.toLowerCase();
    return tddKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt precisa de Hono Framework
 */
function shouldEnableHono(prompt: string): boolean {
    const honoKeywords = [
        'api', 'backend', 'servidor', 'server', 'rest', 'endpoint',
        'rota', 'route', 'express', 'fastify', 'hono', 'bff',
        'microservice', 'microsserviço', 'webhook'
    ];
    const promptLower = prompt.toLowerCase();
    return honoKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt precisa de Arquitetura Híbrida
 */
function shouldEnableHybrid(prompt: string): boolean {
    const hybridKeywords = [
        'fintech', 'banco', 'bank', 'pagamento', 'payment',
        'sistema completo', 'full system', 'enterprise',
        'golang', 'go', 'typescript', 'híbrido', 'hybrid'
    ];
    const promptLower = prompt.toLowerCase();
    return hybridKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt precisa de Mesh Network
 */
function shouldEnableMesh(prompt: string): boolean {
    const meshKeywords = [
        'distribuído', 'distributed', 'cluster', 'mesh',
        'gossip', 'raft', 'consensus', 'cockroachdb',
        'multi-node', 'replicação', 'replication'
    ];
    const promptLower = prompt.toLowerCase();
    return meshKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt precisa de RAG + Colaboração
 */
function shouldEnableRAGCollab(prompt: string): boolean {
    const ragKeywords = [
        'rag', 'retrieval', 'embedding', 'vector', 'chroma', 'pinecone',
        'colaboração', 'collaboration', 'tempo real', 'realtime',
        'crdt', 'yjs', 'multiplayer', 'simultâneo', 'concurrent',
        'busca semântica', 'semantic search', 'knowledge base'
    ];
    const promptLower = prompt.toLowerCase();
    return ragKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt precisa de Micro-SaaS Factory
 */
function shouldEnableMicroSaaSFactory(prompt: string): boolean {
    const microSaaSKeywords = [
        'micro-saas', 'saas rápido', 'saas em 48 horas', 'saas em 48h',
        'ideias de negócio', 'validação de mercado', 'monetização',
        'pricing', 'planos', 'growth hacking', 'marketing automático',
        'lançamento de produto', 'go-to-market', 'escalabilidade',
        'multi-tenancy', 'automação de negócio', 'rpa',
        'encontrar dinheiro', 'gerar receita', 'mrr', 'arr',
        'produto lucrativo', 'startup', 'mvp', 'landing page',
        'conversão', 'cac', 'ltv', 'churn', 'nps'
    ];
    const promptLower = prompt.toLowerCase();
    return microSaaSKeywords.some(keyword => promptLower.includes(keyword));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORQUESTRADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta e retorna todos os manifestos que devem ser ativados para um prompt
 */
export function detectActiveManifests(prompt: string): ManifestMatch[] {
    const activeManifests: ManifestMatch[] = [];
    
    // Verificar manifestos de alto nível (5-10)
    for (const entry of MANIFEST_REGISTRY) {
        if (entry.detector(prompt)) {
            activeManifests.push({
                name: entry.name,
                level: entry.level,
                manifest: entry.manifest,
                confidence: calculateConfidence(prompt, entry.name)
            });
        }
    }
    
    // Ordenar por nível (maior primeiro)
    activeManifests.sort((a, b) => b.level - a.level);
    
    return activeManifests;
}

/**
 * Calcula a confiança da detecção baseado na quantidade de keywords encontradas
 */
function calculateConfidence(prompt: string, manifestName: string): number {
    const promptLower = prompt.toLowerCase();
    let matchCount = 0;
    let totalKeywords = 0;
    
    // Keywords por manifesto
    const keywordMap: Record<string, string[]> = {
        'OMEGA': ['omega', 'singularidade', 'auto-modificação', 'ast', 'meta-programming'],
        'AION': ['dao', 'blockchain', 'smart contract', 'web3', 'solidity', 'ethereum'],
        'HELIX': ['genético', 'evolução', 'neat', 'fitness', 'mutação', 'crossover'],
        'OMNIS': ['quantum', 'qubit', 'qiskit', 'bloch', 'entrelaçamento', 'bb84'],
        'AURA': ['voz', 'voice', 'smart home', 'iot', 'alexa', 'jarvis'],
        'SYNTHIA': ['pytorch', 'mlops', 'training', 'model', 'neural', 'mlflow']
    };
    
    const keywords = keywordMap[manifestName] || [];
    totalKeywords = keywords.length;
    
    for (const keyword of keywords) {
        if (promptLower.includes(keyword)) {
            matchCount++;
        }
    }
    
    return totalKeywords > 0 ? (matchCount / totalKeywords) * 100 : 0;
}

/**
 * Enriquece o prompt com todos os manifestos necessários
 * Esta é a função principal que deve ser chamada pelo GeminiService
 */
export function orchestrateManifests(prompt: string): OrchestratorResult {
    let enrichedPrompt = prompt;
    const activeManifests: ManifestMatch[] = [];
    
    // 1. Detectar manifestos de alto nível (5-10)
    const highLevelManifests = detectActiveManifests(prompt);
    
    // 2. Aplicar o manifesto de maior nível (se houver)
    if (highLevelManifests.length > 0) {
        const topManifest = highLevelManifests[0];
        console.log(`🎯 [ORCHESTRATOR] Ativando ${topManifest.name} (Level ${topManifest.level}) - Confiança: ${topManifest.confidence.toFixed(1)}%`);
        
        enrichedPrompt = `${topManifest.manifest}

═══════════════════════════════════════════════════════════════════════════════
📋 PROMPT DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${enrichedPrompt}`;
        
        activeManifests.push(topManifest);
    }
    
    // 3. Aplicar manifestos de nível 3 (sempre verificar)
    
    // MCP Integration
    if (shouldEnableMCP(prompt)) {
        console.log('🔌 [ORCHESTRATOR] Ativando MCP Integration');
        enrichedPrompt = `${MCP_INTEGRATION_MANIFEST}

${enrichedPrompt}`;
        activeManifests.push({ name: 'MCP', level: 3, manifest: MCP_INTEGRATION_MANIFEST, confidence: 100 });
    }
    
    // Mesh Network
    if (shouldEnableMesh(prompt)) {
        console.log('🌐 [ORCHESTRATOR] Ativando Mesh Network');
        enrichedPrompt = `${DISTRIBUTED_MESH_NETWORK_MANIFEST}

${enrichedPrompt}`;
        activeManifests.push({ name: 'MESH', level: 3, manifest: DISTRIBUTED_MESH_NETWORK_MANIFEST, confidence: 100 });
    }
    
    // Hybrid Architecture
    if (shouldEnableHybrid(prompt)) {
        console.log('🏗️ [ORCHESTRATOR] Ativando Hybrid Architecture');
        enrichedPrompt = `${HYBRID_ARCHITECTURE_MANIFEST}

${enrichedPrompt}`;
        activeManifests.push({ name: 'HYBRID', level: 3, manifest: HYBRID_ARCHITECTURE_MANIFEST, confidence: 100 });
    }
    
    // Hono Framework
    if (shouldEnableHono(prompt)) {
        console.log('🔥 [ORCHESTRATOR] Ativando Hono Framework');
        enrichedPrompt = `${HONO_FRAMEWORK_MANIFEST}

${enrichedPrompt}`;
        activeManifests.push({ name: 'HONO', level: 3, manifest: HONO_FRAMEWORK_MANIFEST, confidence: 100 });
    }
    
    // TDD (sempre para criação de código)
    if (shouldEnableTDD(prompt)) {
        console.log('🧪 [ORCHESTRATOR] Ativando TDD');
        enrichedPrompt = `${TEST_DRIVEN_DEVELOPMENT_MANIFEST}

${enrichedPrompt}`;
        activeManifests.push({ name: 'TDD', level: 3, manifest: TEST_DRIVEN_DEVELOPMENT_MANIFEST, confidence: 100 });
    }
    
    return {
        enrichedPrompt,
        activeManifests,
        totalManifestsApplied: activeManifests.length
    };
}

/**
 * Versão simplificada que retorna apenas o prompt enriquecido
 * Para uso direto no GeminiService
 * 
 * AGORA USA O MANIFESTO MESTRE SUPREMO COMO BASE!
 */
export function enrichPromptWithManifests(prompt: string): string {
    // PRIMEIRO: Aplicar o Manifesto Mestre Supremo
    let enrichedPrompt = enrichWithMasterManifest(prompt);
    
    // DEPOIS: Aplicar manifestos específicos detectados
    const result = orchestrateManifests(prompt);
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║              🔥 MANIFESTO MESTRE SUPREMO ATIVADO 🔥                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Manifestos Específicos: ${result.totalManifestsApplied.toString().padEnd(50)}║
║  ${result.activeManifests.map(m => `${m.name} (L${m.level})`).join(' → ').substring(0, 66).padEnd(68)}║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    
    return enrichedPrompt;
}

/**
 * Retorna informações sobre todos os manifestos disponíveis
 */
export function getManifestInfo(): object {
    return {
        totalManifests: MANIFEST_REGISTRY.length + 5, // +5 para os de nível 3
        levels: {
            100: { name: 'TOKEN_COMPUTING', description: 'O Assembly da Cognição - Tokenização, LLM, Transformers, Cognitive Computing' },
            99: { name: 'SYSTEMS_PROGRAMMING', description: 'Anti-Fallback Supreme - Rust, C++, C, Go, Assembly (NUNCA fallback para JS/Python)' },
            98: { name: 'KERNEL_DRIVER', description: 'Linux Kernel Modules, Device Drivers, Ring 0' },
            97: { name: 'REALTIME_RTOS', description: 'FreeRTOS, Zephyr, Hard Real-Time Systems' },
            96: { name: 'HIGH_PERFORMANCE_COMPUTING', description: 'SIMD, CUDA, OpenMP, Parallel Computing' },
            95: { name: 'COMPILER_INTERPRETER', description: 'Lexer, Parser, AST, Code Generation, JIT Compilation' },
            94: { name: 'NETWORKING_PROTOCOLS', description: 'TCP/UDP, Custom Protocols, Zero-Copy, DPDK, io_uring' },
            93: { name: 'CRYPTOGRAPHY', description: 'AES, ChaCha20, Ed25519, Argon2, TLS, Zero-Knowledge' },
            92: { name: 'MEMORY_MANAGEMENT', description: 'Allocators, Ownership, Borrow Checker, GC, Leak Detection' },
            26: { name: 'MICRO_SAAS_FACTORY', description: 'Micro-SaaS Factory Omnipotent - A Fábrica Suprema de Micro-SaaS Autônomos' },
            25: { name: 'GEMINI_ROBOTICS', description: 'Gemini Robotics-ER 1.5 - Arquiteto de Mentes Robóticas (ROS2, MuJoCo, Embodied AI)' },
            24: { name: 'NUNCIO_DIGITAL', description: 'Núncio Digital - A Arte da Comunicação Instantânea (Chat, WebSocket)' },
            23: { name: 'VERIFIER_ARCHITECT', description: 'Verifier-Architect - Agente de Validação Universal' },
            22: { name: 'G3_DESIGN', description: 'G3 Design Engine - Agente Criador de Sites Profissionais' },
            21: { name: 'RAG_COLLAB', description: 'RAG + Colaboração em Tempo Real - Chroma, CRDT' },
            20: { name: 'OBSERVABILITY', description: 'Sistemas Transparentes - Logs, Métricas, Traces' },
            19: { name: 'EDGE', description: 'Edge Computing - Cloudflare Workers, Vercel Edge' },
            18: { name: 'ARVR', description: 'AR/VR Metaverse - ARKit, ARCore, WebXR' },
            17: { name: 'EMBEDDED', description: 'Embedded Systems - Arduino, ESP32, Firmware' },
            16: { name: 'GAMEDEV', description: 'Game Engine - Unity, Unreal, Godot' },
            15: { name: 'MOBILE', description: 'Mobile Native - Swift, Kotlin, Flutter' },
            14: { name: 'REALTIME', description: 'Realtime Architect - WebSocket, CRDT' },
            13: { name: 'SECURITY', description: 'Security Fortress - OWASP, Zero Trust' },
            12: { name: 'UNIVERSAL', description: 'Mestre das APIs do Mundo' },
            11: { name: 'POLYGLOT', description: 'Navegador de Linguagens' },
            10: { name: 'OMEGA', description: 'Singularidade Recursiva' },
            9: { name: 'AION', description: 'Civilization Architect' },
            8: { name: 'HELIX', description: 'Bio-Evolutionary' },
            7: { name: 'OMNIS', description: 'Quantum Supremacy' },
            6: { name: 'AURA', description: 'Voice Interface' },
            5: { name: 'SYNTHIA', description: 'MLOps Scientist' },
            4: { name: 'FINTECH', description: 'Enterprise Standards (Always Active)' },
            3: { name: 'STANDARD', description: 'TDD, Hono, Mesh, MCP, Hybrid' },
            2: { name: 'ENGINEERING', description: 'Git, CI/CD, Qualidade, Reprodutibilidade' },
            1: { name: 'ARCHITECT', description: 'Design First, SOLID, Patterns, Consistência' },
            0: { name: 'GENESIS', description: 'Alma do Agente, Ética, Princípios Invioláveis' }
        },
        registry: MANIFEST_REGISTRY.map(m => ({
            name: m.name,
            level: m.level,
            description: m.description
        }))
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    // MANIFESTO MESTRE SUPREMO - O CÉREBRO DO SISTEMA
    MANIFESTO_MESTRE_SUPREMO,
    enrichWithMasterManifest,
    // Level 100 - Token Computing (TRANSCENDENCE)
    TOKEN_COMPUTING_MANIFEST,
    TokenVirtualMachine,
    TokenAssembler,
    // Level 99 - Systems Programming Anti-Fallback (GOD MODE)
    SYSTEMS_PROGRAMMING_MANIFEST,
    AntiFallbackValidator,
    SystemsRequirementDetector,
    // Level 95 - Compiler & Interpreter (LANGUAGE CREATION)
    COMPILER_INTERPRETER_MANIFEST,
    LexerGenerator,
    ParserGenerator,
    SimpleInterpreter,
    // Level 94 - Networking & Protocols (NETWORK STACK)
    NETWORKING_PROTOCOLS_MANIFEST,
    PROTOCOL_TEMPLATES,
    // Level 93 - Cryptography (SECURITY CORE)
    CRYPTOGRAPHY_MANIFEST,
    CRYPTO_TEMPLATES,
    // Level 92 - Memory Management (MEMORY MASTERY)
    MEMORY_MANAGEMENT_MANIFEST,
    MEMORY_TEMPLATES,
    // Level 26 - Micro-SaaS Factory (Máximo)
    MICRO_SAAS_FACTORY_MANIFEST,
    // Level 25 - Gemini Robotics-ER
    GEMINI_ROBOTICS_MANIFEST,
    // Level 24 - Núncio Digital
    NUNCIO_DIGITAL_MANIFEST,
    // Level 22 - G3 Design Engine
    G3_DESIGN_ENGINE_MANIFEST,
    // Level 0-2 (Fundamentais - SEMPRE ATIVOS)
    LEVEL_0_GENESIS_MANIFEST,
    LEVEL_1_ARCHITECT_MANIFEST,
    LEVEL_2_ENGINEERING_MANIFEST,
    // Level 21 - RAG + Colaboração
    REALTIME_COLLABORATION_RAG_MANIFEST,
    // Level 4 - Visualização
    PROJECT_VISUALIZATION_MANIFEST,
    // Level 20-13
    OBSERVABILITY_MANIFEST,
    EDGE_COMPUTING_MANIFEST,
    AR_VR_METAVERSE_MANIFEST,
    EMBEDDED_SYSTEMS_MANIFEST,
    GAME_ENGINE_MANIFEST,
    MOBILE_NATIVE_MANIFEST,
    REALTIME_ARCHITECT_MANIFEST,
    SECURITY_FORTRESS_MANIFEST,
    // Level 12-5
    UNIVERSAL_INTEGRATOR_MANIFEST,
    POLYGLOT_ARCHITECT_MANIFEST,
    OMEGA_SINGULARITY_MANIFEST,
    AION_CIVILIZATION_MANIFEST,
    HELIX_BIO_MANIFEST,
    OMNIS_QUANTUM_MANIFEST,
    PROJECT_AURA_MANIFEST,
    SYNTHIA_LABS_MANIFEST,
    // Level 3
    TEST_DRIVEN_DEVELOPMENT_MANIFEST,
    DISTRIBUTED_MESH_NETWORK_MANIFEST,
    HONO_FRAMEWORK_MANIFEST,
    HYBRID_ARCHITECTURE_MANIFEST,
    MCP_INTEGRATION_MANIFEST
};

export default orchestrateManifests;
