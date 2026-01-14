/**
 * ============================================
 * ENTERPRISE MIDDLEWARE STACK
 * ============================================
 * 
 * Middlewares de nível bancário
 * Nível: Tech Lead Itaú
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../core/infrastructure/logging/Logger';
import { rateLimiter } from '../../core/infrastructure/security/RateLimiter';
import { auditService, AuditAction } from '../../core/infrastructure/audit/AuditService';
import { RateLimitExceededError, DomainError } from '../../core/domain/errors/DomainErrors';

// Extende o Request do Express
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * 1. REQUEST ID - Rastreabilidade de ponta a ponta
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * 2. REQUEST LOGGER - Log de todas as requisições
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Log ao finalizar a resposta
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.httpRequest(req, res, duration);
  });
  next();
};

/**
 * 3. RATE LIMITER - Proteção contra abuso
 */
export const rateLimitMiddleware = (type: 'default' | 'auth' | 'sensitive' = 'default') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${type}:${ip}`;
    
    const result = rateLimiter.check(key, type);
    
    // Headers de rate limit (padrão RFC)
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetAt.toString());
    
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter?.toString() || '60');
      
      // Log de segurança
      auditService.logSecurityEvent({
        action: AuditAction.RATE_LIMIT_EXCEEDED,
        ip,
        userAgent: req.get('user-agent') || 'unknown',
        requestId: req.requestId,
        metadata: { type, path: req.path }
      });
      
      throw new RateLimitExceededError(result.retryAfter);
    }
    
    next();
  };
};

/**
 * 4. SECURITY HEADERS - Headers de segurança
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (básico)
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Remove header que expõe tecnologia
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * 5. SANITIZE INPUT - Sanitização básica de entrada
 */
export const sanitizeInputMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitiza strings no body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  // Sanitiza query params
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query as Record<string, unknown>);
  }
  
  next();
};

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove caracteres perigosos básicos
      obj[key] = (obj[key] as string)
        .replace(/[<>]/g, '') // Remove < e >
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}

/**
 * 6. ERROR HANDLER ENTERPRISE - Tratamento profissional de erros
 */
export const enterpriseErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';
  const ip = req.ip || 'unknown';
  
  // Se é um erro de domínio (operacional)
  if (err instanceof DomainError) {
    logger.warn(`Domain error: ${err.message}`, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method
    });
    
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.context && { details: err.context })
      },
      requestId
    });
    return;
  }
  
  // Erro não operacional (bug, crash)
  logger.error('Unhandled error', err, {
    requestId,
    ip,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  // Não expõe detalhes internos em produção
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      ...(!isProduction && { stack: err.stack })
    },
    requestId
  });
};

/**
 * 7. NOT FOUND HANDLER
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    requestId: req.requestId
  });
};
