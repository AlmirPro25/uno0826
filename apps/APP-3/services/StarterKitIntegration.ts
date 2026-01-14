/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    STARTER KIT INTEGRATION - Store Hooks                      ║
 * ║                                                                               ║
 * ║              Conecta o Marketplace ao fluxo de geração principal             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra o Starter Kit Marketplace com:
 * - GeminiService (geração de código)
 * - DAIA (aprendizado)
 * - Store principal (estado da aplicação)
 */

import { starterKitService, autoSaveGeneration, type StarterKit } from './StarterKitService';
import { daiaService } from './DAIAService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface GenerationResult {
  code: string;
  prompt: string;
  modelUsed: string;
  manifestUsed?: string;
}

export interface IntegrationResult {
  starterKit: StarterKit | null;
  daiaSaved: boolean;
  errors: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Processa uma geração de código e salva em todos os sistemas.
 * 
 * Fluxo:
 * 1. Salva como Starter Kit (Go Backend)
 * 2. Envia para DAIA (Python Backend)
 * 3. Retorna resultado consolidado
 */
export async function processGeneration(
  result: GenerationResult
): Promise<IntegrationResult> {
  const errors: string[] = [];
  let starterKit: StarterKit | null = null;
  let daiaSaved = false;

  // Validação básica
  if (!result.code || result.code.length < 100) {
    return {
      starterKit: null,
      daiaSaved: false,
      errors: ['Código muito curto para salvar'],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SALVAR COMO STARTER KIT
  // ═══════════════════════════════════════════════════════════════════════════

  try {
    starterKit = await autoSaveGeneration(result.code, result.prompt, {
      modelUsed: result.modelUsed,
      manifestUsed: result.manifestUsed,
    });

    if (starterKit) {
      console.log(`[Integration] ✅ StarterKit salvo: ${starterKit.id}`);
      console.log(`[Integration]    Grade: ${starterKit.classification.grade}`);
      console.log(`[Integration]    Qualidade: ${starterKit.classification.quality_score}%`);
      console.log(`[Integration]    Categoria: ${starterKit.metadata.category}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    errors.push(`StarterKit: ${msg}`);
    console.error('[Integration] Erro ao salvar StarterKit:', error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ENVIAR PARA DAIA (se qualidade boa)
  // ═══════════════════════════════════════════════════════════════════════════

  // Só envia para DAIA se o StarterKit tiver qualidade >= 70
  if (starterKit && starterKit.classification.quality_score >= 70) {
    try {
      const daiaResult = await daiaService.learn({
        code: result.code,
        prompt: result.prompt,
        category: starterKit.metadata.category,
        score: starterKit.classification.quality_score,
        metadata: {
          starter_kit_id: starterKit.id,
          model: result.modelUsed,
          manifest: result.manifestUsed,
          grade: starterKit.classification.grade,
        },
      });

      daiaSaved = daiaResult !== null;
      
      if (daiaSaved) {
        console.log(`[Integration] ✅ DAIA aprendeu: ${daiaResult?.template_id}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`DAIA: ${msg}`);
      console.error('[Integration] Erro ao enviar para DAIA:', error);
    }
  }

  return {
    starterKit,
    daiaSaved,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS PARA STORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cria handlers para integração com o store Zustand.
 */
export function createStarterKitStoreHandlers() {
  return {
    /**
     * Handler chamado após cada geração de código.
     */
    onCodeGenerated: async (
      code: string,
      prompt: string,
      modelUsed: string,
      manifestUsed?: string
    ): Promise<IntegrationResult> => {
      return processGeneration({
        code,
        prompt,
        modelUsed,
        manifestUsed,
      });
    },

    /**
     * Handler para publicar um kit no marketplace.
     */
    onPublishKit: async (kitId: string): Promise<boolean> => {
      const result = await starterKitService.publishKit(kitId);
      return result.success;
    },

    /**
     * Handler para obter estatísticas.
     */
    onGetStats: async () => {
      return starterKitService.getStats();
    },

    /**
     * Handler para listar kits do usuário.
     */
    onGetMyKits: async () => {
      return starterKitService.listMyKits();
    },

    /**
     * Handler para classificar código sem salvar.
     */
    onClassifyCode: async (code: string, prompt?: string) => {
      return starterKitService.classifyCode(code, prompt);
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINCRONIZAÇÃO DAIA <-> STARTER KIT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sincroniza dados entre DAIA e Starter Kit Store.
 * Útil para manter consistência entre os dois sistemas.
 */
export async function syncDAIAWithStarterKits(): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Buscar kits de alta qualidade que não estão no DAIA
    const myKits = await starterKitService.listMyKits(100, 0);
    
    for (const kit of myKits) {
      // Só sincroniza kits de alta qualidade
      if (kit.classification.quality_score < 70) continue;

      try {
        const result = await daiaService.learn({
          code: kit.code,
          prompt: kit.prompt,
          category: kit.metadata.category,
          score: kit.classification.quality_score,
          metadata: {
            starter_kit_id: kit.id,
            synced_at: new Date().toISOString(),
          },
        });

        if (result && !result.is_duplicate) {
          synced++;
        }
      } catch (error) {
        errors.push(`Kit ${kit.id}: ${error}`);
      }
    }

    console.log(`[Sync] Sincronizados ${synced} kits com DAIA`);
  } catch (error) {
    errors.push(`Erro geral: ${error}`);
  }

  return { synced, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR DADOS PARA TREINAMENTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Exporta dados combinados de DAIA e Starter Kits para fine-tuning.
 */
export async function exportCombinedTrainingData(
  minQuality = 70
): Promise<Array<{ prompt: string; completion: string; source: string }>> {
  const combined: Array<{ prompt: string; completion: string; source: string }> = [];

  // Dados do Starter Kit
  try {
    const skData = await starterKitService.getTrainingData(minQuality);
    for (const item of skData) {
      combined.push({
        ...item,
        source: 'starter_kit',
      });
    }
  } catch (error) {
    console.error('[Export] Erro ao exportar Starter Kits:', error);
  }

  // Dados do DAIA
  try {
    const daiaData = await daiaService.exportForTraining();
    for (const item of daiaData) {
      // Evita duplicatas
      const exists = combined.some(c => c.prompt === item.prompt);
      if (!exists) {
        combined.push({
          ...item,
          source: 'daia',
        });
      }
    }
  } catch (error) {
    console.error('[Export] Erro ao exportar DAIA:', error);
  }

  console.log(`[Export] Total de ${combined.length} amostras para treinamento`);
  
  return combined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { starterKitService } from './StarterKitService';
export { daiaService } from './DAIAService';
