/**
 * 🧪 TEMPLATE SERVICE TESTS
 * Tests for message template management and personalization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({}))
}));

// Mock GeminiService
vi.mock('../../src/services/gemini.service', () => ({
    GeminiService: vi.fn().mockImplementation(() => ({
        generateResponse: vi.fn().mockResolvedValue('Oi amor! Tudo bem?')
    }))
}));

import { TemplateService, MessageTemplate, TemplateContext } from '../../src/services/template.service';

describe('TemplateService', () => {
    let service: TemplateService;

    beforeEach(() => {
        service = new TemplateService();
    });

    describe('Template Management', () => {
        it('should have default templates initialized', () => {
            const templates = service.listTemplates();
            expect(templates.length).toBeGreaterThan(0);
        });

        it('should list templates by category', () => {
            const greetings = service.listTemplates('GREETING');
            expect(greetings.every(t => t.category === 'GREETING')).toBe(true);
        });

        it('should get template by ID', () => {
            const template = service.getTemplate('greeting-casual');
            expect(template).not.toBeNull();
            expect(template?.category).toBe('GREETING');
        });

        it('should return null for non-existent template', () => {
            const template = service.getTemplate('non-existent');
            expect(template).toBeNull();
        });
    });

    describe('Template Application', () => {
        it('should apply template with variables', () => {
            const result = service.applyTemplate('greeting-casual', { nome: 'João' });
            expect(result).toContain('João');
            expect(result).not.toContain('{nome}');
        });

        it('should handle missing variables gracefully', () => {
            const result = service.applyTemplate('greeting-casual', {});
            expect(result).toContain('{nome}');
        });

        it('should return empty string for non-existent template', () => {
            const result = service.applyTemplate('non-existent', { nome: 'João' });
            expect(result).toBe('');
        });

        it('should increment usage count after applying template', () => {
            const beforeCount = service.getTemplate('greeting-casual')?.usageCount || 0;
            service.applyTemplate('greeting-casual', { nome: 'Test' });
            const afterCount = service.getTemplate('greeting-casual')?.usageCount || 0;
            expect(afterCount).toBe(beforeCount + 1);
        });
    });

    describe('Template Selection', () => {
        it('should select best template for high intimacy', () => {
            const template = service.selectBestTemplate('GREETING', 85, 14);
            expect(template).not.toBeNull();
            expect(['FLIRTY', 'CASUAL', 'FRIENDLY']).toContain(template?.tone);
        });

        it('should select best template for low intimacy', () => {
            const template = service.selectBestTemplate('GREETING', 20, 14);
            expect(template).not.toBeNull();
            expect(['FRIENDLY', 'PROFESSIONAL']).toContain(template?.tone);
        });

        it('should return null if no templates exist for category', () => {
            // First remove all templates of a category (for test purposes)
            const template = service.selectBestTemplate('CUSTOM' as any, 50, 14);
            expect(template).toBeNull();
        });
    });

    describe('Outcome Recording', () => {
        it('should update success rate on positive outcome', () => {
            const beforeRate = service.getTemplate('greeting-casual')?.successRate || 50;
            service.recordOutcome('greeting-casual', true);
            const afterRate = service.getTemplate('greeting-casual')?.successRate || 50;
            expect(afterRate).toBeGreaterThanOrEqual(beforeRate);
        });

        it('should update success rate on negative outcome', () => {
            const beforeRate = service.getTemplate('greeting-casual')?.successRate || 50;
            service.recordOutcome('greeting-casual', false);
            const afterRate = service.getTemplate('greeting-casual')?.successRate || 50;
            expect(afterRate).toBeLessThanOrEqual(beforeRate);
        });

        it('should handle non-existent template gracefully', () => {
            expect(() => {
                service.recordOutcome('non-existent', true);
            }).not.toThrow();
        });
    });

    describe('Custom Templates', () => {
        it('should add custom template', () => {
            const newTemplate = service.addTemplate({
                id: 'custom-test',
                name: 'Test Template',
                category: 'CUSTOM',
                template: 'Hello {nome}!',
                variables: ['nome'],
                tone: 'CASUAL',
                useAI: false,
                isActive: true
            });

            expect(newTemplate.id).toBe('custom-test');
            expect(newTemplate.successRate).toBe(50);
            expect(newTemplate.usageCount).toBe(0);
        });

        it('should remove template', () => {
            service.addTemplate({
                id: 'to-remove',
                name: 'To Remove',
                category: 'CUSTOM',
                template: 'Test',
                variables: [],
                tone: 'CASUAL',
                useAI: false,
                isActive: true
            });

            const removed = service.removeTemplate('to-remove');
            expect(removed).toBe(true);
            expect(service.getTemplate('to-remove')).toBeNull();
        });

        it('should toggle template active status', () => {
            const success = service.toggleTemplate('greeting-casual', false);
            expect(success).toBe(true);
            expect(service.getTemplate('greeting-casual')?.isActive).toBe(false);

            service.toggleTemplate('greeting-casual', true);
            expect(service.getTemplate('greeting-casual')?.isActive).toBe(true);
        });
    });

    describe('Statistics', () => {
        it('should return correct stats structure', () => {
            const stats = service.getStats();

            expect(stats).toHaveProperty('totalTemplates');
            expect(stats).toHaveProperty('activeTemplates');
            expect(stats).toHaveProperty('totalUsage');
            expect(stats).toHaveProperty('topPerformers');
            expect(stats).toHaveProperty('byCategory');
        });

        it('should count templates by category', () => {
            const stats = service.getStats();
            expect(stats.byCategory).toHaveProperty('GREETING');
            expect(stats.byCategory.GREETING).toBeGreaterThan(0);
        });
    });

    describe('AI Personalization', () => {
        it('should generate personalized message with AI', async () => {
            const context: TemplateContext = {
                contactName: 'Maria',
                intimacyLevel: 80,
                daysSinceContact: 3,
                lastTopic: 'preço'
            };

            // Use a template that has useAI: true
            const result = await service.generatePersonalizedMessage('reactivation-ai', context);
            expect(typeof result).toBe('string');
        });

        it('should fallback to basic template if AI disabled', async () => {
            const context: TemplateContext = {
                contactName: 'João',
                intimacyLevel: 50,
                daysSinceContact: 1
            };

            const result = await service.generatePersonalizedMessage('greeting-casual', context);
            expect(result).toContain('João');
        });
    });
});
