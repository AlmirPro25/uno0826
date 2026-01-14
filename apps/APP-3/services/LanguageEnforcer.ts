/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     👮 LANGUAGE ENFORCER - O POLICIAL DE LINGUAGEM 👮                       ║
 * ║                                                                              ║
 * ║     "SE PEDIU RUST, TEM QUE SER RUST.                                       ║
 * ║      SE ENTREGOU NODE.JS, É CRIME. GERAÇÃO CANCELADA."                      ║
 * ║                                                                              ║
 * ║     PROTOCOLO NO-FALLBACK: TOLERÂNCIA ZERO                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo é o ÚLTIMO GUARDIÃO antes da geração de código.
 * Ele analisa:
 * 1. O que foi PEDIDO no prompt
 * 2. O que foi GERADO (architecture.json, package.json, etc.)
 * 3. Se houve FALLBACK PROIBIDO → CANCELA e força refazer
 */

// ============================================================================
// TIPOS
// ============================================================================

export type SystemsLanguage = 'rust' | 'c' | 'cpp' | 'assembly' | 'go' | 'zig';
export type WebLanguage = 'typescript' | 'javascript' | 'python' | 'ruby' | 'php';
export type Language = SystemsLanguage | WebLanguage | 'java' | 'csharp' | 'kotlin' | 'swift' | 'dart' | 'cuda' | 'fortran';

export interface LanguageRequirement {
  language: Language;
  component: string;
  isHardRequirement: boolean;
  reason: string;
}

export interface GeneratedArchitecture {
  backend_stack?: { language?: string; framework?: string };
  frontend_stack?: { language?: string; framework?: string };
  core_engine?: { language?: string };
  quantum_core?: { language?: string };
  flight_core?: { language?: string };
  ground_control?: { language?: string };
  [key: string]: unknown;
}

export interface EnforcementResult {
  passed: boolean;
  violations: Violation[];
  warnings: string[];
  verdict: 'APPROVED' | 'REJECTED' | 'WARNING';
  action: 'PROCEED' | 'REGENERATE' | 'ABORT';
  report: string;
}

export interface Violation {
  component: string;
  requested: Language;
  delivered: Language;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const SYSTEMS_LANGUAGES: Language[] = ['rust', 'c', 'cpp', 'assembly', 'go', 'zig', 'cuda', 'fortran'];
const WEB_LANGUAGES: Language[] = ['typescript', 'javascript', 'python', 'ruby', 'php'];

const LANGUAGE_ALIASES: Record<string, Language> = {
  'rust': 'rust', 'rustlang': 'rust',
  'c': 'c', 'clang': 'c',
  'c++': 'cpp', 'cpp': 'cpp', 'cplusplus': 'cpp',
  'assembly': 'assembly', 'asm': 'assembly', 'assembler': 'assembly',
  'go': 'go', 'golang': 'go',
  'zig': 'zig', 'ziglang': 'zig',
  'typescript': 'typescript', 'ts': 'typescript',
  'javascript': 'javascript', 'js': 'javascript', 'node': 'javascript', 'node.js': 'javascript', 'nodejs': 'javascript',
  'python': 'python', 'py': 'python',
  'java': 'java',
  'kotlin': 'kotlin', 'kt': 'kotlin',
  'csharp': 'csharp', 'c#': 'csharp', 'dotnet': 'csharp', '.net': 'csharp',
  'swift': 'swift',
  'dart': 'dart',
  'ruby': 'ruby', 'rb': 'ruby',
  'php': 'php',
  'cuda': 'cuda',
  'fortran': 'fortran', 'f90': 'fortran', 'f95': 'fortran'
};

// ============================================================================
// LANGUAGE ENFORCER CLASS
// ============================================================================

export class LanguageEnforcer {
  private strictMode: boolean = true;
  
  constructor(strictMode: boolean = true) {
    this.strictMode = strictMode;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISE DO PROMPT - O QUE FOI PEDIDO?
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Extrai requisitos de linguagem do prompt original
   */
  extractRequirements(prompt: string): LanguageRequirement[] {
    const requirements: LanguageRequirement[] = [];
    const promptLower = prompt.toLowerCase();
    
    // Padrões para detectar requisitos de linguagem
    const patterns = [
      // "em Rust", "in Rust", "usando Rust"
      { regex: /\b(em|in|using|usando|com|with)\s+(rust|c\+\+|cpp|golang|go|assembly|asm|zig|c(?!\+\+|#))\b/gi, hard: true },
      // "núcleo em Rust", "core in Rust"
      { regex: /\b(núcleo|core|engine|kernel|driver)\s+(em|in)\s+(rust|c\+\+|cpp|c|go|assembly)\b/gi, hard: true },
      // "Rust + C++", "Rust e Go"
      { regex: /\b(rust|c\+\+|cpp|go|c|assembly)\s*(\+|e|and|&)\s*(rust|c\+\+|cpp|go|c|assembly)\b/gi, hard: true },
      // "backend em Go", "flight core em Rust"
      { regex: /\b(backend|frontend|api|service|microservice|flight.?core|ground.?control|quantum.?core)\s+(em|in)\s+(\w+)\b/gi, hard: true },
      // Requisitos implícitos por domínio
      { regex: /\b(kernel|driver|rtos|embedded|firmware|bootloader|simd|avx|cuda)\b/gi, hard: true, impliedLang: 'c' },
      { regex: /\b(hft|high.?frequency|trading|latência.?de.?\d+.?(ms|us|ns)|zero.?copy)\b/gi, hard: true, impliedLang: 'rust' }
    ];
    
    for (const pattern of patterns) {
      const matches = promptLower.matchAll(pattern.regex);
      for (const match of matches) {
        const langStr = pattern.impliedLang || match[match.length - 1] || match[2];
        const lang = this.normalizeLanguage(langStr);
        
        if (lang && SYSTEMS_LANGUAGES.includes(lang)) {
          const component = this.extractComponent(match[0], promptLower);
          requirements.push({
            language: lang,
            component,
            isHardRequirement: pattern.hard,
            reason: `Detectado no prompt: "${match[0]}"`
          });
        }
      }
    }
    
    // Detectar linguagens mencionadas explicitamente
    for (const [alias, lang] of Object.entries(LANGUAGE_ALIASES)) {
      if (SYSTEMS_LANGUAGES.includes(lang)) {
        const regex = new RegExp(`\\b${alias}\\b`, 'gi');
        if (regex.test(promptLower)) {
          const existing = requirements.find(r => r.language === lang);
          if (!existing) {
            requirements.push({
              language: lang,
              component: 'general',
              isHardRequirement: true,
              reason: `Linguagem ${lang} mencionada explicitamente`
            });
          }
        }
      }
    }
    
    return requirements;
  }
  
  private extractComponent(match: string, prompt: string): string {
    const componentPatterns = [
      { regex: /backend/i, component: 'backend' },
      { regex: /frontend/i, component: 'frontend' },
      { regex: /core|engine|núcleo/i, component: 'core' },
      { regex: /flight/i, component: 'flight_core' },
      { regex: /ground/i, component: 'ground_control' },
      { regex: /quantum/i, component: 'quantum_core' },
      { regex: /api/i, component: 'api' },
      { regex: /kernel/i, component: 'kernel' },
      { regex: /driver/i, component: 'driver' }
    ];
    
    for (const p of componentPatterns) {
      if (p.regex.test(match)) {
        return p.component;
      }
    }
    
    return 'general';
  }
  
  private normalizeLanguage(lang: string): Language | null {
    const normalized = lang.toLowerCase().trim();
    return LANGUAGE_ALIASES[normalized] || null;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISE DO OUTPUT - O QUE FOI GERADO?
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Analisa a arquitetura gerada para detectar linguagens usadas
   */
  analyzeGeneratedArchitecture(architecture: GeneratedArchitecture): Map<string, Language> {
    const detected = new Map<string, Language>();
    
    // Analisar cada componente
    if (architecture.backend_stack?.language) {
      const lang = this.normalizeLanguage(architecture.backend_stack.language);
      if (lang) detected.set('backend', lang);
    }
    
    if (architecture.frontend_stack?.language) {
      const lang = this.normalizeLanguage(architecture.frontend_stack.language);
      if (lang) detected.set('frontend', lang);
    }
    
    if (architecture.core_engine?.language) {
      const lang = this.normalizeLanguage(architecture.core_engine.language);
      if (lang) detected.set('core', lang);
    }
    
    if (architecture.quantum_core?.language) {
      const lang = this.normalizeLanguage(architecture.quantum_core.language);
      if (lang) detected.set('quantum_core', lang);
    }
    
    if (architecture.flight_core?.language) {
      const lang = this.normalizeLanguage(architecture.flight_core.language);
      if (lang) detected.set('flight_core', lang);
    }
    
    if (architecture.ground_control?.language) {
      const lang = this.normalizeLanguage(architecture.ground_control.language);
      if (lang) detected.set('ground_control', lang);
    }
    
    return detected;
  }
  
  /**
   * Analisa package.json para detectar se é Node.js/TypeScript
   */
  analyzePackageJson(packageJson: Record<string, unknown>): Language | null {
    if (!packageJson) return null;
    
    const deps = {
      ...(packageJson.dependencies as Record<string, string> || {}),
      ...(packageJson.devDependencies as Record<string, string> || {})
    };
    
    // Se tem typescript, é TypeScript
    if (deps['typescript'] || deps['ts-node']) {
      return 'typescript';
    }
    
    // Se tem express, fastify, etc., é JavaScript/Node
    if (deps['express'] || deps['fastify'] || deps['hono'] || deps['koa']) {
      return packageJson.main?.toString().endsWith('.ts') ? 'typescript' : 'javascript';
    }
    
    return 'javascript';
  }
  
  /**
   * Analisa Cargo.toml para confirmar Rust
   */
  analyzeCargoToml(cargoToml: string): boolean {
    return cargoToml.includes('[package]') && cargoToml.includes('name =');
  }
  
  /**
   * Analisa go.mod para confirmar Go
   */
  analyzeGoMod(goMod: string): boolean {
    return goMod.includes('module ') && goMod.includes('go ');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENFORCEMENT - VERIFICAR E PUNIR
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * FUNÇÃO PRINCIPAL: Verifica se a geração respeitou os requisitos
   */
  enforce(
    prompt: string,
    architecture: GeneratedArchitecture,
    generatedFiles?: Map<string, string>
  ): EnforcementResult {
    const violations: Violation[] = [];
    const warnings: string[] = [];
    
    // 1. Extrair requisitos do prompt
    const requirements = this.extractRequirements(prompt);
    
    if (requirements.length === 0) {
      return {
        passed: true,
        violations: [],
        warnings: ['Nenhum requisito de linguagem de sistemas detectado no prompt'],
        verdict: 'APPROVED',
        action: 'PROCEED',
        report: this.generateReport([], [], 'APPROVED')
      };
    }
    
    // 2. Analisar o que foi gerado
    const generatedLangs = this.analyzeGeneratedArchitecture(architecture);
    
    // 3. Verificar arquivos gerados (se disponíveis)
    if (generatedFiles) {
      // Verificar package.json (indica Node.js/TS)
      const packageJson = generatedFiles.get('package.json') || generatedFiles.get('backend/package.json');
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson);
          const detectedLang = this.analyzePackageJson(pkg);
          if (detectedLang) {
            generatedLangs.set('backend_detected', detectedLang);
          }
        } catch {}
      }
      
      // Verificar Cargo.toml (indica Rust)
      const cargoToml = generatedFiles.get('Cargo.toml') || generatedFiles.get('rust-core/Cargo.toml');
      if (cargoToml && this.analyzeCargoToml(cargoToml)) {
        generatedLangs.set('rust_detected', 'rust');
      }
      
      // Verificar go.mod (indica Go)
      const goMod = generatedFiles.get('go.mod') || generatedFiles.get('go-service/go.mod');
      if (goMod && this.analyzeGoMod(goMod)) {
        generatedLangs.set('go_detected', 'go');
      }
    }
    
    // 4. Comparar requisitos vs gerado
    for (const req of requirements) {
      if (!req.isHardRequirement) continue;
      
      const componentLang = generatedLangs.get(req.component) || 
                           generatedLangs.get('backend') ||
                           generatedLangs.get('backend_detected');
      
      if (!componentLang) {
        warnings.push(`Componente "${req.component}" não encontrado na arquitetura gerada`);
        continue;
      }
      
      // VERIFICAR FALLBACK PROIBIDO
      if (SYSTEMS_LANGUAGES.includes(req.language) && WEB_LANGUAGES.includes(componentLang)) {
        violations.push({
          component: req.component,
          requested: req.language,
          delivered: componentLang,
          severity: 'CRITICAL',
          message: `🚨 FALLBACK PROIBIDO: Pedido ${req.language.toUpperCase()}, entregue ${componentLang.toUpperCase()}. ` +
                   `Isso é uma violação do protocolo NO-FALLBACK.`
        });
      }
    }
    
    // 5. Determinar veredicto
    const hasCritical = violations.some(v => v.severity === 'CRITICAL');
    const hasHigh = violations.some(v => v.severity === 'HIGH');
    
    let verdict: 'APPROVED' | 'REJECTED' | 'WARNING';
    let action: 'PROCEED' | 'REGENERATE' | 'ABORT';
    
    if (hasCritical) {
      verdict = 'REJECTED';
      action = this.strictMode ? 'REGENERATE' : 'ABORT';
    } else if (hasHigh) {
      verdict = 'WARNING';
      action = 'PROCEED';
    } else {
      verdict = 'APPROVED';
      action = 'PROCEED';
    }
    
    return {
      passed: violations.length === 0,
      violations,
      warnings,
      verdict,
      action,
      report: this.generateReport(violations, warnings, verdict)
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RELATÓRIO
  // ═══════════════════════════════════════════════════════════════════════════
  
  private generateReport(
    violations: Violation[],
    warnings: string[],
    verdict: 'APPROVED' | 'REJECTED' | 'WARNING'
  ): string {
    const lines: string[] = [];
    
    lines.push('╔══════════════════════════════════════════════════════════════════════════════╗');
    lines.push('║                    👮 LANGUAGE ENFORCER REPORT 👮                           ║');
    lines.push('╚══════════════════════════════════════════════════════════════════════════════╝');
    lines.push('');
    
    if (verdict === 'APPROVED') {
      lines.push('✅ VEREDICTO: APROVADO');
      lines.push('   A geração respeitou os requisitos de linguagem.');
    } else if (verdict === 'REJECTED') {
      lines.push('🚨 VEREDICTO: REJEITADO');
      lines.push('   A geração violou o protocolo NO-FALLBACK.');
      lines.push('   AÇÃO: Regenerar com linguagem correta.');
    } else {
      lines.push('⚠️ VEREDICTO: AVISO');
      lines.push('   Algumas inconsistências detectadas.');
    }
    
    if (violations.length > 0) {
      lines.push('');
      lines.push('═══════════════════════════════════════════════════════════════════════════════');
      lines.push('🚨 VIOLAÇÕES DETECTADAS:');
      lines.push('═══════════════════════════════════════════════════════════════════════════════');
      
      for (const v of violations) {
        lines.push(`   [${v.severity}] ${v.component}:`);
        lines.push(`      Pedido: ${v.requested.toUpperCase()}`);
        lines.push(`      Entregue: ${v.delivered.toUpperCase()}`);
        lines.push(`      ${v.message}`);
        lines.push('');
      }
    }
    
    if (warnings.length > 0) {
      lines.push('');
      lines.push('⚠️ AVISOS:');
      for (const w of warnings) {
        lines.push(`   • ${w}`);
      }
    }
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENSAGEM DE REGENERAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Gera prompt de correção para forçar regeneração correta
   */
  generateCorrectionPrompt(violations: Violation[], originalPrompt: string): string {
    const lines: string[] = [];
    
    lines.push('🚨 ATENÇÃO: A geração anterior foi REJEITADA pelo Language Enforcer.');
    lines.push('');
    lines.push('VIOLAÇÕES DETECTADAS:');
    
    for (const v of violations) {
      lines.push(`• ${v.component}: Pedido ${v.requested.toUpperCase()}, entregue ${v.delivered.toUpperCase()}`);
    }
    
    lines.push('');
    lines.push('INSTRUÇÕES OBRIGATÓRIAS PARA REGENERAÇÃO:');
    lines.push('');
    
    for (const v of violations) {
      lines.push(`1. O componente "${v.component}" DEVE ser implementado em ${v.requested.toUpperCase()}.`);
      lines.push(`   - NÃO use ${v.delivered.toUpperCase()} ou qualquer linguagem web.`);
      lines.push(`   - Gere Cargo.toml (Rust), go.mod (Go), CMakeLists.txt (C/C++), etc.`);
      lines.push(`   - Se não conseguir gerar código ${v.requested.toUpperCase()}, DIGA EXPLICITAMENTE.`);
    }
    
    lines.push('');
    lines.push('PROMPT ORIGINAL:');
    lines.push(originalPrompt);
    
    return lines.join('\n');
  }
}


// ============================================================================
// FUNÇÕES UTILITÁRIAS EXPORTADAS
// ============================================================================

/**
 * Função rápida para verificar se um prompt requer linguagem de sistemas
 */
export function requiresSystemsLanguage(prompt: string): boolean {
  const enforcer = new LanguageEnforcer();
  const requirements = enforcer.extractRequirements(prompt);
  return requirements.some(r => r.isHardRequirement && SYSTEMS_LANGUAGES.includes(r.language));
}

/**
 * Função rápida para detectar fallback proibido
 */
export function detectFallback(
  requestedLang: Language,
  deliveredLang: Language
): { isFallback: boolean; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' } {
  if (SYSTEMS_LANGUAGES.includes(requestedLang) && WEB_LANGUAGES.includes(deliveredLang)) {
    return { isFallback: true, severity: 'CRITICAL' };
  }
  
  if (requestedLang !== deliveredLang && SYSTEMS_LANGUAGES.includes(requestedLang)) {
    return { isFallback: true, severity: 'HIGH' };
  }
  
  return { isFallback: false, severity: 'NONE' };
}

/**
 * Cria instância singleton do enforcer
 */
let enforcerInstance: LanguageEnforcer | null = null;

export function getEnforcer(strictMode: boolean = true): LanguageEnforcer {
  if (!enforcerInstance) {
    enforcerInstance = new LanguageEnforcer(strictMode);
  }
  return enforcerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SYSTEMS_LANGUAGES,
  WEB_LANGUAGES,
  LANGUAGE_ALIASES
};

export default LanguageEnforcer;
