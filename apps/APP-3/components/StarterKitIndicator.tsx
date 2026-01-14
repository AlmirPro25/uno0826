/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    STARTER KIT INDICATOR - Visual Feedback                    ║
 * ║                                                                               ║
 * ║              Mostra quando código é salvo como Starter Kit                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Check,
  AlertCircle,
  TrendingUp,
  Clock,
  Shield,
  Code,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import type { StarterKit } from '@/services/StarterKitService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface StarterKitIndicatorProps {
  kit: StarterKit | null;
  isSaving?: boolean;
  showDetails?: boolean;
  onPublish?: () => void;
  onViewInMarketplace?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════════

export const StarterKitIndicator: React.FC<StarterKitIndicatorProps> = ({
  kit,
  isSaving = false,
  showDetails = false,
  onPublish,
  onViewInMarketplace,
}) => {
  const [expanded, setExpanded] = useState(showDetails);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animação de sucesso quando kit é salvo
  useEffect(() => {
    if (kit && !isSaving) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [kit, isSaving]);

  if (!kit && !isSaving) {
    return null;
  }

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500 text-white',
    B: 'bg-blue-500 text-white',
    C: 'bg-yellow-500 text-black',
    D: 'bg-orange-500 text-white',
    F: 'bg-red-500 text-white',
  };

  return (
    <div className={`
      rounded-lg border transition-all duration-300
      ${showSuccess 
        ? 'bg-green-900/30 border-green-500' 
        : 'bg-gray-800/50 border-gray-700'
      }
    `}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {isSaving ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showSuccess ? (
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {isSaving ? 'Salvando Starter Kit...' : 'Starter Kit Salvo'}
              </span>
              {kit && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColors[kit.classification.grade]}`}>
                  Grade {kit.classification.grade}
                </span>
              )}
            </div>
            {kit && (
              <span className="text-xs text-gray-400">
                {kit.id} • {kit.metadata.category} • ~{kit.metadata.estimated_hours}h economizadas
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {kit && kit.classification.quality_score >= 60 && !kit.is_public && onPublish && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPublish();
              }}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium
                       transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Publicar
            </button>
          )}
          
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Details */}
      {expanded && kit && (
        <div className="px-3 pb-3 border-t border-gray-700/50 pt-3">
          {/* Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <ScoreItem
              icon={<Code className="w-4 h-4" />}
              label="Qualidade"
              value={kit.classification.quality_score}
            />
            <ScoreItem
              icon={<Shield className="w-4 h-4" />}
              label="Segurança"
              value={kit.classification.security_score}
            />
            <ScoreItem
              icon={<TrendingUp className="w-4 h-4" />}
              label="Arquitetura"
              value={kit.classification.architecture_score}
            />
            <ScoreItem
              icon={<Clock className="w-4 h-4" />}
              label="Manutenção"
              value={kit.classification.maintainability_score}
            />
          </div>

          {/* Patterns & Anti-patterns */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {kit.classification.patterns_detected.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">✅ Padrões detectados</span>
                <div className="flex flex-wrap gap-1">
                  {kit.classification.patterns_detected.slice(0, 5).map(p => (
                    <span key={p} className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {kit.classification.anti_patterns.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">⚠️ Melhorias sugeridas</span>
                <div className="flex flex-wrap gap-1">
                  {kit.classification.anti_patterns.slice(0, 3).map(p => (
                    <span key={p} className="px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded text-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Improvements */}
          {kit.classification.improvements.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-gray-400 block mb-1">💡 Sugestões de melhoria</span>
              <ul className="text-xs text-gray-300 space-y-1">
                {kit.classification.improvements.slice(0, 3).map((imp, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
            <div className="text-xs text-gray-400">
              {kit.classification.is_valid ? (
                <span className="text-green-400">✓ Código válido</span>
              ) : (
                <span className="text-red-400">✗ Código com problemas</span>
              )}
              {' • '}
              Preço sugerido: <span className="text-green-400 font-medium">
                ${kit.marketplace_status.price_usd?.toFixed(0) || '0'}
              </span>
            </div>

            {onViewInMarketplace && (
              <button
                onClick={onViewInMarketplace}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Ver no Marketplace
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface ScoreItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ icon, label, value }) => {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-green-400';
    if (v >= 60) return 'text-yellow-400';
    if (v >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`text-sm font-bold ${getColor(value)}`}>{value}%</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINI INDICATOR (para usar em headers)
// ═══════════════════════════════════════════════════════════════════════════════

interface MiniStarterKitIndicatorProps {
  kit: StarterKit | null;
  onClick?: () => void;
}

export const MiniStarterKitIndicator: React.FC<MiniStarterKitIndicatorProps> = ({
  kit,
  onClick,
}) => {
  if (!kit) return null;

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 
               rounded-lg transition-colors text-sm"
      title={`Starter Kit: ${kit.id}`}
    >
      <Package className="w-4 h-4 text-purple-400" />
      <span className={`w-5 h-5 ${gradeColors[kit.classification.grade]} rounded 
                      flex items-center justify-center text-xs font-bold`}>
        {kit.classification.grade}
      </span>
      <span className="text-gray-400">{kit.classification.quality_score}%</span>
    </button>
  );
};

export default StarterKitIndicator;
