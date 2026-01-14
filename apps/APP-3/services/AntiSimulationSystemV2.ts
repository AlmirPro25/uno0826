/**
 * SISTEMA ANTI-SIMULAÇÃO V2.0 - EVOLUÇÃO COM MCP
 * Integração com Model Context Protocol para funcionalidade REAL
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';

export interface AntiSimulationV2Config {
  enforceRealFunctionality: boolean;
  useMCPIntelligence: boolean;
  focusOnResults: boolean;
  avoidComplexity: boolean;
  enforceMinimalSolutions: boolean;
  validateRealImplementation: boolean;
}

export const DEFAULT_V2_CONFIG: AntiSimulationV2Config = {
  enforceRealFunctionality: true,
  useMCPIntelligence: true,
  focusOnResults: true,
  avoidComplexity: true,
  enforceMinimalSolutions: true,
  validateRealImplementation: true,
};

export const ANTI_SIMULATION_V2_CONTRACT = `
🚫 **CONTRATO ANTI-SIMULAÇÃO V2.0 - FUNCIONALIDADE REAL OBRIGATÓRIA**

**VOCÊ É UM DESENVOLVEDOR SÊNIOR COM MENTALIDADE MCP**

**PRINCÍPIOS FUNDAMENTAIS:**

1. **FUNCIONALIDADE PRIMEIRO, BELEZA DEPOIS:**
   ❌ "Vou criar um design bonito e depois implementar"
   ❌ "Primeiro vamos fazer a interface e depois conectar"
   ❌ "Aqui seria o sistema de pagamento..."
   
   ✅ FUNCIONA imediatamente
   ✅ Código que EXECUTA de verdade
   ✅ Resultado que o usuário pode USAR
   ✅ Menos é mais, mas FUNCIONA

2. **INTELIGÊNCIA DE NECESSIDADES:**
   - Se pediu jogo → HTML + Canvas + JS = Jogo FUNCIONANDO
   - Se pediu API → Express + rotas = API RESPONDENDO
   - Se pediu site → HTML completo = Site CARREGANDO
   - Se pediu e-commerce → Stripe + carrinho = VENDENDO

3. **EVITAR COMPLEXIDADE DESNECESSÁRIA:**
   ❌ React se HTML resolve
   ❌ Banco de dados se localStorage serve
   ❌ Framework se vanilla JS funciona
   ❌ Microserviços se monolito resolve
   ❌ Docker se executar direto funciona

4. **VALIDAÇÃO DE FUNCIONALIDADE REAL:**
   - Botões DEVEM fazer algo
   - APIs DEVEM responder
   - Formulários DEVEM processar
   - Pagamentos DEVEM funcionar
   - Emails DEVEM ser enviados

**REGRAS DE IMPLEMENTAÇÃO:**

🎯 **FOCO NO RESULTADO:**
- Usuário quer USAR, não ver código bonito
- Prefira funcionalidade a arquitetura
- Entregue VALOR, não processo

🔧 **IMPLEMENTAÇÃO MÍNIMA:**
- Menor código que resolve o problema
- Sem dependências desnecessárias
- Sem configurações complexas
- Sem abstrações prematuras

⚡ **EXECUÇÃO IMEDIATA:**
- Código que roda SEM configuração
- Sem "npm install" se possível
- Sem setup complexo
- Funciona no primeiro clique

**VIOLAÇÃO = REGENERAÇÃO AUTOMÁTICA**
`;

export const MINIMAL_SOLUTION_PATTERNS = {
  jogo: {
    pattern: "HTML + Canvas + JavaScript vanilla",
    template: "Arquivo único .html com jogo completo",
    avoid: ["React", "webpack", "build process"],
    focus: "Jogabilidade funcionando"
  },
  api: {
    pattern: "Express.js + rotas essenciais",
    template: "server.js com endpoints funcionais",
    avoid: ["microserviços", "docker", "kubernetes"],
    focus: "Endpoints respondendo"
  },
  site: {
    pattern: "HTML + CSS + JS vanilla",
    template: "index.html completo e funcional",
    avoid: ["framework", "build tools", "bundlers"],
    focus: "Site carregando e funcionando"
  },
  ecommerce: {
    pattern: "HTML + Stripe + localStorage",
    template: "Loja funcionando em arquivo único",
    avoid: ["backend complexo", "banco de dados"],
    focus: "Vendas funcionando"
  }
};

export class AntiSimulationSystemV2 {
  private config: AntiSimulationV2Config;
  private ai: GoogleGenAI;

  constructor(config: AntiSimulationV2Config = DEFAULT_V2_CONFIG) {
    this.config = config;
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
      throw new Error('API Key do Gemini não configurada. Configure VITE_GEMINI_API_KEY no arquivo .env ou adicione uma chave nas configurações.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Gera código com foco em FUNCIONALIDADE REAL
   */
  async generateRealFunctionality(
    userPrompt: string,
    context?: {
      projectType?: string;
      currentCode?: string;
      constraints?: string[];
    }
  ): Promise<{
    code: string;
    functionality: string[];
    complexity: 'minimal' | 'moderate' | 'complex';
    readyToUse: boolean;
  }> {
    console.log('🎯 AntiSimulationV2: Gerando funcionalidade REAL');

    // 1. Analisar necessidade real
    const realNeed = await this.analyzeRealNeed(userPrompt);
    
    // 2. Sugerir solução mínima
    const minimalSolution = this.suggestMinimalSolution(realNeed);
    
    // 3. Gerar código funcional
    const code = await this.generateFunctionalCode(userPrompt, minimalSolution, context);
    
    // 4. Validar funcionalidade
    const validation = this.validateFunctionality(code);
    
    return {
      code,
      functionality: validation.features,
      complexity: validation.complexity,
      readyToUse: validation.isReady
    };
  }

  /**
   * Analisa o que o usuário REALMENTE precisa
   */
  private async analyzeRealNeed(userPrompt: string): Promise<{
    coreNeed: string;
    suggestedApproach: string;
    avoidFeatures: string[];
  }> {
    const analysisPrompt = `
${ANTI_SIMULATION_V2_CONTRACT}

**ANÁLISE DE NECESSIDADE REAL:**

Usuário pediu: "${userPrompt}"

**SUA TAREFA:**
Identifique o que o usuário REALMENTE precisa, não o que ele disse.

**FORMATO DE RESPOSTA:**
{
  "coreNeed": "Funcionalidade essencial que resolve o problema",
  "suggestedApproach": "Solução mais simples que funciona",
  "avoidFeatures": ["feature1", "feature2", "feature3"]
}

**EXEMPLOS:**
- "Quero um jogo" → coreNeed: "Experiência interativa que funciona"
- "Preciso de uma API" → coreNeed: "Endpoints que respondem corretamente"
- "Quero um site" → coreNeed: "Página que carrega e executa função"

RESPONDA APENAS COM O JSON.
    `;

    try {
      const result = await this.callGeminiAPI(analysisPrompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Erro na análise de necessidade:', error);
      return {
        coreNeed: "Funcionalidade básica que resolve o problema",
        suggestedApproach: "Implementação mais simples possível",
        avoidFeatures: ["complexidade desnecessária"]
      };
    }
  }

  /**
   * Sugere solução mínima baseada na necessidade
   */
  private suggestMinimalSolution(need: any): {
    approach: string;
    technologies: string[];
    implementation: string;
  } {
    const prompt = need.coreNeed.toLowerCase();
    
    // Detectar tipo de projeto
    if (prompt.includes('jogo') || prompt.includes('game')) {
      return MINIMAL_SOLUTION_PATTERNS.jogo as any;
    }
    
    if (prompt.includes('api') || prompt.includes('backend')) {
      return MINIMAL_SOLUTION_PATTERNS.api as any;
    }
    
    if (prompt.includes('loja') || prompt.includes('ecommerce') || prompt.includes('venda')) {
      return MINIMAL_SOLUTION_PATTERNS.ecommerce as any;
    }
    
    // Default: site simples
    return MINIMAL_SOLUTION_PATTERNS.site as any;
  }

  /**
   * Gera código funcional baseado na solução mínima
   */
  private async generateFunctionalCode(
    userPrompt: string,
    solution: any,
    context?: any
  ): Promise<string> {
    const functionalPrompt = `
${ANTI_SIMULATION_V2_CONTRACT}

**GERAÇÃO DE CÓDIGO FUNCIONAL:**

**SOLICITAÇÃO ORIGINAL:** "${userPrompt}"

**SOLUÇÃO MÍNIMA IDENTIFICADA:**
- Abordagem: ${solution.approach || solution.pattern}
- Implementação: ${solution.implementation || solution.template}
- Foco: ${solution.focus}

**EVITAR ABSOLUTAMENTE:**
${solution.avoid?.map((item: string) => `- ${item}`).join('\n') || '- Complexidade desnecessária'}

**REGRAS OBRIGATÓRIAS:**

1. **FUNCIONALIDADE IMEDIATA:**
   - Código que RODA sem configuração
   - Botões que FAZEM algo
   - Formulários que PROCESSAM
   - APIs que RESPONDEM

2. **IMPLEMENTAÇÃO MÍNIMA:**
   - Menor código possível
   - Sem dependências desnecessárias
   - Arquivo único se possível
   - Funciona no primeiro clique

3. **CONTEÚDO REAL:**
   - Dados reais, não Lorem Ipsum
   - Funcionalidades reais, não simuladas
   - Integrações reais, não placeholders

4. **IMAGENS OBRIGATÓRIAS:**
   - Use: src="ai-researched-image://descrição detalhada"
   - Mínimo 3-5 imagens por projeto
   - Descrições específicas e relevantes

**CONTEXTO ADICIONAL:**
${context ? JSON.stringify(context, null, 2) : 'Novo projeto'}

**RESPOSTA ESPERADA:**
Código HTML completo e funcional que:
- Executa imediatamente
- Resolve o problema real
- Não precisa de configuração
- Tem funcionalidades reais

NUNCA SIMULE. SEMPRE IMPLEMENTE FUNCIONALIDADE REAL.
    `;

    return await this.callGeminiAPI(functionalPrompt);
  }

  /**
   * Valida se o código tem funcionalidade real
   */
  private validateFunctionality(code: string): {
    isReady: boolean;
    features: string[];
    complexity: 'minimal' | 'moderate' | 'complex';
    issues: string[];
  } {
    const issues: string[] = [];
    const features: string[] = [];

    // Detectar simulações
    const simulationPatterns = [
      /aqui você (conectaria|implementaria|adicionaria)/i,
      /este seria o (endpoint|código|arquivo)/i,
      /simule (a|o|os|as)/i,
      /por questões de segurança/i,
      /lorem ipsum/i,
      /placeholder/i,
      /todo:/i,
      /fixme:/i,
    ];

    simulationPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push(`Simulação detectada: ${pattern.source}`);
      }
    });

    // Detectar funcionalidades reais
    const functionalityPatterns = [
      { pattern: /onclick="[^"]+"/g, feature: "Botões funcionais" },
      { pattern: /onsubmit="[^"]+"/g, feature: "Formulários funcionais" },
      { pattern: /fetch\(|axios\./g, feature: "Chamadas de API" },
      { pattern: /localStorage\./g, feature: "Armazenamento local" },
      { pattern: /addEventListener/g, feature: "Event listeners" },
      { pattern: /ai-researched-image:/g, feature: "Sistema de imagens" },
    ];

    functionalityPatterns.forEach(({ pattern, feature }) => {
      if (pattern.test(code)) {
        features.push(feature);
      }
    });

    // Calcular complexidade
    const codeLines = code.split('\n').length;
    const complexity = codeLines < 200 ? 'minimal' : 
                      codeLines < 500 ? 'moderate' : 'complex';

    return {
      isReady: issues.length === 0 && features.length > 0,
      features,
      complexity,
      issues
    };
  }

  /**
   * Evolui código existente com foco em funcionalidade
   */
  async evolveFunctionality(
    currentCode: string,
    evolutionRequest: string
  ): Promise<{
    evolvedCode: string;
    newFeatures: string[];
    maintained: string[];
  }> {
    const evolutionPrompt = `
${ANTI_SIMULATION_V2_CONTRACT}

**EVOLUÇÃO DE FUNCIONALIDADE:**

**CÓDIGO ATUAL:**
\`\`\`
${currentCode.substring(0, 3000)}...
\`\`\`

**SOLICITAÇÃO DE EVOLUÇÃO:** "${evolutionRequest}"

**REGRAS DE EVOLUÇÃO:**

1. **MANTER FUNCIONALIDADE EXISTENTE:**
   - Não quebrar o que já funciona
   - Preservar funcionalidades atuais
   - Manter simplicidade

2. **ADICIONAR FUNCIONALIDADE REAL:**
   - Nova funcionalidade DEVE funcionar
   - Integrar com código existente
   - Manter padrão de qualidade

3. **EVITAR COMPLEXIDADE:**
   - Não refatorar desnecessariamente
   - Não adicionar dependências
   - Manter arquivo único se possível

**RESPOSTA ESPERADA:**
Código evoluído que:
- Mantém funcionalidades existentes
- Adiciona nova funcionalidade REAL
- Continua simples e funcional

EVOLUA COM FUNCIONALIDADE REAL, NÃO SIMULAÇÃO.
    `;

    const evolvedCode = await this.callGeminiAPI(evolutionPrompt);
    
    // Analisar mudanças
    const currentFeatures = this.extractFeatures(currentCode);
    const newCodeFeatures = this.extractFeatures(evolvedCode);
    
    const newFeatures = newCodeFeatures.filter(f => !currentFeatures.includes(f));
    const maintained = currentFeatures.filter(f => newCodeFeatures.includes(f));

    return {
      evolvedCode,
      newFeatures,
      maintained
    };
  }

  /**
   * Extrai funcionalidades do código
   */
  private extractFeatures(code: string): string[] {
    const features: string[] = [];
    
    const patterns = [
      { pattern: /function\s+\w+/g, feature: "Funções JavaScript" },
      { pattern: /onclick="/g, feature: "Botões interativos" },
      { pattern: /fetch\(/g, feature: "Chamadas de API" },
      { pattern: /localStorage/g, feature: "Armazenamento local" },
      { pattern: /canvas/g, feature: "Canvas para jogos" },
      { pattern: /stripe/gi, feature: "Sistema de pagamentos" },
      { pattern: /ai-researched-image:/g, feature: "Sistema de imagens" },
    ];

    patterns.forEach(({ pattern, feature }) => {
      if (pattern.test(code)) {
        features.push(feature);
      }
    });

    return features;
  }

  /**
   * Chama API do Gemini
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ text: prompt }]
      });
      return result.text || '';
    } catch (error) {
      console.error('Erro na API do Gemini:', error);
      throw error;
    }
  }

  /**
   * Cria template de projeto baseado em necessidade real
   */
  async createProjectTemplate(
    projectType: 'jogo' | 'api' | 'site' | 'ecommerce',
    customization?: string
  ): Promise<{
    template: string;
    features: string[];
    instructions: string;
  }> {
    const templates = {
      jogo: {
        base: "HTML + Canvas + JavaScript para jogo funcional",
        features: ["Controles", "Pontuação", "Física básica", "Gráficos"],
        focus: "Jogabilidade imediata"
      },
      api: {
        base: "Express.js com rotas funcionais",
        features: ["CRUD", "Validação", "Autenticação", "Documentação"],
        focus: "Endpoints respondendo"
      },
      site: {
        base: "HTML completo com funcionalidades",
        features: ["Navegação", "Formulários", "Interatividade", "Responsivo"],
        focus: "Site funcionando"
      },
      ecommerce: {
        base: "Loja online com pagamentos reais",
        features: ["Catálogo", "Carrinho", "Checkout", "Pagamentos"],
        focus: "Vendas funcionando"
      }
    };

    const config = templates[projectType];
    
    const templatePrompt = `
${ANTI_SIMULATION_V2_CONTRACT}

**CRIAÇÃO DE TEMPLATE ${projectType.toUpperCase()}:**

**BASE:** ${config.base}
**FOCO:** ${config.focus}
**CUSTOMIZAÇÃO:** ${customization || 'Template padrão'}

**FUNCIONALIDADES OBRIGATÓRIAS:**
${config.features.map(f => `- ${f} FUNCIONANDO`).join('\n')}

**REGRAS DO TEMPLATE:**
1. Código que EXECUTA imediatamente
2. Funcionalidades REAIS implementadas
3. Sem configuração complexa
4. Arquivo único se possível
5. Imagens com ai-researched-image://

CRIE TEMPLATE FUNCIONAL E PRONTO PARA USO.
    `;

    const template = await this.callGeminiAPI(templatePrompt);
    
    return {
      template,
      features: config.features,
      instructions: `Template ${projectType} pronto para uso. Execute e funciona imediatamente.`
    };
  }
}