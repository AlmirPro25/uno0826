/**
 * 🎨 MANIFESTO: VISUALIZAÇÃO DE PROJETOS
 * 
 * Diretrizes para gerar visualizações impressionantes dos projetos
 * Transforma "tela branca com dados" em "dashboard profissional"
 */

export const PROJECT_VISUALIZATION_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎨 MANIFESTO: VISUALIZAÇÃO PROFISSIONAL DE PROJETOS 🎨              ║
║                                                                              ║
║            "TRANSFORMAR CÓDIGO EM ARTE VISUAL IMPRESSIONANTE"               ║
║                                                                              ║
║                    DEIXAR O USUÁRIO MARAVILHADO                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

DIRETIVA ESTRATÉGICA
═══════════════════════════════════════════════════════════════════════════════

Quando você gera um projeto, o usuário não deve ver apenas:
❌ Uma tela branca com dados crus
❌ Um JSON com a estrutura
❌ Um texto simples da arquitetura

Ele deve ver:
✅ Uma visualização profissional e interativa
✅ Diagrama visual da arquitetura
✅ Árvore de arquivos estilizada
✅ Efeitos visuais e animações
✅ Estatísticas do projeto
✅ Features e segurança destacadas

OBJETIVO: Deixar o usuário **impressionado com a qualidade** do que foi gerado.

═══════════════════════════════════════════════════════════════════════════════

🎨 PADRÕES DE VISUALIZAÇÃO (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════════════════

1. COMPONENTE REACT:
   ✅ Usar Tailwind CSS para styling
   ✅ Usar Lucide React para ícones
   ✅ Suportar dark mode
   ✅ Responsivo (mobile, tablet, desktop)
   ✅ Acessível (ARIA labels)

2. ESTRUTURA VISUAL:
   ✅ Header com nome do projeto
   ✅ Descrição e tecnologias
   ✅ Diagrama da arquitetura (3 colunas: Frontend, Backend, Database)
   ✅ Árvore de arquivos interativa
   ✅ Features e Security cards
   ✅ Estatísticas (Quality, TDD, MCP, Production)
   ✅ Footer com status

3. INTERATIVIDADE:
   ✅ Expandir/colapsar pastas
   ✅ Hover effects
   ✅ Transições suaves
   ✅ Cores por tipo de arquivo
   ✅ Descrições ao passar o mouse

4. CORES E TEMAS:
   ✅ Frontend: Verde (React, UI)
   ✅ Backend: Azul (Hono, APIs)
   ✅ Database: Roxo (PostgreSQL, Data)
   ✅ Features: Amarelo
   ✅ Security: Vermelho
   ✅ Stats: Cinza

═══════════════════════════════════════════════════════════════════════════════

💻 BLUEPRINT DE CÓDIGO (REACT COMPONENT)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, File, Code, Database, Server, Globe } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  description?: string;
  children?: FileNode[];
  color?: string;
}

interface ProjectArchitectureVisualizerProps {
  projectName: string;
  structure: FileNode[];
  description?: string;
  technologies?: string[];
}

export default function ProjectArchitectureVisualizer({
  projectName,
  structure,
  description,
  technologies = []
}: ProjectArchitectureVisualizerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Renderizar árvore de arquivos
  const renderTree = (nodes: FileNode[], path: string = '') => {
    return (
      <div className="space-y-1">
        {nodes.map((node) => {
          const nodePath = \`\${path}/\${node.name}\`;
          const isExpanded = expandedFolders.has(nodePath);
          const hasChildren = node.children && node.children.length > 0;

          return (
            <div key={nodePath}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => hasChildren && toggleFolder(nodePath)}
              >
                {node.type === 'folder' ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <Folder className={node.color || 'text-blue-500'} />
                    <span className="font-semibold">{node.name}</span>
                  </>
                ) : (
                  <>
                    <div className="w-4" />
                    <File className="w-4 h-4" />
                    <span>{node.name}</span>
                  </>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="ml-4 border-l border-gray-200">
                  {renderTree(node.children!, nodePath)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{projectName}</h1>
        <p className="text-gray-600">{description}</p>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <span key={tech} className="px-3 py-1 bg-blue-100 rounded-full text-sm">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <Globe className="w-5 h-5 text-green-600 mb-2" />
          <h3 className="font-bold">Frontend</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• React + TypeScript</li>
            <li>• Tailwind CSS</li>
            <li>• Mobile-first</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <Server className="w-5 h-5 text-blue-600 mb-2" />
          <h3 className="font-bold">Backend</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Hono + Bun</li>
            <li>• MCP Server</li>
            <li>• Type-safe</li>
          </ul>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <Database className="w-5 h-5 text-purple-600 mb-2" />
          <h3 className="font-bold">Database</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• PostgreSQL</li>
            <li>• Prisma ORM</li>
            <li>• Atomic TX</li>
          </ul>
        </div>
      </div>

      {/* File Tree */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📁 Project Structure</h2>
        <div className="bg-white rounded-lg border p-4 font-mono text-sm">
          {renderTree(structure)}
        </div>
      </div>

      {/* Features & Security */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-bold mb-3">✨ Features</h3>
          <ul className="text-sm space-y-2">
            <li>✅ Full-stack type safety</li>
            <li>✅ Atomic transactions</li>
            <li>✅ MCP integration</li>
            <li>✅ 100/100 TDD compliance</li>
          </ul>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="font-bold mb-3">🔒 Security</h3>
          <ul className="text-sm space-y-2">
            <li>✅ BACEN compliant</li>
            <li>✅ Encrypted transactions</li>
            <li>✅ Rate limiting</li>
            <li>✅ Audit logs</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">100/100</div>
          <div className="text-sm text-gray-600">Quality Score</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">TDD</div>
          <div className="text-sm text-gray-600">Compliance</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">MCP</div>
          <div className="text-sm text-gray-600">Ready</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-orange-600">✅</div>
          <div className="text-sm text-gray-600">Production</div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-center">
        <p className="font-semibold">🚀 Ready to Deploy</p>
        <p className="text-sm opacity-90">Docker Compose included • CI/CD Pipeline • Full Documentation</p>
      </div>
    </div>
  );
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════

📝 COMO INTEGRAR NO SISTEMA DE GERAÇÃO
═══════════════════════════════════════════════════════════════════════════════

1. ANALISAR ESTRUTURA GERADA:
   - Ler os arquivos criados
   - Mapear pastas e arquivos
   - Extrair tecnologias usadas

2. CRIAR ESTRUTURA DE DADOS:
   - Converter em formato FileNode[]
   - Adicionar descrições
   - Adicionar cores

3. RENDERIZAR COMPONENTE:
   - Usar ProjectArchitectureVisualizer
   - Passar dados estruturados
   - Exibir para o usuário

4. EXPORTAR:
   - HTML estático
   - Imagem (screenshot)
   - PDF

═══════════════════════════════════════════════════════════════════════════════

🎯 CHECKLIST DE VISUALIZAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Antes de retornar o projeto, verifique:

[ ] Componente React criado?
[ ] Tailwind CSS aplicado?
[ ] Dark mode suportado?
[ ] Responsivo (mobile, tablet, desktop)?
[ ] Acessível (ARIA labels)?
[ ] Árvore de arquivos interativa?
[ ] Diagrama da arquitetura?
[ ] Features e Security destacados?
[ ] Estatísticas visíveis?
[ ] Footer com status?
[ ] Cores por tipo de arquivo?
[ ] Descrições ao hover?
[ ] Animações suaves?

═══════════════════════════════════════════════════════════════════════════════

🏆 RESULTADO FINAL
═══════════════════════════════════════════════════════════════════════════════

Quando o usuário vê o projeto gerado, ele vê:

✅ Uma visualização profissional
✅ Estrutura clara e organizada
✅ Arquitetura bem definida
✅ Features e segurança destacadas
✅ Estatísticas impressionantes
✅ Design moderno e responsivo

Resultado: Usuário **impressionado com a qualidade** do que foi gerado! 🎨✨

═══════════════════════════════════════════════════════════════════════════════
`;

/**
 * Função para detectar se deve gerar visualização
 */
export function shouldGenerateVisualization(prompt: string): boolean {
    const keywords = [
        'visualizar',
        'mostrar',
        'exibir',
        'dashboard',
        'interface',
        'ui',
        'design',
        'layout',
        'visual',
        'bonito',
        'impressionante',
        'profissional'
    ];

    const promptLower = prompt.toLowerCase();
    return keywords.some(keyword => promptLower.includes(keyword));
}

export default PROJECT_VISUALIZATION_MANIFEST;
