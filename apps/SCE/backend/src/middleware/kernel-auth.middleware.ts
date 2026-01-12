/**
 * ================================================================================
 * KERNEL AUTH MIDDLEWARE — SCE
 * ================================================================================
 * 
 * REGRA ÚNICA: SCE não autentica ninguém. Apenas confia no Kernel.
 * 
 * Este middleware:
 * - APENAS valida JWT do Kernel
 * - REJEITA qualquer outro token
 * - Verifica membership no SCE
 * - Retorna NEEDS_LINK se não tem membership
 * 
 * NÃO faz:
 * - Criar usuário
 * - Validar senha
 * - Gerar token
 * - Aceitar token local
 * 
 * ================================================================================
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// ========================================
// CONFIGURAÇÃO
// ========================================

const KERNEL_JWT_SECRET = process.env.PROST_QS_JWT_SECRET;
const SCE_APP_ID = process.env.PROSTQS_APP_ID;

// Validação de ambiente
if (!KERNEL_JWT_SECRET) {
  console.error('❌ [KERNEL-AUTH] PROST_QS_JWT_SECRET não configurado');
  // Em produção, isso deve ser fatal
  // throw new Error('PROST_QS_JWT_SECRET é obrigatório');
}

if (!SCE_APP_ID) {
  console.error('❌ [KERNEL-AUTH] PROSTQS_APP_ID não configurado');
  // Em produção, isso deve ser fatal
  // throw new Error('PROSTQS_APP_ID é obrigatório');
}

// ========================================
// TIPOS
// ========================================

/**
 * Payload do JWT do Kernel (fonte de verdade)
 * Definido em: backend/internal/identity/multiapp.go
 */
interface KernelJWTPayload {
  user_id: string;        // UUID do usuário
  email: string;          // Email
  name: string;           // Nome
  role: string;           // Role global (user, admin)
  origin_app_id: string;  // App onde usuário foi criado
  memberships: string[];  // Lista de app_ids com membership ativa
  type: string;           // Sempre "global_user"
  exp: number;            // Expiração
  iat: number;            // Emissão
}

/**
 * Usuário autenticado disponível no request
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  originAppId: string;
  memberships: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    kernelUser?: AuthenticatedUser;
  }
}

// ========================================
// CÓDIGOS DE ERRO
// ========================================

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  NEEDS_LINK: 'NEEDS_LINK',
  INVALID_TOKEN_TYPE: 'INVALID_TOKEN_TYPE',
  CONFIG_ERROR: 'CONFIG_ERROR',
} as const;

// ========================================
// MIDDLEWARE PRINCIPAL
// ========================================

/**
 * Middleware de autenticação via Kernel
 * 
 * Fluxo:
 * 1. Extrai token do header Authorization
 * 2. Valida JWT com secret do Kernel
 * 3. Verifica se é token do tipo "global_user"
 * 4. Verifica se tem membership no SCE
 * 5. Se não tem membership, retorna NEEDS_LINK
 * 6. Se tem, popula request.kernelUser
 */
export async function kernelAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Verificar configuração
  if (!KERNEL_JWT_SECRET || !SCE_APP_ID) {
    return reply.status(500).send({
      error: 'Configuração de autenticação incompleta',
      code: ErrorCodes.CONFIG_ERROR,
    });
  }

  // Extrair token
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Token não fornecido',
      code: ErrorCodes.UNAUTHORIZED,
    });
  }

  const token = authHeader.substring(7);

  try {
    // Validar JWT do Kernel
    const decoded = jwt.verify(token, KERNEL_JWT_SECRET) as KernelJWTPayload;

    // Verificar tipo do token
    if (decoded.type !== 'global_user') {
      return reply.status(401).send({
        error: 'Tipo de token inválido',
        code: ErrorCodes.INVALID_TOKEN_TYPE,
      });
    }

    // Verificar membership no SCE
    const hasSCEMembership = decoded.memberships.includes(SCE_APP_ID);

    if (!hasSCEMembership) {
      // Usuário autenticado mas sem vínculo com SCE
      // Retorna 403 com código especial para frontend mostrar modal de link
      return reply.status(403).send({
        error: 'Você precisa vincular sua conta ao SCE',
        code: ErrorCodes.NEEDS_LINK,
        user_id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        link_url: `/api/v1/identity/link-app`,
        app_id: SCE_APP_ID,
      });
    }

    // Autorizado — popular request com dados do usuário
    request.kernelUser = {
      id: decoded.user_id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      originAppId: decoded.origin_app_id,
      memberships: decoded.memberships,
    };

    // Log de acesso (opcional, remover em produção de alto volume)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [KERNEL-AUTH] ${decoded.email} acessou SCE`);
    }

  } catch (err: any) {
    // Tratar erros específicos do JWT
    if (err.name === 'TokenExpiredError') {
      return reply.status(401).send({
        error: 'Token expirado',
        code: ErrorCodes.EXPIRED_TOKEN,
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return reply.status(401).send({
        error: 'Token inválido',
        code: ErrorCodes.INVALID_TOKEN,
      });
    }

    // Erro genérico
    console.error('[KERNEL-AUTH] Erro na validação:', err.message);
    return reply.status(401).send({
      error: 'Erro na validação do token',
      code: ErrorCodes.INVALID_TOKEN,
    });
  }
}

// ========================================
// MIDDLEWARES AUXILIARES
// ========================================

/**
 * Middleware para verificar se é admin
 */
export async function kernelAdminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.kernelUser) {
    return reply.status(401).send({
      error: 'Não autenticado',
      code: ErrorCodes.UNAUTHORIZED,
    });
  }

  const adminRoles = ['admin', 'super_admin', 'ADMIN'];
  
  if (!adminRoles.includes(request.kernelUser.role)) {
    return reply.status(403).send({
      error: 'Acesso negado. Requer privilégios de administrador.',
      code: 'FORBIDDEN',
    });
  }
}

/**
 * Middleware opcional — não bloqueia, apenas popula se tiver token
 */
export async function kernelAuthOptional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || !KERNEL_JWT_SECRET) {
    return; // Continua sem autenticação
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, KERNEL_JWT_SECRET) as KernelJWTPayload;
    
    if (decoded.type === 'global_user') {
      request.kernelUser = {
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        originAppId: decoded.origin_app_id,
        memberships: decoded.memberships,
      };
    }
  } catch {
    // Ignora erros — autenticação é opcional
  }
}

// ========================================
// HELPERS
// ========================================

/**
 * Verifica se usuário tem capability específica
 * (Para uso futuro com billing/quotas)
 */
export function hasCapability(request: FastifyRequest, capability: string): boolean {
  // TODO: Implementar quando capabilities estiverem no JWT
  return true;
}

/**
 * Verifica se usuário tem membership em app específico
 */
export function hasMembership(request: FastifyRequest, appId: string): boolean {
  return request.kernelUser?.memberships.includes(appId) ?? false;
}
