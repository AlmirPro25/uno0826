import { generateAiResponse } from '@/services/GeminiService';
import { AiResponseType } from '@/services/GeminiServiceEnhanced';

export interface AmplifiedPrompt {
  original: string;
  amplified: string;
  extractedIntent: string;
  detectedContext: string[];
  suggestedFeatures: string[];
  technicalRequirements: string[];
  userPersona: string;
  complexityLevel: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedScope: string;
}

export class PromptAmplifier {
  
  /**
   * Amplifica um prompt do usuário extraindo intenção, contexto e detalhes
   */
  static async amplifyPrompt(originalPrompt: string, currentCode?: string): Promise<AmplifiedPrompt> {
    const amplificationPrompt = this.buildAmplificationPrompt(originalPrompt, currentCode);
    
    try {
      const response = await generateAiResponse(
        amplificationPrompt,
        currentCode || '',
        [],
        AiResponseType.PLANNING
      );

      if (response?.content) {
        return this.parseAmplificationResponse(originalPrompt, response.content);
      }
    } catch (error) {
      console.error('Erro na amplificação do prompt:', error);
    }

    // Fallback: retorna amplificação básica
    return this.createBasicAmplification(originalPrompt);
  }

  /**
   * Constrói o prompt de amplificação
   */
  private static buildAmplificationPrompt(originalPrompt: string, currentCode?: string): string {
    return `
Você é um especialista em análise de intenção e amplificação de prompts para desenvolvimento de software.

PROMPT ORIGINAL DO USUÁRIO:
"${originalPrompt}"

${currentCode ? `CÓDIGO ATUAL EXISTENTE:
\`\`\`
${currentCode.substring(0, 1000)}${currentCode.length > 1000 ? '...' : ''}
\`\`\`` : 'PROJETO: Iniciando do zero'}

TAREFA: Analise profundamente o prompt e retorne um JSON com a seguinte estrutura:

{
  "extractedIntent": "Intenção principal do usuário em uma frase clara",
  "detectedContext": ["contexto1", "contexto2", "contexto3"],
  "suggestedFeatures": ["feature1", "feature2", "feature3"],
  "technicalRequirements": ["req1", "req2", "req3"],
  "userPersona": "Perfil do usuário (iniciante/intermediário/avançado/empresarial)",
  "complexityLevel": "simple|medium|complex|enterprise",
  "estimatedScope": "Descrição do escopo estimado",
  "amplifiedPrompt": "Prompt expandido e detalhado com todas as inferências e contextos identificados"
}

REGRAS PARA AMPLIFICAÇÃO:
1. Extraia intenções implícitas e explícitas
2. Identifique padrões de uso e necessidades não mencionadas
3. Sugira funcionalidades complementares relevantes
4. Determine requisitos técnicos necessários
5. Expanda o prompt original mantendo a essência
6. Adicione contexto de melhores práticas
7. Considere aspectos de UX/UI, performance e acessibilidade
8. Identifique possíveis integrações necessárias

EXEMPLO DE AMPLIFICAÇÃO:
Original: "Crie um botão"
Amplificado: "Crie um botão interativo e acessível com estados hover/active/disabled, seguindo padrões de design system, com feedback visual adequado, suporte a teclado, aria-labels para acessibilidade, animações suaves de transição, e responsividade para diferentes tamanhos de tela. O botão deve ter variantes de estilo (primary, secondary, outline) e tamanhos (small, medium, large)."

Retorne APENAS o JSON válido, sem explicações adicionais.
`;
  }

  /**
   * Faz parsing da resposta de amplificação
   */
  private static parseAmplificationResponse(original: string, response: string): AmplifiedPrompt {
    try {
      // Extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          original,
          amplified: parsed.amplifiedPrompt || original,
          extractedIntent: parsed.extractedIntent || 'Intenção não identificada',
          detectedContext: parsed.detectedContext || [],
          suggestedFeatures: parsed.suggestedFeatures || [],
          technicalRequirements: parsed.technicalRequirements || [],
          userPersona: parsed.userPersona || 'intermediário',
          complexityLevel: parsed.complexityLevel || 'medium',
          estimatedScope: parsed.estimatedScope || 'Escopo não definido'
        };
      }
    } catch (error) {
      console.error('Erro ao fazer parsing da amplificação:', error);
    }

    return this.createBasicAmplification(original);
  }

  /**
   * Cria amplificação básica como fallback
   */
  private static createBasicAmplification(original: string): AmplifiedPrompt {
    const words = original.toLowerCase();
    
    // Detecção básica de contexto
    const contexts = [];
    if (words.includes('botão') || words.includes('button')) contexts.push('interface');
    if (words.includes('api') || words.includes('backend')) contexts.push('backend');
    if (words.includes('banco') || words.includes('database')) contexts.push('database');
    if (words.includes('mobile') || words.includes('responsivo')) contexts.push('mobile');
    
    // Detecção básica de complexidade
    let complexity: 'simple' | 'medium' | 'complex' | 'enterprise' = 'medium';
    if (words.includes('simples') || words.includes('básico')) complexity = 'simple';
    if (words.includes('complexo') || words.includes('avançado')) complexity = 'complex';
    if (words.includes('sistema') || words.includes('plataforma')) complexity = 'enterprise';

    return {
      original,
      amplified: `${original} - Implementar seguindo melhores práticas de desenvolvimento, com código limpo, responsivo e acessível.`,
      extractedIntent: `Implementar: ${original}`,
      detectedContext: contexts,
      suggestedFeatures: ['Responsividade', 'Acessibilidade', 'Performance'],
      technicalRequirements: ['HTML semântico', 'CSS moderno', 'JavaScript ES6+'],
      userPersona: 'intermediário',
      complexityLevel: complexity,
      estimatedScope: 'Desenvolvimento de funcionalidade específica'
    };
  }

  /**
   * Gera prompt final otimizado para o modelo
   */
  static generateOptimizedPrompt(amplification: AmplifiedPrompt, currentCode?: string): string {
    const contextSection = amplification.detectedContext.length > 0 
      ? `\nCONTEXTO DETECTADO: ${amplification.detectedContext.join(', ')}`
      : '';

    const featuresSection = amplification.suggestedFeatures.length > 0
      ? `\nFUNCIONALIDADES SUGERIDAS: ${amplification.suggestedFeatures.join(', ')}`
      : '';

    const requirementsSection = amplification.technicalRequirements.length > 0
      ? `\nREQUISITOS TÉCNICOS: ${amplification.technicalRequirements.join(', ')}`
      : '';

    return `
INTENÇÃO IDENTIFICADA: ${amplification.extractedIntent}
NÍVEL DE COMPLEXIDADE: ${amplification.complexityLevel.toUpperCase()}
PERFIL DO USUÁRIO: ${amplification.userPersona}
ESCOPO ESTIMADO: ${amplification.estimatedScope}
${contextSection}
${featuresSection}
${requirementsSection}

PROMPT AMPLIFICADO:
${amplification.amplifiedPrompt}

${currentCode ? 'CÓDIGO ATUAL PARA EVOLUÇÃO:' : 'DESENVOLVIMENTO INICIAL:'}
${currentCode ? `\`\`\`\n${currentCode}\n\`\`\`` : 'Criar do zero seguindo melhores práticas'}

INSTRUÇÕES FINAIS:
- Implemente com qualidade de produção
- Siga padrões de acessibilidade (WCAG)
- Garanta responsividade mobile-first
- Use código semântico e limpo
- Adicione comentários explicativos quando necessário
- Considere performance e otimização
`;
  }
}

// Hook para usar o amplificador
export const usePromptAmplifier = () => {
  return {
    amplifyPrompt: (prompt: string, code?: string) => PromptAmplifier.amplifyPrompt(prompt, code),
    generateOptimizedPrompt: (amplification: AmplifiedPrompt, code?: string) => 
      PromptAmplifier.generateOptimizedPrompt(amplification, code)
  };
};
