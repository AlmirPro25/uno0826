/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧬 ALEXANDRIA MANIFEST INTEGRATION FOR AETHER PRIME 🧬              ║
 * ║                                                                              ║
 * ║     "127 MANIFESTOS DE CONHECIMENTO ESPECIALIZADO INTEGRADOS"               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra o sistema de manifestos do ALEXANDRIA no AETHER PRIME,
 * transformando o agente autônomo em um especialista em qualquer domínio.
 * 
 * COMO FUNCIONA:
 * 1. Detecta automaticamente o contexto do prompt do usuário
 * 2. Ativa os manifestos relevantes (até 3 por vez)
 * 3. Injeta o conhecimento especializado no prompt
 * 4. O AETHER PRIME executa com expertise de domínio
 */

import { 
  enrichPromptWithManifests, 
  detectActiveManifests,
  getManifestInfo,
  type ManifestMatch 
} from './manifestos/ManifestOrchestrator';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DE INTEGRAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

export interface ManifestIntegrationConfig {
  enabled: boolean;
  maxManifestsPerPrompt: number;
  logActivations: boolean;
  priorityOverride?: string[]; // Forçar manifestos específicos
}

const DEFAULT_CONFIG: ManifestIntegrationConfig = {
  enabled: true,
  maxManifestsPerPrompt: 3,
  logActivations: true
};

let currentConfig = { ...DEFAULT_CONFIG };

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES PRINCIPAIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Enriquece o prompt do usuário com manifestos relevantes
 * Esta é a função principal que deve ser chamada antes de enviar para o Gemini
 */
export function enrichWithManifests(prompt: string): string {
  if (!currentConfig.enabled) {
    return prompt;
  }

  try {
    const enrichedPrompt = enrichPromptWithManifests(prompt);
    
    if (currentConfig.logActivations) {
      const activeManifests = detectActiveManifests(prompt);
      if (activeManifests.length > 0) {
        console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🧬 ALEXANDRIA MANIFESTOS ATIVADOS 🧬                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
${activeManifests.slice(0, currentConfig.maxManifestsPerPrompt).map(m => 
  `║  Level ${m.level.toString().padStart(3)}: ${m.name.padEnd(25)} (${m.confidence.toFixed(0)}% confiança)`.padEnd(79) + '║'
).join('\n')}
╚══════════════════════════════════════════════════════════════════════════════╝
`);
      }
    }
    
    return enrichedPrompt;
  } catch (error) {
    console.warn('[ManifestIntegration] Erro ao enriquecer prompt:', error);
    return prompt;
  }
}

/**
 * Detecta quais manifestos seriam ativados para um prompt
 * Útil para debug e UI
 */
export function previewManifests(prompt: string): ManifestMatch[] {
  return detectActiveManifests(prompt);
}

/**
 * Retorna informações sobre todos os manifestos disponíveis
 */
export function getAvailableManifests(): object {
  return getManifestInfo();
}

/**
 * Atualiza a configuração de integração
 */
export function updateConfig(config: Partial<ManifestIntegrationConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Retorna a configuração atual
 */
export function getConfig(): ManifestIntegrationConfig {
  return { ...currentConfig };
}

/**
 * Habilita/desabilita a integração de manifestos
 */
export function setEnabled(enabled: boolean): void {
  currentConfig.enabled = enabled;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  enrichPromptWithManifests,
  detectActiveManifests,
  getManifestInfo,
  type ManifestMatch
};

export default enrichWithManifests;
