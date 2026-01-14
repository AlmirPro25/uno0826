/**
 * ============================================
 * AUDIT SERVICE - Rastreabilidade Completa
 * ============================================
 * 
 * Toda operação sensível é registrada
 * Nível: Tech Lead Itaú / Compliance BACEN
 */

import { logger } from '../logging/Logger';

export enum AuditAction {
  // Autenticação
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  
  // Projetos
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  PROJECT_ACCESSED = 'PROJECT_ACCESSED',
  
  // Segurança
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  
  // Admin
  USER_BLOCKED = 'USER_BLOCKED',
  USER_UNBLOCKED = 'USER_UNBLOCKED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED'
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  targetId?: string;
  targetType?: string;
  ip: string;
  userAgent: string;
  requestId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

class AuditService {
  private static instance: AuditService;
  // Em produção, isso seria persistido no banco
  private auditLog: AuditEntry[] = [];

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async log(params: {
    action: AuditAction;
    userId?: string;
    targetId?: string;
    targetType?: string;
    ip: string;
    userAgent: string;
    requestId: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action: params.action,
      userId: params.userId,
      targetId: params.targetId,
      targetType: params.targetType,
      ip: params.ip,
      userAgent: params.userAgent || 'unknown',
      requestId: params.requestId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      metadata: params.metadata,
      success: params.success ?? true,
      errorMessage: params.errorMessage
    };

    // Persiste (em memória por enquanto, em produção seria no banco)
    this.auditLog.push(entry);

    // Log estruturado
    logger.audit(params.action, params.userId || 'anonymous', {
      targetId: params.targetId,
      targetType: params.targetType,
      ip: params.ip,
      requestId: params.requestId,
      success: entry.success
    });

    // Em produção: salvar no banco de dados
    // await this.persistToDatabase(entry);
  }

  // Métodos de conveniência
  public async logAuth(params: {
    action: AuditAction;
    userId?: string;
    email?: string;
    ip: string;
    userAgent: string;
    requestId: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.log({
      ...params,
      targetType: 'authentication',
      metadata: { email: params.email }
    });
  }

  public async logResourceAccess(params: {
    action: AuditAction;
    userId: string;
    resourceId: string;
    resourceType: string;
    ip: string;
    userAgent: string;
    requestId: string;
  }): Promise<void> {
    await this.log({
      ...params,
      targetId: params.resourceId,
      targetType: params.resourceType
    });
  }

  public async logSecurityEvent(params: {
    action: AuditAction;
    ip: string;
    userAgent: string;
    requestId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      ...params,
      success: false
    });

    // Alerta de segurança
    logger.security(params.action, {
      ip: params.ip,
      requestId: params.requestId,
      ...params.metadata
    });
  }

  // Para consultas (em produção seria query no banco)
  public getRecentLogs(limit: number = 100): AuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  public getLogsByUser(userId: string, limit: number = 50): AuditEntry[] {
    return this.auditLog
      .filter(entry => entry.userId === userId)
      .slice(-limit);
  }

  public getSecurityEvents(since: Date): AuditEntry[] {
    return this.auditLog.filter(
      entry => entry.timestamp >= since && !entry.success
    );
  }
}

export const auditService = AuditService.getInstance();
