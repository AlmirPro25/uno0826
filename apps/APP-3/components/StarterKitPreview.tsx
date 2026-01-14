/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    STARTER KIT PREVIEW - Preview Component                    ║
 * ║                                                                               ║
 * ║              Mostra preview do kit quando código é gerado                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import {
  Package,
  Star,
  Shield,
  Accessibility,
  Zap,
  Code,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { StarterKit } from '@/services/StarterKitService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface StarterKitPreviewProps {
  kit: {
    id: string;
    grade: string;
    quality_score: number;
    category: string;
    complexity: string;
    estimated_hours: number;
  };
  onViewDetails?: () => void;
  onPublish?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const StarterKitPreview: React.FC<StarterKitPreviewProps> = ({
  kit,
  onViewDetails,
  onPublish,
  onDismiss,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    B: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    C: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    D: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    F: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  };

  const complexityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    enterprise: 'Enterprise',
  };

  const colors = gradeColors[kit.grade] || gradeColors.C;
  const canPublish = kit.quality_score >= 60;

  if (compact && !expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer
                   ${colors.bg} ${colors.border} border transition-all hover:scale-[1.02]`}
      >
        <Package className={`w-4 h-4 ${colors.text}`} />
        <span className={`font-bold ${colors.text}`}>Grade {kit.grade}</span>
        <span className="text-gray-400 text-sm">•</span>
        <span className="text-gray-300 text-sm">{kit.quality_score}% qualidade</span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
      </div>
    );
  }

  return (
    <div className={`rounded-lg ${colors.bg} ${colors.border} border overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border
                         flex items-center justify-center`}>
            <span className={`text-lg font-bold ${colors.text}`}>{kit.grade}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Package className={`w-4 h-4 ${colors.text}`} />
              <span className="font-medium text-white">Starter Kit Salvo</span>
            </div>
            <span className="text-xs text-gray-400">ID: {kit.id.slice(0, 8)}...</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {compact && (
            <button
              onClick={() => setExpanded(false)}
              className="p-1 hover:bg-gray-700/50 rounded"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-gray-700/50 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreItem
            icon={<Code className="w-4 h-4" />}
            label="Qualidade"
            value={kit.quality_score}
          />
          <ScoreItem
            icon={<Clock className="w-4 h-4" />}
            label="Horas economizadas"
            value={kit.estimated_hours}
            suffix="h"
            isTime
          />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
            {kit.category}
          </span>
          <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
            {complexityLabels[kit.complexity] || kit.complexity}
          </span>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-2 text-sm ${canPublish ? 'text-green-400' : 'text-yellow-400'}`}>
          {canPublish ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Qualidade suficiente para publicar no Marketplace</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>Qualidade abaixo do mínimo para publicação (60%)</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              Ver Detalhes
            </button>
          )}
          {onPublish && canPublish && (
            <button
              onClick={onPublish}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Publicar
            </button>
          )}
        </div>
      </div>
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
  suffix?: string;
  isTime?: boolean;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ icon, label, value, suffix = '%', isTime }) => {
  const getColor = (v: number) => {
    if (isTime) return 'text-blue-400';
    if (v >= 80) return 'text-green-400';
    if (v >= 60) return 'text-yellow-400';
    if (v >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`font-bold ${getColor(value)}`}>
          {value}{suffix}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINI INDICATOR (para usar no chat)
// ═══════════════════════════════════════════════════════════════════════════════

interface StarterKitMiniIndicatorProps {
  grade: string;
  qualityScore: number;
  onClick?: () => void;
}

export const StarterKitMiniIndicator: React.FC<StarterKitMiniIndicatorProps> = ({
  grade,
  qualityScore,
  onClick,
}) => {
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
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded-full
               hover:bg-gray-700 transition-colors text-xs"
      title={`Starter Kit salvo - Grade ${grade} (${qualityScore}%)`}
    >
      <div className={`w-4 h-4 ${gradeColors[grade]} rounded-full flex items-center justify-center`}>
        <span className="text-[10px] font-bold text-white">{grade}</span>
      </div>
      <span className="text-gray-300">{qualityScore}%</span>
      <Package className="w-3 h-3 text-purple-400" />
    </button>
  );
};

export default StarterKitPreview;
