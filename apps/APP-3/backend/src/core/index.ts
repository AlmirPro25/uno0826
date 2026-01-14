/**
 * ============================================
 * CORE MODULE - Exports Centralizados
 * ============================================
 */

// Domain Errors
export * from './domain/errors/DomainErrors';

// Infrastructure
export { logger } from './infrastructure/logging/Logger';
export { rateLimiter } from './infrastructure/security/RateLimiter';
export { auditService, AuditAction } from './infrastructure/audit/AuditService';

// Services
export { authService } from './services/AuthService';
export { projectService } from './services/ProjectService';
