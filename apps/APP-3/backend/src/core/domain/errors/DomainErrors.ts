/**
 * ============================================
 * DOMAIN ERRORS - Erros de Negócio Tipados
 * ============================================
 * 
 * Padrão Enterprise: Erros específicos e tratáveis
 * Nível: Tech Lead Itaú
 */

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// ERROS DE AUTENTICAÇÃO
// ============================================

export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, 'AUTH_FAILED', 401, context);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED', 401);
  }
}

export class TokenInvalidError extends DomainError {
  constructor() {
    super('Token is invalid', 'TOKEN_INVALID', 401);
  }
}


export class AccountLockedError extends DomainError {
  constructor(lockedUntil?: Date) {
    super(
      `Account is temporarily locked${lockedUntil ? ` until ${lockedUntil.toISOString()}` : ''}`,
      'ACCOUNT_LOCKED',
      423,
      { lockedUntil }
    );
  }
}

// ============================================
// ERROS DE AUTORIZAÇÃO
// ============================================

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ResourceOwnershipError extends DomainError {
  constructor(resourceType: string) {
    super(`You don't have access to this ${resourceType}`, 'OWNERSHIP_DENIED', 403);
  }
}

// ============================================
// ERROS DE RECURSOS
// ============================================

export class NotFoundError extends DomainError {
  constructor(resourceType: string, identifier?: string) {
    super(
      `${resourceType} not found${identifier ? `: ${identifier}` : ''}`,
      'NOT_FOUND',
      404,
      { resourceType, identifier }
    );
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super('User', identifier);
  }
}

export class ProjectNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super('Project', identifier);
  }
}

// ============================================
// ERROS DE VALIDAÇÃO
// ============================================

export class ValidationError extends DomainError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>) {
    super('Validation failed', 'VALIDATION_ERROR', 400, { errors });
    this.errors = errors;
  }
}

export class DuplicateResourceError extends DomainError {
  constructor(resourceType: string, field: string) {
    super(
      `${resourceType} with this ${field} already exists`,
      'DUPLICATE_RESOURCE',
      409,
      { resourceType, field }
    );
  }
}

// ============================================
// ERROS DE RATE LIMITING
// ============================================

export class RateLimitExceededError extends DomainError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter }
    );
    this.retryAfter = retryAfter;
  }
}

// ============================================
// ERROS DE SISTEMA
// ============================================

export class InternalError extends DomainError {
  constructor(message: string = 'An unexpected error occurred') {
    super(message, 'INTERNAL_ERROR', 500);
    this.isOperational = false;
  }
}

export class DatabaseError extends DomainError {
  constructor(operation: string) {
    super(`Database operation failed: ${operation}`, 'DATABASE_ERROR', 500);
    this.isOperational = false;
  }
}

export class ExternalServiceError extends DomainError {
  constructor(serviceName: string, message?: string) {
    super(
      `External service error: ${serviceName}${message ? ` - ${message}` : ''}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      { serviceName }
    );
  }
}
