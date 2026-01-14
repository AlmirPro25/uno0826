/**
 * 🤖 EXEMPLO PRÁTICO - GOOGLE ADK
 * 
 * Este arquivo demonstra como criar um agente completo usando
 * os princípios do Google ADK Supreme Master Manifest.
 * 
 * Exemplo: Agente de Pesquisa e Análise
 */

import { GOOGLE_ADK_SUPREME_MANIFEST, shouldActivateADKManifest } from '../services/manifestos/GOOGLE_ADK_SUPREME_MANIFEST';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (input: any) => Promise<any>;
}

interface Memory {
  shortTerm: Map<string, any>;
  longTerm: Map<string, any>;
  store: (key: string, value: any, type: 'short' | 'long') => void;
  recall: (query: string) => any[];
}

interface AgentConfig {
  name: string;
  description: string;
  tools: Tool[];
  memory: Memory;
  model: string;
}

interface AgentInput {
  text: string;
  sessionId: string;
  userId: string;
}

interface AgentOutput {
  response: string;
  toolsUsed: string[];
  reasoning: string;
  metadata: Record<string, any>;
}

// ============================================
// IMPLEMENTAÇÃO DE TOOLS
// ============================================

/**
 * Tool de Busca Web
 */
const searchTool: Tool = {
  name: 'web_search',
  description: 'Busca informações na web sobre um tópico',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Termo de busca' },
      maxResults: { type: 'number', default: 5 }
    },
    required: ['query']
  },
  execute: async (input: { query: string; maxResults?: number }) => {
    console.log(`[SearchTool] Buscando: ${input.query}`);
    
    // Simulação de busca
    return {
      results: [
        { title: `Resultado 1 para ${input.query}`, url: 'https://example.com/1' },
        { title: `Resultado 2 para ${input.query}`, url: 'https://example.com/2' },
      ],
      totalFound: 2,
      searchTimeMs: 150
    };
  }
};


/**
 * Tool de Análise de Dados
 */
const analyzeTool: Tool = {
  name: 'analyze_data',
  description: 'Analisa dados e extrai insights',
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'array', description: 'Dados para análise' },
      analysisType: { type: 'string', enum: ['summary', 'trends', 'comparison'] }
    },
    required: ['data']
  },
  execute: async (input: { data: any[]; analysisType?: string }) => {
    console.log(`[AnalyzeTool] Analisando ${input.data.length} itens`);
    
    return {
      summary: `Análise de ${input.data.length} itens`,
      insights: ['Insight 1', 'Insight 2'],
      confidence: 0.85
    };
  }
};

/**
 * Tool de Geração de Relatório
 */
const reportTool: Tool = {
  name: 'generate_report',
  description: 'Gera relatório estruturado a partir de análise',
  inputSchema: {
    type: 'object',
    properties: {
      analysis: { type: 'object', description: 'Resultado da análise' },
      format: { type: 'string', enum: ['summary', 'detailed', 'executive'] }
    },
    required: ['analysis']
  },
  execute: async (input: { analysis: any; format?: string }) => {
    console.log(`[ReportTool] Gerando relatório ${input.format || 'summary'}`);
    
    return {
      title: 'Relatório de Análise',
      sections: [
        { name: 'Resumo Executivo', content: input.analysis.summary },
        { name: 'Insights', content: input.analysis.insights }
      ],
      generatedAt: new Date().toISOString()
    };
  }
};

// ============================================
// IMPLEMENTAÇÃO DE MEMÓRIA
// ============================================

function createMemory(): Memory {
  const shortTerm = new Map<string, any>();
  const longTerm = new Map<string, any>();
  
  return {
    shortTerm,
    longTerm,
    
    store(key: string, value: any, type: 'short' | 'long') {
      const target = type === 'short' ? shortTerm : longTerm;
      target.set(key, {
        value,
        timestamp: Date.now(),
        accessCount: 0
      });
      console.log(`[Memory] Armazenado em ${type}Term: ${key}`);
    },
    
    recall(query: string): any[] {
      const results: any[] = [];
      
      // Busca em ambas as memórias
      for (const [key, data] of shortTerm) {
        if (key.toLowerCase().includes(query.toLowerCase())) {
          data.accessCount++;
          results.push({ source: 'shortTerm', key, ...data });
        }
      }
      
      for (const [key, data] of longTerm) {
        if (key.toLowerCase().includes(query.toLowerCase())) {
          data.accessCount++;
          results.push({ source: 'longTerm', key, ...data });
        }
      }
      
      console.log(`[Memory] Recall para "${query}": ${results.length} resultados`);
      return results;
    }
  };
}

// ============================================
// CLASSE DO AGENTE
// ============================================

class ResearchAgent {
  private config: AgentConfig;
  private toolRegistry: Map<string, Tool>;
  private metrics: {
    requestsTotal: number;
    toolCallsTotal: number;
    errorsTotal: number;
    totalLatencyMs: number;
  };
  
  constructor(config: AgentConfig) {
    this.config = config;
    this.toolRegistry = new Map();
    this.metrics = {
      requestsTotal: 0,
      toolCallsTotal: 0,
      errorsTotal: 0,
      totalLatencyMs: 0
    };
    
    // Registrar tools
    for (const tool of config.tools) {
      this.toolRegistry.set(tool.name, tool);
    }
    
    console.log(`[Agent] ${config.name} inicializado com ${config.tools.length} tools`);
  }
  
  /**
   * Processa input do usuário
   */
  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    this.metrics.requestsTotal++;
    
    console.log(`\n[Agent] Processando: "${input.text}"`);
    
    try {
      // 1. Recuperar memórias relevantes
      const memories = this.config.memory.recall(input.text);
      console.log(`[Agent] Memórias relevantes: ${memories.length}`);
      
      // 2. Decidir ações (simulação de raciocínio)
      const plan = this.planActions(input.text);
      console.log(`[Agent] Plano: ${plan.join(' → ')}`);
      
      // 3. Executar tools conforme plano
      const toolResults: any[] = [];
      for (const toolName of plan) {
        const result = await this.executeTool(toolName, input);
        toolResults.push(result);
      }
      
      // 4. Gerar resposta
      const response = this.generateResponse(input, toolResults);
      
      // 5. Armazenar na memória
      this.config.memory.store(
        `query_${Date.now()}`,
        { input: input.text, response: response.response },
        'short'
      );
      
      // 6. Métricas
      const latency = Date.now() - startTime;
      this.metrics.totalLatencyMs += latency;
      
      console.log(`[Agent] Resposta gerada em ${latency}ms`);
      
      return response;
      
    } catch (error) {
      this.metrics.errorsTotal++;
      console.error(`[Agent] Erro:`, error);
      throw error;
    }
  }
  
  /**
   * Planeja quais tools usar
   */
  private planActions(query: string): string[] {
    // Lógica simplificada de planejamento
    const plan: string[] = [];
    
    if (query.includes('pesquis') || query.includes('busc')) {
      plan.push('web_search');
    }
    
    if (query.includes('analis') || query.includes('dados')) {
      plan.push('analyze_data');
    }
    
    if (query.includes('relatório') || query.includes('report')) {
      plan.push('generate_report');
    }
    
    // Se nenhuma tool específica, usa busca por padrão
    if (plan.length === 0) {
      plan.push('web_search');
    }
    
    return plan;
  }
  
  /**
   * Executa uma tool
   */
  private async executeTool(toolName: string, input: AgentInput): Promise<any> {
    const tool = this.toolRegistry.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool não encontrada: ${toolName}`);
    }
    
    this.metrics.toolCallsTotal++;
    console.log(`[Agent] Executando tool: ${toolName}`);
    
    // Preparar input para a tool
    const toolInput = this.prepareToolInput(tool, input);
    
    // Executar
    const result = await tool.execute(toolInput);
    
    return { tool: toolName, result };
  }
  
  /**
   * Prepara input para uma tool
   */
  private prepareToolInput(tool: Tool, input: AgentInput): any {
    switch (tool.name) {
      case 'web_search':
        return { query: input.text, maxResults: 5 };
      case 'analyze_data':
        return { data: [input.text], analysisType: 'summary' };
      case 'generate_report':
        return { analysis: { summary: input.text, insights: [] }, format: 'summary' };
      default:
        return { input: input.text };
    }
  }
  
  /**
   * Gera resposta final
   */
  private generateResponse(input: AgentInput, toolResults: any[]): AgentOutput {
    const toolsUsed = toolResults.map(r => r.tool);
    
    // Construir resposta baseada nos resultados
    let responseText = `Baseado na sua pergunta "${input.text}", `;
    
    for (const { tool, result } of toolResults) {
      if (tool === 'web_search') {
        responseText += `encontrei ${result.results.length} resultados relevantes. `;
      } else if (tool === 'analyze_data') {
        responseText += `a análise revelou: ${result.summary}. `;
      } else if (tool === 'generate_report') {
        responseText += `o relatório "${result.title}" foi gerado. `;
      }
    }
    
    return {
      response: responseText,
      toolsUsed,
      reasoning: `Plano executado: ${toolsUsed.join(' → ')}`,
      metadata: {
        sessionId: input.sessionId,
        timestamp: new Date().toISOString(),
        toolResults
      }
    };
  }
  
  /**
   * Retorna métricas do agente
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatencyMs: this.metrics.requestsTotal > 0 
        ? this.metrics.totalLatencyMs / this.metrics.requestsTotal 
        : 0
    };
  }
}


// ============================================
// EXEMPLO DE USO
// ============================================

async function demonstrateADKAgent() {
  console.log('='.repeat(60));
  console.log('🤖 DEMONSTRAÇÃO DO GOOGLE ADK SUPREME MASTER');
  console.log('='.repeat(60));
  
  // 1. Verificar ativação do manifesto
  const testQueries = [
    'Como criar um agente com ADK?',
    'Preciso de um multi-agent workflow',
    'Quero implementar tool calling',
    'Como funciona a memória de agentes?'
  ];
  
  console.log('\n📋 Verificando ativação do manifesto:');
  for (const query of testQueries) {
    const shouldActivate = shouldActivateADKManifest(query);
    console.log(`  "${query}" → ${shouldActivate ? '✅ Ativa' : '❌ Não ativa'}`);
  }
  
  // 2. Criar agente
  console.log('\n🔧 Criando agente de pesquisa...');
  
  const agent = new ResearchAgent({
    name: 'ResearchAssistant',
    description: 'Agente especializado em pesquisa e análise',
    tools: [searchTool, analyzeTool, reportTool],
    memory: createMemory(),
    model: 'gemini-1.5-pro'
  });
  
  // 3. Processar queries
  const queries = [
    'Pesquise sobre inteligência artificial',
    'Analise os dados de vendas',
    'Gere um relatório executivo'
  ];
  
  console.log('\n📝 Processando queries:');
  
  for (const query of queries) {
    console.log('\n' + '-'.repeat(50));
    
    const result = await agent.process({
      text: query,
      sessionId: 'session-001',
      userId: 'user-001'
    });
    
    console.log(`\n📤 Resposta: ${result.response}`);
    console.log(`🔧 Tools usadas: ${result.toolsUsed.join(', ')}`);
  }
  
  // 4. Mostrar métricas
  console.log('\n' + '='.repeat(60));
  console.log('📊 MÉTRICAS DO AGENTE:');
  console.log('='.repeat(60));
  
  const metrics = agent.getMetrics();
  console.log(`  Total de requests: ${metrics.requestsTotal}`);
  console.log(`  Total de tool calls: ${metrics.toolCallsTotal}`);
  console.log(`  Total de erros: ${metrics.errorsTotal}`);
  console.log(`  Latência média: ${metrics.avgLatencyMs.toFixed(2)}ms`);
  
  // 5. Mostrar informações do manifesto
  console.log('\n' + '='.repeat(60));
  console.log('📚 INFORMAÇÕES DO MANIFESTO:');
  console.log('='.repeat(60));
  
  const manifest = GOOGLE_ADK_SUPREME_MANIFEST;
  console.log(`  Nome: ${manifest.metadata.name}`);
  console.log(`  Versão: ${manifest.metadata.version}`);
  console.log(`  Categoria: ${manifest.metadata.category}`);
  console.log(`  SDKs disponíveis: ${Object.keys(manifest.sdks).join(', ')}`);
  console.log(`  Padrões multi-agent: ${Object.keys(manifest.multiAgentPatterns).join(', ')}`);
  
  console.log('\n✅ Demonstração concluída!');
}

// ============================================
// EXEMPLO DE WORKFLOW MULTI-AGENT
// ============================================

class MultiAgentWorkflow {
  private agents: Map<string, ResearchAgent>;
  
  constructor() {
    this.agents = new Map();
    
    // Criar agentes especializados
    this.agents.set('searcher', new ResearchAgent({
      name: 'SearchAgent',
      description: 'Especialista em busca',
      tools: [searchTool],
      memory: createMemory(),
      model: 'gemini-1.5-pro'
    }));
    
    this.agents.set('analyzer', new ResearchAgent({
      name: 'AnalysisAgent',
      description: 'Especialista em análise',
      tools: [analyzeTool],
      memory: createMemory(),
      model: 'gemini-1.5-pro'
    }));
    
    this.agents.set('reporter', new ResearchAgent({
      name: 'ReportAgent',
      description: 'Especialista em relatórios',
      tools: [reportTool],
      memory: createMemory(),
      model: 'gemini-1.5-pro'
    }));
  }
  
  /**
   * Executa workflow sequencial
   */
  async executeSequential(query: string): Promise<any> {
    console.log('\n🔄 Executando workflow sequencial...');
    
    const sessionId = `workflow-${Date.now()}`;
    const results: any[] = [];
    
    // 1. Busca
    const searchResult = await this.agents.get('searcher')!.process({
      text: `Pesquise: ${query}`,
      sessionId,
      userId: 'workflow'
    });
    results.push({ stage: 'search', result: searchResult });
    
    // 2. Análise
    const analysisResult = await this.agents.get('analyzer')!.process({
      text: `Analise os dados sobre: ${query}`,
      sessionId,
      userId: 'workflow'
    });
    results.push({ stage: 'analysis', result: analysisResult });
    
    // 3. Relatório
    const reportResult = await this.agents.get('reporter')!.process({
      text: `Gere relatório sobre: ${query}`,
      sessionId,
      userId: 'workflow'
    });
    results.push({ stage: 'report', result: reportResult });
    
    return {
      query,
      stages: results,
      finalOutput: reportResult.response
    };
  }
  
  /**
   * Executa workflow paralelo
   */
  async executeParallel(queries: string[]): Promise<any[]> {
    console.log('\n⚡ Executando workflow paralelo...');
    
    const sessionId = `parallel-${Date.now()}`;
    
    const promises = queries.map(query => 
      this.agents.get('searcher')!.process({
        text: query,
        sessionId,
        userId: 'workflow'
      })
    );
    
    return Promise.all(promises);
  }
}

async function demonstrateMultiAgent() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 DEMONSTRAÇÃO MULTI-AGENT WORKFLOW');
  console.log('='.repeat(60));
  
  const workflow = new MultiAgentWorkflow();
  
  // Workflow sequencial
  const sequentialResult = await workflow.executeSequential('tendências de IA em 2025');
  console.log('\n📋 Resultado do workflow sequencial:');
  console.log(`  Stages executados: ${sequentialResult.stages.length}`);
  console.log(`  Output final: ${sequentialResult.finalOutput}`);
  
  // Workflow paralelo
  const parallelResults = await workflow.executeParallel([
    'machine learning',
    'deep learning',
    'reinforcement learning'
  ]);
  console.log('\n📋 Resultado do workflow paralelo:');
  console.log(`  Queries processadas: ${parallelResults.length}`);
}

// ============================================
// EXECUÇÃO
// ============================================

// Executar demonstrações
(async () => {
  try {
    await demonstrateADKAgent();
    await demonstrateMultiAgent();
  } catch (error) {
    console.error('Erro na demonstração:', error);
  }
})();

export {
  ResearchAgent,
  MultiAgentWorkflow,
  searchTool,
  analyzeTool,
  reportTool,
  createMemory
};
