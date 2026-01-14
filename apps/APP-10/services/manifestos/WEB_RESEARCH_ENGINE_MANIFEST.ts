/**
 * 🌐 WEB RESEARCH ENGINE MANIFEST
 * 
 * Manifesto do Sistema de Pesquisa Real na Internet
 * Conecta a IA com conhecimento em tempo real do mundo
 * 
 * @version 1.0.0
 * @author Sistema de Manifestos Cognitivos
 */

// ============================================================================
// MANIFESTO PRINCIPAL
// ============================================================================

export const WEB_RESEARCH_ENGINE_MANIFEST = {
  id: 'web-research-engine',
  name: 'Web Research Engine',
  version: '1.0.0',
  
  identity: {
    role: 'Cérebro Pesquisador com Navegador Real',
    expertise: [
      'Pesquisa real na internet (não simulada)',
      'Acesso a APIs gratuitas de conhecimento',
      'Navegação com Playwright/Chromium',
      'Extração e estruturação de informações',
      'Síntese de conhecimento com IA',
      'Rate limiting e cache inteligente'
    ],
    philosophy: 'SE EXISTE NA INTERNET, EU SEI ENCONTRAR E TRAZER'
  },

  activation: {
    keywords: [
      'pesquisa', 'pesquisar', 'buscar', 'search', 'research',
      'internet', 'web', 'online',
      'wikipedia', 'documentação', 'docs', 'documentation',
      'notícias', 'news', 'hacker news',
      'tutorial', 'tutoriais', 'como fazer', 'how to',
      'paper', 'papers', 'artigo', 'científico',
      'atualizado', 'recente', 'latest', 'current',
      'o que é', 'what is', 'explique', 'explain'
    ]
  },

  // ============================================================================
  // FONTES DE CONHECIMENTO
  // ============================================================================
  
  knowledgeSources: {
    apis: {
      wikipedia: {
        name: 'Wikipedia API',
        url: 'https://en.wikipedia.org/w/api.php',
        type: 'wiki',
        rateLimit: 200,
        priority: 8,
        languages: ['en', 'pt', 'es', 'fr', 'de']
      },
      duckduckgo: {
        name: 'DuckDuckGo Instant Answers',
        url: 'https://api.duckduckgo.com',
        type: 'search',
        rateLimit: 60,
        priority: 7
      },
      hackerNews: {
        name: 'Hacker News API',
        url: 'https://hn.algolia.com/api/v1',
        type: 'news',
        rateLimit: 100,
        priority: 8
      },
      devto: {
        name: 'DEV.to API',
        url: 'https://dev.to/api',
        type: 'tutorial',
        rateLimit: 30,
        priority: 7
      },
      arxiv: {
        name: 'ArXiv API',
        url: 'http://export.arxiv.org/api',
        type: 'paper',
        rateLimit: 20,
        priority: 9
      },
      github: {
        name: 'GitHub API',
        url: 'https://api.github.com',
        type: 'code',
        rateLimit: 60,
        priority: 9
      }
    },
    
    websites: {
      documentation: [
        { name: 'MDN Web Docs', url: 'developer.mozilla.org', priority: 10 },
        { name: 'TypeScript Docs', url: 'typescriptlang.org', priority: 9 },
        { name: 'React Docs', url: 'react.dev', priority: 9 },
        { name: 'Node.js Docs', url: 'nodejs.org', priority: 9 },
        { name: 'Go Docs', url: 'go.dev', priority: 9 },
        { name: 'Python Docs', url: 'docs.python.org', priority: 9 },
        { name: 'Rust Docs', url: 'doc.rust-lang.org', priority: 9 }
      ],
      tutorials: [
        { name: 'DEV.to', url: 'dev.to', priority: 7 },
        { name: 'FreeCodeCamp', url: 'freecodecamp.org', priority: 7 },
        { name: 'GeeksForGeeks', url: 'geeksforgeeks.org', priority: 6 },
        { name: 'W3Schools', url: 'w3schools.com', priority: 6 }
      ],
      news: [
        { name: 'Hacker News', url: 'news.ycombinator.com', priority: 8 },
        { name: 'TechCrunch', url: 'techcrunch.com', priority: 7 },
        { name: 'The Verge', url: 'theverge.com', priority: 7 }
      ],
      papers: [
        { name: 'ArXiv', url: 'arxiv.org', priority: 9 },
        { name: 'Papers With Code', url: 'paperswithcode.com', priority: 9 }
      ]
    }
  },

  // ============================================================================
  // ARQUITETURA
  // ============================================================================
  
  architecture: {
    components: [
      {
        name: 'WebResearchEngine',
        file: 'services/WebResearchEngine.ts',
        responsibilities: [
          'Gerenciar fontes confiáveis',
          'Executar pesquisas via APIs',
          'Controlar rate limiting',
          'Estruturar resultados em KnowledgePackets',
          'Navegar com Playwright quando necessário'
        ]
      },
      {
        name: 'AIResearchBrain',
        file: 'services/AIResearchBrain.ts',
        responsibilities: [
          'Decidir se precisa pesquisar',
          'Otimizar queries de busca',
          'Sintetizar resultados com Gemini',
          'Calcular confiança da resposta',
          'Manter histórico de pesquisas'
        ]
      }
    ],
    
    dataStructures: {
      KnowledgePacket: {
        description: 'Unidade de conhecimento extraída',
        fields: [
          'id', 'source', 'url', 'type', 'title',
          'summary', 'content', 'paragraphs', 'codeBlocks',
          'links', 'metadata', 'relevanceScore', 'extractedAt'
        ]
      },
      ResearchResult: {
        description: 'Resultado completo de uma pesquisa',
        fields: [
          'query', 'packets', 'summary', 'sources',
          'totalResults', 'searchTime', 'timestamp'
        ]
      },
      AIResearchResponse: {
        description: 'Resposta processada pela IA',
        fields: [
          'answer', 'researchContext', 'sources',
          'confidence', 'usedResearch', 'processingTime'
        ]
      }
    }
  },

  // ============================================================================
  // CONFIGURAÇÕES
  // ============================================================================
  
  config: {
    researchDepth: {
      quick: { maxResults: 5, description: 'Respostas rápidas' },
      normal: { maxResults: 10, description: 'Uso geral' },
      deep: { maxResults: 20, description: 'Pesquisa aprofundada' }
    },
    
    browser: {
      headless: true,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    },
    
    cache: {
      enabled: true,
      maxSize: 100,
      ttlMinutes: 30
    }
  },

  // ============================================================================
  // PROMPTS DO SISTEMA
  // ============================================================================
  
  prompts: {
    researchDecision: `
Você é um assistente que decide se uma pergunta precisa de pesquisa na internet.

REGRAS:
1. Pesquise se a pergunta é sobre:
   - Notícias recentes ou eventos atuais
   - Documentação técnica específica
   - Dados que mudam frequentemente
   - Informações que você não tem certeza
   - Tutoriais ou guias específicos
   - Papers científicos ou pesquisas

2. NÃO pesquise se:
   - É uma pergunta de opinião
   - É sobre conceitos básicos que você domina
   - É uma tarefa de programação simples
   - É uma conversa casual

Responda em JSON:
{
  "shouldResearch": true/false,
  "reason": "motivo da decisão",
  "suggestedQuery": "query otimizada para pesquisa",
  "suggestedSources": ["fonte1", "fonte2"]
}
`,
    
    researchSynthesis: `
Você é um assistente que sintetiza informações de pesquisa para responder perguntas.

CONTEXTO DA PESQUISA:
{research_context}

PERGUNTA DO USUÁRIO:
{user_question}

REGRAS:
1. Use APENAS informações da pesquisa fornecida
2. Cite as fontes quando usar informações específicas
3. Se a pesquisa não tiver a resposta, diga claramente
4. Seja preciso e factual
5. Organize a resposta de forma clara
6. Inclua código se relevante e disponível na pesquisa

FORMATO:
- Resposta clara e direta
- Citações no formato [Fonte: nome]
- Código em blocos markdown se aplicável
- Links relevantes no final
`
  },

  // ============================================================================
  // MÉTRICAS E QUALIDADE
  // ============================================================================
  
  metrics: {
    confidence: {
      description: 'Confiança na resposta baseada na qualidade da pesquisa',
      factors: [
        'Número de fontes consultadas',
        'Prioridade das fontes',
        'Quantidade de resultados',
        'Tamanho da resposta'
      ],
      calculation: `
        confidence = 0.5 (base)
        + min(sources.length * 0.05, 0.2)
        + min(packets.length * 0.02, 0.15)
        + (hasHighPrioritySource ? 0.1 : 0)
        + (answer.length > 1000 ? 0.05 : 0)
      `
    },
    
    relevance: {
      description: 'Relevância do resultado para a query',
      factors: [
        'Prioridade da fonte',
        'Match com keywords',
        'Recência do conteúdo'
      ]
    }
  },

  // ============================================================================
  // INTEGRAÇÃO
  // ============================================================================
  
  integration: {
    services: [
      {
        name: 'GeminiService',
        purpose: 'Síntese de respostas',
        method: 'generateContent'
      },
      {
        name: 'KnowledgeBase',
        purpose: 'Conhecimento interno',
        method: 'query'
      },
      {
        name: 'AdvancedResearch',
        purpose: 'Pesquisa de design',
        method: 'performAdvancedResearch'
      }
    ],
    
    exports: [
      'WebResearchEngine',
      'AIResearchBrain',
      'webResearchEngine',
      'aiResearchBrain',
      'TRUSTED_SOURCES',
      'KNOWLEDGE_APIS'
    ]
  },

  // ============================================================================
  // COMANDOS
  // ============================================================================
  
  commands: {
    setup: 'npm run setup:research',
    test: 'npm run test:research',
    example: 'npm run example:research'
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default WEB_RESEARCH_ENGINE_MANIFEST;

// Função helper para obter o manifesto
export function getWebResearchManifest() {
  return WEB_RESEARCH_ENGINE_MANIFEST;
}

// Função para verificar se uma query deve ativar pesquisa
export function shouldActivateResearch(query: string): boolean {
  const keywords = WEB_RESEARCH_ENGINE_MANIFEST.activation.keywords;
  const queryLower = query.toLowerCase();
  return keywords.some(kw => queryLower.includes(kw));
}
