import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

/**
 * Payload do JWT do PROST-QS (Kernel)
 * O OSPEDAGEM OBEDECE ao PROST-QS - nunca decide, só valida e executa
 */
interface ProstQSJWTPayload {
  user_id: string;
  role: string;           // user, admin, super_admin
  account_status: string; // active, suspended, banned
  aud?: string[];         // audience: serviços autorizados
  exp: number;
  iat: number;
}

/**
 * Payload legado do OSPEDAGEM (para compatibilidade)
 */
interface LegacyJWTPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Payload unificado que o request vai carregar
 */
interface UserPayload {
  id: string;
  role: string;
  accountStatus: string;
  source: 'PROST_QS' | 'LOCAL';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
  }
}

/**
 * Middleware de autenticação JWT
 * 
 * REGRA: PROST-QS manda, OSPEDAGEM obedece
 * 
 * Aceita tokens de duas fontes:
 * 1. PROST-QS (Kernel) - autoridade central
 * 2. Local (legado) - para desenvolvimento
 * 
 * Em produção, apenas tokens do PROST-QS devem ser aceitos.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ 
        error: 'Token não fornecido',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7);
    
    // Tenta validar como token do PROST-QS primeiro
    const prostQSSecret = process.env.PROST_QS_JWT_SECRET || process.env.JWT_SECRET;
    
    try {
      const decoded = jwt.verify(token, prostQSSecret!) as ProstQSJWTPayload;
      
      // Se tem user_id, é token do PROST-QS
      if (decoded.user_id) {
        // Verifica audience - token deve ser para "ospedagem"
        const validAudience = decoded.aud?.includes('ospedagem') ?? false;
        if (!validAudience && decoded.aud && decoded.aud.length > 0) {
          return reply.status(403).send({
            error: 'Token não autorizado para este serviço',
            code: 'INVALID_AUDIENCE'
          });
        }
        
        // Verifica se conta está ativa
        if (decoded.account_status !== 'active') {
          return reply.status(403).send({
            error: `Conta ${decoded.account_status}. Acesso negado.`,
            code: 'ACCOUNT_INACTIVE'
          });
        }
        
        // Token válido do PROST-QS
        request.user = {
          id: decoded.user_id,
          role: decoded.role,
          accountStatus: decoded.account_status,
          source: 'PROST_QS'
        };
        
        return; // Autorizado pelo Kernel
      }
      
      // Se tem id (não user_id), é token local
      const localDecoded = decoded as unknown as LegacyJWTPayload;
      if (localDecoded.id) {
        request.user = {
          id: localDecoded.id,
          role: localDecoded.role,
          accountStatus: 'active',
          source: 'LOCAL'
        };
        return; // Autorizado localmente
      }
      
    } catch (prostError) {
      // Se não for token do PROST-QS, tenta validar como token local (dev)
      if (process.env.NODE_ENV === 'development') {
        try {
          const decoded = await request.jwtVerify<LegacyJWTPayload>();
          request.user = {
            id: decoded.id,
            role: decoded.role,
            accountStatus: 'active',
            source: 'LOCAL'
          };
          return; // Autorizado localmente (apenas dev)
        } catch {
          // Nenhum token válido
        }
      }
      
      return reply.status(401).send({ 
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }
    
  } catch (err) {
    return reply.status(401).send({ 
      error: 'Erro na validação do token',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware para verificar se é admin
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const adminRoles = ['ADMIN', 'admin', 'super_admin'];
  
  if (!request.user || !adminRoles.includes(request.user.role)) {
    return reply.status(403).send({
      error: 'Acesso negado. Requer privilégios de administrador.',
      code: 'FORBIDDEN'
    });
  }
}

/**
 * Middleware para verificar escopo específico
 * Uso futuro: verificar se usuário pode fazer deploy, ver logs, etc.
 */
export function requireScope(scope: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implementar verificação de escopo quando PROST-QS enviar scopes no JWT
    // Por agora, apenas verifica se está autenticado
    if (!request.user) {
      return reply.status(401).send({
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      });
    }
  };
}
