/**
 * 👁️ GOD VIEW - Exports
 * 
 * Três versões disponíveis:
 * - AetherGodView: Demo animada (sem API)
 * - RealGodView: Colaboração real com MultiAgentCoordinator
 * - CanvasGodView: Integrado ao Canvas de preview (durante geração)
 */

export { GodView } from './GodView';
export { AetherGodView } from './AetherGodView';
export { RealGodView } from './RealGodView';
export { CanvasGodView } from './CanvasGodView';
export type { CanvasAgent, CanvasMessage, CanvasArtifact, CanvasGodViewProps } from './CanvasGodView';
export { AgentNode } from './AgentNode';
export { MessageBubble } from './MessageBubble';
export { ArtifactCard } from './ArtifactCard';
export { CollaborationTimeline } from './CollaborationTimeline';
export { PhaseIndicator } from './PhaseIndicator';

// Default export is the epic demo version
export { AetherGodView as default } from './AetherGodView';
