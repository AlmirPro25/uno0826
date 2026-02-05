/**
 * 🧪 RATE LIMITER SERVICE TESTS
 * Tests for rate limiting functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiterService, RateLimitConfig } from '../../src/services/rate-limiter.service';

describe('RateLimiterService', () => {
    let service: RateLimiterService;

    beforeEach(() => {
        service = new RateLimiterService();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Basic Rate Limiting', () => {
        it('should allow requests under limit', () => {
            const result = service.check('MESSAGE_OUTBOUND', 'contact-1');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(9); // 10 max - 1
        });

        it('should block requests over limit', () => {
            // Hit the limit
            for (let i = 0; i < 10; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            const result = service.check('MESSAGE_OUTBOUND', 'contact-1');
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeGreaterThan(0);
        });

        it('should reset after window expires', () => {
            // Hit the limit
            for (let i = 0; i < 10; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            // Advance time past the window (1 minute)
            vi.advanceTimersByTime(61 * 1000);

            const result = service.check('MESSAGE_OUTBOUND', 'contact-1');
            expect(result.allowed).toBe(true);
        });

        it('should track different identifiers separately', () => {
            // Hit limit for contact-1
            for (let i = 0; i < 10; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            // contact-2 should still be allowed
            const result = service.check('MESSAGE_OUTBOUND', 'contact-2');
            expect(result.allowed).toBe(true);
        });

        it('should track different types separately', () => {
            // Hit MESSAGE_OUTBOUND limit
            for (let i = 0; i < 10; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            // GEMINI_API should still be allowed
            const result = service.check('GEMINI_API', 'contact-1');
            expect(result.allowed).toBe(true);
        });
    });

    describe('Hit Method', () => {
        it('should increment counter without checking', () => {
            const before = service.getStatus('API_REQUEST', 'user-1');
            service.hit('API_REQUEST', 'user-1');
            service.hit('API_REQUEST', 'user-1');
            const after = service.getStatus('API_REQUEST', 'user-1');

            // Initial check creates 1, then 2 hits = 3 total
            expect(after.current).toBeGreaterThan(before.current);
        });
    });

    describe('Reset Method', () => {
        it('should reset limit for identifier', () => {
            // Create some hits
            for (let i = 0; i < 5; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            // Reset
            service.reset('MESSAGE_OUTBOUND', 'contact-1');

            // Check status
            const status = service.getStatus('MESSAGE_OUTBOUND', 'contact-1');
            expect(status.current).toBe(0);
        });
    });

    describe('Status Method', () => {
        it('should return correct status structure', () => {
            service.check('MESSAGE_OUTBOUND', 'contact-1');
            const status = service.getStatus('MESSAGE_OUTBOUND', 'contact-1');

            expect(status).toHaveProperty('current');
            expect(status).toHaveProperty('max');
            expect(status).toHaveProperty('remaining');
            expect(status).toHaveProperty('percentage');
            expect(status).toHaveProperty('resetIn');
        });

        it('should calculate percentage correctly', () => {
            // Use 5 of 10 requests
            for (let i = 0; i < 5; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            const status = service.getStatus('MESSAGE_OUTBOUND', 'contact-1');
            expect(status.percentage).toBe(50);
        });
    });

    describe('Custom Config', () => {
        it('should accept custom configuration', () => {
            const customConfig: RateLimitConfig = {
                windowMs: 5000,
                maxRequests: 3,
                skipFailures: false
            };

            service.setConfig('CUSTOM_TYPE', customConfig);
            const config = service.getConfig('CUSTOM_TYPE');

            expect(config?.windowMs).toBe(5000);
            expect(config?.maxRequests).toBe(3);
        });

        it('should apply custom config to rate limiting', () => {
            service.setConfig('CUSTOM_TYPE', {
                windowMs: 1000,
                maxRequests: 2,
                skipFailures: false
            });

            service.check('CUSTOM_TYPE', 'test');
            service.check('CUSTOM_TYPE', 'test');
            const result = service.check('CUSTOM_TYPE', 'test');

            expect(result.allowed).toBe(false);
        });
    });

    describe('List Types', () => {
        it('should list all configured types', () => {
            const types = service.listTypes();

            expect(types).toContain('MESSAGE_OUTBOUND');
            expect(types).toContain('MESSAGE_GLOBAL');
            expect(types).toContain('GEMINI_API');
            expect(types).toContain('IMAGE_GENERATION');
        });
    });

    describe('Cleanup', () => {
        it('should cleanup expired entries', () => {
            service.check('MESSAGE_OUTBOUND', 'contact-1');
            service.check('MESSAGE_OUTBOUND', 'contact-2');

            // Advance time past 2x window
            vi.advanceTimersByTime(3 * 60 * 1000);

            const cleaned = service.cleanup();
            expect(cleaned).toBeGreaterThan(0);
        });
    });

    describe('Statistics', () => {
        it('should return correct stats', () => {
            service.check('MESSAGE_OUTBOUND', 'contact-1');
            service.check('GEMINI_API', 'contact-1');

            const stats = service.getStats();

            expect(stats).toHaveProperty('activeKeys');
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('totalHits');
            expect(stats.activeKeys).toBeGreaterThan(0);
        });
    });

    describe('Calculate Delay', () => {
        it('should return low delay for light usage', () => {
            service.check('MESSAGE_OUTBOUND', 'contact-1');
            const delay = service.calculateDelay('MESSAGE_OUTBOUND', 'contact-1');
            expect(delay).toBe(500); // Minimum delay
        });

        it('should return high delay for heavy usage', () => {
            // Use 9 of 10 (90%)
            for (let i = 0; i < 9; i++) {
                service.check('MESSAGE_OUTBOUND', 'contact-1');
            }

            const delay = service.calculateDelay('MESSAGE_OUTBOUND', 'contact-1');
            expect(delay).toBe(5000); // Max delay for >80%
        });
    });

    describe('Express Middleware', () => {
        it('should return a middleware function', () => {
            const middleware = service.expressMiddleware('API_REQUEST');
            expect(typeof middleware).toBe('function');
        });

        it('should allow requests under limit', () => {
            const middleware = service.expressMiddleware('API_REQUEST');

            const req = { ip: '127.0.0.1' };
            const res = {
                setHeader: vi.fn(),
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
        });

        it('should block requests over limit', () => {
            service.setConfig('TEST_API', {
                windowMs: 60000,
                maxRequests: 1,
                skipFailures: false
            });

            const middleware = service.expressMiddleware('TEST_API');

            const req = { ip: '127.0.0.1' };
            const res = {
                setHeader: vi.fn(),
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            // First request OK
            middleware(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);

            // Reset mocks
            next.mockClear();
            res.status.mockClear();

            // Second request blocked
            middleware(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(429);
        });
    });
});
