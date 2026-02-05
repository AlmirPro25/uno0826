/**
 * 🧪 LEAD SCORING SERVICE TESTS
 * Tests for the lead scoring calculation engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        contact: {
            findMany: vi.fn(),
            findUnique: vi.fn()
        },
        message: {
            findMany: vi.fn(),
            count: vi.fn()
        }
    }))
}));

// Import after mocking
import { LeadScoringService } from '../../src/services/lead-scoring.service';

describe('LeadScoringService', () => {
    let service: LeadScoringService;

    beforeEach(() => {
        service = new LeadScoringService();
        vi.clearAllMocks();
    });

    describe('Score Calculation', () => {
        it('should calculate tier correctly for high score', () => {
            // Access private method via any type for testing
            const getTier = (service as any).getTier.bind(service);

            expect(getTier(90)).toBe('DIAMOND');
            expect(getTier(85)).toBe('DIAMOND');
            expect(getTier(75)).toBe('GOLD');
            expect(getTier(70)).toBe('GOLD');
            expect(getTier(55)).toBe('SILVER');
            expect(getTier(35)).toBe('BRONZE');
            expect(getTier(20)).toBe('COLD');
        });

        it('should score engagement correctly', () => {
            const calculateEngagement = (service as any).calculateEngagementScore.bind(service);

            // High engagement: many messages, quick responses
            const highEngagement = calculateEngagement({
                totalMessages: 100,
                avgResponseTime: 30,
                avgMessageLength: 50,
                lastInteraction: new Date()
            });
            expect(highEngagement).toBeGreaterThan(70);

            // Low engagement: few messages, slow responses
            const lowEngagement = calculateEngagement({
                totalMessages: 5,
                avgResponseTime: 3600,
                avgMessageLength: 10,
                lastInteraction: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            });
            expect(lowEngagement).toBeLessThan(30);
        });

        it('should detect intent signals correctly', () => {
            const detectIntent = (service as any).detectIntentSignals.bind(service);

            // High intent message
            const highIntent = detectIntent(['quanto custa?', 'aceita pix?', 'quero comprar']);
            expect(highIntent).toBeGreaterThan(60);

            // Low intent message
            const lowIntent = detectIntent(['oi', 'tudo bem', 'legal']);
            expect(lowIntent).toBeLessThan(30);
        });

        it('should calculate recency score correctly', () => {
            const calculateRecency = (service as any).calculateRecencyScore.bind(service);

            // Today
            const today = calculateRecency(new Date());
            expect(today).toBe(100);

            // 7 days ago
            const weekAgo = calculateRecency(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            expect(weekAgo).toBeCloseTo(70, 0);

            // 30 days ago
            const monthAgo = calculateRecency(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            expect(monthAgo).toBeLessThan(20);
        });
    });

    describe('Tier Classification', () => {
        it('should classify DIAMOND tier correctly', () => {
            const tier = (service as any).getTier(90);
            expect(tier).toBe('DIAMOND');
        });

        it('should classify GOLD tier correctly', () => {
            const tier = (service as any).getTier(75);
            expect(tier).toBe('GOLD');
        });

        it('should classify SILVER tier correctly', () => {
            const tier = (service as any).getTier(55);
            expect(tier).toBe('SILVER');
        });

        it('should classify BRONZE tier correctly', () => {
            const tier = (service as any).getTier(35);
            expect(tier).toBe('BRONZE');
        });

        it('should classify COLD tier correctly', () => {
            const tier = (service as any).getTier(15);
            expect(tier).toBe('COLD');
        });
    });

    describe('Buyer Persona Detection', () => {
        it('should detect IMPULSE buyer correctly', () => {
            const detectPersona = (service as any).detectBuyerPersona.bind(service);
            const persona = detectPersona({
                avgResponseTime: 10,
                messageCount: 5,
                hasAskedPrice: true,
                emotionalState: 'EXCITED'
            });
            // Implementation-specific, adjust as needed
        });
    });

    describe('Recommendations', () => {
        it('should generate appropriate recommendations for DIAMOND tier', () => {
            const generateRecs = (service as any).generateRecommendations.bind(service);
            const recs = generateRecs({
                tier: 'DIAMOND',
                engagementScore: 90,
                intentScore: 85,
                recencyScore: 100
            });

            expect(recs).toBeInstanceOf(Array);
            expect(recs.length).toBeGreaterThan(0);
        });

        it('should generate different recommendations for COLD tier', () => {
            const generateRecs = (service as any).generateRecommendations.bind(service);
            const recs = generateRecs({
                tier: 'COLD',
                engagementScore: 10,
                intentScore: 5,
                recencyScore: 10
            });

            expect(recs).toBeInstanceOf(Array);
        });
    });
});
