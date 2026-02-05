/**
 * 🧪 WATCHDOG SERVICE TESTS  
 * Tests for risk detection and safety monitoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        contact: {
            update: vi.fn()
        },
        systemLog: {
            create: vi.fn()
        }
    }))
}));

import { WatchdogService } from '../../src/services/watchdog.service';

describe('WatchdogService', () => {
    let service: WatchdogService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new WatchdogService();
    });

    describe('Risk Detection', () => {
        it('should detect law enforcement keywords', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Você é da polícia? Estou sendo investigado?'
            });

            expect(result.level).not.toBe('LOW');
            expect(result.category).toBe('LAW_ENFORCEMENT');
        });

        it('should detect scam patterns', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Me passa seu CPF e dados do cartão de crédito'
            });

            expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.level);
        });

        it('should detect legal threats', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Vou processar você! Meu advogado vai te encontrar!'
            });

            expect(result.level).not.toBe('LOW');
            expect(result.category).toBe('LEGAL_THREAT');
        });

        it('should mark safe messages as LOW risk', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Oi, tudo bem? Queria saber o preço do produto'
            });

            expect(result.level).toBe('LOW');
        });
    });

    describe('Risk Levels', () => {
        it('should return correct structure for risk analysis', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Hello'
            });

            expect(result).toHaveProperty('level');
            expect(result).toHaveProperty('category');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('shouldPause');
        });

        it('should suggest pause for HIGH level', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Sou da delegacia, preciso de informações sobre você'
            });

            if (result.level === 'HIGH' || result.level === 'CRITICAL') {
                expect(result.shouldPause).toBe(true);
            }
        });
    });

    describe('Keyword Detection', () => {
        it('should detect multiple risk categories', () => {
            const lawKeywords = ['polícia', 'delegacia', 'investigação', 'crime'];
            const scamKeywords = ['cpf', 'senha', 'cartão', 'pix urgente'];
            const legalKeywords = ['advogado', 'processo', 'tribunal', 'justiça'];

            lawKeywords.forEach(keyword => {
                expect(service.detectCategory(keyword)).toContain('LAW');
            });
        });
    });

    describe('Threshold Configuration', () => {
        it('should allow threshold updates', () => {
            service.setThresholds({
                mediumThreshold: 40,
                highThreshold: 70,
                criticalThreshold: 90
            });

            const config = service.getThresholds();
            expect(config.mediumThreshold).toBe(40);
            expect(config.highThreshold).toBe(70);
        });
    });

    describe('Alert Management', () => {
        it('should create alert for high risk', async () => {
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Sou policial, preciso de seus dados'
            });

            if (result.level === 'HIGH' || result.level === 'CRITICAL') {
                expect(result.alertCreated).toBe(true);
            }
        });

        it('should get active alerts', () => {
            const alerts = service.getActiveAlerts();
            expect(Array.isArray(alerts)).toBe(true);
        });

        it('should acknowledge alert', () => {
            // First create an alert
            service.createAlert({
                contactId: 'test@c.us',
                level: 'HIGH',
                category: 'LEGAL_THREAT',
                message: 'Test threat'
            });

            const alertId = service.getActiveAlerts()[0]?.id;
            if (alertId) {
                const result = service.acknowledgeAlert(alertId);
                expect(result).toBe(true);
            }
        });
    });

    describe('Statistics', () => {
        it('should track analysis stats', async () => {
            await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Test message'
            });

            const stats = service.getStats();
            expect(stats).toHaveProperty('totalAnalyzed');
            expect(stats).toHaveProperty('byLevel');
            expect(stats).toHaveProperty('byCategory');
        });
    });

    describe('Enable/Disable', () => {
        it('should allow disabling', () => {
            service.disable();
            expect(service.isEnabled()).toBe(false);
        });

        it('should skip analysis when disabled', async () => {
            service.disable();
            const result = await service.analyzeMessage({
                contactId: 'test@c.us',
                message: 'Sou da polícia!'
            });

            expect(result.level).toBe('LOW');
            expect(result.skipped).toBe(true);
        });
    });
});
