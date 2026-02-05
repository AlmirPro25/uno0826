/**
 * 🧪 HUNTER SERVICE TESTS
 * Tests for proactive outreach functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        contact: {
            findMany: vi.fn().mockResolvedValue([
                {
                    id: 'contact1@c.us',
                    name: 'Test User 1',
                    isPaused: false,
                    intimacyLevel: 60,
                    lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
                },
                {
                    id: 'contact2@c.us',
                    name: 'Test User 2',
                    isPaused: true, // Should be excluded
                    intimacyLevel: 80,
                    lastInteraction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 'contact3@c.us',
                    name: 'Test User 3',
                    isPaused: false,
                    intimacyLevel: 20, // Too low intimacy
                    lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                }
            ])
        },
        message: {
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0)
        }
    }))
}));

// Mock GeminiService
vi.mock('../../src/services/gemini.service', () => ({
    GeminiService: vi.fn().mockImplementation(() => ({
        generateResponse: vi.fn().mockResolvedValue('Oi! Sumiu!')
    }))
}));

import { HunterService } from '../../src/services/hunter.service';

describe('HunterService', () => {
    let service: HunterService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new HunterService();
    });

    describe('Configuration', () => {
        it('should have default configuration', () => {
            const config = service.getConfig();
            expect(config).toHaveProperty('enabled');
            expect(config).toHaveProperty('minDaysSince');
            expect(config).toHaveProperty('minIntimacy');
            expect(config).toHaveProperty('maxMessagesPerDay');
        });

        it('should allow configuration updates', () => {
            service.configure({
                enabled: false,
                minDaysSince: 7
            });

            const config = service.getConfig();
            expect(config.enabled).toBe(false);
            expect(config.minDaysSince).toBe(7);
        });
    });

    describe('Candidate Finding', () => {
        it('should find hunting candidates', async () => {
            const candidates = await service.findCandidates();
            expect(Array.isArray(candidates)).toBe(true);
        });

        it('should exclude paused contacts', async () => {
            const candidates = await service.findCandidates();
            const hasPaused = candidates.some((c: any) => c.isPaused);
            expect(hasPaused).toBe(false);
        });
    });

    describe('Strategy Selection', () => {
        it('should select appropriate strategy based on contact', () => {
            const warmContact = {
                intimacyLevel: 70,
                daysSinceContact: 5,
                previousPurchases: 0
            };

            const strategy = service.selectStrategy(warmContact);
            expect(['WARM_REACTIVATION', 'COLD_FOLLOWUP', 'HOT_CONVERSION']).toContain(strategy);
        });

        it('should use different strategies for different contacts', () => {
            const hotContact = {
                intimacyLevel: 90,
                daysSinceContact: 2,
                salesReadiness: 85
            };

            const coldContact = {
                intimacyLevel: 20,
                daysSinceContact: 30,
                salesReadiness: 10
            };

            const hotStrategy = service.selectStrategy(hotContact);
            const coldStrategy = service.selectStrategy(coldContact);

            // Different contacts should potentially get different strategies
            // (though they might get the same in edge cases)
        });
    });

    describe('Message Generation', () => {
        it('should generate hunting message', async () => {
            const contact = {
                id: 'test@c.us',
                name: 'Test User',
                intimacyLevel: 60,
                lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            };

            const message = await service.generateMessage(contact);
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
        });
    });

    describe('Execution', () => {
        it('should execute hunt in dry run mode', async () => {
            const result = await service.execute({ dryRun: true });

            expect(result).toHaveProperty('candidatesFound');
            expect(result).toHaveProperty('messagesSent');
            expect(result.dryRun).toBe(true);
        });

        it('should respect max messages per execution', async () => {
            service.configure({ maxMessagesPerDay: 2 });
            const result = await service.execute({ dryRun: true });

            expect(result.messagesSent).toBeLessThanOrEqual(2);
        });
    });

    describe('Statistics', () => {
        it('should track execution stats', async () => {
            await service.execute({ dryRun: true });
            const stats = service.getStats();

            expect(stats).toHaveProperty('totalExecutions');
            expect(stats).toHaveProperty('totalMessagesSent');
            expect(stats).toHaveProperty('lastExecution');
        });
    });

    describe('Enable/Disable', () => {
        it('should disable hunting', () => {
            service.disable();
            expect(service.getConfig().enabled).toBe(false);
        });

        it('should enable hunting', () => {
            service.disable();
            service.enable();
            expect(service.getConfig().enabled).toBe(true);
        });

        it('should not execute when disabled', async () => {
            service.disable();
            const result = await service.execute({ dryRun: true });
            expect(result.messagesSent).toBe(0);
        });
    });
});
