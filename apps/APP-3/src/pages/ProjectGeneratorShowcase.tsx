/**
 * 🎨 PROJECT GENERATOR SHOWCASE
 * 
 * Página que demonstra o visualizador de arquitetura em ação
 * Integra: Geração de código + Análise + Visualização
 */

import React, { useState } from 'react';
import ProjectArchitectureVisualizer from '@/components/ProjectArchitectureVisualizer';
import { Loader, Send } from 'lucide-react';

interface GeneratedProject {
  name: string;
  description: string;
  structure: any[];
  technologies: string[];
}

export default function ProjectGeneratorShowcase() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);

  // Exemplo de estrutura de projeto (simulado)
  const exampleAetherPayStructure = [
    {
      name: 'aetherpay',
      type: 'folder' as const,
      description: 'Root do projeto',
      children: [
        {
          name: 'frontend',
          type: 'folder' as const,
          description: 'UI Mobile (React + Vite + Tailwind)',
          color: 'text-green-500',
          children: [
            {
              name: 'src',
              type: 'folder' as const,
              children: [
                { name: 'components', type: 'folder' as const },
                { name: 'pages', type: 'folder' as const },
                { name: 'hooks', type: 'folder' as const },
                { name: 'styles', type: 'folder' as const },
                { name: 'App.tsx', type: 'file' as const },
                { name: 'main.tsx', type: 'file' as const }
              ]
            },
            { name: 'package.json', type: 'file' as const },
            { name: 'vite.config.ts', type: 'file' as const },
            { name: 'tailwind.config.js', type: 'file' as const }
          ]
        },
        {
          name: 'bff',
          type: 'folder' as const,
          description: 'Backend for Frontend (Hono + Bun + MCP Server)',
          color: 'text-blue-500',
          children: [
            {
              name: 'src',
              type: 'folder' as const,
              children: [
                { name: 'routes', type: 'folder' as const },
                { name: 'services', type: 'folder' as const },
                { name: 'middleware', type: 'folder' as const },
                { name: 'mcp', type: 'folder' as const, description: '🔌 MCP Server' },
                { name: 'index.ts', type: 'file' as const }
              ]
            },
            { name: 'package.json', type: 'file' as const },
            { name: 'bunfig.toml', type: 'file' as const }
          ]
        },
        {
          name: 'backend',
          type: 'folder' as const,
          description: 'Core Backend (Go + Gin + Gorm + Atomic TX)',
          color: 'text-purple-500',
          children: [
            {
              name: 'cmd',
              type: 'folder' as const,
              children: [
                { name: 'main.go', type: 'file' as const }
              ]
            },
            {
              name: 'internal',
              type: 'folder' as const,
              children: [
                { name: 'handlers', type: 'folder' as const },
                { name: 'services', type: 'folder' as const },
                { name: 'models', type: 'folder' as const },
                { name: 'db', type: 'folder' as const }
              ]
            },
            { name: 'go.mod', type: 'file' as const },
            { name: 'go.sum', type: 'file' as const }
          ]
        },
        {
          name: '.github',
          type: 'folder' as const,
          description: 'CI/CD Pipeline',
          children: [
            {
              name: 'workflows',
              type: 'folder' as const,
              children: [
                { name: 'test.yml', type: 'file' as const },
                { name: 'deploy.yml', type: 'file' as const }
              ]
            }
          ]
        },
        { name: 'docker-compose.yml', type: 'file' as const },
        { name: '.env.example', type: 'file' as const },
        { name: 'README.md', type: 'file' as const }
      ]
    }
  ];

  const handleGenerateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      // Simular delay de geração
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular resposta do sistema
      const projectName = extractProjectName(prompt);
      const technologies = extractTechnologies(prompt);

      setGeneratedProject({
        name: projectName,
        description: `${projectName} - Aplicação Fintech Híbrida + MCP (100/100 TDD Compliance)`,
        structure: exampleAetherPayStructure,
        technologies: technologies
      });

      setPrompt('');
    } catch (error) {
      console.error('Erro ao gerar projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractProjectName = (prompt: string): string => {
    // Extrair nome do projeto do prompt
    const match = prompt.match(/(?:crie|gere|faça).*?(?:um|uma|de)\s+(\w+)/i);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Novo Projeto';
  };

  const extractTechnologies = (prompt: string): string[] => {
    const techs: string[] = [];
    const keywords: { [key: string]: string } = {
      'react': 'React',
      'typescript': 'TypeScript',
      'hono': 'Hono',
      'bun': 'Bun',
      'go': 'Go',
      'golang': 'Go',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mcp': 'MCP',
      'docker': 'Docker',
      'tdd': 'TDD',
      'fintech': 'Fintech',
      'tailwind': 'Tailwind CSS',
      'vite': 'Vite'
    };

    Object.entries(keywords).forEach(([key, value]) => {
      if (prompt.toLowerCase().includes(key) && !techs.includes(value)) {
        techs.push(value);
      }
    });

    // Se não encontrou nenhuma, adicionar padrão
    if (techs.length === 0) {
      techs.push('React', 'TypeScript', 'Hono', 'Go', 'PostgreSQL', 'MCP', 'Docker', 'TDD');
    }

    return techs;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🚀 Project Generator Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gere projetos completos com visualização profissional
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="mb-8">
          <form onSubmit={handleGenerateProject} className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📝 Descreva o projeto que deseja gerar:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Crie um gerenciador de carteira digital com MCP para Claude Desktop..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gerar Projeto
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Examples */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                💡 Exemplos rápidos:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Crie um gerenciador de tarefas com MCP',
                  'Gere um app de carteira digital com Hono e Go',
                  'Faça um sistema de gestão de projetos com TDD'
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Visualization Section */}
        {generatedProject ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
            <ProjectArchitectureVisualizer
              projectName={generatedProject.name}
              description={generatedProject.description}
              structure={generatedProject.structure}
              technologies={generatedProject.technologies}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pronto para Gerar
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Digite uma descrição do projeto acima e veja a visualização profissional aparecer aqui!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            ✨ Powered by Gemini + MCP + TDD + Fintech Architecture
          </p>
          <p className="text-gray-500 text-sm mt-2">
            100/100 Quality • Production-Ready • Fully Documented
          </p>
        </div>
      </div>
    </div>
  );
}
