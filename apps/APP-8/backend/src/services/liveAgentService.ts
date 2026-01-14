/**
 * LIVE AGENT SERVICE - A Consciência do Sistema
 * 
 * Este é o agente em tempo real que:
 * 1. Vê e ouve tudo em tempo real (câmera + áudio)
 * 2. Detecta quando precisa agir
 * 3. Coordena com o Maestro (subconsciente) para ações complexas
 * 4. Usa ferramentas diretamente para ações rápidas
 * 5. Mantém contexto contínuo da conversa
 */

import { geminiMaestro } from './geminiMaestro';
import { executorService } from './executorService';
import { visionService } from './visionService';
import { roboticsVisionService } from './roboticsVisionService';
import { taskPlanner } from './taskPlanner';

interface LiveContext {
  // Contexto visual
  currentScreen?: any;
  lastScreenUpdate?: Date;
  
  // Contexto conversacional
  recentMessages: Array<{
    speaker: string;
    text: string;
    timestamp: Date;
    isUser: boolean;
  }>;
  
  // Estado do agente
  currentTask?: string;
  isExecuting: boolean;
  lastAction?: {
    type: string;
    result: any;
    timestamp: Date;
  };
  
  // Memória de curto prazo
  shortTermMemory: string[];
}

interface AgentDecision {
  shouldAct: boolean;
  actionType: 'quick' | 'complex' | 'question' | 'conversation';
  confidence: number;
  reasoning: string;
  action?: {
    tool: string;
    params: any;
  };
}

/**
 * Live Agent - A consciência em tempo real do sistema
 */
export class LiveAgentService {
  private context: LiveContext = {
    recentMessages: [],
    isExecuting: false,
    shortTermMemory: []
  };

  // Ferramentas disponíveis para o agente
  private tools = {
    // Ferramentas de execução direta
    executor: {
      move_mouse: (x: number, y: number) => executorService.moveMouse(x, y),
      click: (button: 'left' | 'right' | 'middle', x?: number, y?: number) => executorService.click(button, x, y),
      type: (text: string) => executorService.type(text),
      press: (key: string) => executorService.press(key),
      hotkey: (...keys: string[]) => executorService.hotkey(...keys),
      scroll: (amount: number) => executorService.scroll(amount),
      screenshot: () => executorService.screenshot()
    },
    
    // Ferramentas de visão
    vision: {
      analyze_screen: (query?: string) => visionService.analyzeScreen(query),
      find_element: (target: string) => roboticsVisionService.findAndClick(target, '2D bounding boxes', false),
      detect_elements: (target: string, max: number) => roboticsVisionService.detect2DBoundingBoxes(target, max, false)
    },
    
    // Ferramentas de coordenação (Maestro)
    maestro: {
      execute_complex_task: (command: string, context?: any) => geminiMaestro.executeComplexTask(command, context),
      plan_task: (command: string, screenContext: any) => taskPlanner.planTask(command, screenContext)
    }
  };

  /**
   * Processa mensagem em tempo real e decide se/como agir
   */
  async processRealtimeMessage(
    speaker: string,
    text: string,
    isUser: boolean,
    visualContext?: any
  ): Promise<{
    response: string;
    acted: boolean;
    action?: any;
  }> {
    // Adiciona ao contexto
    const message = {
      speaker,
      text,
      timestamp: new Date(),
      isUser
    };
    
    this.context.recentMessages.push(message);
    if (this.context.recentMessages.length > 20) {
      this.context.recentMessages.shift();
    }

    // Atualiza contexto visual se fornecido
    if (visualContext) {
      this.context.currentScreen = visualContext;
      this.context.lastScreenUpdate = new Date();
    }

    // Só processa mensagens do usuário
    if (!isUser) {
      return {
        response: '',
        acted: false
      };
    }

    console.log('\n' + '='.repeat(70));
    console.log('🧠 LIVE AGENT - Processando mensagem em tempo real');
    console.log('='.repeat(70));
    console.log(`👤 Usuário: "${text}"`);
    console.log('─'.repeat(70));

    // DECISÃO AGÊNTICA: O que fazer?
    const decision = await this.makeAgenticDecision(text);
    
    console.log(`🤔 Decisão: ${decision.shouldAct ? 'AGIR' : 'CONVERSAR'}`);
    console.log(`📊 Tipo: ${decision.actionType} | Confiança: ${(decision.confidence * 100).toFixed(0)}%`);
    console.log(`💭 Raciocínio: ${decision.reasoning}`);
    console.log('─'.repeat(70));

    if (!decision.shouldAct) {
      // Apenas conversa
      const response = await this.generateConversationalResponse(text);
      console.log(`💬 Resposta conversacional: "${response}"`);
      console.log('='.repeat(70) + '\n');
      return {
        response,
        acted: false
      };
    }

    // EXECUÇÃO AGÊNTICA
    try {
      this.context.isExecuting = true;
      
      let result: any;
      let response: string;

      switch (decision.actionType) {
        case 'quick':
          // Ação rápida direta
          console.log('⚡ Executando ação RÁPIDA...');
          result = await this.executeQuickAction(decision.action!);
          response = result.success 
            ? `✅ ${result.message}`
            : `❌ ${result.error}`;
          break;

        case 'complex':
          // Coordena com Maestro para tarefa complexa
          console.log('🎭 Coordenando com MAESTRO para tarefa complexa...');
          result = await this.coordinateWithMaestro(text);
          response = result.explanation;
          break;

        case 'question':
          // Responde pergunta sobre a tela
          console.log('❓ Respondendo pergunta sobre contexto visual...');
          result = await this.answerVisualQuestion(text);
          response = result.answer;
          break;

        default:
          response = 'Não entendi como executar isso.';
      }

      this.context.lastAction = {
        type: decision.actionType,
        result,
        timestamp: new Date()
      };

      this.context.isExecuting = false;

      console.log(`✅ Ação completada: ${response}`);
      console.log('='.repeat(70) + '\n');

      return {
        response,
        acted: true,
        action: result
      };

    } catch (error: any) {
      this.context.isExecuting = false;
      console.error(`❌ Erro na execução: ${error.message}`);
      console.log('='.repeat(70) + '\n');
      
      return {
        response: `❌ Erro: ${error.message}`,
        acted: false
      };
    }
  }

  /**
   * DECISÃO AGÊNTICA: Analisa mensagem e decide o que fazer
   * Esta é a "consciência" que decide quando e como agir
   */
  private async makeAgenticDecision(userMessage: string): Promise<AgentDecision> {
    // Contexto recente
    const recentContext = this.context.recentMessages
      .slice(-5)
      .map(m => `${m.speaker}: ${m.text}`)
      .join('\n');

    const screenInfo = this.context.currentScreen 
      ? `\nTELA ATUAL: ${this.context.currentScreen.description || 'Analisando...'}`
      : '';

    const prompt = `Você é um AGENTE INTELIGENTE em tempo real. Sua função é decidir SE e COMO agir.

CONTEXTO RECENTE:
${recentContext}
${screenInfo}

MENSAGEM DO USUÁRIO: "${userMessage}"

FERRAMENTAS DISPONÍVEIS:
1. QUICK ACTIONS (ações rápidas diretas):
   - move_mouse, click, type, press, hotkey, scroll
   - Use para comandos simples e diretos

2. COMPLEX TASKS (coordenar com Maestro):
   - Tarefas que precisam planejamento
   - Múltiplos passos
   - Análise visual complexa

3. VISUAL QUESTIONS (perguntas sobre tela):
   - "O que tem na tela?"
   - "Quais vídeos estão aparecendo?"
   - "Resume esse artigo"

4. CONVERSATION (apenas conversar):
   - Saudações, agradecimentos
   - Perguntas gerais
   - Feedback

ANALISE e retorne JSON:
{
  "shouldAct": true/false,
  "actionType": "quick|complex|question|conversation",
  "confidence": 0.0-1.0,
  "reasoning": "por que decidiu isso",
  "action": {
    "tool": "nome_da_ferramenta",
    "params": {...}
  }
}

EXEMPLOS:
- "Abra o YouTube" → quick action (hotkey + type)
- "Pesquise Python e clique no primeiro vídeo" → complex task (precisa visão + planejamento)
- "O que tem na tela?" → question
- "Obrigado!" → conversation

Seja DECISIVO e PRECISO. Escolha a abordagem mais eficiente.`;

    try {
      const result = await geminiMaestro.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return decision;
      }
    } catch (error) {
      console.error('Erro na decisão agêntica:', error);
    }

    // Fallback: não agir
    return {
      shouldAct: false,
      actionType: 'conversation',
      confidence: 0,
      reasoning: 'Erro ao processar decisão'
    };
  }

  /**
   * Executa ação rápida diretamente
   */
  private async executeQuickAction(action: { tool: string; params: any }): Promise<any> {
    if (!executorService.connected) {
      throw new Error('Executor não conectado');
    }

    console.log(`   🔧 Ferramenta: ${action.tool}`);
    console.log(`   📦 Parâmetros:`, action.params);

    const tool = action.tool;
    const params = action.params;

    try {
      let result;

      switch (tool) {
        case 'move_mouse':
          result = await executorService.moveMouse(params.x, params.y, params.duration);
          break;
        case 'click':
          result = await executorService.click(params.button || 'left', params.x, params.y);
          break;
        case 'type':
          result = await executorService.type(params.text);
          break;
        case 'press':
          result = await executorService.press(params.key, params.presses);
          break;
        case 'hotkey':
          result = await executorService.hotkey(...params.keys);
          break;
        case 'scroll':
          result = await executorService.scroll(params.amount);
          break;
        case 'screenshot':
          result = await executorService.screenshot();
          break;
        default:
          throw new Error(`Ferramenta desconhecida: ${tool}`);
      }

      return {
        success: true,
        message: `Executado: ${tool}`,
        result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Coordena com Maestro para tarefa complexa
   * CONSCIÊNCIA → SUBCONSCIENTE
   */
  private async coordinateWithMaestro(userCommand: string): Promise<any> {
    console.log('   🔄 Enviando para Maestro (subconsciente)...');
    
    // Envia contexto completo para o Maestro
    const context = {
      source: 'live_agent',
      recentMessages: this.context.recentMessages.slice(-10),
      shortTermMemory: this.context.shortTermMemory,
      timestamp: new Date()
    };

    // Maestro executa com visão + planejamento + execução
    const result = await geminiMaestro.executeComplexTask(userCommand, context);
    
    console.log('   ✅ Maestro completou a tarefa');
    
    return result;
  }

  /**
   * Responde pergunta sobre contexto visual
   */
  private async answerVisualQuestion(question: string): Promise<{ answer: string }> {
    console.log('   👁️  Analisando tela para responder...');
    
    // Captura contexto visual atual
    let screenContext = this.context.currentScreen;
    
    // Se não tem ou está desatualizado, captura novo
    if (!screenContext || 
        !this.context.lastScreenUpdate ||
        (Date.now() - this.context.lastScreenUpdate.getTime()) > 5000) {
      screenContext = await visionService.analyzeScreen(question);
      this.context.currentScreen = screenContext;
      this.context.lastScreenUpdate = new Date();
    }

    const prompt = `O usuário perguntou: "${question}"

CONTEXTO VISUAL:
- App: ${screenContext.appName || 'desconhecido'}
- Descrição: ${screenContext.description}
- Elementos: ${screenContext.elements?.length || 0} identificados

${screenContext.elements?.length > 0 ? `
ELEMENTOS NA TELA:
${screenContext.elements.slice(0, 15).map((e: any) => `- ${e.type}: ${e.label || e.text || 'sem texto'}`).join('\n')}
` : ''}

Responda de forma natural, direta e útil.
Se perguntou sobre vídeos, liste os que vê.
Se perguntou sobre texto, resuma.
Seja conversacional e preciso.`;

    try {
      const result = await geminiMaestro.model.generateContent(prompt);
      return {
        answer: result.response.text()
      };
    } catch (error) {
      return {
        answer: 'Não consegui analisar a tela agora.'
      };
    }
  }

  /**
   * Gera resposta conversacional
   */
  private async generateConversationalResponse(userMessage: string): Promise<string> {
    const recentContext = this.context.recentMessages
      .slice(-5)
      .map(m => `${m.speaker}: ${m.text}`)
      .join('\n');

    const prompt = `Você é um assistente amigável e natural.

CONTEXTO RECENTE:
${recentContext}

MENSAGEM DO USUÁRIO: "${userMessage}"

Responda de forma natural, amigável e concisa (máximo 2 frases).
Seja humano, não robótico.`;

    try {
      const result = await geminiMaestro.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      return 'Desculpe, não entendi bem.';
    }
  }

  /**
   * Atualiza contexto visual periodicamente
   */
  async updateVisualContext(force: boolean = false): Promise<void> {
    const shouldUpdate = force || 
      !this.context.lastScreenUpdate ||
      (Date.now() - this.context.lastScreenUpdate.getTime()) > 10000; // 10s

    if (shouldUpdate && !this.context.isExecuting) {
      try {
        this.context.currentScreen = await visionService.analyzeScreen();
        this.context.lastScreenUpdate = new Date();
      } catch (error) {
        console.error('Erro ao atualizar contexto visual:', error);
      }
    }
  }

  /**
   * Adiciona à memória de curto prazo
   */
  addToShortTermMemory(info: string): void {
    this.context.shortTermMemory.push(info);
    if (this.context.shortTermMemory.length > 10) {
      this.context.shortTermMemory.shift();
    }
  }

  /**
   * Obtém contexto atual
   */
  getContext(): LiveContext {
    return this.context;
  }

  /**
   * Verifica se está executando
   */
  get isExecuting(): boolean {
    return this.context.isExecuting;
  }
}

export const liveAgentService = new LiveAgentService();
