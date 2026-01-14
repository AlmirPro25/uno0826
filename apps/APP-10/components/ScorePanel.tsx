
import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { ExcellenceReport } from '../types';

interface ScorePanelProps {
  report: ExcellenceReport;
  onAutoFix?: () => void;
  isFixing?: boolean;
  className?: string;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ report, onAutoFix, isFixing = false, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    if (score >= 70) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    return 'text-red-400 border-red-500/50 bg-red-500/10';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Improvement';
  };

  const baseColorClass = getScoreColor(report.score);

  return (
    <div className={`relative z-20 ${className}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-3 px-3 py-1.5 rounded-md border transition-all duration-200 ${baseColorClass} hover:bg-opacity-20`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
             <Shield className="w-4 h-4" />
             {report.score >= 90 && <Sparkles className="w-2 h-2 absolute -top-1 -right-1 text-emerald-200 animate-pulse" />}
          </div>
          <span className="font-bold font-mono text-xs">{report.score}/100</span>
        </div>
        <div className="w-px h-3 bg-current opacity-20"></div>
        <span className="text-xs font-medium hidden sm:inline">{getScoreLabel(report.score)}</span>
        {isExpanded ? <ChevronUp className="w-3 h-3 opacity-70" /> : <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#18181b] border border-slate-700 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Excellence Report</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${
                    report.securityLevel === 'high' ? 'border-emerald-500/30 text-emerald-400' : 
                    report.securityLevel === 'medium' ? 'border-yellow-500/30 text-yellow-400' : 
                    'border-red-500/30 text-red-400'
                }`}>
                    Security: {report.securityLevel}
                </span>
            </div>
            
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {report.critique}
            </p>

            {report.improvements.length > 0 && (
                <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase">Recommended Fixes</span>
                    <ul className="space-y-1.5">
                        {report.improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                                <AlertTriangle className="w-3 h-3 text-yellow-500/70 shrink-0 mt-0.5" />
                                <span>{imp}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Auto-Refine Action */}
            {report.score < 95 && onAutoFix && (
                <div className="mt-4 pt-3 border-t border-white/5">
                   <button 
                      onClick={onAutoFix}
                      disabled={isFixing}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                   >
                      {isFixing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Refining Code...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Auto-Refine Project</span>
                        </>
                      )}
                   </button>
                </div>
            )}
            
            {report.score >= 95 && (
                 <div className="mt-4 pt-3 border-t border-white/5 text-center">
                    <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Codebase Optimized
                    </span>
                 </div>
            )}
        </div>
      )}
    </div>
  );
};
