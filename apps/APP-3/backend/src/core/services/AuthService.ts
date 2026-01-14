/**
 * ============================================
 * AUTH SERVICE - Autenticação Enterprise
 * ============================================
 * 
 * Segurança de nível bancário
 * Nível: Tech Lead Itaú
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../../api/models/User';
import { logger } from '../infrastructure/logging/Logger';
import { auditService, AuditAction } from '../infrastructure/audit/AuditService';
import { rateLimiter } from '../infrastructure/security/RateLimiter';
import {
  InvalidCredentialsError,
  AccountLockedError,
  DuplicateResourceError,
  UserNotFoundError,
  TokenInvalidError,
  ValidationError
} from '../domain/errors/DomainErrors';

interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RequestContext {
  ip: string;
  userAgent: string;
  requestId: string;
}

// Armazena tentativas de login falhas (em produção usar Redis)
const loginAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos


class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Registro de novo usuário
   */
  public async register(
    email: string,
    password: string,
    context: RequestContext
  ): Promise<AuthResult> {
    // 1. Validação de entrada
    this.validateEmail(email);
    this.validatePassword(password);

    // 2. Verifica se usuário já existe
    const existingUser = await (User as any).findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new DuplicateResourceError('User', 'email');
    }

    // 3. Cria usuário (senha será hasheada pelo hook do model)
    const user = await (User as any).create({
      email: email.toLowerCase(),
      password
    });

    // 4. Gera tokens
    const tokens = this.generateTokenPair(user.id, user.email);

    // 5. Auditoria
    await auditService.logAuth({
      action: AuditAction.USER_REGISTERED,
      userId: user.id,
      email: user.email,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      success: true
    });

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      requestId: context.requestId
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      ...tokens
    };
  }

  /**
   * Login com proteção contra brute force
   */
  public async login(
    email: string,
    password: string,
    context: RequestContext
  ): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Verifica bloqueio por tentativas
    this.checkLoginAttempts(normalizedEmail, context);

    // 2. Busca usuário
    const user = await (User as any).findOne({ where: { email: normalizedEmail } });
    
    // 3. Timing attack prevention - sempre executa bcrypt
    if (!user) {
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks.here');
      this.recordFailedAttempt(normalizedEmail, context);
      throw new InvalidCredentialsError();
    }

    // 4. Verifica senha
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      this.recordFailedAttempt(normalizedEmail, context);
      
      await auditService.logAuth({
        action: AuditAction.USER_LOGIN_FAILED,
        email: normalizedEmail,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        success: false,
        errorMessage: 'Invalid password'
      });
      
      throw new InvalidCredentialsError();
    }

    // 5. Login bem-sucedido - limpa tentativas
    this.clearLoginAttempts(normalizedEmail);
    rateLimiter.reset(`auth:${context.ip}`);

    // 6. Gera tokens
    const tokens = this.generateTokenPair(user.id, user.email);

    // 7. Auditoria
    await auditService.logAuth({
      action: AuditAction.USER_LOGIN_SUCCESS,
      userId: user.id,
      email: user.email,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      success: true
    });

    logger.info('User logged in successfully', {
      userId: user.id,
      requestId: context.requestId
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      ...tokens
    };
  }

  /**
   * Refresh token
   */
  public async refreshToken(
    refreshToken: string,
    context: RequestContext
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;
      
      if (payload.type !== 'refresh') {
        throw new TokenInvalidError();
      }

      // Verifica se usuário ainda existe
      const user = await (User as any).findByPk(payload.userId);
      if (!user) {
        throw new UserNotFoundError();
      }

      // Gera novo access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      await auditService.logAuth({
        action: AuditAction.TOKEN_REFRESH,
        userId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        success: true
      });

      return {
        accessToken,
        expiresIn: 900 // 15 minutos em segundos
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenInvalidError();
      }
      throw error;
    }
  }

  /**
   * Verifica access token
   */
  public verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      if (payload.type !== 'access') {
        throw new TokenInvalidError();
      }
      return payload;
    } catch (error) {
      throw new TokenInvalidError();
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private generateTokenPair(userId: string, email: string): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = jwt.sign(
      { userId, email, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900
    };
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new ValidationError([{ field: 'email', message: 'Invalid email format' }]);
    }
  }

  private validatePassword(password: string): void {
    const errors: Array<{ field: string; message: string }> = [];
    
    if (!password || password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one number' });
    }
    
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private checkLoginAttempts(email: string, context: RequestContext): void {
    const attempts = loginAttempts.get(email);
    
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      logger.security('Account locked - login attempt blocked', {
        email,
        ip: context.ip,
        lockedUntil: attempts.lockedUntil.toISOString()
      });
      throw new AccountLockedError(attempts.lockedUntil);
    }
  }

  private recordFailedAttempt(email: string, context: RequestContext): void {
    const attempts = loginAttempts.get(email) || { count: 0 };
    attempts.count++;
    
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      
      logger.security('Account locked due to too many failed attempts', {
        email,
        ip: context.ip,
        attempts: attempts.count
      });
    }
    
    loginAttempts.set(email, attempts);
    rateLimiter.recordFailure(`auth:${context.ip}`);
  }

  private clearLoginAttempts(email: string): void {
    loginAttempts.delete(email);
  }
}

export const authService = AuthService.getInstance();
