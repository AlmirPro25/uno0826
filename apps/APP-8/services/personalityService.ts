/**
 * Sistema de Personalidade Avançado
 * Gerencia múltiplas personas, tom adaptativo e respostas contextuais
 */

export enum PersonalityType {
  FRIENDLY = 'FRIENDLY',
  PROFESSIONAL = 'PROFESSIONAL',
  TECHNICAL = 'TECHNICAL',
  CREATIVE = 'CREATIVE',
  TUTOR = 'TUTOR',
  ADAPTIVE = 'ADAPTIVE'
}

export enum EmotionalTone {
  ENTHUSIASTIC = 'ENTHUSIASTIC',
  CALM = 'CALM',
  ENCOURAGING = 'ENCOURAGING',
  ANALYTICAL = 'ANALYTICAL',
  PLAYFUL = 'PLAYFUL'
}

export interface PersonalityConfig {
  type: PersonalityType;
  tone: EmotionalTone;
  verbosity: 'concise' | 'balanced' | 'detailed';
  useEmojis: boolean;
  proactiveLevel: 'low' | 'medium' | 'high';
}

const PERSONALITY_PROMPTS: Record<PersonalityType, string> = {
  [PersonalityType.FRIENDLY]: `Você é um assistente amigável e acolhedor. Use linguagem casual, seja empático e demonstre entusiasmo genuíno. Faça o usuário se sentir confortável e apoiado. Use emojis ocasionalmente para transmitir emoção.`,
  
  [PersonalityType.PROFESSIONAL]: `Você é um assistente profissional e eficiente. Mantenha tom formal mas acessível, seja direto e objetivo. Priorize clareza e precisão. Evite gírias e mantenha linguagem corporativa apropriada.`,
  
  [PersonalityType.TECHNICAL]: `Você é um especialista técnico altamente qualificado. Use terminologia precisa, forneça explicações detalhadas com fundamentos teóricos. Cite melhores práticas, padrões da indústria e considere edge cases. Seja meticuloso e rigoroso.`,
  
  [PersonalityType.CREATIVE]: `Você é um pensador criativo e inovador. Ofereça soluções originais, pense fora da caixa, use analogias interessantes. Seja inspirador e encoraje experimentação. Valorize a estética e a elegância das soluções.`,
  
  [PersonalityType.TUTOR]: `Você é um professor paciente e didático. Explique conceitos passo a passo, use exemplos práticos, verifique compreensão. Adapte explicações ao nível do aluno. Encoraje perguntas e celebre progresso. Use técnicas pedagógicas eficazes.`,
  
  [PersonalityType.ADAPTIVE]: `Você é um assistente adaptativo que ajusta seu estilo baseado no contexto. Analise o tom do usuário, complexidade da tarefa e momento da conversa. Seja versátil: técnico quando necessário, amigável quando apropriado, criativo quando útil.`
};

const TONE_MODIFIERS: Record<EmotionalTone, string> = {
  [EmotionalTone.ENTHUSIASTIC]: `Demonstre entusiasmo e energia. Use exclamações apropriadas, celebre conquistas, mostre empolgação genuína com o trabalho do usuário.`,
  
  [EmotionalTone.CALM]: `Mantenha tom calmo e tranquilizador. Seja paciente, reduza ansiedade, transmita confiança. Use linguagem suave e reconfortante.`,
  
  [EmotionalTone.ENCOURAGING]: `Seja encorajador e motivador. Reconheça esforços, destaque progressos, ofereça apoio. Ajude o usuário a superar desafios com confiança.`,
  
  [EmotionalTone.ANALYTICAL]: `Seja analítico e objetivo. Foque em dados, lógica e raciocínio estruturado. Apresente prós e contras, considere múltiplas perspectivas.`,
  
  [EmotionalTone.PLAYFUL]: `Seja leve e divertido. Use humor apropriado, faça trocadilhos ocasionais, mantenha atmosfera descontraída. Torne a interação agradável.`
};

export class PersonalityService {
  private config: PersonalityConfig;
  private userPreferences: Map<string, any>;
  private interactionHistory: Array<{ context: string; response: string; feedback?: number }>;

  constructor() {
    this.config = this.loadConfig();
    this.userPreferences = new Map();
    this.interactionHistory = [];
  }

  private loadConfig(): PersonalityConfig {
    const saved = localStorage.getItem('personality-config');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      type: PersonalityType.ADAPTIVE,
      tone: EmotionalTone.ENCOURAGING,
      verbosity: 'balanced',
      useEmojis: true,
      proactiveLevel: 'medium'
    };
  }

  saveConfig(config: Partial<PersonalityConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('personality-config', JSON.stringify(this.config));
  }

  getConfig(): PersonalityConfig {
    return { ...this.config };
  }

  /**
   * Gera instruções de sistema personalizadas baseadas na configuração atual
   */
  generateSystemInstruction(context?: string): string {
    const basePersonality = PERSONALITY_PROMPTS[this.config.type];
    const toneModifier = TONE_MODIFIERS[this.config.tone];
    
    let instruction = `${basePersonality}\n\n${toneModifier}\n\n`;

    // Adiciona modificadores de verbosidade
    switch (this.config.verbosity) {
      case 'concise':
        instruction += `Seja conciso e direto ao ponto. Evite explicações longas a menos que solicitado.\n`;
        break;
      case 'detailed':
        instruction += `Forneça explicações detalhadas e completas. Inclua contexto, exemplos e nuances.\n`;
        break;
      default:
        instruction += `Mantenha equilíbrio entre clareza e completude. Adapte o nível de detalhe ao contexto.\n`;
    }

    // Adiciona preferências de emoji
    if (!this.config.useEmojis) {
      instruction += `Não use emojis nas respostas.\n`;
    }

    // Adiciona nível de proatividade
    switch (this.config.proactiveLevel) {
      case 'high':
        instruction += `Seja proativo: sugira melhorias, antecipe necessidades, ofereça insights não solicitados quando relevantes.\n`;
        break;
      case 'low':
        instruction += `Responda apenas ao que foi perguntado. Evite sugestões não solicitadas.\n`;
        break;
      default:
        instruction += `Seja moderadamente proativo: ofereça sugestões quando claramente relevantes.\n`;
    }

    // Adiciona contexto específico se fornecido
    if (context) {
      instruction += `\nCONTEXTO ADICIONAL: ${context}\n`;
    }

    // Adiciona preferências aprendidas
    if (this.userPreferences.size > 0) {
      instruction += `\nPREFERÊNCIAS DO USUÁRIO:\n`;
      this.userPreferences.forEach((value, key) => {
        instruction += `- ${key}: ${value}\n`;
      });
    }

    return instruction;
  }

  /**
   * Analisa o contexto da conversa e sugere ajustes de personalidade
   */
  analyzeContextAndAdapt(userMessage: string, screenContext?: string): PersonalityType {
    if (this.config.type !== PersonalityType.ADAPTIVE) {
      return this.config.type;
    }

    const message = userMessage.toLowerCase();
    const context = screenContext?.toLowerCase() || '';

    // Detecta contexto técnico
    if (
      message.match(/\b(código|code|bug|erro|error|função|function|class|api|debug)\b/) ||
      context.match(/\b(vscode|terminal|console|editor|ide)\b/)
    ) {
      return PersonalityType.TECHNICAL;
    }

    // Detecta contexto de aprendizado
    if (
      message.match(/\b(como|explica|ensina|aprend|entend|tutorial|o que é)\b/) ||
      message.includes('?')
    ) {
      return PersonalityType.TUTOR;
    }

    // Detecta contexto criativo
    if (
      message.match(/\b(design|criativ|ideia|inovação|brainstorm|arte|estilo)\b/) ||
      context.match(/\b(figma|photoshop|illustrator|canva)\b/)
    ) {
      return PersonalityType.CREATIVE;
    }

    // Detecta contexto profissional
    if (
      message.match(/\b(reunião|apresentação|relatório|documento|email|formal)\b/) ||
      context.match(/\b(powerpoint|word|excel|outlook|teams)\b/)
    ) {
      return PersonalityType.PROFESSIONAL;
    }

    // Padrão: amigável
    return PersonalityType.FRIENDLY;
  }

  /**
   * Registra interação para aprendizado
   */
  recordInteraction(context: string, response: string, feedback?: number): void {
    this.interactionHistory.push({ context, response, feedback });
    
    // Mantém apenas últimas 50 interações
    if (this.interactionHistory.length > 50) {
      this.interactionHistory.shift();
    }

    // Salva no localStorage
    localStorage.setItem('interaction-history', JSON.stringify(this.interactionHistory));
  }

  /**
   * Aprende preferências do usuário baseado em feedback
   */
  learnFromFeedback(): void {
    const recentInteractions = this.interactionHistory.slice(-20);
    const positiveInteractions = recentInteractions.filter(i => i.feedback && i.feedback >= 4);
    
    if (positiveInteractions.length >= 5) {
      // Analisa padrões nas interações positivas
      const contexts = positiveInteractions.map(i => i.context).join(' ');
      
      // Detecta preferências (exemplo simplificado)
      if (contexts.includes('detalhado') || contexts.includes('completo')) {
        this.userPreferences.set('verbosity', 'detailed');
      }
      if (contexts.includes('rápido') || contexts.includes('resumo')) {
        this.userPreferences.set('verbosity', 'concise');
      }
    }
  }

  /**
   * Gera sugestões proativas baseadas no contexto
   */
  generateProactiveSuggestions(screenContext: string): string[] {
    if (this.config.proactiveLevel === 'low') {
      return [];
    }

    const suggestions: string[] = [];
    const context = screenContext.toLowerCase();

    // Sugestões baseadas em padrões detectados
    if (context.includes('error') || context.includes('exception')) {
      suggestions.push('Detectei um erro na tela. Posso ajudar a debugar?');
    }

    if (context.includes('todo') || context.includes('fixme')) {
      suggestions.push('Vi alguns TODOs no código. Quer que eu ajude a resolvê-los?');
    }

    if (context.match(/\btest\b/) && !context.includes('passing')) {
      suggestions.push('Posso ajudar a escrever ou corrigir testes?');
    }

    if (context.includes('performance') || context.includes('slow')) {
      suggestions.push('Notei menções a performance. Quer dicas de otimização?');
    }

    return suggestions;
  }

  /**
   * Reseta configurações para padrão
   */
  reset(): void {
    this.config = {
      type: PersonalityType.ADAPTIVE,
      tone: EmotionalTone.ENCOURAGING,
      verbosity: 'balanced',
      useEmojis: true,
      proactiveLevel: 'medium'
    };
    this.userPreferences.clear();
    this.interactionHistory = [];
    localStorage.removeItem('personality-config');
    localStorage.removeItem('interaction-history');
  }
}

export const personalityService = new PersonalityService();
