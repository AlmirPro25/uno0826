import { AntiImageDirective } from './AntiImageDirective';
import { useAppStore } from '@/store/useAppStore';

/**
 * Serviço de validação de código que integra com o sistema de geração
 * Previne automaticamente a geração de imagens no código
 */
export class CodeValidationService {
  
  /**
   * Valida código antes de ser aplicado no editor
   */
  static validateBeforeApply(code: string): { 
    isValid: boolean; 
    sanitizedCode: string; 
    warnings: string[] 
  } {
    const validation = AntiImageDirective.validateCode(code);
    const sanitizedCode = validation.isValid ? code : AntiImageDirective.sanitizeCode(code);
    
    return {
      isValid: validation.isValid,
      sanitizedCode,
      warnings: validation.violations
    };
  }

  /**
   * Intercepta e valida código gerado pela IA
   */
  static interceptAiGeneration(originalCode: string, generatedCode: string): string {
    const validation = this.validateBeforeApply(generatedCode);
    
    if (!validation.isValid) {
      // Log das violações
      console.warn('🚨 Código gerado pela IA contém violações:', validation.warnings);
      
      // Notificar usuário
      const store = useAppStore.getState();
      store.setAiStatusMessage('⚠️ Código sanitizado - imagens removidas automaticamente');
      
      // Mostrar alternativas corretas
      this.showCorrectAlternatives(validation.warnings);
      
      return validation.sanitizedCode;
    }
    
    return generatedCode;
  }

  /**
   * Mostra alternativas corretas para violações detectadas
   */
  private static showCorrectAlternatives(violations: string[]) {
    violations.forEach(violation => {
      if (violation.includes('qrcode') || violation.includes('QR')) {
        console.info('✅ Alternativa correta para QR Code:', 
          AntiImageDirective.generateCorrectAlternative('qrcode'));
      }
      if (violation.includes('SVG') || violation.includes('svg')) {
        console.info('✅ Alternativa correta para SVG:', 
          AntiImageDirective.generateCorrectAlternative('svg'));
      }
      if (violation.includes('Base64') || violation.includes('base64')) {
        console.info('✅ Alternativa correta para imagens:', 
          AntiImageDirective.generateCorrectAlternative('canvas'));
      }
    });
  }

  /**
   * Gera prompt aprimorado com instruções anti-imagem
   */
  static enhancePromptWithAntiImageRules(originalPrompt: string): string {
    const antiImageInstructions = AntiImageDirective.getAiInstructions();
    
    return `${antiImageInstructions}

PROMPT ORIGINAL:
${originalPrompt}

LEMBRE-SE: Gere apenas código limpo, sem imagens Base64 ou SVGs complexos!`;
  }

  /**
   * Middleware para todas as gerações de código
   */
  static applyToAllGenerations() {
    // Interceptar função de geração principal
    const originalGenerateAiResponse = (window as any).generateAiResponse;
    
    if (originalGenerateAiResponse) {
      (window as any).generateAiResponse = async (...args: any[]) => {
        // Aplicar regras anti-imagem ao prompt
        if (args[0]) {
          args[0] = this.enhancePromptWithAntiImageRules(args[0]);
        }
        
        // Executar geração original
        const result = await originalGenerateAiResponse(...args);
        
        // Validar resultado
        if (result?.content) {
          result.content = this.interceptAiGeneration('', result.content);
        }
        
        return result;
      };
    }
  }
}

// Auto-aplicar middleware quando o serviço for importado
if (typeof window !== 'undefined') {
  CodeValidationService.applyToAllGenerations();
}
