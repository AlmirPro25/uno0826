import { geminiMaestro } from './geminiMaestro';
import { taskPlanner } from './taskPlanner';
import { visionService } from './visionService';
import { executorService } from './executorService';
import { roboticsVisionService } from './roboticsVisionService';

interface LiveMessage {
  speaker: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

interface CommandDetection {
  isCommand: boolean;
  command: string;
  confidence: number;
  type: 'navigation' | 'search' | 'action' | 'question' | 'conversation';
}

/**
 * Serviço que detecta e executa comandos vindos da Live
 */
export class LiveCommandService {
  private commandHistory: LiveMessage[] = [];
  private isExecuting = false;

  /**
   * Detecta se a mensagem é um comando ou conversa normal
   */
  async detectCommand(message: LiveMessage): Promise<CommandDetection> {
    const prompt = `Você é um assistente que detecta comandos de automação em conversas.

MENSAGEM DO USUÁRIO: "${message.text}"

CONTEXTO: O usuário está conversando com você em uma live. Ele pode:
- Dar COMANDOS para você executar no computador
- Fazer PERGUNTAS sobre o que está na tela
- Apenas CONVERSAR normalmente

COMANDOS típicos:
- "Abra o YouTube"
- "Pesquise por Python tutorial"
- "Clica nesse vídeo"
- "Role para baixo"
- "O que tem na tela?"
- "Resume esse artigo"

CONVERSA normal:
- "Como você está?"
- "Que legal!"
- "Obrigado"

Analise e retorne JSON:
{
  "isCommand": true/false,
  "command": "comando limpo e claro",
  "confidence": 0.0-1.0,
  "type": "navigation|search|action|question|conversation"
}

Se for comando, extraia a intenção clara.
Se for conversa, marque isCommand: false.`;

    try {
      const result = await geminiMaestro.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Erro ao detectar comando:', error);
    }

    return {
      isCommand: false,
      command: '',
      confidence: 0,
      type: 'conversation'
    };
  }

  /**
   * Processa comando detectado - EXECUÇÃO REAL INTEGRADA
   */
  async processCommand(detection: CommandDetection): Promise<{
    success: boolean;
    response: string;
    actions?: any[];
  }> {
    if (!detection.isCommand || detection.confidence < 0.7) {
      return {
        success: false,
        response: 'Não entendi como um comando. Pode reformular?'
      };
    }

    // Verifica se Executor está REALMENTE conectado
    if (!executorService.connected) {
      console.error('❌ Executor NÃO está conectado!');
      return {
        success: false,
        response: '❌ O Executor não está conectado. Inicie o módulo Python primeiro: `cd executor && py executor.py`'
      };
    }

    this.isExecuting = true;
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMANDO RECEBIDO DA LIVE');
    console.log('='.repeat(60));
    console.log(`📝 Comando: "${detection.command}"`);
    console.log(`🎭 Tipo: ${detection.type}`);
    console.log(`📊 Confiança: ${(detection.confidence * 100).toFixed(0)}%`);
    console.log('='.repeat(60) + '\n');

    try {
      // Se for pergunta sobre a tela, responde direto
      if (detection.type === 'question') {
        console.log('❓ Detectado como PERGUNTA - Analisando tela...');
        const screenContext = await visionService.analyzeScreen(detection.command);
        const response = await this.answerScreenQuestion(detection.command, screenContext);
        this.isExecuting = false;
        return {
          success: true,
          response
        };
      }

      // Comandos de navegação rápidos (otimizados)
      const quickCommand = await this.tryQuickCommand(detection.command);
      if (quickCommand) {
        this.isExecuting = false;
        return quickCommand;
      }

      // Usa o Maestro para executar tarefa complexa (FLUXO COMPLETO)
      console.log('🤖 Iniciando FLUXO COMPLETO: Live → Maestro → Vision → Planner → Executor');
      console.log('');
      
      const result = await geminiMaestro.executeComplexTask(
        detection.command,
        { source: 'live', timestamp: new Date() }
      );

      this.isExecuting = false;

      console.log('\n' + '='.repeat(60));
      console.log(result.success ? '✅ COMANDO EXECUTADO COM SUCESSO' : '❌ COMANDO FALHOU');
      console.log('='.repeat(60));
      console.log(`📊 Resultado: ${result.explanation}`);
      if (result.plan) {
        console.log(`📋 Passos executados: ${result.execution?.completedSteps || 0}/${result.plan.steps.length}`);
      }
      console.log('='.repeat(60) + '\n');

      return {
        success: result.success,
        response: result.explanation,
        actions: result.plan?.steps || []
      };
    } catch (error: any) {
      this.isExecuting = false;
      console.error('\n❌ ERRO AO PROCESSAR COMANDO:', error.message);
      return {
        success: false,
        response: `❌ Erro ao executar: ${error.message}`
      };
    }
  }

  /**
   * Tenta executar comandos rápidos de navegação (sem planejamento complexo)
   */
  private async tryQuickCommand(command: string): Promise<{
    success: boolean;
    response: string;
  } | null> {
    const cmd = command.toLowerCase();

    try {
      // Abrir navegador
      if (cmd.includes('abr') && (cmd.includes('navegador') || cmd.includes('chrome') || cmd.includes('browser'))) {
        console.log('🚀 Comando rápido: Abrir navegador');
        await executorService.hotkey('win', 'r');
        await this.sleep(500);
        await executorService.type('chrome');
        await executorService.press('enter');
        return {
          success: true,
          response: '✅ Abrindo navegador Chrome...'
        };
      }

      // Abrir YouTube
      if (cmd.includes('abr') && cmd.includes('youtube')) {
        console.log('🚀 Comando rápido: Abrir YouTube');
        await executorService.hotkey('win', 'r');
        await this.sleep(500);
        await executorService.type('chrome youtube.com');
        await executorService.press('enter');
        return {
          success: true,
          response: '✅ Abrindo YouTube...'
        };
      }

      // Pesquisar no YouTube
      if ((cmd.includes('pesquis') || cmd.includes('procur') || cmd.includes('busca')) && cmd.includes('youtube')) {
        console.log('🚀 Comando rápido: Pesquisar no YouTube');
        const searchTerm = command.match(/(?:pesquis|procur|busca)[a-z]*\s+(?:por|no youtube)?\s*(.+)/i)?.[1];
        if (searchTerm) {
          await executorService.hotkey('win', 'r');
          await this.sleep(500);
          await executorService.type(`chrome youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`);
          await executorService.press('enter');
          return {
            success: true,
            response: `✅ Pesquisando "${searchTerm}" no YouTube...`
          };
        }
      }

      // Fechar janela/navegador
      if ((cmd.includes('fech') || cmd.includes('fecha')) && (cmd.includes('navegador') || cmd.includes('janela') || cmd.includes('isso'))) {
        console.log('🚀 Comando rápido: Fechar janela');
        await executorService.hotkey('alt', 'f4');
        return {
          success: true,
          response: '✅ Fechando janela...'
        };
      }

      // Rolar página
      if (cmd.includes('rol') && (cmd.includes('baix') || cmd.includes('cima'))) {
        console.log('🚀 Comando rápido: Rolar página');
        const amount = cmd.includes('baix') ? 300 : -300;
        await executorService.scroll(amount);
        return {
          success: true,
          response: `✅ Rolando página para ${cmd.includes('baix') ? 'baixo' : 'cima'}...`
        };
      }

      // Voltar página
      if (cmd.includes('volt') && (cmd.includes('página') || cmd.includes('pagina'))) {
        console.log('🚀 Comando rápido: Voltar página');
        await executorService.hotkey('alt', 'left');
        return {
          success: true,
          response: '✅ Voltando página...'
        };
      }

      // Atualizar página
      if (cmd.includes('atualiz') && (cmd.includes('página') || cmd.includes('pagina'))) {
        console.log('🚀 Comando rápido: Atualizar página');
        await executorService.press('f5');
        return {
          success: true,
          response: '✅ Atualizando página...'
        };
      }

      // ========== COMANDOS COM ROBOTICS VISION ==========
      
      // Clicar em elemento específico
      if ((cmd.includes('clic') || cmd.includes('clica')) && (cmd.includes('no') || cmd.includes('na') || cmd.includes('em'))) {
        console.log('🤖 Comando com Robotics Vision: Clicar em elemento');
        
        // Extrai o que clicar
        const targetMatch = command.match(/(?:clic|clica)[a-z]*\s+(?:no|na|em)\s+(.+)/i);
        if (targetMatch) {
          const target = targetMatch[1].trim();
          console.log(`🎯 Procurando: "${target}"`);
          
          const result = await roboticsVisionService.findAndClick(target, '2D bounding boxes', false);
          
          if (result.success) {
            return {
              success: true,
              response: `✅ Clicado em "${result.label}" na posição (${result.clicked?.x}, ${result.clicked?.y})`
            };
          } else {
            return {
              success: false,
              response: `❌ Não encontrei "${target}" na tela. Tente ser mais específico.`
            };
          }
        }
      }

      // Encontrar elemento
      if ((cmd.includes('encontr') || cmd.includes('acha') || cmd.includes('procura')) && (cmd.includes('botão') || cmd.includes('botao') || cmd.includes('ícone') || cmd.includes('icone'))) {
        console.log('🤖 Comando com Robotics Vision: Encontrar elemento');
        
        const targetMatch = command.match(/(?:encontr|acha|procura)[a-z]*\s+(?:o|a)?\s*(.+)/i);
        if (targetMatch) {
          const target = targetMatch[1].trim();
          console.log(`🔍 Procurando: "${target}"`);
          
          const boxes = await roboticsVisionService.detect2DBoundingBoxes(target, 5, false);
          
          if (boxes.length > 0) {
            const labels = boxes.map(b => b.label).join(', ');
            return {
              success: true,
              response: `✅ Encontrei ${boxes.length} elemento(s): ${labels}`
            };
          } else {
            return {
              success: false,
              response: `❌ Não encontrei "${target}" na tela.`
            };
          }
        }
      }

      // Detectar todos os botões/ícones
      if ((cmd.includes('mostr') || cmd.includes('lista') || cmd.includes('quais')) && (cmd.includes('botõ') || cmd.includes('botao') || cmd.includes('ícone') || cmd.includes('icone'))) {
        console.log('🤖 Comando com Robotics Vision: Listar elementos');
        
        const target = cmd.includes('botão') || cmd.includes('botao') ? 'buttons' : 'icons';
        const boxes = await roboticsVisionService.detect2DBoundingBoxes(target, 15, false);
        
        if (boxes.length > 0) {
          const labels = boxes.slice(0, 5).map(b => b.label).join(', ');
          const more = boxes.length > 5 ? ` e mais ${boxes.length - 5}` : '';
          return {
            success: true,
            response: `✅ Encontrei ${boxes.length} ${target === 'buttons' ? 'botões' : 'ícones'}: ${labels}${more}`
          };
        } else {
          return {
            success: false,
            response: `❌ Não encontrei ${target === 'buttons' ? 'botões' : 'ícones'} na tela.`
          };
        }
      }

      // Clicar no primeiro/último elemento
      if ((cmd.includes('clic') || cmd.includes('clica')) && (cmd.includes('primeiro') || cmd.includes('último') || cmd.includes('ultimo'))) {
        console.log('🤖 Comando com Robotics Vision: Clicar no primeiro/último');
        
        const isFirst = cmd.includes('primeiro');
        const targetMatch = command.match(/(?:primeiro|último|ultimo)\s+(.+)/i);
        
        if (targetMatch) {
          const target = targetMatch[1].trim();
          const boxes = await roboticsVisionService.detect2DBoundingBoxes(target, 10, false);
          
          if (boxes.length > 0) {
            const box = isFirst ? boxes[0] : boxes[boxes.length - 1];
            
            // Obtém dimensões da tela
            const screenInfo = await executorService.getScreenInfo();
            const x = Math.round((box.x + box.width / 2) * screenInfo.screen.width);
            const y = Math.round((box.y + box.height / 2) * screenInfo.screen.height);
            
            await executorService.click('left', x, y);
            
            return {
              success: true,
              response: `✅ Clicado no ${isFirst ? 'primeiro' : 'último'} "${box.label}"`
            };
          } else {
            return {
              success: false,
              response: `❌ Não encontrei "${target}" na tela.`
            };
          }
        }
      }

    } catch (error: any) {
      console.error('❌ Erro em comando rápido:', error.message);
      return null;
    }

    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Responde perguntas sobre o que está na tela
   */
  private async answerScreenQuestion(question: string, screenContext: any): Promise<string> {
    const prompt = `O usuário perguntou: "${question}"

TELA ATUAL:
- App: ${screenContext.appName || 'desconhecido'}
- Descrição: ${screenContext.description}
- Elementos: ${screenContext.elements?.length || 0} elementos identificados

${screenContext.elements?.length > 0 ? `
ELEMENTOS NA TELA:
${screenContext.elements.slice(0, 10).map((e: any) => `- ${e.type}: ${e.label}`).join('\n')}
` : ''}

Responda a pergunta do usuário de forma natural e útil.
Se ele perguntou sobre vídeos, liste os que você vê.
Se perguntou sobre texto, resuma o que está visível.
Seja direto e conversacional.`;

    try {
      const result = await geminiMaestro.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return 'Não consegui analisar a tela agora.';
    }
  }

  /**
   * Processa mensagem da live
   */
  async processLiveMessage(message: LiveMessage): Promise<{
    isCommand: boolean;
    response: string;
    executed?: boolean;
  }> {
    // Adiciona ao histórico
    this.commandHistory.push(message);
    if (this.commandHistory.length > 50) {
      this.commandHistory.shift();
    }

    // Só processa se for do usuário
    if (!message.isUser) {
      return {
        isCommand: false,
        response: ''
      };
    }

    // Detecta se é comando
    const detection = await this.detectCommand(message);

    if (!detection.isCommand) {
      return {
        isCommand: false,
        response: ''
      };
    }

    // Processa comando
    const result = await this.processCommand(detection);

    return {
      isCommand: true,
      response: result.response,
      executed: result.success
    };
  }

  /**
   * Verifica se está executando algo
   */
  get executing(): boolean {
    return this.isExecuting;
  }

  /**
   * Obtém histórico de comandos
   */
  getHistory(): LiveMessage[] {
    return this.commandHistory;
  }
}

export const liveCommandService = new LiveCommandService();
