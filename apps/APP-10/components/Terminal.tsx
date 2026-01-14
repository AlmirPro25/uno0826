
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { TerminalSquare, Trash2 } from 'lucide-react';
import { isLocalMode } from '../services/runtimeBridge';

interface TerminalProps {
    onInput?: (input: string) => void;
    onResize?: (cols: number, rows: number) => void;
    onOpenFile?: (path: string) => void;
    className?: string;
    terminalInstanceRef: React.MutableRefObject<XTerm | null>;
}

export const Terminal: React.FC<TerminalProps> = ({ onInput, onResize, onOpenFile, className = "", terminalInstanceRef }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const term = new XTerm({
            theme: {
                background: '#0c0c0e',
                foreground: '#f8fafc',
                cursor: '#a5b4fc',
                cursorAccent: '#0c0c0e',
                selectionBackground: '#4338ca50',
                selectionForeground: '#ffffff',
                black: '#000000',
                red: '#ef4444',
                green: '#22c55e',
                yellow: '#eab308',
                blue: '#3b82f6',
                magenta: '#d946ef',
                cyan: '#06b6d4',
                white: '#ffffff',
                brightBlack: '#71717a',
                brightRed: '#f87171',
                brightGreen: '#4ade80',
                brightYellow: '#fde047',
                brightBlue: '#60a5fa',
                brightMagenta: '#e879f9',
                brightCyan: '#22d3ee',
                brightWhite: '#ffffff',
            },
            fontSize: 13,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            fontWeight: 'normal',
            fontWeightBold: 'bold',
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 10000,
            tabStopWidth: 4,
            allowProposedApi: true,
            convertEol: true,
            // Melhor renderização
            drawBoldTextInBrightColors: true,
            minimumContrastRatio: 1,
        });

        // 1. Fit Addon
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddonRef.current = fitAddon;

        // 2. Web Links Addon (http/https)
        term.loadAddon(new WebLinksAddon());

        term.open(containerRef.current);
        
        // 3. Custom File Link Provider (Detects paths like src/App.tsx:10:5)
        if (onOpenFile) {
            term.registerLinkProvider({
                provideLinks: (bufferLineNumber, callback) => {
                    const line = term.buffer.active.getLine(bufferLineNumber - 1);
                    if (!line) return;
                    
                    const text = line.translateToString(true);
                    const links: any[] = [];
                    
                    // Regex to match filenames with common extensions, optional line/column numbers
                    // e.g., src/components/Button.tsx, ./index.js:10, App.tsx
                    const regex = /(?:\.{0,2}\/)?[\w\-\/]+\.(?:tsx|ts|jsx|js|css|html|json|md)(?::\d+(?::\d+)?)?/g;
                    
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const pathWithLine = match[0];
                        const startIndex = match.index;
                        const endIndex = match.index + pathWithLine.length;
                        
                        links.push({
                            range: { start: { x: startIndex + 1, y: bufferLineNumber }, end: { x: endIndex, y: bufferLineNumber } },
                            text: pathWithLine,
                            activate: (event: MouseEvent, text: string) => {
                                // Strip line numbers for opening the file (e.g. src/App.tsx:10 -> src/App.tsx)
                                const cleanPath = text.split(':')[0];
                                onOpenFile(cleanPath);
                            }
                        });
                    }
                    
                    callback(links);
                }
            });
        }

        // Initial welcome message
        if (isLocalMode) {
            term.writeln('\x1b[1;35m╔══════════════════════════════════════════════════╗\x1b[0m');
            term.writeln('\x1b[1;35m║  🖥️  Aether PowerShell - Real Terminal           ║\x1b[0m');
            term.writeln('\x1b[1;35m╚══════════════════════════════════════════════════╝\x1b[0m');
            term.writeln('\x1b[90mReal system access enabled. Type commands directly.\x1b[0m');
            term.writeln('');
        } else {
            term.writeln('\x1b[1;34m✨ Aether Maestro Terminal\x1b[0m');
            term.writeln('\x1b[90mSystem Ready. Links & Colors Enabled.\x1b[0m');
        }
        
        if (onInput) {
            term.onData(data => {
                onInput(data);
            });
        }

        if (onResize) {
            term.onResize(size => {
                onResize(size.cols, size.rows);
            });
        }

        terminalInstanceRef.current = term;
        
        // Helper for safe fitting
        const fit = () => {
            if (!containerRef.current || !term.element) return;
            
            // Critical: Check if the element is actually visible in the DOM.
            // If offsetParent is null, the element is hidden (display: none), and fit() will crash.
            if (containerRef.current.offsetParent === null) return;
            if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) return;
            
            try {
                fitAddon.fit();
                const dims = fitAddon.proposeDimensions();
                if (dims && onResize) {
                    onResize(dims.cols, dims.rows);
                }
            } catch (e) {
                // Swallow fit errors that occur when element is hidden or not ready
            }
        };

        // Safe fit after small delay to ensure DOM is ready
        setTimeout(() => {
             fit();
        }, 100);

        // Setup ResizeObserver for robust layout handling
        resizeObserverRef.current = new ResizeObserver(() => {
            // Wrap in requestAnimationFrame to avoid Loop Limit Exceeded
            requestAnimationFrame(() => {
                fit();
            });
        });
        resizeObserverRef.current.observe(containerRef.current);

        return () => {
            resizeObserverRef.current?.disconnect();
            term.dispose();
        };
    }, []);

    const handleClear = () => {
        terminalInstanceRef.current?.clear();
        if (isLocalMode) {
            terminalInstanceRef.current?.writeln('\x1b[1;35m🖥️ Terminal Cleared (PowerShell)\x1b[0m');
        } else {
            terminalInstanceRef.current?.writeln('\x1b[1;34m✨ Terminal Cleared\x1b[0m');
        }
    };

    return (
        <div className={`flex flex-col h-full bg-[#0c0c0e] ${className}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                    <TerminalSquare className={`w-4 h-4 ${isLocalMode ? 'text-purple-400' : 'text-indigo-400'}`} />
                    <span className="text-xs font-medium text-slate-300">
                        {isLocalMode ? 'PowerShell' : 'Terminal'}
                    </span>
                    {isLocalMode && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">LOCAL</span>
                    )}
                </div>
                <button 
                    onClick={handleClear}
                    className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition-colors"
                    title="Clear Terminal"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
            <div ref={containerRef} className="flex-1 overflow-hidden p-2 custom-scrollbar" />
        </div>
    );
};
