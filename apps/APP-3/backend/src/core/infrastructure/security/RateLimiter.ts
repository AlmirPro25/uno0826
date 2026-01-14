/**
 * ============================================
 * RATE LIMITER - Proteção contra Abuso
 * ============================================
 * 
 * Implementação em memória (para produção usar Redis)
 * Nível: Tech Lead Itaú
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;      // Janela de tempo em ms
  maxRequests: number;   // Máximo de requisições na janela
  blockDurationMs: number; // Duração do bloqueio após exceder
}

class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimitEntry> = new Map();
  
  // Configurações por tipo de endpoint
  private configs: Record<string, RateLimitConfig> = {
    default: {
      windowMs: 60 * 1000,      // 1 minuto
      maxRequests: 100,
      blockDurationMs: 60 * 1000
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5,           // 5 tentativas de login
      blockDurationMs: 15 * 60 * 1000
    },
    sensitive: {
      windowMs: 60 * 1000,
      maxRequests: 10,
      blockDurationMs: 5 * 60 * 1000
    }
  };

  private constructor() {
    // Limpa entradas expiradas a cada minuto
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now && (!entry.blocked || (entry.blockedUntil && entry.blockedUntil < now))) {
        this.store.delete(key);
      }
    }
  }

  public check(key: string, type: 'default' | 'auth' | 'sensitive' = 'default'): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  } {
    const config = this.configs[type];
    const now = Date.now();
    let entry = this.store.get(key);

    // Verifica se está bloqueado
    if (entry?.blocked && entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    // Reset se a janela expirou
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
        blocked: false
      };
    }

    entry.count++;

    // Verifica se excedeu o limite
    if (entry.count > config.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + config.blockDurationMs;
      this.store.set(key, entry);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil(config.blockDurationMs / 1000)
      };
    }

    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt
    };
  }

  public recordFailure(key: string): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.count += 2; // Penalidade extra para falhas
      this.store.set(key, entry);
    }
  }

  public reset(key: string): void {
    this.store.delete(key);
  }

  // Para testes
  public clear(): void {
    this.store.clear();
  }
}

export const rateLimiter = RateLimiter.getInstance();
