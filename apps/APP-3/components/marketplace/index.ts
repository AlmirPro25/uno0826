/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MARKETPLACE COMPONENTS - Index                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Componentes principais
export { StarterKitMarketplace } from '../StarterKitMarketplace';
export { MarketplaceDashboard } from '../MarketplaceDashboard';
export { StarterKitIndicator, MiniStarterKitIndicator } from '../StarterKitIndicator';
export { StarterKitPreview, StarterKitMiniIndicator } from '../StarterKitPreview';

// Hooks
export { useStarterKit, useAutoSaveStarterKit, type SavedKitInfo } from '../../hooks/useStarterKit';

// Services
export {
  starterKitService,
  autoSaveGeneration,
  type StarterKit,
  type StarterKitMetadata,
  type StarterKitClassification,
  type MarketplaceStatus,
  type MarketplaceStats,
  type ClassifyResult,
} from '../../services/StarterKitService';

// Integration
export {
  processGeneration,
  createStarterKitStoreHandlers,
  syncDAIAWithStarterKits,
  exportCombinedTrainingData,
  type GenerationResult,
  type IntegrationResult,
} from '../../services/StarterKitIntegration';
