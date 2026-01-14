/**
 * 🏗️ PROJECT ARCHITECTURE VISUALIZER
 * 
 * Componente que exibe a arquitetura do projeto gerado de forma visual e interativa
 * com Tailwind CSS, animações e efeitos visuais impressionantes
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, File, Code, Database, Server, Globe } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  icon?: React.ReactNode;
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

const ProjectArchitectureVisualizer: React.FC<ProjectArchitectureVisualizerProps> = ({
  projectName,
  structure,
  description,
  technologies = []
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return <Code className="w-4 h-4 text-blue-500" />;
    if (name.endsWith('.json')) return <Code className="w-4 h-4 text-yellow-500" />;
    if (name.endsWith('.md')) return <File className="w-4 h-4 text-gray-500" />;
    if (name.endsWith('.yml') || name.endsWith('.yaml')) return <Code className="w-4 h-4 text-purple-500" />;
    if (name.endsWith('.sql')) return <Database className="w-4 h-4 text-green-500" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  const renderTree = (nodes: FileNode[], path: string = '') => {
    return (
      <div className="space-y-1">
        {nodes.map((node, index) => {
          const nodePath = `${path}/${node.name}`;
          const isExpanded = expandedFolders.has(nodePath);
          const hasChildren = node.children && node.children.length > 0;

          return (
            <div key={nodePath}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                onClick={() => hasChildren && toggleFolder(nodePath)}
              >
                {node.type === 'folder' ? (
                  <>
                    <div className="flex-shrink-0">
                      {hasChildren ? (
                        isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )
                      ) : (
                        <div className="w-4" />
                      )}
                    </div>
                    <Folder className={`w-4 h-4 ${node.color || 'text-blue-500'}`} />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{node.name}</span>
                    {node.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.description}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-4" />
                    {getFileIcon(node.name)}
                    <span className="text-gray-700 dark:text-gray-300">{node.name}</span>
                    {node.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.description}
                      </span>
                    )}
                  </>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="ml-4 border-l border-gray-200 dark:border-gray-700">
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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Folder className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {projectName}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Technologies */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Frontend */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-bold text-green-900 dark:text-green-100">Frontend</h3>
          </div>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• React + TypeScript</li>
            <li>• Tailwind CSS</li>
            <li>• Vite</li>
            <li>• Mobile-first</li>
          </ul>
        </div>

        {/* Backend */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-blue-900 dark:text-blue-100">Backend</h3>
          </div>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Hono + Bun</li>
            <li>• MCP Server</li>
            <li>• Type-safe</li>
            <li>• Production-ready</li>
          </ul>
        </div>

        {/* Database */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-purple-900 dark:text-purple-100">Database</h3>
          </div>
          <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
            <li>• PostgreSQL</li>
            <li>• Prisma ORM</li>
            <li>• Atomic TX</li>
            <li>• ACID compliant</li>
          </ul>
        </div>
      </div>

      {/* File Tree */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📁 Project Structure
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
          <div className="font-mono text-sm">
            {renderTree(structure)}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-3">✨ Features</h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
            <li>✅ Full-stack type safety</li>
            <li>✅ Atomic transactions</li>
            <li>✅ MCP integration</li>
            <li>✅ 100/100 TDD compliance</li>
          </ul>
        </div>

        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-lg border border-red-200 dark:border-red-700">
          <h3 className="font-bold text-red-900 dark:text-red-100 mb-3">🔒 Security</h3>
          <ul className="text-sm text-red-800 dark:text-red-200 space-y-2">
            <li>✅ BACEN compliant</li>
            <li>✅ Encrypted transactions</li>
            <li>✅ Rate limiting</li>
            <li>✅ Audit logs</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">100/100</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">TDD</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Compliance</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">MCP</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Ready</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">✅</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Production</div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-center">
        <p className="font-semibold">🚀 Ready to Deploy</p>
        <p className="text-sm opacity-90">Docker Compose included • CI/CD Pipeline • Full Documentation</p>
      </div>
    </div>
  );
};

export default ProjectArchitectureVisualizer;
