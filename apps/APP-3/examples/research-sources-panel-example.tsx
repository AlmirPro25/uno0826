/**
 * 🎨 EXEMPLO DE USO - ResearchSourcesPanel
 * 
 * Demonstra como usar o novo componente de visualização de fontes de pesquisa
 */

import React, { useState, useEffect } from 'react';
import { ResearchSourcesPanel } from '../components/ResearchSourcesPanel';
import { AIResearchBrain, ResearchContext } from '../services/AIResearchBrain';

// ============================================================================
// EXEMPLO 1: Uso Básico como Painel
// ============================================================================

export const BasicPanelExample: React.FC = () => {
  const [researchContext, setResearchContext] = useState<ResearchContext | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    try {
      const brain = new AIResearchBrain();
      const response = await brain.process({
        userPrompt: query,
        enableResearch: true,
        researchDepth: 'normal'
      });
      
      if (response.researchContext) {
        setResearchContext(response.researchContext);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Exemplo: Painel de Fontes</h2>
      
      <button
        onClick={() => handleSearch('O que é machine learning?')}
        className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
      >
        Pesquisar "Machine Learning"
      </button>
      
      <ResearchSourcesPanel
        researchContext={researchContext}
        isSearching={isSearching}
        variant="panel"
      />
    </div>
  );
};

// ============================================================================
// EXEMPLO 2: Uso como Modal
// ============================================================================

export const ModalExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [researchContext, setResearchContext] = useState<ResearchContext | null>(null);

  // Simular dados de pesquisa
  useEffect(() => {
    // Dados de exemplo
    setResearchContext({
      query: 'React hooks',
      packets: [
        {
          id: '1',
          source: 'Wikipedia',
          url: 'https://en.wikipedia.org/wiki/React_(JavaScript_library)',
          type: 'wiki',
          title: 'React (JavaScript library)',
          summary: 'React is a free and open-source front-end JavaScript library...',
          content: 'React is a free and open-source front-end JavaScript library for building user interfaces based on components.',
          paragraphs: ['React is a free and open-source front-end JavaScript library...'],
          codeBlocks: [],
          links: [],
          metadata: { language: 'en', wordCount: 100, readingTime: 1 },
          relevanceScore: 0.95,
          extractedAt: new Date().toISOString()
        },
        {
          id: '2',
          source: 'GitHub',
          url: 'https://github.com/facebook/react',
          type: 'code',
          title: 'facebook/react',
          summary: 'The library for web and native user interfaces.',
          content: 'React is a JavaScript library for building user interfaces.',
          paragraphs: ['React is a JavaScript library...'],
          codeBlocks: ['const element = <h1>Hello, world!</h1>;'],
          links: ['https://github.com/facebook/react'],
          metadata: { author: 'facebook', language: 'JavaScript', wordCount: 50, readingTime: 1 },
          relevanceScore: 0.92,
          extractedAt: new Date().toISOString()
        },
        {
          id: '3',
          source: 'Stack Overflow',
          url: 'https://stackoverflow.com/questions/react-hooks',
          type: 'forum',
          title: 'How to use React Hooks?',
          summary: 'React Hooks are functions that let you use state and other React features...',
          content: 'React Hooks are functions that let you use state and other React features without writing a class.',
          paragraphs: ['React Hooks are functions...'],
          codeBlocks: ['const [count, setCount] = useState(0);'],
          links: [],
          metadata: { author: 'user123', language: 'en', wordCount: 80, readingTime: 1 },
          relevanceScore: 0.88,
          extractedAt: new Date().toISOString()
        }
      ],
      summary: 'Pesquisa sobre React hooks com 3 resultados de 3 fontes.',
      sources: ['Wikipedia', 'GitHub', 'Stack Overflow'],
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Exemplo: Modal de Fontes</h2>
      
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Abrir Modal de Fontes
      </button>
      
      {showModal && (
        <ResearchSourcesPanel
          researchContext={researchContext}
          variant="modal"
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// EXEMPLO 3: Uso Inline (dentro de um chat)
// ============================================================================

export const InlineExample: React.FC = () => {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    researchContext?: ResearchContext | null;
  }>>([]);

  const handleSend = async (message: string) => {
    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Simular pesquisa e resposta
    const brain = new AIResearchBrain();
    const response = await brain.process({
      userPrompt: message,
      enableResearch: true
    });
    
    // Adicionar resposta com contexto de pesquisa
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.answer,
      researchContext: response.researchContext
    }]);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Exemplo: Chat com Fontes Inline</h2>
      
      <div className="space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-4 rounded-lg ${
            msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
          }`}>
            <p>{msg.content}</p>
            
            {/* Mostrar fontes inline após a resposta */}
            {msg.researchContext && (
              <div className="mt-4">
                <ResearchSourcesPanel
                  researchContext={msg.researchContext}
                  variant="inline"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Digite sua pergunta..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <button
          onClick={() => handleSend('O que é TypeScript?')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EXEMPLO 4: Pesquisa com Novas APIs
// ============================================================================

export const NewAPIsExample: React.FC = () => {
  const [results, setResults] = useState<{
    arxiv: any[];
    github: any[];
    stackoverflow: any[];
  }>({ arxiv: [], github: [], stackoverflow: [] });
  const [loading, setLoading] = useState(false);

  const searchAllAPIs = async () => {
    setLoading(true);
    
    try {
      const { WebResearchEngine } = await import('../services/WebResearchEngine');
      const engine = new WebResearchEngine();
      
      // Pesquisar em paralelo nas 3 novas APIs
      const [arxiv, github, stackoverflow] = await Promise.all([
        engine.searchArXiv('machine learning', 3),
        engine.searchGitHub('react typescript', 3),
        engine.searchStackOverflow('react hooks', 3)
      ]);
      
      setResults({ arxiv, github, stackoverflow });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Exemplo: Novas APIs (ArXiv, GitHub, Stack Overflow)</h2>
      
      <button
        onClick={searchAllAPIs}
        disabled={loading}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? 'Pesquisando...' : 'Pesquisar em Todas as APIs'}
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* ArXiv */}
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="font-bold text-red-700 mb-2">📄 ArXiv ({results.arxiv.length})</h3>
          {results.arxiv.map((paper, i) => (
            <div key={i} className="text-sm mb-2">
              <a href={paper.url} target="_blank" className="text-red-600 hover:underline">
                {paper.title.slice(0, 50)}...
              </a>
            </div>
          ))}
        </div>
        
        {/* GitHub */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-2">🐙 GitHub ({results.github.length})</h3>
          {results.github.map((repo, i) => (
            <div key={i} className="text-sm mb-2">
              <a href={repo.url} target="_blank" className="text-gray-600 hover:underline">
                {repo.title}
              </a>
            </div>
          ))}
        </div>
        
        {/* Stack Overflow */}
        <div className="p-4 bg-amber-50 rounded-lg">
          <h3 className="font-bold text-amber-700 mb-2">📝 Stack Overflow ({results.stackoverflow.length})</h3>
          {results.stackoverflow.map((q, i) => (
            <div key={i} className="text-sm mb-2">
              <a href={q.url} target="_blank" className="text-amber-600 hover:underline">
                {q.title.slice(0, 50)}...
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  BasicPanelExample,
  ModalExample,
  InlineExample,
  NewAPIsExample
};
