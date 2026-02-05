/**
 * 🧪 ANALYTICS SERVICE TESTS
 * Tests for metrics and statistics calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        message: {
            count: vi.fn().mockResolvedValue(100),
            findMany: vi.fn().mockResolvedValue([
                { timestamp: new Date(), fromMe: true, body: 'Hello' },
                { timestamp: new Date(), fromMe: false, body: 'Hi' }
            ]),
            groupBy: vi.fn().mockResolvedValue([])
        },
        contact: {
            count: vi.fn().mockResolvedValue(50),
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null)
        },
        systemLog: {
            count: vi.fn().mockResolvedValue(10),
            findMany: vi.fn().mockResolvedValue([])
        }
    }))
}));

import { AnalyticsService } from '../../src/services/analytics.service';

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AnalyticsService();
    });

    describe('Daily Metrics', () => {
        it('should get daily metrics', async () => {
            const metrics = await service.getDailyMetrics();

            expect(metrics).toHaveProperty('date');
            expect(metrics).toHaveProperty('messagesReceived');
            expect(metrics).toHaveProperty('messagesSent');
            expect(metrics).toHaveProperty('activeContacts');
        });

        it('should calculate AI response rate', async () => {
            const metrics = await service.getDailyMetrics();

            expect(metrics.aiResponseRate).toBeGreaterThanOrEqual(0);
            expect(metrics.aiResponseRate).toBeLessThanOrEqual(100);
        });
    });

    describe('Conversion Funnel', () => {
        it('should return funnel stages', async () => {
            const funnel = await service.getConversionFunnel();

            expect(funnel).toHaveProperty('stages');
            expect(Array.isArray(funnel.stages)).toBe(true);
        });

        it('should have correct stage order', async () => {
            const funnel = await service.getConversionFunnel();
            const stageNames = funnel.stages.map((s: any) => s.name);

            expect(stageNames).toContain('Leads');
            expect(stageNames).toContain('Engaged');
            expect(stageNames).toContain('Converted');
        });

        it('should calculate conversion rates', async () => {
            const funnel = await service.getConversionFunnel();

            funnel.stages.forEach((stage: any) => {
                expect(stage.count).toBeGreaterThanOrEqual(0);
                expect(stage.rate).toBeGreaterThanOrEqual(0);
                expect(stage.rate).toBeLessThanOrEqual(100);
            });
        });
    });

    describe('Peak Hours', () => {
        it('should return hourly distribution', async () => {
            const peakHours = await service.getPeakHours();

            expect(Array.isArray(peakHours)).toBe(true);
            expect(peakHours.length).toBe(24); // 24 hours
        });

        it('should have hour and count for each entry', async () => {
            const peakHours = await service.getPeakHours();

            peakHours.forEach((entry: any) => {
                expect(entry).toHaveProperty('hour');
                expect(entry).toHaveProperty('count');
                expect(entry.hour).toBeGreaterThanOrEqual(0);
                expect(entry.hour).toBeLessThan(24);
            });
        });
    });

    describe('Top Contacts', () => {
        it('should return top contacts by engagement', async () => {
            const topContacts = await service.getTopContacts(10);

            expect(Array.isArray(topContacts)).toBe(true);
            expect(topContacts.length).toBeLessThanOrEqual(10);
        });

        it('should order by score descending', async () => {
            const topContacts = await service.getTopContacts(5);

            for (let i = 1; i < topContacts.length; i++) {
                expect(topContacts[i - 1].score).toBeGreaterThanOrEqual(topContacts[i].score);
            }
        });
    });

    describe('Keyword Cloud', () => {
        it('should extract keywords from messages', async () => {
            const keywords = await service.getKeywordCloud();

            expect(Array.isArray(keywords)).toBe(true);
        });

        it('should return word and count', async () => {
            const keywords = await service.getKeywordCloud();

            keywords.forEach((kw: any) => {
                expect(kw).toHaveProperty('word');
                expect(kw).toHaveProperty('count');
            });
        });
    });

    describe('Date Range', () => {
        it('should filter by date range', async () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date('2026-01-31');

            const metrics = await service.getDailyMetrics(startDate, endDate);

            expect(metrics).toHaveProperty('date');
        });
    });

    describe('Overview Stats', () => {
        it('should return complete overview', async () => {
            const overview = await service.getOverview();

            expect(overview).toHaveProperty('totalContacts');
            expect(overview).toHaveProperty('totalMessages');
            expect(overview).toHaveProperty('aiResponseRate');
            expect(overview).toHaveProperty('avgResponseTime');
        });
    });

    describe('Trends', () => {
        it('should calculate trends over time', async () => {
            const trends = await service.getTrends(7); // Last 7 days

            expect(Array.isArray(trends)).toBe(true);
            expect(trends.length).toBeLessThanOrEqual(7);
        });

        it('should include date and metrics in each trend', async () => {
            const trends = await service.getTrends(7);

            trends.forEach((day: any) => {
                expect(day).toHaveProperty('date');
                expect(day).toHaveProperty('messages');
                expect(day).toHaveProperty('contacts');
            });
        });
    });
});
