import { PromptAmplifier, AmplifiedPrompt } from './PromptAmplifier';
import { useAppStore } from '@/store/useAppStore';
import { generateAiResponse } from './GeminiService';
import { AiResponseType } from './GeminiServiceEnhanced';

/**
 * Handler aprimorado que integra amplificação de prompt no fluxo normal
 */
export class EnhancedCommandHandler {
  
  /**
   * Processa comando com amplificação automática
   */
  static async processCommandWithAmplification(
    originalPrompt: string,
    currentCode?: string,
    attachments?: any[],
    action?: any,
    forceFullStack?: boolean,
    arquitetaUnica?: boolean,
    artesaoMundos?: boolean
  ): Promise<any> {
    
    const store = useAppStore.getState();
    
    // 1. Mostrar status de amplificação
    store.setDetailedStatus(
      'Amplificação de Prompt',
      'Analisando',
      'Extraindo intenção e expandindo contexto...',
      10,
      15
    );

    try {
      // 2. Amplificar o prompt
      const amplification = await PromptAmplifier.amplifyPrompt(originalPrompt, currentCode);
      
      // 3. Gerar prompt otimizado
      const optimizedPrompt = PromptAmplifier.generateOptimizedPrompt(amplification, currentCode);
      
      // 4. Atualizar status
      store.setDetailedStatus(
        'Geração de Código',
        'Processando',
        `Gerando com base na intenção: ${amplification.extractedIntent}`,
        30,
        60
      );

      // 5. Log da amplificação para debug
      console.log('🎯 Prompt Amplificado:', {
        original: originalPrompt,
        intent: amplification.extractedIntent,
        complexity: amplification.complexityLevel,
        features: amplification.suggestedFeatures
      });

      // 6. Continuar com o fluxo normal usando prompt amplificado
      return await this.executeNormalFlow(
        optimizedPrompt,
        currentCode,
        attachments,
        action,
        forceFullStack,
        arquitetaUnica,
        artesaoMundos,
        amplification
      );

    } catch (error) {
      console.error('Erro na amplificação, usando prompt original:', error);
      
      // Fallback: usar prompt original
      return await this.executeNormalFlow(
        originalPrompt,
        currentCode,
        attachments,
        action,
        forceFullStack,
        arquitetaUnica,
        artesaoMundos
      );
    }
  }

  /**
   * Executa o fluxo normal de geração
   */
  private static async executeNormalFlow(
    prompt: string,
    currentCode?: string,
    attachments?: any[],
    action?: any,
    forceFullStack?: boolean,
    arquitetaUnica?: boolean,
    artesaoMundos?: boolean,
    amplification?: AmplifiedPrompt
  ): Promise<any> {
    
    const store = useAppStore.getState();
    
    // Usar a função handleAiCommand existente, mas com prompt amplificado
    return await store.handleAiCommand(
      prompt,
      currentCode || '',
      attachments,
      action,
      forceFullStack,
      arquitetaUnica,
      artesaoMundos
    );
  }

  /**
   * Versão com interface visual (modal de amplificação)
   */
  static async processCommandWithVisualAmplification(
    originalPrompt: string,
    currentCode?: string,
    onShowAmplificationPanel?: (prompt: string, onComplete: (amplified: string) => void) => void
  ): Promise<void> {
    
    if (onShowAmplificationPanel) {
      // Mostrar painel visual de amplificação
      onShowAmplificationPanel(originalPrompt, (amplifiedPrompt: string) => {
        // Continuar com prompt amplificado
        const store = useAppStore.getState();
        store.handleAiCommand(amplifiedPrompt, currentCode || '');
      });
    } else {
      // Fallback: amplificação automática sem interface
      await this.processCommandWithAmplification(originalPrompt, currentCode);
    }
  }

  /**
   * Detecta se prompt precisa de amplificação
   */
  static shouldAmplifyPrompt(prompt: string): boolean {
    const shortPrompts = prompt.length < 50;
    const vaguePhrases = [
      'crie', 'faça', 'gere', 'implemente', 'adicione', 'melhore',
      'create', 'make', 'generate', 'implement', 'add', 'improve'
    ];
    
    const hasVaguePhrase = vaguePhrases.some(phrase => 
      prompt.toLowerCase().includes(phrase)
    );
    
    const lacksDetail = !prompt.includes('com') && !prompt.includes('que') && 
                       !prompt.includes('para') && !prompt.includes('usando');
    
    return shortPrompts || (hasVaguePhrase && lacksDetail);
  }

  /**
   * Amplificação rápida para prompts simples
   */
  static async quickAmplify(prompt: string): Promise<string> {
    if (!this.shouldAmplifyPrompt(prompt)) {
      return prompt;
    }

    try {
      const amplification = await PromptAmplifier.amplifyPrompt(prompt);
      return PromptAmplifier.generateOptimizedPrompt(amplification);
    } catch (error) {
      console.error('Erro na amplificação rápida:', error);
      return prompt;
    }
  }
}

// Hook para usar o handler aprimorado
export const useEnhancedCommandHandler = () => {
  return {
    processWithAmplification: EnhancedCommandHandler.processCommandWithAmplification,
    processWithVisualAmplification: EnhancedCommandHandler.processCommandWithVisualAmplification,
    shouldAmplify: EnhancedCommandHandler.shouldAmplifyPrompt,
    quickAmplify: EnhancedCommandHandler.quickAmplify
  };
};
