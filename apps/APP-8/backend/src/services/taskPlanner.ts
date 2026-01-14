import { GoogleGenerativeAI } from '@google/generative-ai';
import { visionService } from './visionService';
import { executorService } from './executorService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface Action {
  type: 'click' | 'type' | 'press' | 'hotkey' | 'wait' | 'verify' | 'scroll' | 'drag';
  params: any;
  description: string;
}

interface TaskPlan {
  task: string;
  steps: Action[];
  estimatedTime: number;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  errors: string[];
  screenshots: string[];
  duration: number;
}

export class TaskPlanner {
  /**
   * Planeja execução de tarefa complexa
   */
  async planTask(
    userCommand: string,
    screenContext?: any,
    userContext?: any
  ): Promise<TaskPlan> {
    try {
      // Analisa tela atual se não foi fornecido contexto
      const vision = screenContext || await visionService.analyzeScreen(userCommand);

      const prompt = `Você é um assistente especializado em controlar computadores.

COMANDO DO USUÁRIO: "${userCommand}"

TELA ATUAL:
- Descrição: ${vision.description}
- Aplicativo: ${vision.appName || 'desconhecido'}
- Janela: ${vision.windowTitle || 'desconhecido'}

ELEMENTOS DISPONÍVEIS NA TELA:
${JSON.stringify(vision.elements, null, 2)}

${userContext ? `CONTEXTO DO USUÁRIO:\n${JSON.stringify(userContext, null, 2)}\n` : ''}

FERRAMENTAS DISPONÍVEIS:
- click(x, y) - Clica em coordenadas específicas
- type(text) - Digita texto no campo focado
- press(key) - Pressiona tecla (enter, tab, esc, backspace, delete, etc)
- hotkey(keys[]) - Atalho de teclado (["ctrl", "c"], ["alt", "tab"], etc)
- wait(seconds) - Aguarda tempo em segundos
- scroll(amount) - Rola página (positivo=baixo, negativo=cima)
- drag(x, y) - Arrasta mouse para coordenadas
- verify(condition) - Verifica se condição foi atendida

CRIE UM PLANO DETALHADO para executar a tarefa.

Retorne APENAS um JSON válido (sem markdown):
{
  "task": "descrição clara da tarefa",
  "steps": [
    {
      "type": "click",
      "params": {"x": 100, "y": 200},
      "description": "Clicar no botão Menu"
    },
    {
      "type": "wait",
      "params": {"seconds": 0.5},
      "description": "Aguardar menu abrir"
    },
    {
      "type": "type",
      "params": {"text": "relatório"},
      "description": "Digitar 'relatório' no campo de busca"
    }
  ],
  "estimatedTime": 5,
  "requiresConfirmation": false,
  "riskLevel": "low"
}

REGRAS IMPORTANTES:
1. Use coordenadas dos elementos identificados na tela
2. Adicione wait entre ações quando necessário (ex: após clicar, aguardar 0.5s)
3. Adicione verify após ações críticas para validar resultado
4. Se a tarefa envolver deletar, fechar, ou modificar dados: requiresConfirmation=true e riskLevel="high"
5. Seja específico nas descrições de cada passo
6. Considere que o usuário pode estar em qualquer aplicativo
7. Se não conseguir executar a tarefa, explique o motivo no campo "task"`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        
        // Valida o plano
        if (!plan.steps || plan.steps.length === 0) {
          throw new Error('Plano não contém passos executáveis');
        }

        return plan;
      }

      throw new Error('Não foi possível gerar plano válido');
    } catch (error: any) {
      console.error('Erro ao planejar tarefa:', error);
      throw new Error(`Erro ao planejar tarefa: ${error.message}`);
    }
  }

  /**
   * Executa plano de tarefa com feedback loop
   */
  async executePlan(
    plan: TaskPlan,
    onProgress?: (step: number, total: number, description: string) => void
  ): Promise<ExecutionResult> {
    const errors: string[] = [];
    const screenshots: string[] = [];
    let completedSteps = 0;
    const startTime = Date.now();

    console.log(`🎯 Iniciando execução: ${plan.task}`);
    console.log(`📋 Total de passos: ${plan.steps.length}`);

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      
      console.log(`\n[${i + 1}/${plan.steps.length}] ${step.description}`);
      
      if (onProgress) {
        onProgress(i + 1, plan.steps.length, step.description);
      }

      try {
        // Captura screenshot ANTES da ação
        const beforeScreenshot = await executorService.screenshot(
          `before_step_${i + 1}.png`
        );
        screenshots.push(beforeScreenshot.filename);

        // Executa ação
        await this.executeAction(step);
        completedSteps++;

        // Aguarda um pouco para UI atualizar
        await this.sleep(300);

        // Captura screenshot DEPOIS da ação
        const afterScreenshot = await executorService.screenshot(
          `after_step_${i + 1}.png`
        );
        screenshots.push(afterScreenshot.filename);

        // Se for verificação, valida resultado
        if (step.type === 'verify') {
          const verification = await visionService.verifyCondition(step.params.condition);
          
          if (!verification.verified) {
            errors.push(`❌ Verificação falhou no passo ${i + 1}: ${verification.reason}`);
            console.error(`❌ Verificação falhou: ${verification.reason}`);
            break;
          } else {
            console.log(`✅ Verificação passou: ${verification.reason}`);
          }
        }

        console.log(`✅ Passo ${i + 1} concluído`);

        // Aguarda entre ações
        await this.sleep(500);
      } catch (error: any) {
        const errorMsg = `Erro no passo ${i + 1} (${step.description}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        break;
      }
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0 && completedSteps === plan.steps.length;

    console.log(`\n${'='.repeat(50)}`);
    console.log(success ? '✅ TAREFA CONCLUÍDA COM SUCESSO!' : '❌ TAREFA FALHOU');
    console.log(`Passos completados: ${completedSteps}/${plan.steps.length}`);
    console.log(`Duração: ${(duration / 1000).toFixed(1)}s`);
    if (errors.length > 0) {
      console.log(`Erros: ${errors.length}`);
    }
    console.log('='.repeat(50));

    return {
      success,
      completedSteps,
      totalSteps: plan.steps.length,
      errors,
      screenshots,
      duration
    };
  }

  /**
   * Executa ação individual
   */
  private async executeAction(action: Action): Promise<void> {
    console.log(`  → Executando: ${action.type}(${JSON.stringify(action.params)})`);

    switch (action.type) {
      case 'click':
        await executorService.click('left', action.params.x, action.params.y);
        break;

      case 'type':
        await executorService.type(action.params.text);
        break;

      case 'press':
        await executorService.press(action.params.key, action.params.presses || 1);
        break;

      case 'hotkey':
        await executorService.hotkey(...action.params.keys);
        break;

      case 'wait':
        await this.sleep(action.params.seconds * 1000);
        break;

      case 'scroll':
        await executorService.scroll(action.params.amount);
        break;

      case 'drag':
        await executorService.drag(action.params.x, action.params.y);
        break;

      case 'verify':
        // Verificação é feita após a execução no loop principal
        break;

      default:
        throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }
  }

  /**
   * Tenta recuperar de erro com estratégia alternativa
   */
  async retryWithAlternativeStrategy(
    originalPlan: TaskPlan,
    failedStep: number,
    error: string
  ): Promise<TaskPlan> {
    const vision = await visionService.analyzeScreen();

    const prompt = `A execução de uma tarefa falhou. Crie uma estratégia alternativa.

TAREFA ORIGINAL: ${originalPlan.task}

PASSO QUE FALHOU: ${failedStep + 1}/${originalPlan.steps.length}
ERRO: ${error}

TELA ATUAL:
${vision.description}

ELEMENTOS DISPONÍVEIS:
${JSON.stringify(vision.elements, null, 2)}

Crie um NOVO PLANO alternativo para completar a tarefa.

Retorne APENAS um JSON válido com o novo plano.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Não foi possível criar estratégia alternativa');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const taskPlanner = new TaskPlanner();
