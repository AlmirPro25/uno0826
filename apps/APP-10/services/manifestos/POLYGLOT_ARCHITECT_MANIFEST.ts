/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🌐 POLYGLOT ARCHITECT: NAVEGADOR DE LINGUAGENS - LEVEL 11 🌐        ║
 * ║                                                                              ║
 * ║            "NÃO EXISTE LINGUAGEM PERFEITA.                                  ║
 * ║             EXISTE A COMBINAÇÃO PERFEITA PARA CADA PROBLEMA."               ║
 * ║                                                                              ║
 * ║                    O ARQUITETO QUE FALA TODAS AS LÍNGUAS                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface LanguageProfile {
  name: string;
  tier: 'systems' | 'enterprise' | 'frontend' | 'scripting' | 'data' | 'infra';
  strengths: string[];
  weaknesses: string[];
  useCases: string[];
  frameworks: string[];
  combinesWith: string[];
  performanceScore: number; // 1-10
  learningCurve: number;    // 1-10 (10 = mais difícil)
  ecosystemMaturity: number; // 1-10
}

export interface ProjectRequirements {
  type: 'api' | 'cli' | 'desktop' | 'mobile' | 'web' | 'data' | 'embedded' | 'game';
  performanceCritical: boolean;
  teamExpertise: string[];
  scalabilityNeeds: 'low' | 'medium' | 'high' | 'extreme';
  timeToMarket: 'fast' | 'normal' | 'flexible';
  maintenanceImportance: 'low' | 'medium' | 'high';
  securityLevel: 'standard' | 'high' | 'critical';
}

export interface StackRecommendation {
  primary: string;
  secondary: string[];
  reasoning: string;
  architecture: string;
  interopMethod: string;
}

// ============================================================================
// CATÁLOGO DE LINGUAGENS
// ============================================================================

export const LANGUAGE_CATALOG: Record<string, LanguageProfile> = {

  // TIER 1: SISTEMAS DE BAIXO NÍVEL
  rust: {
    name: 'Rust',
    tier: 'systems',
    strengths: ['Memory safety sem GC', 'Zero-cost abstractions', 'Concorrência segura', 'WebAssembly'],
    weaknesses: ['Curva de aprendizado íngreme', 'Tempo de compilação'],
    useCases: ['CLI tools', 'WebAssembly', 'Sistemas críticos', 'Infra cloud'],
    frameworks: ['Actix', 'Axum', 'Rocket', 'Tokio'],
    combinesWith: ['Python (PyO3)', 'Node (napi-rs)', 'C (FFI)'],
    performanceScore: 10,
    learningCurve: 9,
    ecosystemMaturity: 7
  },
  
  cpp: {
    name: 'C++',
    tier: 'systems',
    strengths: ['Performance máxima', 'Controle de memória', 'STL', 'Templates'],
    weaknesses: ['Complexidade', 'Memory leaks', 'Tempo de compilação'],
    useCases: ['Game engines', 'Browsers', 'Databases', 'Libs nativas'],
    frameworks: ['Qt', 'Boost', 'POCO'],
    combinesWith: ['Python (pybind11)', 'Node (N-API)', 'C# (P/Invoke)'],
    performanceScore: 10,
    learningCurve: 9,
    ecosystemMaturity: 10
  },

  c: {
    name: 'C',
    tier: 'systems',
    strengths: ['Controle total', 'Portabilidade', 'Performance'],
    weaknesses: ['Memory leaks', 'Buffer overflow', 'Sem OOP'],
    useCases: ['Kernels', 'Drivers', 'Firmware', 'Embarcados'],
    frameworks: ['libc', 'POSIX'],
    combinesWith: ['Assembly (inline)', 'Python (ctypes)'],
    performanceScore: 10,
    learningCurve: 7,
    ecosystemMaturity: 10
  },

  // TIER 2: BACKEND ENTERPRISE
  go: {
    name: 'Go (Golang)',
    tier: 'enterprise',
    strengths: ['Goroutines', 'Binário único', 'Compilação rápida', 'Simplicidade'],
    weaknesses: ['Generics limitados', 'Error handling verboso'],
    useCases: ['Microservices', 'CLI', 'DevOps tools', 'Cloud-native'],
    frameworks: ['Gin', 'Echo', 'Fiber', 'Chi'],
    combinesWith: ['C (cgo)', 'Python (gRPC)', 'Rust (FFI)'],
    performanceScore: 8,
    learningCurve: 4,
    ecosystemMaturity: 9
  },

  java: {
    name: 'Java',
    tier: 'enterprise',
    strengths: ['Ecossistema maduro', 'JVM', 'Tipagem forte', 'Enterprise'],
    weaknesses: ['Verbosidade', 'Cold start', 'Memória'],
    useCases: ['Sistemas bancários', 'ERP', 'Microservices enterprise'],
    frameworks: ['Spring Boot', 'Quarkus', 'Micronaut'],
    combinesWith: ['Kotlin (interop)', 'Scala (Spark)', 'Groovy'],
    performanceScore: 7,
    learningCurve: 5,
    ecosystemMaturity: 10
  },

  kotlin: {
    name: 'Kotlin',
    tier: 'enterprise',
    strengths: ['Null safety', 'Coroutines', 'Conciso', 'Multiplatform'],
    weaknesses: ['Comunidade menor que Java'],
    useCases: ['Android', 'Backend moderno', 'Multiplatform'],
    frameworks: ['Ktor', 'Spring Boot'],
    combinesWith: ['Java (100% interop)', 'Swift (KMM)'],
    performanceScore: 7,
    learningCurve: 4,
    ecosystemMaturity: 8
  },

  csharp: {
    name: 'C# / .NET',
    tier: 'enterprise',
    strengths: ['LINQ', 'async/await', 'Ecossistema Microsoft', 'Cross-platform'],
    weaknesses: ['Historicamente Windows-only'],
    useCases: ['Enterprise Windows', 'APIs', 'Games (Unity)', 'Desktop'],
    frameworks: ['ASP.NET Core', 'Blazor', 'MAUI'],
    combinesWith: ['F# (funcional)', 'PowerShell', 'C++ (P/Invoke)'],
    performanceScore: 8,
    learningCurve: 5,
    ecosystemMaturity: 10
  },

  typescript: {
    name: 'TypeScript / Node.js',
    tier: 'enterprise',
    strengths: ['Ecossistema npm', 'Async I/O', 'Full-stack JS', 'Tipagem'],
    weaknesses: ['Single-threaded', 'Performance CPU-bound'],
    useCases: ['APIs', 'BFF', 'Real-time', 'Serverless'],
    frameworks: ['Express', 'Fastify', 'NestJS', 'Hono'],
    combinesWith: ['Rust (napi-rs)', 'C++ (N-API)', 'Python'],
    performanceScore: 6,
    learningCurve: 4,
    ecosystemMaturity: 9
  },

  python: {
    name: 'Python',
    tier: 'enterprise',
    strengths: ['Legibilidade', 'Bibliotecas ML/AI', 'Prototipagem rápida'],
    weaknesses: ['Performance (GIL)', 'Tipagem dinâmica'],
    useCases: ['Scripts', 'ML/AI', 'Automação', 'APIs'],
    frameworks: ['FastAPI', 'Django', 'Flask'],
    combinesWith: ['C/C++ (ctypes, Cython)', 'Rust (PyO3)', 'R'],
    performanceScore: 4,
    learningCurve: 2,
    ecosystemMaturity: 10
  },

  // TIER 3: FRONTEND & MOBILE
  javascript: {
    name: 'JavaScript',
    tier: 'frontend',
    strengths: ['Ubíquo', 'Ecossistema React/Vue/Angular', 'Flexibilidade'],
    weaknesses: ['Tipagem fraca', 'Fragmentação'],
    useCases: ['Web apps', 'SPAs', 'PWAs'],
    frameworks: ['React', 'Vue', 'Angular', 'Svelte', 'Solid'],
    combinesWith: ['WebAssembly (Rust/C++)', 'Node (SSR)'],
    performanceScore: 5,
    learningCurve: 3,
    ecosystemMaturity: 10
  },

  swift: {
    name: 'Swift',
    tier: 'frontend',
    strengths: ['Performance', 'Safety', 'SwiftUI', 'Apple ecosystem'],
    weaknesses: ['Apple-only'],
    useCases: ['iOS', 'macOS', 'watchOS', 'tvOS'],
    frameworks: ['SwiftUI', 'UIKit', 'Vapor'],
    combinesWith: ['Objective-C (interop)', 'C (bridging)'],
    performanceScore: 9,
    learningCurve: 5,
    ecosystemMaturity: 9
  },

  dart: {
    name: 'Dart / Flutter',
    tier: 'frontend',
    strengths: ['Hot reload', 'UI consistente', 'Single codebase'],
    weaknesses: ['Ecossistema menor que nativo'],
    useCases: ['Apps multiplataforma (iOS, Android, Web, Desktop)'],
    frameworks: ['Flutter'],
    combinesWith: ['Platform channels (Swift/Kotlin/C++)'],
    performanceScore: 7,
    learningCurve: 4,
    ecosystemMaturity: 7
  },

  // TIER 4: SCRIPTING & AUTOMAÇÃO
  powershell: {
    name: 'PowerShell',
    tier: 'scripting',
    strengths: ['Objetos (não texto)', 'Integração .NET', 'Remoting', 'Azure'],
    weaknesses: ['Verboso', 'Performance'],
    useCases: ['Automação Windows', 'Administração', 'CI/CD', 'Azure'],
    frameworks: ['PSScriptAnalyzer', 'Pester', 'Az'],
    combinesWith: ['C# (cmdlets)', 'Python (subprocess)', 'Bash (WSL)'],
    performanceScore: 4,
    learningCurve: 5,
    ecosystemMaturity: 9
  },

  bash: {
    name: 'Bash / Shell',
    tier: 'scripting',
    strengths: ['Ubíquo em Linux', 'Pipes', 'Text processing'],
    weaknesses: ['Sintaxe arcaica', 'Error handling'],
    useCases: ['Scripts Unix/Linux', 'Containers', 'CI/CD'],
    frameworks: ['shellcheck', 'bats'],
    combinesWith: ['Python (subprocess)', 'awk', 'sed', 'jq'],
    performanceScore: 5,
    learningCurve: 6,
    ecosystemMaturity: 10
  },

  // TIER 5: DADOS & ANALYTICS
  sql: {
    name: 'SQL',
    tier: 'data',
    strengths: ['ACID', 'Índices', 'Stored procedures', 'Padrão'],
    weaknesses: ['Não procedural', 'Vendor lock-in'],
    useCases: ['Dados transacionais', 'OLTP', 'Queries complexas'],
    frameworks: ['PostgreSQL', 'MySQL', 'SQL Server'],
    combinesWith: ['Qualquer linguagem (drivers)'],
    performanceScore: 8,
    learningCurve: 4,
    ecosystemMaturity: 10
  },

  scala: {
    name: 'Scala',
    tier: 'data',
    strengths: ['Funcional + OOP', 'JVM', 'Spark nativo'],
    weaknesses: ['Complexidade', 'Tempo de compilação'],
    useCases: ['Big Data', 'ETL distribuído', 'Streaming'],
    frameworks: ['Spark', 'Akka', 'Play'],
    combinesWith: ['Java', 'Python (PySpark)', 'SQL'],
    performanceScore: 8,
    learningCurve: 8,
    ecosystemMaturity: 8
  },

  // TIER 6: INFRAESTRUTURA
  hcl: {
    name: 'HCL (Terraform)',
    tier: 'infra',
    strengths: ['Declarativo', 'State management', 'Multi-cloud'],
    weaknesses: ['Limitações de lógica'],
    useCases: ['Infrastructure as Code', 'Multi-cloud'],
    frameworks: ['Terraform', 'Packer'],
    combinesWith: ['Bash', 'Python', 'Go (providers custom)'],
    performanceScore: 7,
    learningCurve: 5,
    ecosystemMaturity: 9
  }
};


// ============================================================================
// MOTOR DE DECISÃO POLYGLOT
// ============================================================================

export class PolyglotDecisionEngine {
  
  /**
   * Analisa requisitos e recomenda stack tecnológico
   */
  static analyzeAndRecommend(requirements: ProjectRequirements): StackRecommendation {
    const scores: Record<string, number> = {};
    
    // Calcula score para cada linguagem
    for (const [key, lang] of Object.entries(LANGUAGE_CATALOG)) {
      scores[key] = this.calculateScore(lang, requirements);
    }
    
    // Ordena por score
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);
    
    const primary = sorted[0][0];
    const secondary = sorted.slice(1, 4).map(([k]) => k);
    
    return {
      primary: LANGUAGE_CATALOG[primary].name,
      secondary: secondary.map(k => LANGUAGE_CATALOG[k].name),
      reasoning: this.generateReasoning(primary, requirements),
      architecture: this.suggestArchitecture(requirements),
      interopMethod: this.suggestInterop(primary, secondary)
    };
  }

  private static calculateScore(lang: LanguageProfile, req: ProjectRequirements): number {
    let score = 0;
    
    // Performance crítica
    if (req.performanceCritical) {
      score += lang.performanceScore * 2;
    }
    
    // Expertise da equipe
    if (req.teamExpertise.some(e => 
      lang.name.toLowerCase().includes(e.toLowerCase()) ||
      lang.frameworks.some(f => f.toLowerCase().includes(e.toLowerCase()))
    )) {
      score += 30; // Bonus significativo
    }
    
    // Time to market
    if (req.timeToMarket === 'fast') {
      score += (10 - lang.learningCurve) * 2;
      score += lang.ecosystemMaturity;
    }
    
    // Manutenibilidade
    if (req.maintenanceImportance === 'high') {
      score += lang.ecosystemMaturity;
      score += (10 - lang.learningCurve);
    }
    
    // Tipo de projeto
    const typeBonus = this.getTypeBonus(lang, req.type);
    score += typeBonus;
    
    // Escalabilidade
    if (req.scalabilityNeeds === 'extreme' && lang.tier === 'systems') {
      score += 15;
    }
    
    // Segurança
    if (req.securityLevel === 'critical') {
      if (['rust', 'go', 'java', 'csharp'].includes(lang.name.toLowerCase())) {
        score += 10;
      }
    }
    
    return score;
  }

  private static getTypeBonus(lang: LanguageProfile, type: string): number {
    const bonusMap: Record<string, string[]> = {
      api: ['go', 'java', 'csharp', 'typescript', 'python'],
      cli: ['go', 'rust', 'python'],
      desktop: ['csharp', 'cpp', 'rust'],
      mobile: ['kotlin', 'swift', 'dart'],
      web: ['typescript', 'javascript'],
      data: ['python', 'scala', 'sql'],
      embedded: ['c', 'rust', 'cpp'],
      game: ['cpp', 'csharp']
    };
    
    const preferred = bonusMap[type] || [];
    const langKey = Object.entries(LANGUAGE_CATALOG)
      .find(([, v]) => v.name === lang.name)?.[0] || '';
    
    return preferred.includes(langKey) ? 20 : 0;
  }

  private static generateReasoning(primary: string, req: ProjectRequirements): string {
    const lang = LANGUAGE_CATALOG[primary];
    const reasons: string[] = [];
    
    if (req.performanceCritical && lang.performanceScore >= 8) {
      reasons.push(`Performance de ${lang.performanceScore}/10`);
    }
    
    if (req.timeToMarket === 'fast' && lang.learningCurve <= 5) {
      reasons.push(`Curva de aprendizado acessível (${lang.learningCurve}/10)`);
    }
    
    reasons.push(`Ecossistema maduro (${lang.ecosystemMaturity}/10)`);
    reasons.push(`Ideal para: ${lang.useCases.slice(0, 2).join(', ')}`);
    
    return reasons.join('. ');
  }

  private static suggestArchitecture(req: ProjectRequirements): string {
    if (req.scalabilityNeeds === 'extreme') {
      return 'Microservices Polyglot com Message Bus (Kafka/NATS)';
    }
    if (req.type === 'mobile' || req.type === 'web') {
      return 'BFF (Backend-for-Frontend) com Core Services';
    }
    if (req.performanceCritical) {
      return 'Native Speed + Glue (Rust/C++ core + Python/Node API)';
    }
    return 'Monolito Modular (deploy simples, fácil evolução)';
  }

  private static suggestInterop(primary: string, secondary: string[]): string {
    const methods: string[] = [];
    
    if (secondary.some(s => ['python', 'typescript'].includes(s))) {
      methods.push('REST + OpenAPI');
    }
    if (secondary.some(s => ['go', 'java', 'csharp'].includes(s))) {
      methods.push('gRPC + Protobuf');
    }
    if (secondary.some(s => ['rust', 'cpp', 'c'].includes(s))) {
      methods.push('FFI / Native Bindings');
    }
    
    return methods.length > 0 ? methods.join(', ') : 'REST + JSON';
  }
}


// ============================================================================
// DETECTOR DE STACK EXISTENTE
// ============================================================================

export class StackDetector {
  
  /**
   * Detecta linguagens/frameworks em um projeto existente
   */
  static detectFromFiles(files: string[]): DetectedStack {
    const detected: DetectedStack = {
      languages: [],
      frameworks: [],
      buildTools: [],
      databases: [],
      infrastructure: []
    };

    const patterns: Record<string, { lang: string; framework?: string; category: keyof DetectedStack }> = {
      'package.json': { lang: 'TypeScript/JavaScript', category: 'languages' },
      'tsconfig.json': { lang: 'TypeScript', category: 'languages' },
      'go.mod': { lang: 'Go', category: 'languages' },
      'Cargo.toml': { lang: 'Rust', category: 'languages' },
      'pom.xml': { lang: 'Java', framework: 'Maven', category: 'languages' },
      'build.gradle': { lang: 'Java/Kotlin', framework: 'Gradle', category: 'languages' },
      '*.csproj': { lang: 'C#', category: 'languages' },
      'requirements.txt': { lang: 'Python', category: 'languages' },
      'pyproject.toml': { lang: 'Python', category: 'languages' },
      'Gemfile': { lang: 'Ruby', category: 'languages' },
      'composer.json': { lang: 'PHP', category: 'languages' },
      'pubspec.yaml': { lang: 'Dart/Flutter', category: 'languages' },
      'Dockerfile': { lang: 'Docker', category: 'infrastructure' },
      'docker-compose.yml': { lang: 'Docker Compose', category: 'infrastructure' },
      'terraform': { lang: 'Terraform/HCL', category: 'infrastructure' },
      '.github/workflows': { lang: 'GitHub Actions', category: 'infrastructure' },
      'vite.config': { lang: 'TypeScript', framework: 'Vite', category: 'buildTools' },
      'next.config': { lang: 'TypeScript', framework: 'Next.js', category: 'frameworks' },
      'nuxt.config': { lang: 'TypeScript', framework: 'Nuxt', category: 'frameworks' },
      'angular.json': { lang: 'TypeScript', framework: 'Angular', category: 'frameworks' },
    };

    for (const file of files) {
      for (const [pattern, info] of Object.entries(patterns)) {
        if (file.includes(pattern) || file.endsWith(pattern)) {
          if (!detected[info.category].includes(info.lang)) {
            detected[info.category].push(info.lang);
          }
          if (info.framework && !detected.frameworks.includes(info.framework)) {
            detected.frameworks.push(info.framework);
          }
        }
      }
    }

    return detected;
  }

  /**
   * Analisa package.json para detectar frameworks
   */
  static analyzePackageJson(content: string): string[] {
    const frameworks: string[] = [];
    
    try {
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      const frameworkMap: Record<string, string> = {
        'react': 'React',
        'vue': 'Vue',
        'angular': 'Angular',
        'svelte': 'Svelte',
        'next': 'Next.js',
        'nuxt': 'Nuxt',
        'express': 'Express',
        'fastify': 'Fastify',
        'nestjs': 'NestJS',
        'hono': 'Hono',
        'prisma': 'Prisma',
        'typeorm': 'TypeORM',
        'drizzle': 'Drizzle',
        'tailwindcss': 'Tailwind CSS',
        'vite': 'Vite',
        'webpack': 'Webpack',
        'esbuild': 'esbuild'
      };
      
      for (const [dep, name] of Object.entries(frameworkMap)) {
        if (deps[dep] || deps[`@${dep}/core`]) {
          frameworks.push(name);
        }
      }
    } catch {
      // Ignore parse errors
    }
    
    return frameworks;
  }
}

export interface DetectedStack {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  databases: string[];
  infrastructure: string[];
}


// ============================================================================
// MANIFESTO TEXTUAL (para exibição)
// ============================================================================

export const POLYGLOT_ARCHITECT_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🌐 POLYGLOT ARCHITECT: NAVEGADOR DE LINGUAGENS - LEVEL 11 🌐        ║
║                                                                              ║
║            "CADA LINGUAGEM É UMA FERRAMENTA. O ARQUITETO ESCOLHE A CERTA."  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
📜 AS CINCO LEIS DO ARQUITETO POLYGLOT
═══════════════════════════════════════════════════════════════════════════════

1️⃣ LEI DA ADEQUAÇÃO
   - Cada componente usa a linguagem IDEAL para sua função
   - Performance crítica → Rust/C++
   - Business logic → Java/C#/Go
   - Scripts/Automação → PowerShell/Python/Bash

2️⃣ LEI DA INTEROPERABILIDADE
   - Linguagens se comunicam via contratos (OpenAPI, Protobuf, gRPC)
   - Mensageria para desacoplamento (Kafka, RabbitMQ)
   - Containers padronizam deploy

3️⃣ LEI DA EQUIPE
   - Linguagem que a equipe domina > linguagem "perfeita"
   - Curva de aprendizado é custo real
   - Manutenibilidade > Performance (exceto quando crítico)

4️⃣ LEI DA COMPOSIÇÃO
   - Monolito modular OU Microservices polyglot
   - BFF (Backend-for-Frontend) adapta APIs
   - Native libs expostas via FFI

5️⃣ LEI DA GOVERNANÇA
   - Padronização mínima: linting, logs, CI/CD
   - Segurança em scripts (SecretManagement)
   - Observabilidade unificada (OpenTelemetry)

═══════════════════════════════════════════════════════════════════════════════
🗺️ MAPA DE LINGUAGENS POR DOMÍNIO
═══════════════════════════════════════════════════════════════════════════════

TIER 1: SISTEMAS DE BAIXO NÍVEL
├── C        → Kernels, drivers, firmware
├── C++      → Game engines, browsers, databases
├── Rust     → Sistemas seguros, WebAssembly, CLI
└── Assembly → Bootloaders, otimizações críticas

TIER 2: BACKEND ENTERPRISE
├── Java/Kotlin → Sistemas bancários, ERP, microservices
├── C# / .NET   → Enterprise Windows, APIs, Unity
├── Go          → Cloud-native, microservices, DevOps
├── Node/TS     → APIs, BFF, real-time, serverless
└── Python      → Scripts, ML/AI, automação, APIs

TIER 3: FRONTEND & MOBILE
├── JavaScript/TypeScript → Web apps, SPAs, PWAs
├── Swift                 → iOS, macOS
├── Kotlin                → Android
├── Dart/Flutter          → Cross-platform
└── React Native          → Cross-platform JS

TIER 4: SCRIPTING & AUTOMAÇÃO
├── PowerShell → Windows, Azure, administração
├── Bash       → Linux, containers, CI/CD
├── Python     → Cross-platform, DevOps
└── Lua        → Scripting embarcado

TIER 5: DADOS & ANALYTICS
├── SQL        → Dados transacionais, OLTP
├── Python     → Análise, ML, visualização
├── R          → Estatística, bioinformática
├── Scala      → Big Data, Spark
└── Julia      → Computação científica

TIER 6: INFRAESTRUTURA
├── HCL/Terraform → Infrastructure as Code
├── YAML          → Kubernetes, CI/CD
├── Dockerfile    → Containerização
└── Ansible       → Configuration management

═══════════════════════════════════════════════════════════════════════════════
🔗 MÉTODOS DE INTEROPERABILIDADE
═══════════════════════════════════════════════════════════════════════════════

REST + OpenAPI    → Qualquer linguagem ↔ Qualquer linguagem
gRPC + Protobuf   → Alta performance, tipagem forte
GraphQL           → Frontend-driven queries
Message Queues    → Desacoplamento total (Kafka, RabbitMQ)
FFI               → C/C++/Rust → Python/Node/Java/C#
WebAssembly       → Rust/C++/Go → Browser/Node
Subprocess/CLI    → Qualquer linguagem chama qualquer CLI

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARQUITETURAS POLYGLOT
═══════════════════════════════════════════════════════════════════════════════

1. MONOLITO MODULAR
   └── Uma linguagem principal + scripts de ops
   └── Quando: Equipe pequena, domínio coeso

2. MICROSERVICES POLYGLOT
   └── Cada serviço na linguagem ideal
   └── Quando: Equipes independentes, escalabilidade

3. BFF (Backend-for-Frontend)
   └── BFFs específicos por cliente + core services
   └── Quando: Múltiplos clientes diferentes

4. NATIVE SPEED + GLUE
   └── Core em Rust/C++ + API em Python/Node
   └── Quando: Performance crítica em partes específicas

═══════════════════════════════════════════════════════════════════════════════
📋 MATRIZ DE DECISÃO RÁPIDA
═══════════════════════════════════════════════════════════════════════════════

COMPONENTE          │ PRIMÁRIA        │ ALTERNATIVAS
────────────────────┼─────────────────┼─────────────────────
API Gateway         │ Go, Node/TS     │ Java, C#
Business Logic      │ Java, C#, Go    │ Kotlin, Python
Real-time/WebSocket │ Node, Go        │ Elixir, Rust
Data Processing     │ Python, Scala   │ Java, Go
ML/AI               │ Python          │ Julia, Rust
CLI Tools           │ Go, Rust        │ Python, Node
Desktop App         │ C#, Electron    │ Rust (Tauri), Flutter
Mobile Android      │ Kotlin          │ Flutter, React Native
Mobile iOS          │ Swift           │ Flutter, React Native
Mobile Cross        │ Flutter         │ React Native, KMM
Game Engine         │ C++             │ Rust, C#
Embedded/IoT        │ C, Rust         │ C++, MicroPython
Automation Windows  │ PowerShell      │ Python, C#
Automation Linux    │ Bash, Python    │ Go, Ansible

═══════════════════════════════════════════════════════════════════════════════

"NÃO EXISTE LINGUAGEM PERFEITA. EXISTE A COMBINAÇÃO PERFEITA PARA CADA PROBLEMA."

                    — Polyglot Architect, Level 11
`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  POLYGLOT_ARCHITECT_MANIFEST,
  LANGUAGE_CATALOG,
  PolyglotDecisionEngine,
  StackDetector
};


// ============================================================================
// FUNÇÃO DE DETECÇÃO (para o Orchestrator)
// ============================================================================

/**
 * Detecta se o prompt precisa do Polyglot Architect
 */
export function shouldEnablePolyglot(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const polyglotKeywords = [
    // Linguagens de sistemas
    'rust', 'c++', 'cpp', 'c#', 'csharp', '.net', 'dotnet',
    'assembly', 'asm', 'wasm', 'webassembly',
    
    // Scripting
    'powershell', 'pwsh', 'bash', 'shell', 'script',
    'automação', 'automation', 'devops',
    
    // Mobile nativo
    'swift', 'kotlin', 'flutter', 'dart', 'react native',
    'ios nativo', 'android nativo', 'native',
    
    // Enterprise
    'java', 'spring', 'quarkus', 'jvm',
    'scala', 'spark', 'big data',
    
    // Polyglot específico
    'polyglot', 'multi-linguagem', 'multi-language',
    'interoperabilidade', 'interop', 'ffi',
    'grpc', 'protobuf', 'bindings',
    
    // Arquiteturas
    'microservices polyglot', 'bff', 'backend-for-frontend',
    'native speed', 'performance crítica',
    
    // Infra
    'terraform', 'hcl', 'ansible', 'kubernetes', 'k8s',
    'docker', 'container', 'ci/cd', 'pipeline',
    
    // Data
    'julia', 'r language', 'matlab', 'fortran',
    'computação científica', 'scientific computing'
  ];
  
  // Verifica keywords diretas
  if (polyglotKeywords.some(keyword => promptLower.includes(keyword))) {
    return true;
  }
  
  // Verifica padrões compostos
  const compositePatterns = [
    /qual\s+(linguagem|language)/i,
    /melhor\s+(linguagem|stack|tecnologia)/i,
    /escolher\s+(entre|linguagem)/i,
    /comparar\s+(linguagens|stacks)/i,
    /(rust|go|java|c\+\+)\s+(ou|vs|versus)\s+(rust|go|java|c\+\+)/i,
    /migrar\s+(de|para)\s+(rust|go|java|python)/i,
    /integrar\s+.*(rust|c\+\+|python|node)/i
  ];
  
  return compositePatterns.some(pattern => pattern.test(prompt));
}
