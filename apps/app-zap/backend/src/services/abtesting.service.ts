/**
 * 🧪 A/B TESTING SERVICE
 * Testa diferentes abordagens de venda automaticamente.
 * Identifica o que converte melhor e otimiza respostas.
 */

import { PrismaClient } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface ABTestVariant {
    id: string;
    name: string;
    content: string;         // O template da mensagem
    impressions: number;     // Quantas vezes foi mostrada
    conversions: number;     // Quantas vezes converteu
    conversionRate: number;  // Taxa de conversão
}

export interface ABTest {
    id: string;
    name: string;
    description: string;
    type: 'GREETING' | 'OBJECTION' | 'CLOSING' | 'FOLLOWUP' | 'REACTIVATION';
    variants: ABTestVariant[];
    isActive: boolean;
    winningVariant?: string;
    createdAt: Date;
    endsAt?: Date;
    minSampleSize: number;
}

export class ABTestingService {
    private logRepo = new LogRepository();
    private tests: Map<string, ABTest> = new Map();

    constructor() {
        this.initializeDefaultTests();
    }

    private initializeDefaultTests() {
        // Test: Saudação Inicial
        this.createTest({
            id: 'greeting-test',
            name: 'Teste de Saudação',
            description: 'Qual saudação gera mais engajamento?',
            type: 'GREETING',
            variants: [
                { id: 'v1', name: 'Formal', content: 'Olá! Tudo bem? 😊', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v2', name: 'Casual', content: 'Oi lindx! 🔥', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v3', name: 'Direto', content: 'E aí, como posso te ajudar? 💬', impressions: 0, conversions: 0, conversionRate: 0 }
            ],
            isActive: true,
            minSampleSize: 50
        });

        // Test: Resposta a Preço Alto
        this.createTest({
            id: 'price-objection-test',
            name: 'Teste de Objeção de Preço',
            description: 'Qual resposta funciona melhor quando dizem que tá caro?',
            type: 'OBJECTION',
            variants: [
                { id: 'v1', name: 'Valor', content: 'Entendo! Mas olha o que você leva: {produtos}. Vale muito!', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v2', name: 'Escassez', content: 'Esse preço é por tempo limitado, viu? Depois sobe 😬', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v3', name: 'Parcelamento', content: 'Posso parcelar pra você! Fica suave 💳', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v4', name: 'Social Proof', content: 'Várias pessoas já compraram e amaram! Quer ver depoimentos?', impressions: 0, conversions: 0, conversionRate: 0 }
            ],
            isActive: true,
            minSampleSize: 30
        });

        // Test: Fechamento de Venda
        this.createTest({
            id: 'closing-test',
            name: 'Teste de Fechamento',
            description: 'Qual fechamento converte mais?',
            type: 'CLOSING',
            variants: [
                { id: 'v1', name: 'Urgência', content: 'Então, bora fechar? Só tenho mais {x} vagas hoje! 🔥', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v2', name: 'Soft Close', content: 'Quer que eu mande o pix? 😏', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v3', name: 'Alternativa', content: 'Prefere o pacote {A} ou o {B}?', impressions: 0, conversions: 0, conversionRate: 0 }
            ],
            isActive: true,
            minSampleSize: 30
        });

        // Test: Reativação de Contato Frio
        this.createTest({
            id: 'reactivation-test',
            name: 'Teste de Reativação',
            description: 'Qual mensagem traz de volta contatos frios?',
            type: 'REACTIVATION',
            variants: [
                { id: 'v1', name: 'Saudade', content: 'Oi {nome}! Sumiu, tava pensando em você 💭', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v2', name: 'Novidade', content: 'Ei {nome}! Tenho novidades quentinhas pra você 🔥', impressions: 0, conversions: 0, conversionRate: 0 },
                { id: 'v3', name: 'Desconto', content: '{nome}! Preparei um desconto especial só pra você 🎁', impressions: 0, conversions: 0, conversionRate: 0 }
            ],
            isActive: true,
            minSampleSize: 30
        });
    }

    /**
     * Cria um novo teste
     */
    createTest(test: Omit<ABTest, 'createdAt'>): void {
        const fullTest: ABTest = {
            ...test,
            createdAt: new Date()
        };
        this.tests.set(test.id, fullTest);
    }

    /**
     * Seleciona uma variante para mostrar (weighted random)
     */
    selectVariant(testId: string): ABTestVariant | null {
        const test = this.tests.get(testId);
        if (!test || !test.isActive) return null;

        // Se já tem vencedor declarado, retorna ele
        if (test.winningVariant) {
            return test.variants.find(v => v.id === test.winningVariant) || null;
        }

        // Thompson Sampling para seleção inteligente
        const scores = test.variants.map(v => {
            // Beta distribution approximation
            const alpha = v.conversions + 1;
            const beta = v.impressions - v.conversions + 1;
            return { variant: v, score: this.sampleBeta(alpha, beta) };
        });

        // Seleciona variante com maior score
        scores.sort((a, b) => b.score - a.score);
        return scores[0].variant;
    }

    /**
     * Registra uma impressão (variante foi mostrada)
     */
    recordImpression(testId: string, variantId: string): void {
        const test = this.tests.get(testId);
        if (!test) return;

        const variant = test.variants.find(v => v.id === variantId);
        if (variant) {
            variant.impressions++;
            this.updateConversionRate(variant);
            this.checkForWinner(test);
        }
    }

    /**
     * Registra uma conversão (ação desejada ocorreu)
     */
    recordConversion(testId: string, variantId: string): void {
        const test = this.tests.get(testId);
        if (!test) return;

        const variant = test.variants.find(v => v.id === variantId);
        if (variant) {
            variant.conversions++;
            this.updateConversionRate(variant);
            this.checkForWinner(test);

            this.logRepo.create('INFO', 'AB_TEST_CONVERSION',
                `Test "${test.name}" - Variant "${variant.name}" converted`, undefined);
        }
    }

    /**
     * Atualiza taxa de conversão
     */
    private updateConversionRate(variant: ABTestVariant): void {
        variant.conversionRate = variant.impressions > 0
            ? (variant.conversions / variant.impressions) * 100
            : 0;
    }

    /**
     * Verifica se há um vencedor estatisticamente significativo
     */
    private checkForWinner(test: ABTest): void {
        // Precisamos de amostra mínima
        const totalImpressions = test.variants.reduce((sum, v) => sum + v.impressions, 0);
        if (totalImpressions < test.minSampleSize * test.variants.length) return;

        // Ordenar por taxa de conversão
        const sorted = [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate);
        const best = sorted[0];
        const secondBest = sorted[1];

        // Calcular significância estatística (simplificado)
        const zScore = this.calculateZScore(best, secondBest);

        // Se z-score > 1.96 (95% confidence), declarar vencedor
        if (zScore > 1.96) {
            test.winningVariant = best.id;
            this.logRepo.create('INFO', 'AB_TEST_WINNER',
                `Test "${test.name}" - Winner: "${best.name}" with ${best.conversionRate.toFixed(2)}% conversion`, undefined);
        }
    }

    /**
     * Calcula Z-score para comparar duas variantes
     */
    private calculateZScore(a: ABTestVariant, b: ABTestVariant): number {
        if (a.impressions < 10 || b.impressions < 10) return 0;

        const p1 = a.conversions / a.impressions;
        const p2 = b.conversions / b.impressions;
        const p = (a.conversions + b.conversions) / (a.impressions + b.impressions);

        const se = Math.sqrt(p * (1 - p) * (1 / a.impressions + 1 / b.impressions));

        return se > 0 ? (p1 - p2) / se : 0;
    }

    /**
     * Sample from Beta distribution (approximation)
     */
    private sampleBeta(alpha: number, beta: number): number {
        // Simple approximation using gamma distribution ratio
        const x = this.sampleGamma(alpha);
        const y = this.sampleGamma(beta);
        return x / (x + y);
    }

    private sampleGamma(shape: number): number {
        // Marsaglia and Tsang's method
        if (shape < 1) {
            return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
        }

        const d = shape - 1 / 3;
        const c = 1 / Math.sqrt(9 * d);

        while (true) {
            let x, v;
            do {
                x = this.randomNormal();
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            const u = Math.random();

            if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
        }
    }

    private randomNormal(): number {
        const u = Math.random();
        const v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // ==================== API Methods ====================

    /**
     * Lista todos os testes
     */
    getAllTests(): ABTest[] {
        return Array.from(this.tests.values());
    }

    /**
     * Obtém um teste específico
     */
    getTest(testId: string): ABTest | null {
        return this.tests.get(testId) || null;
    }

    /**
     * Ativa/desativa teste
     */
    toggleTest(testId: string, active: boolean): boolean {
        const test = this.tests.get(testId);
        if (!test) return false;
        test.isActive = active;
        return true;
    }

    /**
     * Reseta estatísticas de um teste
     */
    resetTest(testId: string): boolean {
        const test = this.tests.get(testId);
        if (!test) return false;

        test.variants.forEach(v => {
            v.impressions = 0;
            v.conversions = 0;
            v.conversionRate = 0;
        });
        test.winningVariant = undefined;

        return true;
    }

    /**
     * Obtém melhor variante de um teste
     */
    getBestVariant(testId: string): ABTestVariant | null {
        const test = this.tests.get(testId);
        if (!test) return null;

        if (test.winningVariant) {
            return test.variants.find(v => v.id === test.winningVariant) || null;
        }

        // Retorna a com maior taxa de conversão se não há vencedor oficial
        return [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate)[0];
    }

    /**
     * Estatísticas gerais de A/B testing
     */
    getStats(): {
        totalTests: number;
        activeTests: number;
        testsWithWinner: number;
        totalImpressions: number;
        totalConversions: number;
    } {
        const tests = Array.from(this.tests.values());

        let totalImpressions = 0;
        let totalConversions = 0;

        tests.forEach(test => {
            test.variants.forEach(v => {
                totalImpressions += v.impressions;
                totalConversions += v.conversions;
            });
        });

        return {
            totalTests: tests.length,
            activeTests: tests.filter(t => t.isActive).length,
            testsWithWinner: tests.filter(t => t.winningVariant).length,
            totalImpressions,
            totalConversions
        };
    }
}
