/**
 * Gemini Maestro - O cérebro que orquestra todo o sistema
 * Responsável por análises, resumos, extração de contexto e decisões inteligentes
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { executorService } from './executorService';
import { visionService } from './visionService';
import { roboticsVisionService } from './roboticsVisionService';
import { taskPlanner } from './taskPlanner';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export class GeminiMaestro {
  // Expõe o modelo para uso externo
  public model = model;

  /**
   * Ferramentas disponíveis para o Maestro usar via Executor
   */
  private executorTools = [
    {
      name: 'move_mouse',
      description: 'Move o cursor do mouse para coordenadas específicas na tela',
      parameters: {
        x: 'number - coordenada X',
        y: 'number - coordenada Y',
        duration: 'number (opcional) - duração do movimento em segundos'
      }
    },
    {
      name: 'click_mouse',
      description: 'Clica o mouse na posição atual ou em coordenadas específicas',
      parameters: {
        button: 'string (opcional) - left, right ou middle',
        x: 'number (opcional) - coordenada X',
        y: 'number (opcional) - coordenada Y'
      }
    },
    {
      name: 'type_text',
      description: 'Digita texto no campo atualmente focado',
      parameters: {
        text: 'string - texto a ser digitado'
      }
    },
    {
      name: 'press_key',
      description: 'Pressiona uma tecla especial (enter, tab, esc, etc)',
      parameters: {
        key: 'string - nome da tecla',
        presses: 'number (opcional) - número de vezes'
      }
    },
    {
      name: 'hotkey',
      description: 'Executa combinação de teclas (ctrl+c, alt+tab, etc)',
      parameters: {
        keys: 'array de strings - teclas da combinação'
      }
    },
    {
      name: 'scroll',
      description: 'Rola a página para cima ou para baixo',
      parameters: {
        amount: 'number - quantidade (positivo = baixo, negativo = cima)'
      }
    },
    {
      name: 'screenshot',
      description: 'Captura screenshot da tela ou região específica',
      parameters: {
        filename: 'string (opcional) - nome do arquivo',
        region: 'array (opcional) - [x, y, width, height]'
      }
    }
  ];

  /**
   * Executa ação física via Executor
   */
  async executePhysicalAction(action: string, params: any): Promise<any> {
    if (!executorService.connected) {
      throw new Error('Executor não está conectado. Inicie o módulo Python primeiro.');
    }

    switch (action) {
      case 'move_mouse':
        return await executorService.moveMouse(params.x, params.y, params.duration);
      case 'click_mouse':
        return await executorService.click(params.button, params.x, params.y);
      case 'type_text':
        return await executorService.type(params.text);
      case 'press_key':
        return await executorService.press(params.key, params.presses);
      case 'hotkey':
        return await executorService.hotkey(...params.keys);
      case 'scroll':
        return await executorService.scroll(params.amount, params.x, params.y);
      case 'screenshot':
        return await executorService.screenshot(params.filename, params.region);
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Executa tarefa complexa com visão e planejamento
   * FLUXO COMPLETO INTEGRADO: Maestro → Vision → Planner → Executor
   */
  async executeComplexTask(
    userCommand: string,
    userContext?: any
  ): Promise<{
    success: boolean;
    plan: any;
    execution: any;
    explanation: string;
  }> {
    try {
      console.log(`\n🎯 MAESTRO INICIANDO TAREFA: "${userCommand}"`);
      console.log('─'.repeat(60));

      // 1. Analisa tela atual com VISÃO
      console.log('�️  PaASSO 1: Analisando tela com Gemini Vision...');
      const screenContext = await visionService.analyzeScreen(userCommand);
      console.log(`   📱 App: ${screenContext.appName || 'desconhecido'}`);
      console.log(`   📝 Descrição: ${screenContext.description}`);
      console.log(`   🎯 Elementos encontrados: ${screenContext.elements?.length || 0}`);

      // 2. Cria plano de ação INTELIGENTE
      console.log('\n🧠 PASSO 2: Criando plano de ação com Task Planner...');
      const plan = await taskPlanner.planTask(
        userCommand,
        screenContext,
        userContext
      );
      console.log(`   📋 Passos planejados: ${plan.steps.length}`);
      console.log(`   ⏱️  Tempo estimado: ${plan.estimatedTime}s`);
      console.log(`   ⚠️  Nível de risco: ${plan.riskLevel}`);
      
      // Mostra resumo do plano
      console.log('\n   📝 PLANO DE EXECUÇÃO:');
      plan.steps.forEach((step: any, i: number) => {
        console.log(`      ${i + 1}. ${step.description}`);
      });

      // 3. Se requer confirmação, retorna plano para aprovação
      if (plan.requiresConfirmation) {
        console.log('\n⚠️  ATENÇÃO: Tarefa requer confirmação (risco alto)');
        return {
          success: false,
          plan,
          execution: null,
          explanation: '⚠️ Tarefa requer confirmação do usuário antes de executar (risco alto)'
        };
      }

      // 4. Executa plano com EXECUTOR
      console.log('\n🚀 PASSO 3: Executando plano com Executor Python...');
      console.log('─'.repeat(60));
      
      const execution = await taskPlanner.executePlan(plan, (step, total, desc) => {
        console.log(`   ⚙️  [${step}/${total}] ${desc}`);
      });

      console.log('─'.repeat(60));

      const successMsg = execution.success
        ? `✅ Tarefa completada! ${execution.completedSteps} passos em ${(execution.duration / 1000).toFixed(1)}s`
        : `❌ Tarefa falhou no passo ${execution.completedSteps}/${execution.totalSteps}`;

      console.log(`\n${successMsg}`);
      
      if (execution.errors.length > 0) {
        console.log(`   ❌ Erros: ${execution.errors.join(', ')}`);
      }

      return {
        success: execution.success,
        plan,
        execution,
        explanation: execution.success
          ? `✅ Tarefa completada com sucesso em ${execution.completedSteps} passos (${(execution.duration / 1000).toFixed(1)}s)`
          : `❌ Tarefa falhou no passo ${execution.completedSteps}: ${execution.errors.join(', ')}`
      };
    } catch (error: any) {
      console.error('\n❌ ERRO CRÍTICO NO MAESTRO:', error.message);
      return {
        success: false,
        plan: null,
        execution: null,
        explanation: `Erro ao executar tarefa: ${error.message}`
      };
    }
  }

  /**
   * Usa Robotics Vision para encontrar e clicar em elementos
   * Fallback mais preciso que Vision normal
   */
  async findAndClickWithRobotics(
    targetElement: string,
    enableThinking: boolean = false
  ): Promise<{
    success: boolean;
    found: boolean;
    clicked?: { x: number; y: number };
    label?: string;
    explanation: string;
  }> {
    try {
      console.log(`🤖 MAESTRO usando Robotics Vision para: "${targetElement}"`);
      
      const result = await roboticsVisionService.findAndClick(
        targetElement,
        '2D bounding boxes',
        enableThinking
      );

      if (result.success) {
        return {
          ...result,
          explanation: `✅ Encontrado e clicado em "${result.label}" usando Robotics Vision`
        };
      } else {
        return {
          ...result,
          explanation: `❌ "${targetElement}" não encontrado na tela`
        };
      }
    } catch (error: any) {
      console.error('❌ Erro no Robotics Vision:', error);
      return {
        success: false,
        found: false,
        explanation: `Erro: ${error.message}`
      };
    }
  }

  /**
   * Detecta elementos na tela com Robotics Vision
   */
  async detectElementsWithRobotics(
    targetItems: string,
    maxItems: number = 20,
    enableThinking: boolean = false
  ): Promise<{
    success: boolean;
    count: number;
    elements: any[];
    explanation: string;
  }> {
    try {
      console.log(`🤖 MAESTRO detectando "${targetItems}" com Robotics Vision...`);
      
      const boxes = await roboticsVisionService.detect2DBoundingBoxes(
        targetItems,
        maxItems,
        enableThinking
      );

      return {
        success: true,
        count: boxes.length,
        elements: boxes,
        explanation: `✅ Detectados ${boxes.length} elementos: ${boxes.map(b => b.label).join(', ')}`
      };
    } catch (error: any) {
      console.error('❌ Erro no Robotics Vision:', error);
      return {
        success: false,
        count: 0,
        elements: [],
        explanation: `Erro: ${error.message}`
      };
    }
  }

  /**
   * Interpreta comando em linguagem natural e executa ações físicas (versão simples)
   */
  async interpretAndExecute(command: string, screenContext?: string): Promise<{
    understood: boolean;
    actions: Array<{ action: string; params: any; result: any }>;
    explanation: string;
  }> {
    const toolsDescription = this.executorTools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    const prompt = `Você é um assistente que controla o computador do usuário.

FERRAMENTAS DISPONÍVEIS:
${toolsDescription}

${screenContext ? `CONTEXTO DA TELA:\n${screenContext}\n\n` : ''}

COMANDO DO USUÁRIO: "${command}"

Analise o comando e retorne um JSON com:
{
  "understood": true/false,
  "actions": [
    {"action": "nome_da_ação", "params": {...}},
    ...
  ],
  "explanation": "explicação do que será feito"
}

Se não entender ou não for possível, retorne understood: false.
Seja preciso e cuidadoso com as ações.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        
        if (plan.understood && plan.actions) {
          // Executa as ações planejadas
          const executedActions = [];
          
          for (const action of plan.actions) {
            try {
              const result = await this.executePhysicalAction(action.action, action.params);
              executedActions.push({
                ...action,
                result,
                success: true
              });
            } catch (error: any) {
              executedActions.push({
                ...action,
                result: null,
                success: false,
                error: error.message
              });
            }
          }
          
          return {
            understood: true,
            actions: executedActions,
            explanation: plan.explanation
          };
        }
        
        return plan;
      }
    } catch (error) {
      console.error('Erro ao interpretar comando:', error);
    }

    return {
      understood: false,
      actions: [],
      explanation: 'Não consegui entender o comando'
    };
  }
  /**
   * Analisa uma conversa e extrai fatos importantes
   */
  async extractFacts(conversation: string): Promise<Array<{
    content: string;
    type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context';
    importance: number;
    tags: string[];
  }>> {
    const prompt = `Analise a seguinte conversa e extraia fatos importantes sobre o usuário.
    
Conversa:
${conversation}

Retorne um JSON array com objetos contendo:
- content: o fato extraído
- type: tipo (conversation, fact, preference, skill, context)
- importance: 1-10
- tags: array de tags relevantes

Exemplo: [{"content": "Usuário prefere trabalhar de manhã", "type": "preference", "importance": 7, "tags": ["trabalho", "rotina"]}]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Erro ao extrair fatos:', error);
    }
    
    return [];
  }

  /**
   * Cria um resumo de uma sessão
   */
  async summarizeSession(messages: Array<{ speaker: string; text: string }>): Promise<string> {
    const conversation = messages
      .map(m => `${m.speaker}: ${m.text}`)
      .join('\n');

    const prompt = `Crie um resumo conciso e informativo desta conversa:

${conversation}

Resumo (máximo 3 frases):`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Erro ao resumir sessão:', error);
      return 'Erro ao gerar resumo';
    }
  }

  /**
   * Cria resumo diário inteligente
   */
  async createDailySummary(sessions: Array<{
    id: number;
    summary: string;
    messages: Array<{ speaker: string; text: string }>;
  }>): Promise<{
    summary: string;
    keyTopics: string[];
    importantFacts: string[];
    userMood: string;
    productivityScore: number;
    aiInsights: string;
  }> {
    const allContent = sessions.map(s => 
      `Sessão ${s.id}:\nResumo: ${s.summary}\nMensagens: ${s.messages.length}`
    ).join('\n\n');

    const prompt = `Analise o dia do usuário baseado nestas sessões:

${allContent}

Retorne um JSON com:
{
  "summary": "resumo geral do dia (2-3 frases)",
  "keyTopics": ["tópico1", "tópico2"],
  "importantFacts": ["fato1", "fato2"],
  "userMood": "humor detectado",
  "productivityScore": 1-10,
  "aiInsights": "insights e sugestões para o usuário"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Erro ao criar resumo diário:', error);
    }

    return {
      summary: 'Dia produtivo com várias interações',
      keyTopics: [],
      importantFacts: [],
      userMood: 'neutro',
      productivityScore: 5,
      aiInsights: 'Continue assim!'
    };
  }

  /**
   * Analisa uma imagem e extrai contexto
   */
  async analyzeImage(imageBase64: string, context?: string): Promise<{
    description: string;
    tags: string[];
    relevantInfo: string;
  }> {
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = context 
      ? `Analise esta imagem no contexto: ${context}\n\nDescreva o que vê e extraia informações relevantes.`
      : 'Descreva esta imagem em detalhes e identifique elementos importantes.';

    try {
      const result = await visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        }
      ]);

      const description = result.response.text();
      
      // Extrai tags da descrição
      const tagsPrompt = `Da seguinte descrição, extraia 5-10 tags relevantes (apenas palavras-chave):\n${description}\n\nTags (separadas por vírgula):`;
      const tagsResult = await model.generateContent(tagsPrompt);
      const tags = tagsResult.response.text().split(',').map(t => t.trim());

      return {
        description,
        tags,
        relevantInfo: description.substring(0, 200)
      };
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return {
        description: 'Erro ao analisar imagem',
        tags: [],
        relevantInfo: ''
      };
    }
  }

  /**
   * Busca semântica usando embeddings do Gemini
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      return [];
    }
  }

  /**
   * Monta contexto inteligente para resposta
   */
  async buildContextForResponse(
    currentQuery: string,
    relevantMemories: any[],
    shortTermContext: string[],
    userProfile: any
  ): Promise<string> {
    let context = '=== CONTEXTO DO USUÁRIO ===\n\n';

    if (userProfile.name) {
      context += `Nome: ${userProfile.name}\n`;
    }

    if (userProfile.skills?.length > 0) {
      context += `Habilidades: ${userProfile.skills.join(', ')}\n`;
    }

    if (userProfile.interests?.length > 0) {
      context += `Interesses: ${userProfile.interests.join(', ')}\n`;
    }

    context += '\n=== MEMÓRIAS RELEVANTES ===\n';
    relevantMemories.forEach(mem => {
      context += `- [${mem.type}] ${mem.content}\n`;
    });

    context += '\n=== CONTEXTO RECENTE ===\n';
    shortTermContext.slice(-5).forEach(ctx => {
      context += `- ${ctx}\n`;
    });

    return context;
  }
}

export const geminiMaestro = new GeminiMaestro();
