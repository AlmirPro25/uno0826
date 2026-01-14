import { useAppStore } from '@/store/useAppStore';
import { generateAiResponse } from '@/services/GeminiService';
import { AiResponseType } from '@/services/GeminiServiceEnhanced';

export interface QualityScore {
  performance: number;
  accessibility: number;
  responsiveness: number;
  codeQuality: number;
  userExperience: number;
  totalScore: number;
  improvements: string[];
  improvementPrompt?: string;
  metrics: any;
}

export interface AutopilotConfig {
  enabled: boolean;
  qualityThreshold: number; // Pontuação mínima aceitável (ex: 90)
  maxIterations: number; // Máximo de iterações automáticas (ex: 3)
  autoApplyImprovements: boolean;
  pauseBetweenIterations: number; // ms entre iterações
}

export class QualityAutopilot {
  private static instance: QualityAutopilot;
  private config: AutopilotConfig;
  private isRunning: boolean = false;
  private currentIteration: number = 0;

  private constructor() {
    this.config = {
      enabled: false,
      qualityThreshold: 90,
      maxIterations: 3,
      autoApplyImprovements: true,
      pauseBetweenIterations: 2000
    };
  }

  static getInstance(): QualityAutopilot {
    if (!QualityAutopilot.instance) {
      QualityAutopilot.instance = new QualityAutopilot();
    }
    return QualityAutopilot.instance;
  }

  updateConfig(newConfig: Partial<AutopilotConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AutopilotConfig {
    return { ...this.config };
  }

  async startAutopilot(htmlCode: string): Promise<void> {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.currentIteration = 0;

    try {
      await this.runAutopilotLoop(htmlCode);
    } catch (error) {
      console.error('Erro no piloto automático:', error);
      useAppStore.getState().setDetailedStatus(
        'Piloto Automático',
        'Erro',
        `Erro durante execução: ${error}`,
        100,
        0
      );
    } finally {
      this.isRunning = false;
      this.currentIteration = 0;
    }
  }

  private async runAutopilotLoop(currentCode: string): Promise<void> {
    const store = useAppStore.getState();

    while (this.currentIteration < this.config.maxIterations && this.isRunning) {
      this.currentIteration++;

      // Atualizar status
      store.setDetailedStatus(
        'Piloto Automático de Qualidade',
        `Iteração ${this.currentIteration}`,
        'Analisando qualidade do código...',
        (this.currentIteration / this.config.maxIterations) * 100,
        30
      );

      // 1. Executar auto-crítica
      const score = await this.performQualityCritique(currentCode);
      
      if (!score) {
        console.warn('Não foi possível obter pontuação de qualidade');
        break;
      }

      // Mostrar pontuação atual
      store.setCurrentScore(score);

      // 2. Verificar se atingiu o limiar de qualidade
      if (score.totalScore >= this.config.qualityThreshold) {
        store.setDetailedStatus(
          'Piloto Automático de Qualidade',
          'Concluído',
          `Qualidade atingida: ${score.totalScore}/100 ✅`,
          100,
          0
        );
        
        store.setAiStatusMessage(`🎯 Piloto Automático concluído! Qualidade: ${score.totalScore}/100`);
        break;
      }

      // 3. Se não atingiu o limiar, aplicar melhorias
      if (score.improvementPrompt && this.config.autoApplyImprovements) {
        store.setDetailedStatus(
          'Piloto Automático de Qualidade',
          `Melhorando (${this.currentIteration}/${this.config.maxIterations})`,
          'Aplicando melhorias automáticas...',
          50,
          25
        );

        const improvedCode = await this.applyImprovements(currentCode, score.improvementPrompt);
        
        if (improvedCode && improvedCode !== currentCode) {
          currentCode = improvedCode;
          
          // Atualizar o código no editor
          store.setHtmlCode(improvedCode);
          
          // Aguardar antes da próxima iteração
          await this.sleep(this.config.pauseBetweenIterations);
        } else {
          console.warn('Não foi possível aplicar melhorias');
          break;
        }
      } else {
        break;
      }
    }

    // Limpar status detalhado após conclusão
    setTimeout(() => {
      store.clearDetailedStatus();
    }, 3000);
  }

  private async performQualityCritique(htmlCode: string): Promise<QualityScore | null> {
    try {
      const critiquePrompt = `
Analise este código HTML/CSS/JS e forneça uma pontuação detalhada de qualidade.

CÓDIGO:
\`\`\`html
${htmlCode}
\`\`\`

Retorne APENAS um JSON válido no seguinte formato:
{
  "performance": 85,
  "accessibility": 78,
  "responsiveness": 92,
  "codeQuality": 88,
  "userExperience": 90,
  "totalScore": 87,
  "improvements": ["Otimizar imagens", "Adicionar alt text", "Melhorar contraste"],
  "improvementPrompt": "Melhore a performance otimizando as imagens e adicione alt text para melhorar acessibilidade...",
  "metrics": {
    "linesOfCode": 150,
    "complexity": "medium",
    "bestPractices": ["semantic-html", "responsive-design"]
  }
}

Seja rigoroso na avaliação. A pontuação total deve ser a média das outras pontuações.
Se a pontuação total for menor que 90, inclua um improvementPrompt detalhado.
`;

      const response = await generateAiResponse(
        critiquePrompt,
        htmlCode,
        [],
        AiResponseType.CODE_GENERATION
      );

      if (response?.content) {
        // Extrair JSON da resposta
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return null;
    } catch (error) {
      console.error('Erro na crítica de qualidade:', error);
      return null;
    }
  }

  private async applyImprovements(currentCode: string, improvementPrompt: string): Promise<string | null> {
    try {
      const enhancementPrompt = `
${improvementPrompt}

CÓDIGO ATUAL:
\`\`\`html
${currentCode}
\`\`\`

Aplique as melhorias sugeridas e retorne o código completo melhorado.
Mantenha toda a funcionalidade existente.
Foque nas melhorias de qualidade identificadas.
`;

      const response = await generateAiResponse(
        enhancementPrompt,
        currentCode,
        [],
        AiResponseType.CODE_GENERATION
      );

      return response?.content || null;
    } catch (error) {
      console.error('Erro ao aplicar melhorias:', error);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopAutopilot(): void {
    this.isRunning = false;
  }

  isAutopilotRunning(): boolean {
    return this.isRunning;
  }

  getCurrentIteration(): number {
    return this.currentIteration;
  }
}

// Hook para usar o piloto automático
export const useQualityAutopilot = () => {
  const autopilot = QualityAutopilot.getInstance();
  
  return {
    startAutopilot: (code: string) => autopilot.startAutopilot(code),
    stopAutopilot: () => autopilot.stopAutopilot(),
    updateConfig: (config: Partial<AutopilotConfig>) => autopilot.updateConfig(config),
    getConfig: () => autopilot.getConfig(),
    isRunning: () => autopilot.isAutopilotRunning(),
    getCurrentIteration: () => autopilot.getCurrentIteration()
  };
};
