/**
 * PROST-QS Internal SDK
 * 
 * SDK interno para uso pelos apps satélites (VOX, SCE).
 * Quando estiver maduro, será publicado como @prost-qs/sdk
 * 
 * @internal
 */

export * from './identity';
export * from './telemetry';
export * from './billing';
export * from './decisions';
export * from './activity';
export * from './webhooks';
export * from './apikeys';
export * from './events';
export * from './types';

// Re-export para conveniência
export { ProstQSClient } from './client';
