/**
 * ============================================
 * 📦 EXEMPLO DE INTEGRAÇÃO DO TERMINAL PROFISSIONAL
 * ============================================
 * 
 * Este arquivo mostra como integrar o ProfessionalTerminal
 * no seu ChatView ou qualquer outro componente.
 */

import React, { useState } from 'react';
import { ProfessionalTerminal } from '@/components/ProfessionalTerminal';
import { kiroUnifiedAgent, useKiroAgent } from '@/services/KiroUnifiedAgent';

// ============================================
// EXEMPLO 1: Uso básico do Terminal
// ============================================

export const BasicTerminalExample: React.FC = () => {
  const [projectFiles] = useState(['src/App.tsx', 'package.json', 'README.md']);
  const [activeFile, setActiveFile] = useState('src/App.tsx');

  return (
    <div className="h-screen bg-slate-900 p-4">
      <ProfessionalTerminal
        projectFiles={projectFiles}
        activeFile={activeFile}
        onFileSelect={setActiveFile}
        className="h-full"
      />
    </div>
  );
};

// ============================================
// EXEMPLO 2: Terminal com Editor lado a lado
// ============================================

export const TerminalWithEditorExample: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(40); // % da altura

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Editor Area */}
      <div 
        className="flex-1 bg-slate-800"
        style={{ height: showTerminal ? `${100 - terminalHeight}%` : '100%' }}
      >
        {/* Seu editor aqui */}
        <div className="p-4 text-slate-300">
          Editor de Código
        </div>
      </div>

      {/* Terminal Toggle */}
      <button
        onClick={() => setShowTerminal(!showTerminal)}
        className="px-4 py-1 bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
      >
        {showTerminal ? '▼ Esconder Terminal' : '▲ Mostrar Terminal'}
      </button>

      {/* Terminal */}
      {showTerminal && (
        <div style={{ height: `${terminalHeight}%` }}>
          <ProfessionalTerminal />
        </div>
      )}
    </div>
  );
};

// ============================================
// EXEMPLO 3: Uso programático do Agente
// ============================================

export const ProgrammaticAgentExample: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runCommand = async (command: string) => {
    setIsLoading(true);
    setOutput(prev => [...prev, `> ${command}`]);

    try {
      // Criar sessão se não existir
      const sessionId = kiroUnifiedAgent.createSession();

      // Processar com streaming
      await kiroUnifiedAgent.processMessage(
        command,
        sessionId,
        (event) => {
          if (event.type === 'text') {
            setOutput(prev => [...prev, event.content || '']);
          } else if (event.type === 'tool_start') {
            setOutput(prev => [...prev, `🔧 ${event.tool}...`]);
          } else if (event.type === 'error') {
            setOutput(prev => [...prev, `❌ ${event.error}`]);
          }
        }
      );
    } catch (error: any) {
      setOutput(prev => [...prev, `❌ Erro: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-300">
      <h2 className="text-xl mb-4">Agente Programático</h2>
      
      {/* Botões de ação */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => runCommand('liste os arquivos da pasta src')}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded"
        >
          Listar src/
        </button>
        <button
          onClick={() => runCommand('mostre o git status')}
          disabled={isLoading}
          className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded"
        >
          Git Status
        </button>
        <button
          onClick={() => runCommand('busque por useState nos arquivos tsx')}
          disabled={isLoading}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 rounded"
        >
          Buscar useState
        </button>
      </div>

      {/* Output */}
      <div className="bg-slate-800 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        {output.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">{line}</div>
        ))}
        {isLoading && <div className="text-yellow-400">⏳ Processando...</div>}
      </div>
    </div>
  );
};

// ============================================
// EXEMPLO 4: Atalhos rápidos
// ============================================

export const QuickActionsExample: React.FC = () => {
  const { quickRead, quickSearch, quickCommand } = useKiroAgent();
  const [result, setResult] = useState<string>('');

  const actions = [
    {
      label: 'Ler package.json',
      action: async () => {
        const content = await quickRead('package.json');
        setResult(content);
      }
    },
    {
      label: 'Buscar imports',
      action: async () => {
        const results = await quickSearch('import', '**/*.tsx');
        setResult(JSON.stringify(results.slice(0, 5), null, 2));
      }
    },
    {
      label: 'NPM version',
      action: async () => {
        const output = await quickCommand('npm --version');
        setResult(output);
      }
    }
  ];

  return (
    <div className="p-4 bg-slate-900 text-slate-300">
      <h2 className="text-xl mb-4">Ações Rápidas</h2>
      
      <div className="flex gap-2 mb-4">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded"
          >
            {action.label}
          </button>
        ))}
      </div>

      <pre className="bg-slate-800 p-4 rounded text-sm overflow-auto max-h-96">
        {result || 'Clique em uma ação...'}
      </pre>
    </div>
  );
};

export default BasicTerminalExample;
