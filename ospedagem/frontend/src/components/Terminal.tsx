'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, Copy, Check, Maximize2, Minimize2, X } from 'lucide-react';

interface TerminalProps {
  title?: string;
  logs: string[];
  isStreaming?: boolean;
  maxHeight?: string;
  onClear?: () => void;
}

export function Terminal({ 
  title = 'Terminal', 
  logs, 
  isStreaming = false,
  maxHeight = 'h-80',
  onClear
}: TerminalProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLog = (log: string) => {
    // Colorização baseada no conteúdo
    if (log.includes('❌') || log.includes('ERRO') || log.includes('Error')) {
      return 'text-red-400';
    }
    if (log.includes('✅') || log.includes('SUCCESS') || log.includes('concluído')) {
      return 'text-emerald-400';
    }
    if (log.includes('⚠️') || log.includes('WARN')) {
      return 'text-amber-400';
    }
    if (log.includes('🚀') || log.includes('🔨') || log.includes('📦')) {
      return 'text-cyan-400';
    }
    return 'text-slate-300';
  };

  return (
    <motion.div 
      layout
      className={`bg-black/90 rounded-xl border border-slate-800 overflow-hidden ${
        isExpanded ? 'fixed inset-4 z-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button 
              onClick={onClear}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
              title="Limpar"
            />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <TerminalIcon className="w-4 h-4" />
            <span className="text-xs font-medium">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-2 text-xs text-cyan-400 mr-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
          <button 
            onClick={copyLogs}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors"
            title="Copiar logs"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-slate-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`p-4 overflow-y-auto font-mono text-sm scrollbar-hide ${
        isExpanded ? 'h-[calc(100%-48px)]' : maxHeight
      }`}>
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-600"
            >
              Aguardando logs...
            </motion.p>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="py-0.5 flex"
              >
                <span className="text-slate-600 w-20 flex-shrink-0 select-none">
                  {String(i + 1).padStart(3, '0')} │
                </span>
                <span className={formatLog(log)}>{log}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {isStreaming && (
          <div className="py-0.5 flex">
            <span className="text-slate-600 w-20 flex-shrink-0">
              {String(logs.length + 1).padStart(3, '0')} │
            </span>
            <span className="text-cyan-400 animate-pulse">▋</span>
          </div>
        )}
        
        <div ref={logsEndRef} />
      </div>

      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </motion.div>
  );
}
