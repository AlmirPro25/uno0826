/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Like Button                                           ║
 * ║                                                                               ║
 * ║              Botão de Like que salva código no DAIA automaticamente          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { sendToDAIA } from '@/services/DAIAIntegration';
import { daiaBrain } from '@/services/DAIABrainService';

interface DAIALikeButtonProps {
    code: string;
    prompt: string;
    modelUsed: string;
    onLiked?: () => void;
    onDisliked?: () => void;
    className?: string;
    showLabels?: boolean;
}

const DAIALikeButton: React.FC<DAIALikeButtonProps> = ({
    code,
    prompt,
    modelUsed,
    onLiked,
    onDisliked,
    className = '',
    showLabels = true
}) => {
    const [rating, setRating] = useState<'liked' | 'disliked' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedToDAIA, setSavedToDAIA] = useState(false);

    const handleLike = async () => {
        if (rating === 'liked') return;
        
        setRating('liked');
        setIsSaving(true);

        try {
            // Tenta salvar no DAIA
            const success = await sendToDAIA({
                code,
                prompt,
                modelUsed,
                userRating: 'liked',
                isGoodForTraining: true,
                score: 85
            });

            setSavedToDAIA(success);
            
            if (success) {
                console.log('[DAIA Like] ✅ Código salvo no DAIA');
            }

            onLiked?.();
        } catch (error) {
            console.error('[DAIA Like] Erro ao salvar:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDislike = () => {
        if (rating === 'disliked') return;
        setRating('disliked');
        setSavedToDAIA(false);
        onDisliked?.();
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Like Button */}
            <button
                onClick={handleLike}
                disabled={isSaving}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all
                    ${rating === 'liked'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 border border-transparent'
                    }
                    ${isSaving ? 'opacity-50 cursor-wait' : ''}
                `}
                title={savedToDAIA ? 'Salvo no DAIA!' : 'Gostei - Salvar no DAIA'}
            >
                {isSaving ? (
                    <i className="fa-solid fa-spinner fa-spin text-sm" />
                ) : (
                    <i className={`fa-${rating === 'liked' ? 'solid' : 'regular'} fa-thumbs-up text-sm`} />
                )}
                {showLabels && (
                    <span className="text-xs font-medium">
                        {savedToDAIA ? 'Salvo!' : 'Gostei'}
                    </span>
                )}
            </button>

            {/* Dislike Button */}
            <button
                onClick={handleDislike}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all
                    ${rating === 'disliked'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent'
                    }
                `}
                title="Não gostei"
            >
                <i className={`fa-${rating === 'disliked' ? 'solid' : 'regular'} fa-thumbs-down text-sm`} />
                {showLabels && <span className="text-xs font-medium">Não gostei</span>}
            </button>

            {/* DAIA Indicator */}
            {savedToDAIA && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 ml-2">
                    <i className="fa-solid fa-brain" />
                    DAIA
                </span>
            )}
        </div>
    );
};

export default DAIALikeButton;
