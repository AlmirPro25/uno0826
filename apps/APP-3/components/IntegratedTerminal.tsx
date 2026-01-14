/**
 * ============================================
 * TERMINAL INTEGRADO TURBINADO - COMPONENTE
 * ============================================
 * 
 * Terminal inteligente com:
 * - Modo CLI (comandos diretos)
 * - Modo Agente (linguagem natural com tool calling)
 * - Kiro Tools integradas
 * - Análise de IA
 */

import * as React from 'react';
import { terminalMaestro, type TerminalAnalysis } from '@/services/TerminalMaestro';
import { kiroAgent } from '@/services/KiroAgentService';
import { kiroToolExecutor, type ToolResult } from '@/services/KiroToolExecutor';

const { useState, useRef, useEffect } = React;

interface IntegratedTerminalProps {
    projectFiles?: string[];
    onCommandExecuted?: (command: string, output: string) => void;
}

interface TerminalLine {
    id: string;
    type: 'command' | 'output' | 'error' | 'info' | 'suggestion' | 'tool' | 'agent';
    content: string;
    timestamp: Date;
    analysis?: TerminalAnalysis;
    toolName?: string;
}

type TerminalMode = 'cli' | 'agent';

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
    projectFiles = [],
    onCommandExecuted
}) => {
    const [lines, setLines] = useState<TerminalLine[]>([
        {
            id: '0',
            type: 'info',
            content: '🚀 Terminal KIRO TURBINADO - Digite "help" para comandos ou use linguagem natural',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mode, setMode] = useState<TerminalMode>('agent');
    const [showQuickActions, setShowQuickActions] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    
    // Verificar status do backend
    useEffect(() => {
        checkBackendStatus();
        const interval = setInterval(checkBackendStatus, 10000);
        return () => clearInterval(interval);
    }, []);
    
    // Auto-scroll para o final
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [lines]);
    
    // Carregar sugestões quando input muda
    useEffect(() => {
        if (input.length > 2 && mode === 'cli') {
            loadSuggestions();
        } else {
            setShowSuggestions(false);
        }
    }, [input, mode]);
    
    const checkBackendStatus = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/health');
            if (response.ok) {
                setBackendStatus('online');
            } else {
                setBackendStatus('offline');
            }
        } catch {
            setBackendStatus('offline');
        }
    };
    
    const loadSuggestions = async () => {
        const lastCommand = commandHistory[commandHistory.length - 1];
        const lastOutput = lines.filter(l => l.type === 'output').slice(-1)[0]?.content;
        
        const suggestions = await terminalMaestro.suggestNextCommand({
            lastCommand,
            lastOutput,
            projectFiles
        });
        
        setSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
    };
    
    const addLine = (type: TerminalLine['type'], content: string, extra?: Partial<TerminalLine>) => {
        const newLine: TerminalLine = {
            id: Date.now().toString() + Math.random(),
            type,
            content,
            timestamp: new Date(),
            ...extra
        };
        
        setLines(prev => [...prev, newLine]);
    };
    
    // ========== MODO AGENTE (Linguagem Natural) ==========
    const executeAgentCommand = async (userInput: string) => {
        addLine('command', `🤖 ${userInput}`);
        setCommandHistory(prev => [...prev, userInput]);
        setHistoryIndex(-1);
        setIsExecuting(true);
        
        try {
            addLine('info', '🧠 Processando com IA...');
            
            const response = await kiroAgent.processMessage(userInput);
            
            if (response.toolsUsed.length > 0) {
                addLine('tool', `� Toopls usadas: ${response.toolsUsed.join(', ')}`);
            }
            
            if (response.success) {
                addLine('agent', response.message);
            } else {
                addLine('error', response.message);
            }
            
            if (onCommandExecuted) {
                onCommandExecuted(userInput, response.message);
            }
        } catch (error: any) {
            addLine('error', `❌ Erro: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    };
    
    // ========== MODO CLI (Comandos Diretos) ==========
    const executeCLICommand = async (command: string) => {
        addLine('command', `$ ${command}`);
        setCommandHistory(prev => [...prev, command]);
        setHistoryIndex(-1);
        setIsExecuting(true);
        
        try {
            // Comandos especiais do terminal
            if (command === 'clear' || command === 'cls') {
                clearTerminal();
                setIsExecuting(false);
                return;
            }
            
            if (command === 'help') {
                showHelp();
                setIsExecuting(false);
                return;
            }
            
            if (command === 'mode agent') {
                setMode('agent');
                addLine('info', '🤖 Modo Agente ativado - Use linguagem natural');
                setIsExecuting(false);
                return;
            }
            
            if (command === 'mode cli') {
                setMode('cli');
                addLine('info', '💻 Modo CLI ativado - Use comandos diretos');
                setIsExecuting(false);
                return;
            }
            
            // Interpretar comando com IA
            addLine('info', '🤖 Analisando comando...');
            const interpretation = await terminalMaestro.interpretCommand(command);
            
            if (!interpretation.understood) {
                addLine('error', `❌ ${interpretation.explanation}`);
                setIsExecuting(false);
                return;
            }
            
            addLine('info', `💡 ${interpretation.explanation}`);
            
            if (interpretation.needsConfirmation && interpretation.risks) {
                addLine('info', `⚠️  Riscos: ${interpretation.risks.join(', ')}`);
                addLine('info', '⚠️  Digite "confirm" para confirmar');
                setIsExecuting(false);
                return;
            }
            
            if (backendStatus === 'offline') {
                addLine('error', '❌ Backend offline. Inicie: npm run backend');
                setIsExecuting(false);
                return;
            }
            
            addLine('info', '⚡ Executando...');
            
            const result = await executeViaBackend(interpretation.cliCommand || command);
            
            if (result.success) {
                addLine('output', result.output);
                
                const analysis = await terminalMaestro.analyzeOutput(
                    command,
                    result.output,
                    result.exitCode || 0
                );
                
                if (analysis.hasError) {
                    addLine('error', `❌ ${analysis.errorMessage}`);
                    if (analysis.suggestion) {
                        addLine('suggestion', `💡 ${analysis.suggestion}`);
                    }
                } else {
                    addLine('info', '✅ Sucesso!');
                }
                
                terminalMaestro.addToHistory({
                    id: Date.now().toString(),
                    command,
                    output: result.output,
                    exitCode: result.exitCode || 0,
                    timestamp: new Date().toISOString(),
                    duration: result.duration || 0,
                    type: 'cli'
                });
                
                if (onCommandExecuted) {
                    onCommandExecuted(command, result.output);
                }
            } else {
                addLine('error', `❌ ${result.error}`);
            }
        } catch (error: any) {
            addLine('error', `❌ Erro: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    };
    
    const executeViaBackend = async (command: string): Promise<any> => {
        try {
            // CORRIGIDO: Endpoint correto
            const response = await fetch('http://localhost:3001/api/terminal/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    output: data.stdout || data.output || 'OK',
                    exitCode: data.exitCode || 0,
                    duration: data.duration || 0
                };
            } else {
                return {
                    success: false,
                    error: data.error || data.stderr || 'Erro',
                    exitCode: 1
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                exitCode: 1
            };
        }
    };
    
    // ========== QUICK ACTIONS (Kiro Tools) ==========
    const quickActions = [
        { icon: '📂', label: 'Listar', action: () => executeQuickTool('list', '.') },
        { icon: '🔍', label: 'Buscar', action: () => promptAndExecute('Buscar texto:', 'search') },
        { icon: '📄', label: 'Ler', action: () => promptAndExecute('Arquivo:', 'read') },
        { icon: '📊', label: 'Diagnóstico', action: () => promptAndExecute('Arquivo:', 'diag') },
        { icon: '�', laabel: 'Criar', action: () => promptAndExecute('Nome do arquivo:', 'create') },
        { icon: '🔄', label: 'Git Status', action: () => executeQuickTool('git', 'status') },
        { icon: '📦', label: 'NPM Install', action: () => executeQuickTool('npm', 'install') },
        { icon: '🏗️', label: 'Build', action: () => executeQuickTool('npm', 'run build') },
    ];
    
    const executeQuickTool = async (tool: string, arg: string) => {
        setIsExecuting(true);
        try {
            let result: ToolResult;
            switch (tool) {
                case 'list':
                    result = await kiroToolExecutor.execute('listDirectory', { path: arg, depth: 2 });
                    if (result.success) {
                        addLine('output', formatTree(result.data));
                    } else {
                        addLine('error', result.error || 'Erro');
                    }
                    break;
                case 'git':
                    addLine('info', `⚡ Executando: git ${arg}`);
                    result = await kiroToolExecutor.execute('executeCommand', { command: `git ${arg}` });
                    if (result.success) {
                        addLine('output', result.data?.stdout || 'OK');
                    } else {
                        addLine('error', result.error || result.data?.stderr || 'Erro');
                    }
                    break;
                case 'npm':
                    addLine('info', `⚡ Executando: npm ${arg}`);
                    result = await kiroToolExecutor.execute('executeCommand', { command: `npm ${arg}` });
                    if (result.success) {
                        addLine('output', result.data?.stdout || '✅ Concluído!');
                        if (result.data?.stderr) {
                            addLine('info', result.data.stderr);
                        }
                    } else {
                        addLine('error', result.error || result.data?.stderr || 'Erro');
                    }
                    break;
            }
        } catch (error: any) {
            addLine('error', error.message);
        } finally {
            setIsExecuting(false);
        }
    };
    
    const promptAndExecute = async (prompt: string, tool: string) => {
        const value = window.prompt(prompt);
        if (!value) return;
        
        setIsExecuting(true);
        try {
            let result: ToolResult;
            switch (tool) {
                case 'search':
                    result = await kiroToolExecutor.execute('grepSearch', { query: value });
                    if (result.success && result.data) {
                        addLine('output', `🔍 Resultados para "${value}":\n${formatSearchResults(result.data)}`);
                    } else {
                        addLine('info', 'Nenhum resultado encontrado');
                    }
                    break;
                case 'read':
                    result = await kiroToolExecutor.execute('readFile', { path: value });
                    if (result.success) {
                        addLine('output', `📄 ${value}:\n${result.data?.substring(0, 2000)}${result.data?.length > 2000 ? '\n...(truncado)' : ''}`);
                    } else {
                        addLine('error', result.error || 'Arquivo não encontrado');
                    }
                    break;
                case 'diag':
                    result = await kiroToolExecutor.execute('getDiagnostics', { paths: [value] });
                    if (result.success) {
                        addLine('output', `📊 Diagnóstico de ${value}:\n${JSON.stringify(result.data, null, 2)}`);
                    } else {
                        addLine('error', result.error || 'Erro');
                    }
                    break;
                case 'create':
                    const content = window.prompt('Conteúdo inicial (ou deixe vazio):') || '';
                    result = await kiroToolExecutor.execute('writeFile', { path: value, content });
                    if (result.success) {
                        addLine('output', `✅ Arquivo criado: ${value}`);
                    } else {
                        addLine('error', result.error || 'Erro ao criar arquivo');
                    }
                    break;
            }
        } catch (error: any) {
            addLine('error', error.message);
        } finally {
            setIsExecuting(false);
        }
    };
    
    const formatTree = (tree: any): string => {
        if (!tree) return 'Vazio';
        if (typeof tree === 'string') return tree;
        return JSON.stringify(tree, null, 2);
    };
    
    const formatSearchResults = (results: any[]): string => {
        if (!results || results.length === 0) return 'Nenhum resultado';
        return results.slice(0, 20).map(r => 
            `${r.file}:${r.line}: ${r.content?.substring(0, 100)}`
        ).join('\n');
    };
    
    const executeCommand = async (command: string) => {
        if (!command.trim()) return;
        
        if (mode === 'agent') {
            await executeAgentCommand(command);
        } else {
            await executeCLICommand(command);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeCommand(input);
            setInput('');
            setShowSuggestions(false);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1 
                    ? commandHistory.length - 1 
                    : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setInput('');
                } else {
                    setHistoryIndex(newIndex);
                    setInput(commandHistory[newIndex]);
                }
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (suggestions.length > 0) {
                setInput(suggestions[0]);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };
    
    const clearTerminal = () => {
        setLines([{
            id: Date.now().toString(),
            type: 'info',
            content: '🚀 Terminal limpo',
            timestamp: new Date()
        }]);
        kiroAgent.clearHistory();
    };
    
    const showHelp = () => {
        addLine('info', `
╔══════════════════════════════════════════════════════════════╗
║                    KIRO TURBINADO HELP                       ║
╠══════════════════════════════════════════════════════════════╣
║  MODOS:                                                      ║
║    mode agent  - Linguagem natural (IA executa tools)        ║
║    mode cli    - Comandos diretos                            ║
║                                                              ║
║  COMANDOS:                                                   ║
║    clear/cls   - Limpar terminal                             ║
║    help        - Esta ajuda                                  ║
║                                                              ║
║  MODO AGENTE (exemplos):                                     ║
║    "liste os arquivos da pasta src"                          ║
║    "busque por useState nos arquivos tsx"                    ║
║    "leia o arquivo package.json"                             ║
║    "crie um arquivo test.txt com Hello World"                ║
║    "execute npm run build"                                   ║
║                                                              ║
║  QUICK ACTIONS: Clique nos botões acima do input             ║
╚══════════════════════════════════════════════════════════════╝
        `);
    };
    
    const getLineColor = (type: TerminalLine['type']) => {
        switch (type) {
            case 'command': return 'text-sky-400';
            case 'output': return 'text-slate-300';
            case 'error': return 'text-red-400';
            case 'info': return 'text-blue-400';
            case 'suggestion': return 'text-green-400';
            case 'tool': return 'text-purple-400';
            case 'agent': return 'text-emerald-400';
            default: return 'text-slate-300';
        }
    };
    
    const getLineIcon = (type: TerminalLine['type']) => {
        switch (type) {
            case 'command': return mode === 'agent' ? '🤖' : '❯';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            case 'suggestion': return '💡';
            case 'tool': return '🔧';
            case 'agent': return '✨';
            default: return '';
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 rounded-t-lg">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-terminal text-sky-400"></i>
                    <span className="text-sm font-semibold text-slate-200">KIRO TURBINADO</span>
                    
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-0.5">
                        <button
                            onClick={() => setMode('agent')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                mode === 'agent' 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            🤖 Agente
                        </button>
                        <button
                            onClick={() => setMode('cli')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                mode === 'cli' 
                                    ? 'bg-sky-600 text-white' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            💻 CLI
                        </button>
                    </div>
                    
                    {/* Backend Status */}
                    <div className={`flex items-center gap-1 text-xs ${
                        backendStatus === 'online' ? 'text-green-400' :
                        backendStatus === 'offline' ? 'text-red-400' :
                        'text-yellow-400'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            backendStatus === 'online' ? 'bg-green-400' :
                            backendStatus === 'offline' ? 'bg-red-400' :
                            'bg-yellow-400 animate-pulse'
                        }`}></div>
                        <span>{backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : '...'}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            showQuickActions ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                        title="Quick Actions"
                    >
                        <i className="fa-solid fa-bolt mr-1"></i>
                        Tools
                    </button>
                    <button
                        onClick={clearTerminal}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                        title="Limpar"
                    >
                        <i className="fa-solid fa-broom"></i>
                    </button>
                </div>
            </div>
            
            {/* Quick Actions Bar */}
            {showQuickActions && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.action}
                            disabled={isExecuting}
                            className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded transition-colors flex items-center gap-1"
                        >
                            <span>{action.icon}</span>
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
            
            {/* Terminal Output */}
            <div 
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
            >
                {lines.map(line => (
                    <div key={line.id} className={`${getLineColor(line.type)} flex items-start gap-2`}>
                        <span className="flex-shrink-0 w-5">{getLineIcon(line.type)}</span>
                        <span className="flex-1 whitespace-pre-wrap break-words">{line.content}</span>
                    </div>
                ))}
                
                {isExecuting && (
                    <div className="text-yellow-400 flex items-center gap-2">
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>{mode === 'agent' ? 'Processando com IA...' : 'Executando...'}</span>
                    </div>
                )}
            </div>
            
            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="flex-shrink-0 px-4 py-2 bg-slate-800 border-t border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">💡 Sugestões (Tab):</div>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setInput(suggestion);
                                    setShowSuggestions(false);
                                    inputRef.current?.focus();
                                }}
                                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Input */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-800 border-t border-slate-700 rounded-b-lg">
                <span className={mode === 'agent' ? 'text-emerald-400' : 'text-sky-400'}>
                    {mode === 'agent' ? '🤖' : '$'}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === 'agent' 
                        ? 'Diga o que você quer fazer em linguagem natural...' 
                        : 'Digite um comando...'}
                    className="flex-1 bg-transparent text-slate-200 font-mono text-sm focus:outline-none placeholder-slate-500"
                    disabled={isExecuting}
                    autoFocus
                />
                <button
                    onClick={() => {
                        executeCommand(input);
                        setInput('');
                    }}
                    disabled={!input.trim() || isExecuting}
                    className={`px-3 py-1 text-xs text-white rounded transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed ${
                        mode === 'agent' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
                    }`}
                >
                    {isExecuting ? (
                        <i className="fa-solid fa-spinner animate-spin"></i>
                    ) : (
                        <i className="fa-solid fa-paper-plane"></i>
                    )}
                </button>
            </div>
        </div>
    );
};
