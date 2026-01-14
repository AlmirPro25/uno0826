/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Components - Index                                    ║
 * ║                                                                               ║
 * ║              Exporta todos os componentes relacionados ao DAIA               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Status Indicator
export { default as DAIAStatusIndicator } from '../DAIAStatusIndicator';

// Templates Modal
export { default as DAIATemplatesModal } from '../DAIATemplatesModal';

// Like Button
export { default as DAIALikeButton } from '../DAIALikeButton';

// Suggestion Banner
export { default as DAIASuggestionBanner } from '../DAIASuggestionBanner';

// Re-export types and services
export type { TemplateResult, DAIAHealthStatus } from '@/services/DAIAService';
export type { ThinkResponse, ToolUsed, BrainStatus } from '@/services/DAIABrainService';
export type { DAIALearnPayload, DAIAEnrichmentResult, DAIABrainResult } from '@/services/DAIAIntegration';

// Re-export hooks
export { useDAIA } from '@/hooks/useDAIA';

// Re-export services
export { daiaService } from '@/services/DAIAService';
export { daiaBrain } from '@/services/DAIABrainService';
export {
    sendToDAIA,
    enrichWithDAIA,
    getDAIASuggestion,
    isDAIAAvailable,
    isDAIABrainAvailable,
    getDAIAFullStatus,
    askDAIABrain,
    generateWithDAIABrain,
    createDAIAStoreHandlers
} from '@/services/DAIAIntegration';
