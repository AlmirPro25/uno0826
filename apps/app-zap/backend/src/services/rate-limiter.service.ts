/**
 * 🚦 RATE LIMITER SERVICE
 * Proteção contra abuso e rate limiting inteligente.
 * Previne spam e gerencia throughput de mensagens.
 */

export interface RateLimitConfig {
    windowMs: number;       // Janela de tempo em ms
    maxRequests: number;    // Máximo de requests por janela
    skipFailures: boolean;  // Não contar falhas
    keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
}

interface RateLimitEntry {
    count: number;
    firstRequest: number;
    lastRequest: number;
}

export class RateLimiterService {
    private limits: Map<string, RateLimitEntry> = new Map();

    // Default configs for different operations
    private configs: Record<string, RateLimitConfig> = {
        // Mensagens por contato
        MESSAGE_OUTBOUND: {
            windowMs: 60 * 1000,     // 1 minuto
            maxRequests: 10,         // Máximo 10 msgs/min por contato
            skipFailures: true
        },
        // Mensagens totais
        MESSAGE_GLOBAL: {
            windowMs: 60 * 1000,     // 1 minuto
            maxRequests: 60,         // Máximo 60 msgs/min total
            skipFailures: true
        },
        // Chamadas à API do Gemini
        GEMINI_API: {
            windowMs: 60 * 1000,     // 1 minuto
            maxRequests: 30,         // Máximo 30 requests/min
            skipFailures: false
        },
        // Geração de imagens
        IMAGE_GENERATION: {
            windowMs: 60 * 60 * 1000, // 1 hora
            maxRequests: 30,          // Máximo 30 imagens/hora
            skipFailures: false
        },
        // Geração de áudio
        VOICE_GENERATION: {
            windowMs: 60 * 60 * 1000, // 1 hora
            maxRequests: 60,          // Máximo 60 áudios/hora
            skipFailures: false
        },
        // API requests gerais
        API_REQUEST: {
            windowMs: 60 * 1000,      // 1 minuto
            maxRequests: 100,         // 100 requests/min
            skipFailures: true
        },
        // Campanhas Hunter
        HUNTER_CAMPAIGN: {
            windowMs: 60 * 60 * 1000, // 1 hora
            maxRequests: 20,          // Máximo 20 mensagens de campanha/hora
            skipFailures: true
        }
    };

    /**
     * Verifica se request é permitido
     */
    check(type: string, identifier: string): RateLimitResult {
        const config = this.configs[type] || this.configs.API_REQUEST;
        const key = this.generateKey(type, identifier, config);

        const now = Date.now();
        const entry = this.limits.get(key);

        // Se não existe ou janela expirou, criar nova
        if (!entry || now - entry.firstRequest > config.windowMs) {
            this.limits.set(key, {
                count: 1,
                firstRequest: now,
                lastRequest: now
            });

            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime: new Date(now + config.windowMs)
            };
        }

        // Verificar se excedeu limite
        if (entry.count >= config.maxRequests) {
            const resetTime = entry.firstRequest + config.windowMs;
            return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(resetTime),
                retryAfter: Math.ceil((resetTime - now) / 1000)
            };
        }

        // Incrementar contador
        entry.count++;
        entry.lastRequest = now;

        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetTime: new Date(entry.firstRequest + config.windowMs)
        };
    }

    /**
     * Incrementa contador (para uso após verificação)
     */
    hit(type: string, identifier: string): void {
        const config = this.configs[type] || this.configs.API_REQUEST;
        const key = this.generateKey(type, identifier, config);

        const now = Date.now();
        const entry = this.limits.get(key);

        if (entry && now - entry.firstRequest <= config.windowMs) {
            entry.count++;
            entry.lastRequest = now;
        }
    }

    /**
     * Reseta limite para um identifier
     */
    reset(type: string, identifier: string): void {
        const config = this.configs[type] || this.configs.API_REQUEST;
        const key = this.generateKey(type, identifier, config);
        this.limits.delete(key);
    }

    /**
     * Obtém status atual
     */
    getStatus(type: string, identifier: string): {
        current: number;
        max: number;
        remaining: number;
        percentage: number;
        resetIn: number;
    } {
        const config = this.configs[type] || this.configs.API_REQUEST;
        const key = this.generateKey(type, identifier, config);

        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry || now - entry.firstRequest > config.windowMs) {
            return {
                current: 0,
                max: config.maxRequests,
                remaining: config.maxRequests,
                percentage: 0,
                resetIn: 0
            };
        }

        const resetIn = Math.max(0, entry.firstRequest + config.windowMs - now);

        return {
            current: entry.count,
            max: config.maxRequests,
            remaining: Math.max(0, config.maxRequests - entry.count),
            percentage: Math.round((entry.count / config.maxRequests) * 100),
            resetIn: Math.ceil(resetIn / 1000)
        };
    }

    /**
     * Configura limite customizado
     */
    setConfig(type: string, config: RateLimitConfig): void {
        this.configs[type] = config;
    }

    /**
     * Obtém configuração
     */
    getConfig(type: string): RateLimitConfig | undefined {
        return this.configs[type];
    }

    /**
     * Lista todos os tipos de rate limit
     */
    listTypes(): string[] {
        return Object.keys(this.configs);
    }

    /**
     * Limpa entradas expiradas (manutenção)
     */
    cleanup(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.limits.entries()) {
            // Encontrar a config pelo tipo no key
            const type = key.split(':')[0];
            const config = this.configs[type] || this.configs.API_REQUEST;

            if (now - entry.firstRequest > config.windowMs * 2) {
                this.limits.delete(key);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Estatísticas gerais
     */
    getStats(): {
        activeKeys: number;
        byType: Record<string, number>;
        totalHits: number;
    } {
        const byType: Record<string, number> = {};
        let totalHits = 0;

        for (const [key, entry] of this.limits.entries()) {
            const type = key.split(':')[0];
            byType[type] = (byType[type] || 0) + 1;
            totalHits += entry.count;
        }

        return {
            activeKeys: this.limits.size,
            byType,
            totalHits
        };
    }

    /**
     * Gera chave única
     */
    private generateKey(type: string, identifier: string, config: RateLimitConfig): string {
        if (config.keyGenerator) {
            return `${type}:${config.keyGenerator(identifier)}`;
        }
        return `${type}:${identifier}`;
    }

    /**
     * Middleware Express para rate limiting
     */
    expressMiddleware(type: string = 'API_REQUEST') {
        return (req: any, res: any, next: any) => {
            const identifier = req.ip || req.connection.remoteAddress || 'unknown';
            const result = this.check(type, identifier);

            // Add headers
            res.setHeader('X-RateLimit-Limit', this.configs[type]?.maxRequests || 100);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

            if (!result.allowed) {
                res.setHeader('Retry-After', result.retryAfter);
                return res.status(429).json({
                    error: 'Too Many Requests',
                    retryAfter: result.retryAfter,
                    resetTime: result.resetTime
                });
            }

            next();
        };
    }

    /**
     * Delay inteligente baseado no rate limit atual
     */
    calculateDelay(type: string, identifier: string): number {
        const status = this.getStatus(type, identifier);

        // Se uso está alto, aumentar delay
        if (status.percentage > 80) {
            return 5000; // 5 segundos
        } else if (status.percentage > 50) {
            return 2000; // 2 segundos
        } else if (status.percentage > 25) {
            return 1000; // 1 segundo
        }

        return 500; // 500ms mínimo
    }
}

// Singleton
let rateLimiterInstance: RateLimiterService | null = null;

export function getRateLimiter(): RateLimiterService {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new RateLimiterService();

        // Cleanup automático a cada 5 minutos
        setInterval(() => {
            rateLimiterInstance?.cleanup();
        }, 5 * 60 * 1000);
    }
    return rateLimiterInstance;
}
