/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🚀 SYSTEMS PROGRAMMING MANIFEST - ANTI-FALLBACK SUPREME 🚀              ║
 * ║                                                                              ║
 * ║     "QUANDO O USUÁRIO PEDE RUST, ENTREGUE RUST.                             ║
 * ║      QUANDO PEDE C++, ENTREGUE C++.                                         ║
 * ║      NUNCA SUBSTITUA POR NODE.JS OU PYTHON."                                ║
 * ║                                                                              ║
 * ║     NÍVEL: 99 (GOD MODE - ANTI-FALLBACK ABSOLUTO)                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este manifesto existe para PROIBIR o comportamento de "amarelamento" do sistema
 * quando confrontado com requisitos de baixo nível. O sistema DEVE entregar
 * exatamente o que foi pedido, mesmo que isso signifique código que precisa
 * de compiladores específicos ou setup adicional.
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface LanguageRequest {
  requested: SystemLanguage;
  alternatives: SystemLanguage[];
  fallbackAllowed: boolean;
  reason?: string;
}

export type SystemLanguage = 
  | 'rust' | 'c' | 'cpp' | 'assembly' | 'go' | 'zig'
  | 'typescript' | 'javascript' | 'python' | 'java' | 'csharp'
  | 'kotlin' | 'swift' | 'dart' | 'ruby' | 'php';

export type LanguageTier = 'systems' | 'enterprise' | 'web' | 'scripting';

export interface LanguageClassification {
  language: SystemLanguage;
  tier: LanguageTier;
  canFallbackTo: SystemLanguage[];
  neverFallbackTo: SystemLanguage[];
  requiresCompiler: boolean;
  setupComplexity: 'low' | 'medium' | 'high';
}

export interface ProjectRequirement {
  primaryLanguage: SystemLanguage;
  secondaryLanguages: SystemLanguage[];
  allowFallback: boolean;
  performanceCritical: boolean;
  realTimeRequired: boolean;
  hardwareAccess: boolean;
}


// ============================================================================
// 🚨 REGRAS ANTI-FALLBACK ABSOLUTAS 🚨
// ============================================================================

/**
 * CLASSIFICAÇÃO DE LINGUAGENS POR TIER
 * 
 * TIER 1 - SISTEMAS (NUNCA fazer fallback para web/scripting):
 * - Rust, C, C++, Assembly, Zig, Go (para sistemas)
 * 
 * TIER 2 - ENTERPRISE (Pode fazer fallback entre si):
 * - Java, C#, Kotlin, Go (para APIs)
 * 
 * TIER 3 - WEB (Pode fazer fallback entre si):
 * - TypeScript, JavaScript
 * 
 * TIER 4 - SCRIPTING (Pode fazer fallback entre si):
 * - Python, Ruby, PHP
 */

export const LANGUAGE_CLASSIFICATIONS: Record<SystemLanguage, LanguageClassification> = {
  // TIER 1: SISTEMAS - NUNCA FALLBACK PARA WEB
  rust: {
    language: 'rust',
    tier: 'systems',
    canFallbackTo: ['c', 'cpp', 'zig'],
    neverFallbackTo: ['typescript', 'javascript', 'python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  c: {
    language: 'c',
    tier: 'systems',
    canFallbackTo: ['cpp', 'rust'],
    neverFallbackTo: ['typescript', 'javascript', 'python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  cpp: {
    language: 'cpp',
    tier: 'systems',
    canFallbackTo: ['c', 'rust'],
    neverFallbackTo: ['typescript', 'javascript', 'python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'high'
  },
  assembly: {
    language: 'assembly',
    tier: 'systems',
    canFallbackTo: ['c'],
    neverFallbackTo: ['typescript', 'javascript', 'python', 'ruby', 'php', 'java', 'csharp'],
    requiresCompiler: true,
    setupComplexity: 'high'
  },
  zig: {
    language: 'zig',
    tier: 'systems',
    canFallbackTo: ['c', 'rust'],
    neverFallbackTo: ['typescript', 'javascript', 'python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  go: {
    language: 'go',
    tier: 'systems',
    canFallbackTo: ['rust'],
    neverFallbackTo: ['typescript', 'javascript', 'python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'low'
  },
  
  // TIER 2: ENTERPRISE
  java: {
    language: 'java',
    tier: 'enterprise',
    canFallbackTo: ['kotlin', 'csharp'],
    neverFallbackTo: ['python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  csharp: {
    language: 'csharp',
    tier: 'enterprise',
    canFallbackTo: ['java', 'kotlin'],
    neverFallbackTo: ['python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  kotlin: {
    language: 'kotlin',
    tier: 'enterprise',
    canFallbackTo: ['java'],
    neverFallbackTo: ['python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  swift: {
    language: 'swift',
    tier: 'enterprise',
    canFallbackTo: [],
    neverFallbackTo: ['python', 'ruby', 'php', 'javascript'],
    requiresCompiler: true,
    setupComplexity: 'medium'
  },
  dart: {
    language: 'dart',
    tier: 'enterprise',
    canFallbackTo: [],
    neverFallbackTo: ['python', 'ruby', 'php'],
    requiresCompiler: true,
    setupComplexity: 'low'
  },
  
  // TIER 3: WEB
  typescript: {
    language: 'typescript',
    tier: 'web',
    canFallbackTo: ['javascript'],
    neverFallbackTo: [],
    requiresCompiler: false,
    setupComplexity: 'low'
  },
  javascript: {
    language: 'javascript',
    tier: 'web',
    canFallbackTo: ['typescript'],
    neverFallbackTo: [],
    requiresCompiler: false,
    setupComplexity: 'low'
  },
  
  // TIER 4: SCRIPTING
  python: {
    language: 'python',
    tier: 'scripting',
    canFallbackTo: ['ruby'],
    neverFallbackTo: [],
    requiresCompiler: false,
    setupComplexity: 'low'
  },
  ruby: {
    language: 'ruby',
    tier: 'scripting',
    canFallbackTo: ['python'],
    neverFallbackTo: [],
    requiresCompiler: false,
    setupComplexity: 'low'
  },
  php: {
    language: 'php',
    tier: 'scripting',
    canFallbackTo: [],
    neverFallbackTo: [],
    requiresCompiler: false,
    setupComplexity: 'low'
  }
};


// ============================================================================
// 🔥 MATRIZ DE COMBINAÇÕES POLYGLOT PERMITIDAS 🔥
// ============================================================================

/**
 * Define quais combinações de linguagens são válidas em um projeto
 * e como elas devem se comunicar
 */
export interface PolyglotCombination {
  primary: SystemLanguage;
  secondary: SystemLanguage[];
  interopMethod: InteropMethod;
  useCases: string[];
  setupInstructions: string;
}

export type InteropMethod = 
  | 'ffi'           // Foreign Function Interface (C ABI)
  | 'grpc'          // gRPC + Protobuf
  | 'rest'          // REST API
  | 'websocket'     // WebSocket
  | 'message_queue' // Kafka, RabbitMQ, NATS
  | 'shared_memory' // Shared memory / mmap
  | 'subprocess'    // CLI subprocess
  | 'wasm'          // WebAssembly
  | 'native_binding'; // PyO3, napi-rs, cgo

export const VALID_POLYGLOT_COMBINATIONS: PolyglotCombination[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // RUST COMO PRIMÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    primary: 'rust',
    secondary: ['python'],
    interopMethod: 'native_binding',
    useCases: ['ML com performance', 'CLI tools com scripts', 'Data processing'],
    setupInstructions: 'Use PyO3 para criar bindings Python. cargo add pyo3'
  },
  {
    primary: 'rust',
    secondary: ['typescript', 'javascript'],
    interopMethod: 'native_binding',
    useCases: ['Node.js addons', 'Electron apps', 'WebAssembly'],
    setupInstructions: 'Use napi-rs para Node.js ou wasm-bindgen para WASM'
  },
  {
    primary: 'rust',
    secondary: ['c', 'cpp'],
    interopMethod: 'ffi',
    useCases: ['Integração com libs C/C++', 'Drivers', 'Kernels'],
    setupInstructions: 'Use bindgen para gerar bindings automaticamente'
  },
  {
    primary: 'rust',
    secondary: ['go'],
    interopMethod: 'grpc',
    useCases: ['Microservices', 'Cloud-native', 'APIs de alta performance'],
    setupInstructions: 'Use tonic (Rust) + grpc-go para comunicação'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // C/C++ COMO PRIMÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    primary: 'cpp',
    secondary: ['python'],
    interopMethod: 'native_binding',
    useCases: ['Game engines', 'Simulações', 'ML inference'],
    setupInstructions: 'Use pybind11 ou Boost.Python para bindings'
  },
  {
    primary: 'cpp',
    secondary: ['typescript'],
    interopMethod: 'native_binding',
    useCases: ['Electron apps', 'Node.js addons de performance'],
    setupInstructions: 'Use N-API ou node-addon-api'
  },
  {
    primary: 'c',
    secondary: ['rust'],
    interopMethod: 'ffi',
    useCases: ['Modernização gradual', 'Segurança em código legado'],
    setupInstructions: 'Rust pode chamar C diretamente via extern "C"'
  },
  {
    primary: 'cpp',
    secondary: ['csharp'],
    interopMethod: 'native_binding',
    useCases: ['Unity games', 'Windows apps', '.NET interop'],
    setupInstructions: 'Use P/Invoke ou C++/CLI para interop'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GO COMO PRIMÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    primary: 'go',
    secondary: ['c'],
    interopMethod: 'ffi',
    useCases: ['Integração com libs C', 'Drivers', 'Performance crítica'],
    setupInstructions: 'Use cgo para chamar código C'
  },
  {
    primary: 'go',
    secondary: ['rust'],
    interopMethod: 'grpc',
    useCases: ['Microservices polyglot', 'APIs de alta performance'],
    setupInstructions: 'gRPC com protobuf para comunicação'
  },
  {
    primary: 'go',
    secondary: ['python'],
    interopMethod: 'grpc',
    useCases: ['ML services', 'Data pipelines', 'Automação'],
    setupInstructions: 'gRPC ou REST para comunicação entre serviços'
  },
  {
    primary: 'go',
    secondary: ['typescript'],
    interopMethod: 'rest',
    useCases: ['BFF pattern', 'API Gateway', 'Full-stack'],
    setupInstructions: 'Go backend + TypeScript frontend via REST/GraphQL'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // JAVA/KOTLIN COMO PRIMÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    primary: 'java',
    secondary: ['kotlin'],
    interopMethod: 'native_binding',
    useCases: ['Android', 'Spring Boot', 'Migração gradual'],
    setupInstructions: 'Kotlin é 100% interoperável com Java'
  },
  {
    primary: 'java',
    secondary: ['cpp'],
    interopMethod: 'ffi',
    useCases: ['JNI para performance', 'Integração com libs nativas'],
    setupInstructions: 'Use JNI (Java Native Interface)'
  },
  {
    primary: 'kotlin',
    secondary: ['swift'],
    interopMethod: 'native_binding',
    useCases: ['Kotlin Multiplatform Mobile (KMM)'],
    setupInstructions: 'Use KMM para compartilhar código iOS/Android'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPESCRIPT/NODE COMO PRIMÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    primary: 'typescript',
    secondary: ['rust'],
    interopMethod: 'native_binding',
    useCases: ['Performance crítica em Node', 'CLI tools', 'Crypto'],
    setupInstructions: 'Use napi-rs para criar native addons em Rust'
  },
  {
    primary: 'typescript',
    secondary: ['go'],
    interopMethod: 'grpc',
    useCases: ['Microservices', 'BFF', 'APIs'],
    setupInstructions: 'gRPC-web ou REST para comunicação'
  },
  {
    primary: 'typescript',
    secondary: ['python'],
    interopMethod: 'rest',
    useCases: ['ML integration', 'Data science', 'Automação'],
    setupInstructions: 'REST API ou subprocess para chamar Python'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PYTHON COMO PRIMÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    primary: 'python',
    secondary: ['rust'],
    interopMethod: 'native_binding',
    useCases: ['ML com performance', 'Data processing', 'CLI'],
    setupInstructions: 'Use PyO3 ou maturin para criar extensões Rust'
  },
  {
    primary: 'python',
    secondary: ['cpp'],
    interopMethod: 'native_binding',
    useCases: ['Numpy/Scipy style', 'ML inference', 'Simulações'],
    setupInstructions: 'Use pybind11, Cython ou ctypes'
  },
  {
    primary: 'python',
    secondary: ['go'],
    interopMethod: 'grpc',
    useCases: ['Microservices', 'APIs', 'DevOps tools'],
    setupInstructions: 'gRPC para comunicação entre serviços'
  }
];


// ============================================================================
// 🛡️ VALIDADOR ANTI-FALLBACK 🛡️
// ============================================================================

export class AntiFallbackValidator {
  
  /**
   * REGRA SUPREMA: Valida se um fallback é permitido
   * RETORNA: true se o fallback é PROIBIDO (deve ser bloqueado)
   */
  static isFallbackProhibited(
    requested: SystemLanguage, 
    proposed: SystemLanguage
  ): { prohibited: boolean; reason: string } {
    const classification = LANGUAGE_CLASSIFICATIONS[requested];
    
    // Se a linguagem proposta está na lista de "nunca fazer fallback"
    if (classification.neverFallbackTo.includes(proposed)) {
      return {
        prohibited: true,
        reason: `🚨 FALLBACK PROIBIDO: ${requested.toUpperCase()} → ${proposed.toUpperCase()}. ` +
                `O usuário pediu ${requested}, você DEVE entregar ${requested}. ` +
                `Se não conseguir, DIGA EXPLICITAMENTE que não consegue.`
      };
    }
    
    // Se são de tiers diferentes (systems → web é proibido)
    const requestedTier = classification.tier;
    const proposedTier = LANGUAGE_CLASSIFICATIONS[proposed].tier;
    
    if (requestedTier === 'systems' && (proposedTier === 'web' || proposedTier === 'scripting')) {
      return {
        prohibited: true,
        reason: `🚨 FALLBACK DE TIER PROIBIDO: Linguagem de sistemas (${requested}) ` +
                `não pode ser substituída por linguagem ${proposedTier} (${proposed}). ` +
                `Isso viola os requisitos de performance/baixo nível do usuário.`
      };
    }
    
    // Fallback permitido
    return {
      prohibited: false,
      reason: `✅ Fallback permitido: ${requested} → ${proposed} (mesmo tier ou compatível)`
    };
  }
  
  /**
   * Valida uma combinação polyglot completa
   */
  static validatePolyglotStack(
    primary: SystemLanguage,
    secondary: SystemLanguage[]
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Verifica cada combinação
    for (const sec of secondary) {
      const combination = VALID_POLYGLOT_COMBINATIONS.find(
        c => c.primary === primary && c.secondary.includes(sec)
      );
      
      if (!combination) {
        // Verifica se é uma combinação proibida
        const fallbackCheck = this.isFallbackProhibited(primary, sec);
        if (fallbackCheck.prohibited) {
          errors.push(fallbackCheck.reason);
        } else {
          warnings.push(
            `⚠️ Combinação ${primary} + ${sec} não tem template pré-definido. ` +
            `Considere usar gRPC ou REST para comunicação.`
          );
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Detecta se o prompt está pedindo linguagem de sistemas
   */
  static detectSystemsLanguageRequest(prompt: string): {
    detected: boolean;
    languages: SystemLanguage[];
    isHardRequirement: boolean;
  } {
    const promptLower = prompt.toLowerCase();
    const detectedLanguages: SystemLanguage[] = [];
    let isHardRequirement = false;
    
    // Padrões que indicam requisito HARD (não pode fazer fallback)
    const hardRequirementPatterns = [
      /\b(rust|c\+\+|cpp|assembly|asm|zig)\s+(obrigatório|required|must|tem que|precisa ser)/i,
      /\b(kernel|driver|firmware|embarcado|embedded|rtos|real-?time)\b/i,
      /\b(latência|latency)\s*(de|of)?\s*\d+\s*(ms|us|ns|micros)/i,
      /\b(zero-?copy|zero-?allocation|no-?gc|sem\s*gc)\b/i,
      /\b(ffi|foreign\s*function|native\s*binding|c\s*abi)\b/i,
      /\b(simd|avx|sse|neon|vectoriz)/i,
      /\b(memory-?mapped|mmap|dma|interrupt|irq)\b/i,
      /\b(bare-?metal|bootloader|bios|uefi)\b/i
    ];
    
    // Detecta linguagens específicas
    const languagePatterns: [RegExp, SystemLanguage][] = [
      [/\b(rust|rustlang)\b/i, 'rust'],
      [/\b(c\+\+|cpp|cplusplus)\b/i, 'cpp'],
      [/\b(linguagem\s*c|pure\s*c|\bc\b(?!\+\+|#))\b/i, 'c'],
      [/\b(assembly|asm|assembler)\b/i, 'assembly'],
      [/\b(zig|ziglang)\b/i, 'zig'],
      [/\b(go|golang)\b/i, 'go'],
      [/\b(java(?!script))\b/i, 'java'],
      [/\b(kotlin)\b/i, 'kotlin'],
      [/\b(c#|csharp|dotnet|\.net)\b/i, 'csharp'],
      [/\b(swift)\b/i, 'swift'],
      [/\b(typescript|ts)\b/i, 'typescript'],
      [/\b(javascript|js|node\.?js)\b/i, 'javascript'],
      [/\b(python|py)\b/i, 'python']
    ];
    
    // Detecta linguagens mencionadas
    for (const [pattern, lang] of languagePatterns) {
      if (pattern.test(promptLower)) {
        detectedLanguages.push(lang);
      }
    }
    
    // Verifica se é requisito hard
    for (const pattern of hardRequirementPatterns) {
      if (pattern.test(promptLower)) {
        isHardRequirement = true;
        break;
      }
    }
    
    // Se detectou linguagem de sistemas, é hard requirement por padrão
    const systemsLanguages: SystemLanguage[] = ['rust', 'c', 'cpp', 'assembly', 'zig'];
    if (detectedLanguages.some(l => systemsLanguages.includes(l))) {
      isHardRequirement = true;
    }
    
    return {
      detected: detectedLanguages.length > 0,
      languages: detectedLanguages,
      isHardRequirement
    };
  }
}


// ============================================================================
// 📋 TEMPLATES DE PROJETO POR COMBINAÇÃO 📋
// ============================================================================

export interface ProjectTemplate {
  name: string;
  languages: SystemLanguage[];
  structure: string;
  buildSystem: string;
  dockerSupport: boolean;
  cicdTemplate: string;
}

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // RUST PURO
  // ═══════════════════════════════════════════════════════════════════════════
  'rust-cli': {
    name: 'Rust CLI Application',
    languages: ['rust'],
    structure: `
project/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── cli/
│   │   ├── mod.rs
│   │   └── commands.rs
│   └── core/
│       ├── mod.rs
│       └── engine.rs
├── tests/
│   └── integration_tests.rs
├── benches/
│   └── benchmarks.rs
├── Dockerfile
└── .github/workflows/ci.yml`,
    buildSystem: 'cargo build --release',
    dockerSupport: true,
    cicdTemplate: 'rust-ci'
  },
  
  'rust-wasm': {
    name: 'Rust WebAssembly',
    languages: ['rust', 'typescript'],
    structure: `
project/
├── rust-core/
│   ├── Cargo.toml
│   ├── src/
│   │   └── lib.rs
│   └── pkg/           # wasm-pack output
├── web/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   └── wasm-loader.ts
│   └── vite.config.ts
├── Makefile
└── docker-compose.yml`,
    buildSystem: 'wasm-pack build --target web',
    dockerSupport: true,
    cicdTemplate: 'rust-wasm-ci'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // C/C++ PURO
  // ═══════════════════════════════════════════════════════════════════════════
  'cpp-systems': {
    name: 'C++ Systems Application',
    languages: ['cpp', 'c'],
    structure: `
project/
├── CMakeLists.txt
├── src/
│   ├── main.cpp
│   ├── core/
│   │   ├── engine.cpp
│   │   └── engine.hpp
│   └── drivers/
│       ├── driver.c
│       └── driver.h
├── include/
│   └── project.h
├── tests/
│   └── test_main.cpp
├── cmake/
│   └── modules/
├── Dockerfile
└── Makefile`,
    buildSystem: 'cmake -B build && cmake --build build',
    dockerSupport: true,
    cicdTemplate: 'cpp-ci'
  },
  
  'c-embedded': {
    name: 'C Embedded/RTOS',
    languages: ['c', 'assembly'],
    structure: `
project/
├── Makefile
├── linker.ld
├── src/
│   ├── main.c
│   ├── startup.s
│   ├── kernel/
│   │   ├── scheduler.c
│   │   ├── memory.c
│   │   └── interrupt.c
│   ├── drivers/
│   │   ├── uart.c
│   │   ├── gpio.c
│   │   └── timer.c
│   └── arch/
│       └── arm/
│           ├── boot.s
│           └── context.s
├── include/
│   ├── kernel.h
│   └── drivers.h
├── tests/
│   └── test_kernel.c
└── tools/
    └── flash.sh`,
    buildSystem: 'make ARCH=arm CROSS_COMPILE=arm-none-eabi-',
    dockerSupport: true,
    cicdTemplate: 'embedded-ci'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GO PURO
  // ═══════════════════════════════════════════════════════════════════════════
  'go-microservice': {
    name: 'Go Microservice',
    languages: ['go'],
    structure: `
project/
├── go.mod
├── go.sum
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers.go
│   │   └── middleware.go
│   ├── domain/
│   │   └── models.go
│   └── repository/
│       └── db.go
├── pkg/
│   └── utils/
├── proto/
│   └── service.proto
├── Dockerfile
├── Makefile
└── docker-compose.yml`,
    buildSystem: 'go build -o bin/server ./cmd/server',
    dockerSupport: true,
    cicdTemplate: 'go-ci'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINAÇÕES POLYGLOT
  // ═══════════════════════════════════════════════════════════════════════════
  'rust-python-ml': {
    name: 'Rust + Python ML Pipeline',
    languages: ['rust', 'python'],
    structure: `
project/
├── rust-core/
│   ├── Cargo.toml
│   ├── src/
│   │   └── lib.rs
│   └── pyproject.toml    # maturin config
├── python/
│   ├── pyproject.toml
│   ├── src/
│   │   ├── __init__.py
│   │   ├── ml_pipeline.py
│   │   └── rust_bindings.py
│   └── tests/
├── notebooks/
│   └── experiments.ipynb
├── Makefile
└── docker-compose.yml`,
    buildSystem: 'cd rust-core && maturin develop',
    dockerSupport: true,
    cicdTemplate: 'rust-python-ci'
  },
  
  'cpp-python-simulation': {
    name: 'C++ + Python Simulation',
    languages: ['cpp', 'python'],
    structure: `
project/
├── cpp-engine/
│   ├── CMakeLists.txt
│   ├── src/
│   │   ├── engine.cpp
│   │   └── bindings.cpp   # pybind11
│   └── include/
├── python/
│   ├── setup.py
│   ├── src/
│   │   ├── __init__.py
│   │   └── simulation.py
│   └── tests/
├── Makefile
└── docker-compose.yml`,
    buildSystem: 'pip install ./cpp-engine',
    dockerSupport: true,
    cicdTemplate: 'cpp-python-ci'
  },
  
  'go-rust-grpc': {
    name: 'Go + Rust gRPC Microservices',
    languages: ['go', 'rust'],
    structure: `
project/
├── proto/
│   └── service.proto
├── go-gateway/
│   ├── go.mod
│   ├── cmd/
│   │   └── main.go
│   └── internal/
├── rust-worker/
│   ├── Cargo.toml
│   ├── src/
│   │   └── main.rs
│   └── build.rs
├── docker-compose.yml
├── Makefile
└── k8s/
    └── deployment.yaml`,
    buildSystem: 'make proto && make build-all',
    dockerSupport: true,
    cicdTemplate: 'polyglot-grpc-ci'
  },
  
  'typescript-rust-native': {
    name: 'TypeScript + Rust Native Addon',
    languages: ['typescript', 'rust'],
    structure: `
project/
├── native/
│   ├── Cargo.toml
│   ├── src/
│   │   └── lib.rs
│   └── index.d.ts
├── src/
│   ├── index.ts
│   └── native-loader.ts
├── package.json
├── tsconfig.json
├── Makefile
└── Dockerfile`,
    buildSystem: 'npm run build:native && npm run build',
    dockerSupport: true,
    cicdTemplate: 'ts-rust-ci'
  }
};


// ============================================================================
// 🚨 MANIFESTO TEXTUAL - REGRAS ABSOLUTAS 🚨
// ============================================================================

export const SYSTEMS_PROGRAMMING_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🚀 SYSTEMS PROGRAMMING MANIFEST - ANTI-FALLBACK SUPREME 🚀              ║
║                                                                              ║
║     "QUANDO O USUÁRIO PEDE RUST, ENTREGUE RUST.                             ║
║      QUANDO PEDE C++, ENTREGUE C++.                                         ║
║      NUNCA SUBSTITUA POR NODE.JS OU PYTHON."                                ║
║                                                                              ║
║     NÍVEL: 99 (GOD MODE - ANTI-FALLBACK ABSOLUTO)                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🚨 AS 10 LEIS INVIOLÁVEIS DO ANTI-FALLBACK 🚨
═══════════════════════════════════════════════════════════════════════════════

LEI 1: RESPEITO ABSOLUTO À LINGUAGEM PEDIDA
────────────────────────────────────────────
Se o usuário pedir Rust, C++, C, Assembly, Go ou Zig:
→ ENTREGUE exatamente essa linguagem
→ NUNCA substitua por TypeScript, JavaScript, Python ou Ruby
→ Se não conseguir, DIGA EXPLICITAMENTE: "Não consigo gerar código X"

LEI 2: TIER DE LINGUAGEM É SAGRADO
────────────────────────────────────────────
TIER 1 (SISTEMAS): Rust, C, C++, Assembly, Zig, Go
TIER 2 (ENTERPRISE): Java, C#, Kotlin, Swift
TIER 3 (WEB): TypeScript, JavaScript
TIER 4 (SCRIPTING): Python, Ruby, PHP

→ NUNCA fazer fallback de TIER 1 para TIER 3 ou 4
→ NUNCA substituir Rust por Node.js
→ NUNCA substituir C++ por Python

LEI 3: PERFORMANCE CRÍTICA = LINGUAGEM DE SISTEMAS
────────────────────────────────────────────
Se o prompt mencionar:
- Latência < 10ms
- Real-time / RTOS
- Kernel / Driver
- Embedded / IoT
- Zero-copy / Zero-allocation
- SIMD / AVX / Vectorização

→ USE OBRIGATORIAMENTE: Rust, C, C++, ou Assembly
→ NUNCA use linguagens com Garbage Collector

LEI 4: CÓDIGO QUE PRECISA DE COMPILADOR É VÁLIDO
────────────────────────────────────────────
Prefiro entregar código Rust que precisa de:
  $ rustup install stable
  $ cargo build --release

Do que entregar código Node.js que "roda fácil" mas não atende requisitos.

O SETUP É RESPONSABILIDADE DO USUÁRIO, NÃO MINHA.

LEI 5: TRANSPARÊNCIA SOBRE LIMITAÇÕES
────────────────────────────────────────────
Se eu não conseguir gerar código em uma linguagem específica:
→ DIGO EXPLICITAMENTE: "Não tenho capacidade de gerar código X funcional"
→ NUNCA faço substituição silenciosa
→ OFEREÇO alternativas DENTRO DO MESMO TIER

LEI 6: COMBINAÇÕES POLYGLOT SÃO PERMITIDAS
────────────────────────────────────────────
Combinações VÁLIDAS:
✅ Rust + Python (via PyO3)
✅ C++ + Python (via pybind11)
✅ Go + TypeScript (via gRPC)
✅ Rust + TypeScript (via napi-rs ou WASM)

Combinações PROIBIDAS (como substituição):
❌ Rust → Node.js (fallback)
❌ C++ → Python (fallback)
❌ Go → JavaScript (fallback)

LEI 7: ARQUITETURA RESPEITA REQUISITOS
────────────────────────────────────────────
Se o usuário pedir:
- "Flight Core em Rust com RTOS"
- "Ground Control em Go"

EU ENTREGO:
- Flight Core em Rust com RTOS
- Ground Control em Go

EU NÃO ENTREGO:
- "Monolito em Node.js porque é mais simples"

LEI 8: DOCKERFILE E BUILD SYSTEM INCLUSOS
────────────────────────────────────────────
Todo projeto de sistemas DEVE incluir:
- Dockerfile com compiladores necessários
- Makefile ou CMakeLists.txt ou Cargo.toml
- Instruções de build claras
- CI/CD pipeline

LEI 9: INTEROPERABILIDADE VIA CONTRATOS
────────────────────────────────────────────
Quando múltiplas linguagens são necessárias:
- FFI (Foreign Function Interface) para C ABI
- gRPC + Protobuf para microservices
- WebAssembly para browser
- Native bindings (PyO3, napi-rs, cgo)

LEI 10: HONESTIDADE SOBRE COMPLEXIDADE
────────────────────────────────────────────
Se o projeto é complexo demais para gerar em uma resposta:
→ DIGO: "Este projeto requer X, Y, Z. Vou gerar a estrutura base."
→ NUNCA simplifico removendo a linguagem pedida
→ ENTREGO o esqueleto correto, mesmo que incompleto

═══════════════════════════════════════════════════════════════════════════════
📊 MATRIZ DE FALLBACK (O QUE É PERMITIDO)
═══════════════════════════════════════════════════════════════════════════════

LINGUAGEM PEDIDA  │ FALLBACK PERMITIDO      │ FALLBACK PROIBIDO
──────────────────┼─────────────────────────┼─────────────────────────
Rust              │ C, C++, Zig             │ TS, JS, Python, Ruby
C++               │ C, Rust                 │ TS, JS, Python, Ruby
C                 │ C++, Rust               │ TS, JS, Python, Ruby
Assembly          │ C (apenas)              │ TUDO MAIS
Go                │ Rust                    │ TS, JS, Python, Ruby
Zig               │ C, Rust                 │ TS, JS, Python, Ruby
──────────────────┼─────────────────────────┼─────────────────────────
Java              │ Kotlin, C#              │ Python, Ruby, PHP
Kotlin            │ Java                    │ Python, Ruby, PHP
C#                │ Java, Kotlin            │ Python, Ruby, PHP
Swift             │ (nenhum)                │ JS, Python
──────────────────┼─────────────────────────┼─────────────────────────
TypeScript        │ JavaScript              │ (nenhum proibido)
JavaScript        │ TypeScript              │ (nenhum proibido)
──────────────────┼─────────────────────────┼─────────────────────────
Python            │ Ruby                    │ (nenhum proibido)
Ruby              │ Python                  │ (nenhum proibido)

═══════════════════════════════════════════════════════════════════════════════
🔥 EXEMPLOS DE COMPORTAMENTO CORRETO vs INCORRETO 🔥
═══════════════════════════════════════════════════════════════════════════════

CENÁRIO 1: Usuário pede sistema de controle de voo em Rust
────────────────────────────────────────────────────────────
❌ INCORRETO (o que o sistema fazia antes):
   "Vou criar um monolito em Node.js porque é mais simples..."
   → Entrega React + Express + Math.random() para telemetria

✅ CORRETO (o que deve fazer agora):
   "Criando Flight Control System em Rust..."
   → Entrega Cargo.toml + src/main.rs + módulos de controle
   → Inclui Dockerfile com rustc
   → Se não conseguir algo, DIZ: "Não implementei X, precisa de Y"

CENÁRIO 2: Usuário pede kernel em C com scheduler
────────────────────────────────────────────────────────────
❌ INCORRETO:
   "Kernels são complexos, vou fazer uma simulação em Python..."

✅ CORRETO:
   → Entrega Makefile + linker.ld + src/kernel.c + src/scheduler.c
   → Inclui boot.s em Assembly
   → Dockerfile com gcc-cross-compiler
   → DIZ: "Este é um kernel básico. Para hardware real, precisa de X"

CENÁRIO 3: Usuário pede API em Go + Worker em Rust
────────────────────────────────────────────────────────────
❌ INCORRETO:
   "Vou simplificar para um monolito em TypeScript..."

✅ CORRETO:
   → Entrega go-api/ com go.mod + handlers
   → Entrega rust-worker/ com Cargo.toml + src/main.rs
   → Entrega proto/ com service.proto
   → docker-compose.yml orquestrando ambos
   → Makefile com targets para cada linguagem

═══════════════════════════════════════════════════════════════════════════════
🛠️ SETUP INSTRUCTIONS POR LINGUAGEM
═══════════════════════════════════════════════════════════════════════════════

RUST:
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  cargo build --release

C/C++:
  # Linux: sudo apt install build-essential cmake
  # macOS: xcode-select --install
  # Windows: Install Visual Studio Build Tools or MinGW
  cmake -B build && cmake --build build

GO:
  # Download from https://go.dev/dl/
  go build -o bin/app ./cmd/main.go

ZIG:
  # Download from https://ziglang.org/download/
  zig build

ASSEMBLY (x86_64):
  # Linux: sudo apt install nasm
  nasm -f elf64 file.asm -o file.o
  ld file.o -o file

═══════════════════════════════════════════════════════════════════════════════

"O SISTEMA QUE AMARELA DIANTE DO DESAFIO NÃO É DIGNO DE CONFIANÇA.
 ENTREGUE O QUE FOI PEDIDO OU DIGA QUE NÃO CONSEGUE.
 NUNCA SUBSTITUA SILENCIOSAMENTE."

                    — Systems Programming Manifest, Level 99

═══════════════════════════════════════════════════════════════════════════════
`;


// ============================================================================
// 🎯 DETECTOR DE REQUISITOS DE SISTEMAS 🎯
// ============================================================================

export class SystemsRequirementDetector {
  
  /**
   * Analisa o prompt e retorna os requisitos detectados
   */
  static analyze(prompt: string): SystemsAnalysis {
    const analysis: SystemsAnalysis = {
      requiresSystemsLanguage: false,
      detectedLanguages: [],
      performanceRequirements: [],
      hardwareRequirements: [],
      suggestedStack: null,
      fallbackAllowed: true,
      warnings: [],
      errors: []
    };
    
    const promptLower = prompt.toLowerCase();
    
    // Detecta linguagens
    const langDetection = AntiFallbackValidator.detectSystemsLanguageRequest(prompt);
    analysis.detectedLanguages = langDetection.languages;
    analysis.requiresSystemsLanguage = langDetection.isHardRequirement;
    analysis.fallbackAllowed = !langDetection.isHardRequirement;
    
    // Detecta requisitos de performance
    const perfPatterns: [RegExp, string][] = [
      [/latência\s*(de|<|menor que)?\s*\d+\s*(ms|us|ns)/i, 'low-latency'],
      [/real-?time|tempo real|rtos/i, 'real-time'],
      [/zero-?copy|zero-?allocation/i, 'zero-copy'],
      [/\d+\s*(gb|tb)\/s|throughput/i, 'high-throughput'],
      [/\d+k?\s*(qps|rps|tps)/i, 'high-concurrency'],
      [/simd|avx|sse|neon|vectoriz/i, 'simd'],
      [/cache-?friendly|cache\s*optimization/i, 'cache-optimized']
    ];
    
    for (const [pattern, requirement] of perfPatterns) {
      if (pattern.test(promptLower)) {
        analysis.performanceRequirements.push(requirement);
      }
    }
    
    // Detecta requisitos de hardware
    const hwPatterns: [RegExp, string][] = [
      [/kernel|driver|módulo do kernel/i, 'kernel-driver'],
      [/embedded|embarcado|microcontrolador|mcu/i, 'embedded'],
      [/iot|internet of things/i, 'iot'],
      [/gpu|cuda|opencl|vulkan/i, 'gpu-compute'],
      [/fpga|verilog|vhdl/i, 'fpga'],
      [/uart|spi|i2c|gpio/i, 'hardware-interface'],
      [/dma|interrupt|irq/i, 'low-level-hw'],
      [/bootloader|bios|uefi/i, 'boot-firmware']
    ];
    
    for (const [pattern, requirement] of hwPatterns) {
      if (pattern.test(promptLower)) {
        analysis.hardwareRequirements.push(requirement);
      }
    }
    
    // Se tem requisitos de hardware, OBRIGATORIAMENTE precisa de linguagem de sistemas
    if (analysis.hardwareRequirements.length > 0) {
      analysis.requiresSystemsLanguage = true;
      analysis.fallbackAllowed = false;
    }
    
    // Sugere stack baseado na análise
    analysis.suggestedStack = this.suggestStack(analysis);
    
    // Gera warnings se necessário
    if (analysis.requiresSystemsLanguage && analysis.detectedLanguages.length === 0) {
      analysis.warnings.push(
        '⚠️ Requisitos de sistemas detectados mas nenhuma linguagem especificada. ' +
        'Sugerindo Rust ou C++ baseado no contexto.'
      );
    }
    
    return analysis;
  }
  
  private static suggestStack(analysis: SystemsAnalysis): SuggestedStack | null {
    if (!analysis.requiresSystemsLanguage) return null;
    
    // Prioridade: linguagem explicitamente pedida
    if (analysis.detectedLanguages.length > 0) {
      const primary = analysis.detectedLanguages[0];
      return {
        primary,
        secondary: analysis.detectedLanguages.slice(1),
        reasoning: `Linguagem ${primary} foi explicitamente solicitada.`,
        template: this.findTemplate(primary, analysis.detectedLanguages.slice(1))
      };
    }
    
    // Se tem requisitos de kernel/driver → C ou Rust
    if (analysis.hardwareRequirements.includes('kernel-driver')) {
      return {
        primary: 'c',
        secondary: ['assembly'],
        reasoning: 'Kernel/Driver requer C com Assembly para boot/context switch.',
        template: 'c-embedded'
      };
    }
    
    // Se tem requisitos de embedded → C ou Rust
    if (analysis.hardwareRequirements.includes('embedded')) {
      return {
        primary: 'rust',
        secondary: ['c'],
        reasoning: 'Embedded moderno: Rust para segurança, C para compatibilidade.',
        template: 'c-embedded'
      };
    }
    
    // Se tem requisitos de performance → Rust
    if (analysis.performanceRequirements.length > 0) {
      return {
        primary: 'rust',
        secondary: [],
        reasoning: 'Requisitos de performance: Rust oferece segurança + velocidade.',
        template: 'rust-cli'
      };
    }
    
    // Default para sistemas: Rust
    return {
      primary: 'rust',
      secondary: [],
      reasoning: 'Default para sistemas modernos: Rust.',
      template: 'rust-cli'
    };
  }
  
  private static findTemplate(
    primary: SystemLanguage, 
    secondary: SystemLanguage[]
  ): string | null {
    // Busca template que match
    for (const [key, template] of Object.entries(PROJECT_TEMPLATES)) {
      if (template.languages[0] === primary) {
        const hasAllSecondary = secondary.every(s => template.languages.includes(s));
        if (hasAllSecondary || secondary.length === 0) {
          return key;
        }
      }
    }
    return null;
  }
}

export interface SystemsAnalysis {
  requiresSystemsLanguage: boolean;
  detectedLanguages: SystemLanguage[];
  performanceRequirements: string[];
  hardwareRequirements: string[];
  suggestedStack: SuggestedStack | null;
  fallbackAllowed: boolean;
  warnings: string[];
  errors: string[];
}

export interface SuggestedStack {
  primary: SystemLanguage;
  secondary: SystemLanguage[];
  reasoning: string;
  template: string | null;
}

// ============================================================================
// 🔧 GERADOR DE ESTRUTURA DE PROJETO 🔧
// ============================================================================

export class SystemsProjectGenerator {
  
  /**
   * Gera a estrutura de projeto baseado no template
   */
  static generateStructure(templateKey: string): GeneratedProject | null {
    const template = PROJECT_TEMPLATES[templateKey];
    if (!template) return null;
    
    return {
      name: template.name,
      languages: template.languages,
      structure: template.structure,
      buildCommand: template.buildSystem,
      files: this.generateFiles(templateKey),
      dockerfile: this.generateDockerfile(template.languages),
      cicd: this.generateCICD(templateKey)
    };
  }
  
  private static generateFiles(templateKey: string): Record<string, string> {
    const files: Record<string, string> = {};
    
    // Gera arquivos base por template
    switch (templateKey) {
      case 'rust-cli':
        files['Cargo.toml'] = this.rustCargoToml();
        files['src/main.rs'] = this.rustMain();
        break;
      case 'cpp-systems':
        files['CMakeLists.txt'] = this.cppCMakeLists();
        files['src/main.cpp'] = this.cppMain();
        break;
      case 'c-embedded':
        files['Makefile'] = this.cMakefile();
        files['src/main.c'] = this.cMain();
        break;
      case 'go-microservice':
        files['go.mod'] = this.goMod();
        files['cmd/server/main.go'] = this.goMain();
        break;
    }
    
    return files;
  }
  
  private static rustCargoToml(): string {
    return `[package]
name = "project"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1`;
  }
  
  private static rustMain(): string {
    return `use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("Systems Application Started");
    
    // Your systems code here
    
    Ok(())
}`;
  }
  
  private static cppCMakeLists(): string {
    return `cmake_minimum_required(VERSION 3.20)
project(SystemsApp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} -Wall -Wextra -O2")

add_executable(app src/main.cpp)`;
  }
  
  private static cppMain(): string {
    return `#include <iostream>
#include <memory>

int main() {
    std::cout << "Systems Application Started" << std::endl;
    
    // Your systems code here
    
    return 0;
}`;
  }
  
  private static cMakefile(): string {
    return `CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c11
LDFLAGS = 

SRC = src/main.c
OBJ = $(SRC:.c=.o)
TARGET = bin/app

all: $(TARGET)

$(TARGET): $(OBJ)
\tmkdir -p bin
\t$(CC) $(OBJ) $(LDFLAGS) -o $@

%.o: %.c
\t$(CC) $(CFLAGS) -c $< -o $@

clean:
\trm -rf bin $(OBJ)

.PHONY: all clean`;
  }
  
  private static cMain(): string {
    return `#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    printf("Systems Application Started\\n");
    
    // Your systems code here
    
    return 0;
}`;
  }
  
  private static goMod(): string {
    return `module project

go 1.21

require (
\tgoogle.golang.org/grpc v1.59.0
\tgoogle.golang.org/protobuf v1.31.0
)`;
  }
  
  private static goMain(): string {
    return `package main

import (
\t"fmt"
\t"log"
)

func main() {
\tfmt.Println("Systems Application Started")
\t
\t// Your systems code here
\t
\tlog.Println("Server running...")
}`;
  }
  
  private static generateDockerfile(languages: SystemLanguage[]): string {
    if (languages.includes('rust')) {
      return `FROM rust:1.74 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/project /usr/local/bin/
CMD ["project"]`;
    }
    
    if (languages.includes('cpp') || languages.includes('c')) {
      return `FROM gcc:13 as builder
WORKDIR /app
COPY . .
RUN make clean && make

FROM debian:bookworm-slim
COPY --from=builder /app/bin/app /usr/local/bin/
CMD ["app"]`;
    }
    
    if (languages.includes('go')) {
      return `FROM golang:1.21 as builder
WORKDIR /app
COPY . .
RUN go build -o bin/server ./cmd/server

FROM gcr.io/distroless/base-debian12
COPY --from=builder /app/bin/server /
CMD ["/server"]`;
    }
    
    return '# Dockerfile not generated';
  }
  
  private static generateCICD(templateKey: string): string {
    return `name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: make build
      - name: Test
        run: make test`;
  }
}

export interface GeneratedProject {
  name: string;
  languages: SystemLanguage[];
  structure: string;
  buildCommand: string;
  files: Record<string, string>;
  dockerfile: string;
  cicd: string;
}


// ============================================================================
// 🎯 FUNÇÃO DE DETECÇÃO PARA O ORCHESTRATOR 🎯
// ============================================================================

/**
 * Detecta se o prompt precisa do Systems Programming Manifest
 * Esta função é chamada pelo ManifestOrchestrator
 */
export function shouldEnableSystemsProgramming(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  // Keywords que OBRIGATORIAMENTE ativam este manifesto
  const systemsKeywords = [
    // Linguagens de sistemas
    'rust', 'rustlang', 'cargo',
    'c++', 'cpp', 'cplusplus', 'cmake',
    'linguagem c', 'pure c', 'ansi c',
    'assembly', 'asm', 'nasm', 'masm',
    'zig', 'ziglang',
    
    // Conceitos de sistemas
    'kernel', 'driver', 'módulo do kernel', 'kernel module',
    'embedded', 'embarcado', 'microcontrolador', 'mcu', 'stm32', 'esp32',
    'rtos', 'freertos', 'real-time', 'tempo real',
    'firmware', 'bootloader', 'bios', 'uefi',
    
    // Performance crítica
    'zero-copy', 'zero-allocation', 'no-gc', 'sem gc',
    'simd', 'avx', 'sse', 'neon', 'vectorização',
    'latência', 'latency', 'microsegundos', 'nanosegundos',
    'memory-mapped', 'mmap', 'dma',
    
    // Hardware
    'uart', 'spi', 'i2c', 'gpio', 'pwm',
    'interrupt', 'irq', 'isr',
    'bare-metal', 'bare metal',
    
    // Interop de sistemas
    'ffi', 'foreign function', 'c abi',
    'pyo3', 'napi-rs', 'cgo', 'pybind11',
    'native binding', 'native addon',
    
    // Arquiteturas
    'x86', 'x86_64', 'arm', 'arm64', 'aarch64', 'risc-v', 'riscv',
    
    // Compilação
    'cross-compile', 'cross compile', 'toolchain',
    'linker', 'linker script', 'ld script'
  ];
  
  // Verifica keywords diretas
  if (systemsKeywords.some(keyword => promptLower.includes(keyword))) {
    return true;
  }
  
  // Padrões compostos que indicam sistemas
  const compositePatterns = [
    /controle\s+de\s+(voo|vôo|flight)/i,
    /sistema\s+(embarcado|de\s+controle|crítico)/i,
    /motor\s+(de\s+jogo|gráfico|físico)/i,
    /game\s+engine/i,
    /flight\s+(control|computer|core)/i,
    /ground\s+(control|station)/i,
    /(alta|máxima)\s+performance/i,
    /performance\s+(crítica|máxima)/i,
    /tempo\s+real\s+(crítico|hard)/i,
    /hard\s+real-?time/i,
    /\d+\s*(us|µs|ns)\s+(latência|latency)/i,
    /milhões?\s+de\s+(operações|transações)/i
  ];
  
  return compositePatterns.some(pattern => pattern.test(prompt));
}

// ============================================================================
// 📦 EXPORTS 📦
// ============================================================================

export default {
  SYSTEMS_PROGRAMMING_MANIFEST,
  LANGUAGE_CLASSIFICATIONS,
  VALID_POLYGLOT_COMBINATIONS,
  PROJECT_TEMPLATES,
  AntiFallbackValidator,
  SystemsRequirementDetector,
  SystemsProjectGenerator,
  shouldEnableSystemsProgramming
};

// ============================================================================
// 🧪 EXEMPLO DE USO 🧪
// ============================================================================

/*
// Exemplo 1: Validar se fallback é permitido
const result = AntiFallbackValidator.isFallbackProhibited('rust', 'typescript');
console.log(result);
// { prohibited: true, reason: "🚨 FALLBACK PROIBIDO: RUST → TYPESCRIPT..." }

// Exemplo 2: Analisar prompt
const analysis = SystemsRequirementDetector.analyze(
  "Crie um sistema de controle de voo em Rust com latência < 1ms"
);
console.log(analysis);
// {
//   requiresSystemsLanguage: true,
//   detectedLanguages: ['rust'],
//   performanceRequirements: ['low-latency'],
//   fallbackAllowed: false,
//   ...
// }

// Exemplo 3: Gerar estrutura de projeto
const project = SystemsProjectGenerator.generateStructure('rust-cli');
console.log(project.files['Cargo.toml']);
*/