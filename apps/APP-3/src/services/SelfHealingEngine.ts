// src/services/SelfHealingEngine.ts
// 🚑 MOTOR DE AUTOCORREÇÃO: Detecta erros e aciona o Neural Core para correção

import { backendTerminalService } from './BackendTerminalService';
import { generateAiResponse } from './GeminiService';

export interface ErrorContext {
  commandId: string;
  command: string;
  error: string;
  exitCode?: number;
  timestamp: Date;
  projectFiles?: Array<{ path: string; content: string }>;
}

export interface HealingAttempt {
  id: string;
  errorContext: ErrorContext;
  analysis: string;
  solution: string;
  newCommand?: string;
  newFiles?: Array<{ path: string; content: string }>;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
}

class SelfHealingEngine {
  private healingHistory: HealingAttempt[] = [];
  private maxRetries: number = 3;
  private isHealing: boolean = false;

  constructor() {
    this.setupErrorListener();
  }

  // Escuta eventos de erro do terminal
  private setupErrorListener() {
    window.addEventListener('terminal_error', ((event: CustomEvent) => {
      const { error, commandId } = event.detail;
      console.log('🚑 Self-Healing: Erro detectado', { error, commandId });
      
      // Não inicia healing se já estiver em processo
      if (!this.isHealing) {
        this.initiateHealing({ 
          commandId, 
          command: '', 
          error, 
          timestamp: new Date() 
        });
      }
    }) as EventListener);
  }

  // Inicia o processo de autocorreção
  async initiateHealing(errorContext: ErrorContext): Promise<HealingAttempt | null> {
    // Verifica se já tentou muitas vezes
    const recentAttempts = this.healingHistory.filter(
      h => Date.now() - h.timestamp.getTime() < 60000 // Últimos 60 segundos
    );

    if (recentAttempts.length >= this.maxRetries) {
      console.error('🚑 Self-Healing: Limite de tentativas atingido');
      this.notifyUser('Limite de tentativas de correção atingido. Intervenção manual necessária.');
      return null;
    }

    this.isHealing = true;

    try {
      // 1. ANÁLISE: Pede ao Neural Core para analisar o erro
      const analysis = await this.analyzeError(errorContext);

      // 2. SOLUÇÃO: Gera correção
      const solution = await this.generateSolution(errorContext, analysis);

      // 3. APLICAÇÃO: Aplica a correção
      const healingAttempt: HealingAttempt = {
        id: crypto.randomUUID(),
        errorContext,
        analysis,
        solution: solution.explanation,
        newCommand: solution.command,
        newFiles: solution.files,
        status: 'pending',
        timestamp: new Date()
      };

      this.healingHistory.push(healingAttempt);

      // 4. EXECUÇÃO: Tenta executar a correção
      const success = await this.applySolution(healingAttempt);

      healingAttempt.status = success ? 'success' : 'failed';

      if (success) {
        console.log('✅ Self-Healing: Correção aplicada com sucesso');
        this.notifyUser('✅ Erro corrigido automaticamente!');
      } else {
        console.error('❌ Self-Healing: Correção falhou');
        this.notifyUser('⚠️ Tentativa de correção falhou. Tentando novamente...');
      }

      return healingAttempt;
    } catch (error) {
      console.error('🚑 Self-Healing: Erro durante healing', error);
      return null;
    } finally {
      this.isHealing = false;
    }
  }

  // Analisa o erro usando o Neural Core
  private async analyzeError(errorContext: ErrorContext): Promise<string> {
    const analysisPrompt = `
🚑 ANÁLISE DE ERRO PARA AUTOCORREÇÃO

**Comando Executado:**
\`\`\`bash
${errorContext.command}
\`\`\`

**Erro Detectado:**
\`\`\`
${errorContext.error}
\`\`\`

**Exit Code:** ${errorContext.exitCode || 'N/A'}

**Sua Tarefa:**
Analise este erro e identifique:
1. A causa raiz do problema
2. O que deu errado
3. Qual é a solução mais provável

Seja conciso e direto. Foque na solução prática.
`;

    try {
      const response = await generateAiResponse(analysisPrompt, 'generate_code_no_plan');
      return response.content;
    } catch (error) {
      console.error('Erro ao analisar erro:', error);
      return 'Análise automática falhou. Tentando solução genérica.';
    }
  }

  // Gera solução baseada na análise
  private async generateSolution(
    errorContext: ErrorContext,
    analysis: string
  ): Promise<{
    explanation: string;
    command?: string;
    files?: Array<{ path: string; content: string }>;
  }> {
    const solutionPrompt = `
🔧 GERAÇÃO DE SOLUÇÃO PARA AUTOCORREÇÃO

**Análise do Erro:**
${analysis}

**Erro Original:**
\`\`\`
${errorContext.error}
\`\`\`

**Comando que Falhou:**
\`\`\`bash
${errorContext.command}
\`\`\`

**Sua Tarefa:**
Gere uma solução prática em formato JSON:

\`\`\`json
{
  "explanation": "Explicação breve da solução",
  "command": "novo comando corrigido (se aplicável)",
  "files": [
    {
      "path": "caminho/do/arquivo",
      "content": "conteúdo corrigido do arquivo"
    }
  ]
}
\`\`\`

**Exemplos de Soluções:**

1. **Porta Ocupada:**
\`\`\`json
{
  "explanation": "Porta 3000 ocupada. Mudando para 3001.",
  "files": [
    {
      "path": "docker-compose.yml",
      "content": "version: '3'\\nservices:\\n  app:\\n    ports:\\n      - '3001:3000'"
    }
  ],
  "command": "docker-compose up -d"
}
\`\`\`

2. **Dependência Faltando:**
\`\`\`json
{
  "explanation": "Módulo 'lodash' não encontrado. Instalando.",
  "command": "npm install lodash"
}
\`\`\`

3. **Erro de Sintaxe:**
\`\`\`json
{
  "explanation": "Erro de sintaxe no arquivo. Corrigindo.",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "// código corrigido aqui"
    }
  ]
}
\`\`\`

Gere APENAS o JSON, sem explicações adicionais.
`;

    try {
      const response = await generateAiResponse(solutionPrompt, 'generate_code_no_plan');
      
      // Tenta extrair JSON da resposta
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response.content;
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Erro ao gerar solução:', error);
      return {
        explanation: 'Solução automática não disponível. Intervenção manual necessária.'
      };
    }
  }

  // Aplica a solução gerada
  private async applySolution(healingAttempt: HealingAttempt): Promise<boolean> {
    try {
      const isHealthy = await backendTerminalService.checkHealth();
      
      if (!isHealthy) {
        console.error('Backend terminal não disponível. Não é possível aplicar solução.');
        return false;
      }

      // 1. Se há arquivos para escrever, escreve primeiro
      if (healingAttempt.newFiles && healingAttempt.newFiles.length > 0) {
        console.log('📝 Escrevendo arquivos corrigidos...');
        const writeResult = await backendTerminalService.writeFilesToDisk(healingAttempt.newFiles);
        
        if (!writeResult.success) {
          console.error('Erro ao escrever arquivos:', writeResult.results);
          return false;
        }
      }

      // 2. Se há comando para executar, executa
      if (healingAttempt.newCommand) {
        console.log('🚀 Executando comando corrigido:', healingAttempt.newCommand);
        
        const result = await backendTerminalService.executeCommand(
          healingAttempt.newCommand,
          './project'
        );

        console.log('[Healing Output]', result.stdout);
        
        if (result.stderr) {
          console.error('[Healing Error]', result.stderr);
        }

        console.log('[Healing Exit]', result.exitCode);
        
        return result.success;
      }

      // Se só escreveu arquivos, considera sucesso
      return true;
    } catch (error) {
      console.error('Erro ao aplicar solução:', error);
      return false;
    }
  }

  // Notifica o usuário sobre o status do healing
  private notifyUser(message: string) {
    // Dispara evento customizado para o frontend exibir notificação
    window.dispatchEvent(new CustomEvent('healing_notification', {
      detail: { message, timestamp: new Date() }
    }));

    // Também loga no console
    console.log('🚑 Self-Healing:', message);
  }

  // Retorna histórico de tentativas de healing
  getHealingHistory(): HealingAttempt[] {
    return [...this.healingHistory];
  }

  // Limpa histórico
  clearHistory() {
    this.healingHistory = [];
  }

  // Retorna estatísticas
  getStats() {
    const total = this.healingHistory.length;
    const success = this.healingHistory.filter(h => h.status === 'success').length;
    const failed = this.healingHistory.filter(h => h.status === 'failed').length;
    const pending = this.healingHistory.filter(h => h.status === 'pending').length;

    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? (success / total) * 100 : 0
    };
  }
}

export const selfHealingEngine = new SelfHealingEngine();
