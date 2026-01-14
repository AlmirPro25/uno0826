/**
 * ============================================
 * AUTH MIDDLEWARE - Enterprise Grade
 * ============================================
 * 
 * Proteção de rotas com logging completo
 * Nível: Tech Lead Itaú
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../../core/services/AuthService';
import { auditService, AuditAction } from '../../core/infrastructure/audit/AuditService';
import { logger } from '../../core/infrastructure/logging/Logger';
import User from '../models/User';
import { TokenInvalidError, AuthenticationError } from '../../core/domain/errors/DomainErrors';

// Extende Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * Middleware de proteção de rotas
 * Verifica e valida JWT token
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extrai token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Invalid authorization header format');
    }

    // 2. Verifica token
    const payload = authService.verifyAccessToken(token);

    // 3. Busca usuário
    const user = await (User as any).findByPk(payload.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      logger.security('Token valid but user not found', {
        userId: payload.userId,
        ip: req.ip,
        requestId: req.requestId
      });
      throw new AuthenticationError('User not found');
    }

    // 4. Anexa usuário ao request
    req.user = user;

    next();
  } catch (error) {
    // Log de tentativa de acesso não autorizado
    if (error instanceof TokenInvalidError || error instanceof AuthenticationError) {
      await auditService.logSecurityEvent({
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        requestId: req.requestId,
        metadata: {
          path: req.path,
          method: req.method,
          error: (error as Error).message
        }
      });
    }
    
    next(error);
  }
};

/**
 * Middleware opcional de autenticação
 * Não bloqueia se não houver token, mas anexa user se houver
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const payload = authService.verifyAccessToken(token);
    const user = await (User as any).findByPk(payload.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Token inválido em auth opcional não bloqueia
    next();
  }
};
