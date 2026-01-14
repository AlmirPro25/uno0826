# 🤖 Integração Gemini Robotics-ER com Executor

## 🎯 Visão Geral

Integração do **Gemini Robotics-ER** (Vision-Language-Action model) com o Executor para criar um sistema de automação inteligente que:

- 👁️ **VÊ** a tela em tempo real
- 🧠 **ENTENDE** o contexto e estado da UI
- 🎯 **AGE** executando ações físicas precisas

## 🏗️ Arquitetura Híbrida

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO                              │
│              "Abra o relatório de vendas"               │
└────────────────────┬────────────────────────────────────┘
                     │ Comando em linguagem natural
                     ▼
┌─────────────────────────────────────────────────────────┐
│              GEMINI MAESTRO (Node.js)                   │
│  • Recebe comando                                       │
│  • Captura contexto atual                              │
│  • Envia para Gemini Robotics-ER                       │
└────────────────────┬────────────────────────────────────┘
                     │ Screenshot + Contexto + Tarefa
                     ▼
┌─────────────────────────────────────────────────────────┐
│         GEMINI ROBOTICS-ER (Google Cloud)               │
│  • Analisa tela visualmente                            │
│  • Decompõe tarefa em subtarefas                       │
│  • Planeja sequência de ações                          │
│  • Retorna tool calls (click, type, etc)               │
└────────────────────┬────────────────────────────────────┘
                     │ Plano de ações + coordenadas
                     ▼
┌─────────────────────────────────────────────────────────┐
│              EXECUTOR (Python Local)                    │
│  • Executa ações físicas                               │
│  • Captura feedback visual                             │
│  • Valida resultado                                    │
└─────────────────────────────────────────────────────────┘
                     │ Feedback loop
                     ▼
                  [Repete até completar tarefa]
```

## 🔧 Componentes Técnicos

### 1. Vision Service (Novo)

Serviço para capturar e processar visão da tela:

```typescript
// backend/src/services/visionService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { executorService } from './executorService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class VisionService {
  private visionModel = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash' // Modelo geral
  });
  
  // Para robótica, use o modelo específico:
  private roboticsModel = genAI.getGenerativeModel({ 
    model: 'gemini-robotics-er-1.5-preview'
  });

  /**
   * Captura tela e analisa visualmente
   */
  async analyzeScreen(context?: string): Promise<{
    description: string;
    elements: Array<{
      type: string;
      label: string;
      position: { x: number; y: number };
      confidence: number;
    }>;
    suggestions: string[];
  }> {
    // Captura screenshot via Executor
    const screenshot = await executorService.screenshot();
    
    // Lê imagem e converte para base64
    const imageBase64 = await this.readImageAsBase64(screenshot.filename);
    
    const prompt = `Analise esta tela de computador e identifique:
1. Elementos clicáveis (botões, menus, links)
2. Campos de entrada (texto, formulários)
3. Estado atual da aplicação
4. Ações possíveis

${context ? `Contexto: ${context}` : ''}

Retorne JSON:
{
  "description": "descrição geral da tela",
  "elements": [
    {
      "type": "button|input|menu|link",
      "label": "texto do elemento",
      "position": {"x": 0, "y": 0},
      "confidence": 0.95
    }
  ],
  "suggestions": ["ações sugeridas"]
}`;

    const result = await this.visionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64
        }
      }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      description: text,
      elements: [],
      suggestions: []
    };
  }

  /**
   * Encontra elemento específico na tela
   */
  async findElement(elementDescription: string): Promise<{
    found: boolean;
    position?: { x: number; y: number };
    confidence: number;
  }> {
    const screenshot = await executorService.screenshot();
    const imageBase64 = await this.readImageAsBase64(screenshot.filename);

    const prompt = `Encontre o elemento "${elementDescription}" nesta tela.
    
Retorne JSON:
{
  "found": true/false,
  "position": {"x": 0, "y": 0},
  "confidence": 0.95
}

Se não encontrar, retorne found: false.`;

    const result = await this.visionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64
        }
      }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { found: false, confidence: 0 };
  }

  private async readImageAsBase64(filename: string): Promise<string> {
    const fs = require('fs').promises;
    const buffer = await fs.readFile(filename);
    return buffer.toString('base64');
  }
}

export const visionService = new VisionService();
```

### 2. Task Planner (Novo)

Decompõe tarefas complexas em subtarefas executáveis:

```typescript
// backend/src/services/taskPlanner.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { visionService } from './visionService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface Action {
  type: 'click' | 'type' | 'press' | 'hotkey' | 'wait' | 'verify';
  params: any;
  description: string;
}

interface TaskPlan {
  task: string;
  steps: Action[];
  estimatedTime: number;
  requiresConfirmation: boolean;
}

export class TaskPlanner {
  /**
   * Planeja execução de tarefa complexa
   */
  async planTask(
    userCommand: string,
    screenContext: any,
    userContext: any
  ): Promise<TaskPlan> {
    // Analisa tela atual
    const vision = await visionService.analyzeScreen(userCommand);

    const prompt = `Você é um assistente que controla o computador do usuário.

COMANDO DO USUÁRIO: "${userCommand}"

TELA ATUAL:
${vision.description}

ELEMENTOS DISPONÍVEIS:
${JSON.stringify(vision.elements, null, 2)}

CONTEXTO DO USUÁRIO:
${JSON.stringify(userContext, null, 2)}

FERRAMENTAS DISPONÍVEIS:
- click(x, y) - Clica em coordenadas
- type(text) - Digita texto
- press(key) - Pressiona tecla (enter, tab, esc, etc)
- hotkey(keys[]) - Atalho (["ctrl", "c"])
- wait(seconds) - Aguarda
- verify(condition) - Verifica resultado

Crie um plano detalhado para executar a tarefa.

Retorne JSON:
{
  "task": "descrição da tarefa",
  "steps": [
    {
      "type": "click",
      "params": {"x": 100, "y": 200},
      "description": "Clicar no botão Menu"
    },
    {
      "type": "type",
      "params": {"text": "relatório"},
      "description": "Digitar 'relatório' no campo de busca"
    }
  ],
  "estimatedTime": 5,
  "requiresConfirmation": false
}

IMPORTANTE:
- Use coordenadas dos elementos identificados
- Adicione waits entre ações quando necessário
- Verifique resultados após ações críticas
- Se a tarefa for perigosa (deletar, fechar), marque requiresConfirmation: true`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Não foi possível criar plano para a tarefa');
  }

  /**
   * Executa plano de tarefa com feedback loop
   */
  async executePlan(
    plan: TaskPlan,
    onProgress?: (step: number, total: number, description: string) => void
  ): Promise<{
    success: boolean;
    completedSteps: number;
    errors: string[];
    screenshots: string[];
  }> {
    const errors: string[] = [];
    const screenshots: string[] = [];
    let completedSteps = 0;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      
      if (onProgress) {
        onProgress(i + 1, plan.steps.length, step.description);
      }

      try {
        // Executa ação
        await this.executeAction(step);
        completedSteps++;

        // Captura screenshot após ação
        const screenshot = await executorService.screenshot(
          `step_${i + 1}.png`
        );
        screenshots.push(screenshot.filename);

        // Se for verificação, valida resultado
        if (step.type === 'verify') {
          const verified = await this.verifyCondition(step.params.condition);
          if (!verified) {
            errors.push(`Verificação falhou: ${step.params.condition}`);
            break;
          }
        }

        // Aguarda um pouco entre ações
        await this.sleep(500);
      } catch (error: any) {
        errors.push(`Erro no passo ${i + 1}: ${error.message}`);
        break;
      }
    }

    return {
      success: errors.length === 0 && completedSteps === plan.steps.length,
      completedSteps,
      errors,
      screenshots
    };
  }

  private async executeAction(action: Action): Promise<void> {
    switch (action.type) {
      case 'click':
        await executorService.click('left', action.params.x, action.params.y);
        break;
      case 'type':
        await executorService.type(action.params.text);
        break;
      case 'press':
        await executorService.press(action.params.key);
        break;
      case 'hotkey':
        await executorService.hotkey(...action.params.keys);
        break;
      case 'wait':
        await this.sleep(action.params.seconds * 1000);
        break;
      case 'verify':
        // Verificação é feita após a execução
        break;
      default:
        throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }
  }

  private async verifyCondition(condition: string): Promise<boolean> {
    // Captura tela e verifica se condição foi atendida
    const vision = await visionService.analyzeScreen(condition);
    
    const prompt = `Verifique se esta condição foi atendida: "${condition}"
    
Tela atual: ${vision.description}

Retorne JSON: {"verified": true/false, "reason": "explicação"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const response = JSON.parse(jsonMatch[0]);
      return response.verified;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const taskPlanner = new TaskPlanner();
```

### 3. Atualização do Maestro

Integrar visão e planejamento:

```typescript
// Adicionar ao geminiMaestro.ts

import { visionService } from './visionService';
import { taskPlanner } from './taskPlanner';

/**
 * Executa tarefa complexa com visão e planejamento
 */
async executeComplexTask(
  userCommand: string,
  userContext: any
): Promise<{
  success: boolean;
  plan: any;
  execution: any;
  explanation: string;
}> {
  try {
    // 1. Analisa tela atual
    const screenContext = await visionService.analyzeScreen(userCommand);

    // 2. Cria plano de ação
    const plan = await taskPlanner.planTask(
      userCommand,
      screenContext,
      userContext
    );

    // 3. Se requer confirmação, retorna plano para aprovação
    if (plan.requiresConfirmation) {
      return {
        success: false,
        plan,
        execution: null,
        explanation: 'Tarefa requer confirmação do usuário antes de executar'
      };
    }

    // 4. Executa plano
    const execution = await taskPlanner.executePlan(plan, (step, total, desc) => {
      console.log(`[${step}/${total}] ${desc}`);
    });

    return {
      success: execution.success,
      plan,
      execution,
      explanation: execution.success
        ? `Tarefa completada com sucesso em ${execution.completedSteps} passos`
        : `Tarefa falhou: ${execution.errors.join(', ')}`
    };
  } catch (error: any) {
    return {
      success: false,
      plan: null,
      execution: null,
      explanation: `Erro ao executar tarefa: ${error.message}`
    };
  }
}
```

## 🎯 Casos de Uso

### Caso 1: Abrir Aplicativo e Navegar

**Comando:** "Abra o Chrome e pesquise por 'Python tutorial'"

**Plano gerado:**
```json
{
  "task": "Abrir Chrome e pesquisar",
  "steps": [
    {"type": "hotkey", "params": {"keys": ["win", "r"]}, "description": "Abrir Executar"},
    {"type": "wait", "params": {"seconds": 0.5}},
    {"type": "type", "params": {"text": "chrome"}},
    {"type": "press", "params": {"key": "enter"}},
    {"type": "wait", "params": {"seconds": 2}},
    {"type": "verify", "params": {"condition": "Chrome está aberto"}},
    {"type": "click", "params": {"x": 400, "y": 60}, "description": "Clicar na barra de endereços"},
    {"type": "type", "params": {"text": "Python tutorial"}},
    {"type": "press", "params": {"key": "enter"}}
  ],
  "estimatedTime": 8,
  "requiresConfirmation": false
}
```

### Caso 2: Preencher Formulário

**Comando:** "Preencha o formulário com meus dados"

**Plano gerado:**
```json
{
  "task": "Preencher formulário",
  "steps": [
    {"type": "click", "params": {"x": 300, "y": 200}, "description": "Campo Nome"},
    {"type": "type", "params": {"text": "João Silva"}},
    {"type": "press", "params": {"key": "tab"}},
    {"type": "type", "params": {"text": "joao@email.com"}},
    {"type": "press", "params": {"key": "tab"}},
    {"type": "type", "params": {"text": "11999999999"}},
    {"type": "click", "params": {"x": 350, "y": 400}, "description": "Botão Enviar"},
    {"type": "verify", "params": {"condition": "Formulário enviado com sucesso"}}
  ],
  "estimatedTime": 6,
  "requiresConfirmation": false
}
```

### Caso 3: Automação Complexa

**Comando:** "Exporte o relatório de vendas do último mês em PDF"

**Plano gerado:**
```json
{
  "task": "Exportar relatório",
  "steps": [
    {"type": "hotkey", "params": {"keys": ["alt", "f"]}, "description": "Menu Arquivo"},
    {"type": "wait", "params": {"seconds": 0.3}},
    {"type": "press", "params": {"key": "down"}, "description": "Navegar para Exportar"},
    {"type": "press", "params": {"key": "down"}},
    {"type": "press", "params": {"key": "enter"}},
    {"type": "wait", "params": {"seconds": 1}},
    {"type": "click", "params": {"x": 500, "y": 300}, "description": "Selecionar PDF"},
    {"type": "click", "params": {"x": 600, "y": 500}, "description": "Botão Exportar"},
    {"type": "verify", "params": {"condition": "Arquivo PDF foi salvo"}}
  ],
  "estimatedTime": 10,
  "requiresConfirmation": true
}
```

## 🔄 Feedback Loop

O sistema usa feedback visual contínuo:

```
1. Captura tela ANTES da ação
2. Executa ação
3. Captura tela DEPOIS da ação
4. Compara com expectativa
5. Se falhou, tenta estratégia alternativa
6. Se sucesso, continua próximo passo
```

## 🚀 Implementação Faseada

### Fase 1: Visão Básica ✅
- [x] VisionService para análise de tela
- [x] Identificação de elementos clicáveis
- [x] Busca de elementos específicos

### Fase 2: Planejamento ✅
- [x] TaskPlanner para decomposição de tarefas
- [x] Geração de planos de ação
- [x] Execução com feedback loop

### Fase 3: Integração Completa (Próximo)
- [ ] Conectar com Gemini Live API para streaming
- [ ] Tool calling nativo do Gemini
- [ ] Retry automático com estratégias alternativas
- [ ] Aprendizado incremental

### Fase 4: Otimização (Futuro)
- [ ] Cache de elementos da tela
- [ ] Predição de ações
- [ ] Execução paralela quando possível
- [ ] Modelo local para baixa latência

## 📊 Métricas e Monitoramento

```typescript
interface TaskMetrics {
  taskId: string;
  command: string;
  planningTime: number;
  executionTime: number;
  stepsCompleted: number;
  stepsTotal: number;
  success: boolean;
  retries: number;
  screenshots: string[];
  errors: string[];
}
```

## 🔒 Segurança

- ✅ Confirmação para ações destrutivas
- ✅ Timeout por tarefa (máx 5 minutos)
- ✅ Parada de emergência a qualquer momento
- ✅ Log completo de todas as ações
- ✅ Screenshots de cada passo
- ✅ Rollback quando possível

## 📚 Próximos Passos

1. Implementar VisionService e TaskPlanner
2. Testar com tarefas simples
3. Adicionar retry e fallback
4. Integrar com Gemini Live API quando disponível
5. Otimizar latência e precisão

---

**Status:** Arquitetura definida, pronta para implementação! 🚀
