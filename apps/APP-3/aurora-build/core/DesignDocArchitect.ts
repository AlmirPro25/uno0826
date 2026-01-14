/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     📋 DESIGN DOC ARCHITECT - ARQUITETO DE DOCUMENTAÇÃO BIG TECH 📋         ║
 * ║                                                                              ║
 * ║     "ANTES DE ESCREVER CÓDIGO, ESCREVA O PLANO."                            ║
 * ║                                                                              ║
 * ║     NÍVEL: 85 (Arquiteto de Documentação)                                   ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra com o AuroraBuilder para:
 * 1. GERAR Design Doc ANTES de gerar código
 * 2. Usar o Design Doc como guia para o código
 * 3. Validar código contra o Design Doc
 * 
 * FLUXO:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  PEDIDO DO USUÁRIO                                              │
 * │         ↓                                                       │
 * │  📋 DESIGN DOC ARCHITECT                                        │
 * │         │                                                       │
 * │         ├─→ Detecta estilo ideal (Google, Amazon, Stripe...)   │
 * │         ├─→ Gera Design Doc completo                           │
 * │         ├─→ Extrai Goals, Non-Goals, Riscos                    │
 * │         ↓                                                       │
 * │  🏗️ AURORA BUILDER (com contexto do Design Doc)                │
 * │         ↓                                                       │
 * │  ✅ CÓDIGO + DESIGN DOC                                         │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from '../../services/ApiKeyManager';
import {
  DesignDocStyle,
  ProjectComplexity,
  DesignDocTemplate,
  designDocEngine
} from '../../services/manifestos/DESIGN_DOC_ENGINE_MANIFEST';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface DesignDocArchitectRequest {
  userPrompt: string;
  style?: DesignDocStyle;
  complexity?: ProjectComplexity;
  author?: string;
  team?: string;
  autoDetectStyle?: boolean;
  includeAlternatives?: boolean;
  includeRisks?: boolean;
  includeTimeline?: boolean;
}

export interface GeneratedDesignDoc {
  style: DesignDocStyle;
  company: string;
  markdown: string;
  sections: {
    tldr: string;
    problem: string;
    goals: string[];
    nonGoals: string[];
    solution: string;
    alternatives: Array<{
      name: string;
      description: string;
      pros: string[];
      cons: string[];
      whyNot: string;
    }>;
    risks: Array<{
      risk: string;
      probability: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      mitigation: string;
    }>;
    timeline?: Array<{
      milestone: string;
      date: string;
      owner: string;
    }>;
    successMetrics: Array<{
      metric: string;
      current: string;
      target: string;
    }>;
  };
  metadata: {
    generatedAt: string;
    estimatedReadTime: string;
    wordCount: number;
  };
}

export interface DesignDocArchitectResult {
  designDoc: GeneratedDesignDoc;
  auroraContext: string; // Contexto para passar ao AuroraBuilder
  logs: string[];
}

// ============================================================================
// DETECTORES
// ============================================================================

/**
 * Detecta o melhor estilo de Design Doc baseado no prompt
 */
export function detectBestStyle(prompt: string): DesignDocStyle {
  const promptLower = prompt.toLowerCase();
  
  // Amazon PR/FAQ - Novos produtos, customer-first
  const prfaqKeywords = [
    'novo produto', 'new product', 'lançamento', 'launch',
    'cliente', 'customer', 'usuário final', 'end user',
    'mvp', 'minimum viable', 'startup', 'ideia'
  ];
  if (prfaqKeywords.some(k => promptLower.includes(k))) {
    return 'amazon_prfaq';
  }
  
  // Netflix ADR - Decisões de arquitetura
  const adrKeywords = [
    'decisão', 'decision', 'escolher entre', 'choose between',
    'migrar', 'migrate', 'substituir', 'replace',
    'arquitetura', 'architecture', 'tecnologia', 'technology'
  ];
  if (adrKeywords.some(k => promptLower.includes(k))) {
    return 'netflix';
  }
  
  // Stripe RFC - Mudanças técnicas focadas
  const rfcKeywords = [
    'api', 'endpoint', 'refatorar', 'refactor',
    'mudança técnica', 'technical change', 'breaking change',
    'deprecar', 'deprecate', 'versão', 'version'
  ];
  if (rfcKeywords.some(k => promptLower.includes(k))) {
    return 'stripe';
  }
  
  // Meta - Alta escala
  const metaKeywords = [
    'escala', 'scale', 'milhões', 'millions', 'bilhões', 'billions',
    'alta disponibilidade', 'high availability', 'distribuído', 'distributed',
    'sharding', 'replicação', 'replication'
  ];
  if (metaKeywords.some(k => promptLower.includes(k))) {
    return 'meta';
  }
  
  // Microsoft - Enterprise com ROI
  const msKeywords = [
    'enterprise', 'corporativo', 'roi', 'budget', 'orçamento',
    'aprovação', 'approval', 'stakeholder', 'business case',
    'investimento', 'investment'
  ];
  if (msKeywords.some(k => promptLower.includes(k))) {
    return 'microsoft';
  }
  
  // Uber - Sistemas distribuídos complexos
  const uberKeywords = [
    'microserviço', 'microservice', 'kubernetes', 'k8s',
    'disaster recovery', 'dr', 'sla', 'slo', 'sli',
    'observability', 'monitoring', 'alerting'
  ];
  if (uberKeywords.some(k => promptLower.includes(k))) {
    return 'uber';
  }
  
  // Amazon 6-Pager - Estratégia
  const sixPagerKeywords = [
    'estratégia', 'strategy', 'roadmap', 'visão', 'vision',
    'longo prazo', 'long term', 'planejamento', 'planning'
  ];
  if (sixPagerKeywords.some(k => promptLower.includes(k))) {
    return 'amazon_6p';
  }
  
  // Default: Universal (melhor de todos)
  return 'universal';
}

/**
 * Detecta complexidade do projeto
 */
export function detectComplexity(prompt: string): ProjectComplexity {
  const promptLower = prompt.toLowerCase();
  
  // Enterprise
  const enterpriseKeywords = [
    'enterprise', 'corporativo', 'multi-tenant', 'compliance',
    'audit', 'soc2', 'hipaa', 'gdpr', 'pci'
  ];
  if (enterpriseKeywords.some(k => promptLower.includes(k))) {
    return 'enterprise';
  }
  
  // Large
  const largeKeywords = [
    'completo', 'complete', 'fullstack', 'full-stack',
    'e-commerce', 'marketplace', 'saas', 'plataforma', 'platform'
  ];
  if (largeKeywords.some(k => promptLower.includes(k))) {
    return 'large';
  }
  
  // Medium
  const mediumKeywords = [
    'dashboard', 'admin', 'painel', 'crud', 'api',
    'autenticação', 'authentication'
  ];
  if (mediumKeywords.some(k => promptLower.includes(k))) {
    return 'medium';
  }
  
  // Small
  return 'small';
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class DesignDocArchitect {
  private genAI: GoogleGenAI | null = null;
  private logs: string[] = [];
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 📋 MÉTODO PRINCIPAL: Gera Design Doc completo
   */
  async generate(request: DesignDocArchitectRequest): Promise<DesignDocArchitectResult> {
    this.log('📋 DESIGN DOC ARCHITECT INICIADO');
    this.log(`📝 Prompt: ${request.userPrompt}`);
    
    // Detectar estilo se não especificado
    const style = request.style || (request.autoDetectStyle !== false ? detectBestStyle(request.userPrompt) : 'universal');
    const complexity = request.complexity || detectComplexity(request.userPrompt);
    
    this.log(`🎨 Estilo detectado: ${style}`);
    this.log(`📊 Complexidade: ${complexity}`);
    
    // Obter template
    const template = designDocEngine.getTemplate(style);
    if (!template) {
      throw new Error(`Template não encontrado: ${style}`);
    }
    
    this.log(`🏢 Empresa: ${template.company}`);
    
    // Gerar Design Doc via LLM
    const designDoc = await this.generateWithLLM(request, style, complexity, template);
    
    // Criar contexto para AuroraBuilder
    const auroraContext = this.createAuroraContext(designDoc);
    
    this.log('✅ Design Doc gerado com sucesso!');
    this.log(`📄 ${designDoc.metadata.wordCount} palavras`);
    this.log(`⏱️ Tempo de leitura: ${designDoc.metadata.estimatedReadTime}`);
    
    return {
      designDoc,
      auroraContext,
      logs: [...this.logs]
    };
  }
  
  /**
   * 🤖 Gera Design Doc usando LLM
   */
  private async generateWithLLM(
    request: DesignDocArchitectRequest,
    style: DesignDocStyle,
    complexity: ProjectComplexity,
    template: DesignDocTemplate
  ): Promise<GeneratedDesignDoc> {
    if (!this.genAI) {
      // Fallback sem LLM
      return this.generateFallback(request, style, template);
    }
    
    const prompt = this.buildPrompt(request, style, complexity, template);
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    
    return this.parseResponse(response, style, template);
  }
  
  /**
   * 📝 Constrói prompt para gerar Design Doc
   */
  private buildPrompt(
    request: DesignDocArchitectRequest,
    style: DesignDocStyle,
    complexity: ProjectComplexity,
    template: DesignDocTemplate
  ): string {
    const sectionsGuide = template.sections.map(s => 
      `### ${s.title}\n${s.description}\n${s.required ? '(OBRIGATÓRIO)' : '(Opcional)'}`
    ).join('\n\n');
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    📋 DESIGN DOC ARCHITECT 📋                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um ARQUITETO DE DOCUMENTAÇÃO SÊNIOR especializado em Design Docs estilo Big Tech.

🎯 SUA MISSÃO: Criar um Design Doc completo no estilo ${template.company} (${style})

═══════════════════════════════════════════════════════════════════════════════
📝 PEDIDO DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

"${request.userPrompt}"

═══════════════════════════════════════════════════════════════════════════════
📊 CONTEXTO:
═══════════════════════════════════════════════════════════════════════════════

- **Estilo:** ${style} (${template.company})
- **Complexidade:** ${complexity}
- **Autor:** ${request.author || 'Não especificado'}
- **Time:** ${request.team || 'Não especificado'}
- **Processo de Review:** ${template.reviewProcess}
${template.maxPages ? `- **Máximo de Páginas:** ${template.maxPages}` : ''}

═══════════════════════════════════════════════════════════════════════════════
📋 SEÇÕES DO TEMPLATE ${template.company.toUpperCase()}:
═══════════════════════════════════════════════════════════════════════════════

${sectionsGuide}

═══════════════════════════════════════════════════════════════════════════════
🎯 INSTRUÇÕES:
═══════════════════════════════════════════════════════════════════════════════

1. **ANALISE** o pedido do usuário profundamente
2. **IDENTIFIQUE** o problema real a ser resolvido
3. **DEFINA** Goals claros e mensuráveis
4. **LISTE** Non-Goals explícitos (o que NÃO faremos)
5. **PROPONHA** uma solução técnica detalhada
6. **CONSIDERE** pelo menos 2 alternativas
7. **IDENTIFIQUE** riscos e mitigações
8. **DEFINA** métricas de sucesso

═══════════════════════════════════════════════════════════════════════════════
📋 FORMATO DE RESPOSTA:
═══════════════════════════════════════════════════════════════════════════════

Retorne um JSON com esta estrutura:

\`\`\`json
{
  "tldr": "Resumo em 2-3 frases",
  "problem": "Descrição detalhada do problema",
  "goals": ["Goal 1 mensurável", "Goal 2 mensurável"],
  "nonGoals": ["Non-Goal 1", "Non-Goal 2"],
  "solution": "Descrição técnica da solução proposta",
  "alternatives": [
    {
      "name": "Alternativa 1",
      "description": "O que seria",
      "pros": ["Vantagem 1", "Vantagem 2"],
      "cons": ["Desvantagem 1"],
      "whyNot": "Por que não escolhemos"
    }
  ],
  "risks": [
    {
      "risk": "Descrição do risco",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "Como mitigar"
    }
  ],
  "timeline": [
    {
      "milestone": "Nome do milestone",
      "date": "Data estimada",
      "owner": "Responsável"
    }
  ],
  "successMetrics": [
    {
      "metric": "Nome da métrica",
      "current": "Valor atual",
      "target": "Valor alvo"
    }
  ],
  "markdown": "O Design Doc completo em Markdown seguindo o template ${template.company}"
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
⚠️ REGRAS:
═══════════════════════════════════════════════════════════════════════════════

✅ SEMPRE inclua Goals E Non-Goals
✅ SEMPRE considere pelo menos 2 alternativas
✅ SEMPRE identifique riscos
✅ SEMPRE defina métricas de sucesso mensuráveis
✅ SEMPRE use linguagem clara e direta
✅ SEMPRE pense em quem vai ler (técnico e não-técnico)

❌ NUNCA deixe seções vazias
❌ NUNCA use jargão sem explicar
❌ NUNCA omita trade-offs
❌ NUNCA seja vago em Goals

═══════════════════════════════════════════════════════════════════════════════

🚀 GERE O DESIGN DOC AGORA!
`;
  }
  
  /**
   * 📊 Parseia resposta do LLM
   */
  private parseResponse(
    response: string,
    style: DesignDocStyle,
    template: DesignDocTemplate
  ): GeneratedDesignDoc {
    try {
      // Extrair JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const markdown = parsed.markdown || this.generateMarkdown(parsed, template);
        const wordCount = markdown.split(/\s+/).length;
        
        return {
          style,
          company: template.company,
          markdown,
          sections: {
            tldr: parsed.tldr || '',
            problem: parsed.problem || '',
            goals: parsed.goals || [],
            nonGoals: parsed.nonGoals || [],
            solution: parsed.solution || '',
            alternatives: parsed.alternatives || [],
            risks: parsed.risks || [],
            timeline: parsed.timeline,
            successMetrics: parsed.successMetrics || []
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            estimatedReadTime: `${Math.ceil(wordCount / 200)} min`,
            wordCount
          }
        };
      }
      
      throw new Error('JSON não encontrado na resposta');
      
    } catch (error) {
      this.log(`⚠️ Erro ao parsear resposta: ${error}`);
      return this.generateFallback({ userPrompt: '' }, style, template);
    }
  }
  
  /**
   * 📄 Gera Markdown a partir das seções
   */
  private generateMarkdown(sections: any, template: DesignDocTemplate): string {
    return `
# Design Doc

## ⚡ TL;DR

${sections.tldr || 'A ser definido'}

## 🎯 Problem Statement

${sections.problem || 'A ser definido'}

## ✅ Goals

${(sections.goals || []).map((g: string) => `- [ ] ${g}`).join('\n')}

## ❌ Non-Goals

${(sections.nonGoals || []).map((g: string) => `- ${g}`).join('\n')}

## 🏗️ Proposed Solution

${sections.solution || 'A ser definido'}

## 🔄 Alternatives Considered

${(sections.alternatives || []).map((alt: any) => `
### ${alt.name}
- **Descrição:** ${alt.description}
- **Prós:** ${alt.pros?.join(', ')}
- **Contras:** ${alt.cons?.join(', ')}
- **Por que não:** ${alt.whyNot}
`).join('\n')}

## ⚠️ Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
${(sections.risks || []).map((r: any) => 
  `| ${r.risk} | ${r.probability} | ${r.impact} | ${r.mitigation} |`
).join('\n')}

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
${(sections.successMetrics || []).map((m: any) => 
  `| ${m.metric} | ${m.current} | ${m.target} |`
).join('\n')}

${sections.timeline ? `
## 📅 Timeline

| Milestone | Date | Owner |
|-----------|------|-------|
${sections.timeline.map((t: any) => 
  `| ${t.milestone} | ${t.date} | ${t.owner} |`
).join('\n')}
` : ''}

---
*Generated by Aurora Design Doc Architect - Style: ${template.company}*
`;
  }
  
  /**
   * 🔧 Gera fallback sem LLM
   */
  private generateFallback(
    request: DesignDocArchitectRequest,
    style: DesignDocStyle,
    template: DesignDocTemplate
  ): GeneratedDesignDoc {
    const markdown = `
# Design Doc - ${request.userPrompt || 'Novo Projeto'}

## ⚡ TL;DR

- **Problema:** A ser definido
- **Solução:** A ser definido
- **Impacto:** A ser definido

## 🎯 Goals

- [ ] Goal 1
- [ ] Goal 2

## ❌ Non-Goals

- Non-Goal 1

## 🏗️ Proposed Solution

A ser definido.

## 🔄 Alternatives Considered

### Alternativa 1
- **Por que não:** A ser definido

## ⚠️ Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Risk 1 | Medium | Medium | A definir |

---
*Template: ${template.company}*
`;
    
    return {
      style,
      company: template.company,
      markdown,
      sections: {
        tldr: 'A ser definido',
        problem: 'A ser definido',
        goals: ['Goal 1', 'Goal 2'],
        nonGoals: ['Non-Goal 1'],
        solution: 'A ser definido',
        alternatives: [],
        risks: [],
        successMetrics: []
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedReadTime: '2 min',
        wordCount: markdown.split(/\s+/).length
      }
    };
  }
  
  /**
   * 🌉 Cria contexto para AuroraBuilder
   */
  private createAuroraContext(designDoc: GeneratedDesignDoc): string {
    return `
═══════════════════════════════════════════════════════════════════════════════
📋 DESIGN DOC CONTEXT (${designDoc.company} Style)
═══════════════════════════════════════════════════════════════════════════════

⚡ TL;DR: ${designDoc.sections.tldr}

🎯 GOALS (O que DEVEMOS fazer):
${designDoc.sections.goals.map(g => `• ${g}`).join('\n')}

❌ NON-GOALS (O que NÃO devemos fazer):
${designDoc.sections.nonGoals.map(g => `• ${g}`).join('\n')}

🏗️ SOLUÇÃO PROPOSTA:
${designDoc.sections.solution}

⚠️ RISCOS IDENTIFICADOS:
${designDoc.sections.risks.map(r => `• ${r.risk} (${r.probability}/${r.impact}) - Mitigação: ${r.mitigation}`).join('\n')}

📊 MÉTRICAS DE SUCESSO:
${designDoc.sections.successMetrics.map(m => `• ${m.metric}: ${m.current} → ${m.target}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
⚠️ IMPORTANTE: O código gerado DEVE seguir este Design Doc!
═══════════════════════════════════════════════════════════════════════════════
`;
  }
  
  /**
   * 📝 Log helper
   */
  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DesignDocArchitect;
