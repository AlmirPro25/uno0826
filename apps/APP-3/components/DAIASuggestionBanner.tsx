/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Suggestion Banner                                     ║
 * ║                                                                               ║
 * ║              Banner que mostra sugestões do DAIA antes de gerar              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';
import { daiaService, type TemplateResult } from '@/services/DAIAService';
import { isDAIAAvailable } from '@/services/DAIAIntegration';

interface DAIASuggestionBannerProps {
    prompt: string;
    onUseSuggestion: (template: TemplateResult) => void;
    onDismiss: () => void;
    className?: string;
}

const DAIASuggestionBanner: React.FC<DAIASuggestionBannerProps> = ({
    prompt,
    onUseSuggestion,
    onDismiss,
    className = ''
}) => {
    const [suggestion, setSuggestion] = useState<TemplateResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkSuggestion = async () => {
            if (!prompt || prompt.length < 10) {
                setIsVisible(false);
                return;
            }

            const available = await isDAIAAvailable();
            if (!available) {
                setIsVisible(false);
                return;
            }

            setIsLoading(true);
            try {
                const result = await daiaService.getSuggestion(prompt);
                if (result && result.similarity > 0.85) {
                    setSuggestion(result);
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.error('[DAIA Suggestion] Erro:', error);
                setIsVisible(false);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce the check
        const timeout = setTimeout(checkSuggestion, 500);
        return () => clearTimeout(timeout);
    }, [prompt]);

    if (!isVisible || !suggestion) return null;

    return (
        <div className={`bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/30 rounded-lg p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-lightbulb text-emerald-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-emerald-400">
                            DAIA encontrou algo similar!
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                            {(suggestion.similarity * 100).toFixed(0)}% similar
                        </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                        "{suggestion.prompt}"
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onUseSuggestion(suggestion)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <i className="fa-solid fa-code" />
                            Usar como base
                        </button>
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                onDismiss();
                            }}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                        >
                            Gerar novo
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <i className="fa-solid fa-times" />
                </button>
            </div>
        </div>
    );
};

export default DAIASuggestionBanner;
