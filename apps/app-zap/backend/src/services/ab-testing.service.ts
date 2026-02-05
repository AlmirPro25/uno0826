/**
 * 🧪 A/B TESTING SERVICE (Testes de Abordagem)
 * Testa diferentes mensagens/abordagens para otimizar conversões.
 * Machine learning em tempo real para vendas.
 */

import { PrismaClient } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface ABTest {
    id: string;
    name: string;
    description: string;
    variants: ABVariant[];
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
    metric: 'RESPONSE_RATE' | 'CONVERSION_RATE' | 'ENGAGEMENT_SCORE';
    startDate?: Date;
    endDate?: Date;
    winner?: string;
    createdAt: Date;
}

export interface ABVariant {
    id: string;
    name: string;
    content: string;      // Message template or approach
    weight: number;       // 0-100, distribution weight
    impressions: number;  // Times shown
    conversions: number;  // Times successful
    conversionRate: number;
}

export interface TestResult {
    testId: string;
    winningVariant: string;
    confidence: number;
    improvement: number;
    sampleSize: number;
}

export class ABTestService {
    private logRepo = new LogRepository();
    private tests: Map<string, ABTest> = new Map();

    constructor() {
        this.loadDefaultTests();
    }

    private loadDefaultTests() {
        // Pre-defined A/B tests
        const defaultTests: ABTest[] = [
            {
                id: 'opener-style',
                name: 'Estilo de Abertura',
                description: 'Testa diferentes formas de iniciar conversa',
                status: 'DRAFT',
                metric: 'RESPONSE_RATE',
                variants: [
                    { id: 'v1', name: 'Direto', content: 'Oi {name}, tudo bem?', weight: 33, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v2', name: 'Curioso', content: 'E aí {name}, sumiu? 🔥', weight: 33, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v3', name: 'Íntimo', content: 'Saudade de vc {name} 💕', weight: 34, impressions: 0, conversions: 0, conversionRate: 0 }
                ],
                createdAt: new Date()
            },
            {
                id: 'price-objection',
                name: 'Resposta a Objeção de Preço',
                description: 'Testa diferentes formas de contornar "tá caro"',
                status: 'DRAFT',
                metric: 'CONVERSION_RATE',
                variants: [
                    { id: 'v1', name: 'Desconto', content: 'Posso fazer um precinho especial pra vc amor', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v2', name: 'Valor', content: 'Vale cada centavo gato, me diz o que vc curte mais', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v3', name: 'Escassez', content: 'Esse preço é só hj, amanhã sobe', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v4', name: 'Prova Social', content: 'Os meninos pagam sem reclamar e voltam pedindo mais 😏', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 }
                ],
                createdAt: new Date()
            },
            {
                id: 'closing-technique',
                name: 'Técnica de Fechamento',
                description: 'Testa diferentes formas de fechar a venda',
                status: 'DRAFT',
                metric: 'CONVERSION_RATE',
                variants: [
                    { id: 'v1', name: 'Urgência', content: 'Só tenho mais {n} vagas hoje, quer garantir?', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v2', name: 'Assumido', content: 'Qual pack vc quer amor? o de 50 ou o completo?', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v3', name: 'Benefício', content: 'Imagina a gente curtindo junto... manda o pix ai', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 },
                    { id: 'v4', name: 'Conexão', content: 'Gostei de conversar contigo. Se quiser continuar...', weight: 25, impressions: 0, conversions: 0, conversionRate: 0 }
                ],
                createdAt: new Date()
            }
        ];

        defaultTests.forEach(test => this.tests.set(test.id, test));
    }

    /**
     * Seleciona uma variante para um teste
     */
    selectVariant(testId: string): ABVariant | null {
        const test = this.tests.get(testId);
        if (!test || test.status !== 'RUNNING') return null;

        // Weighted random selection
        const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
        let random = Math.random() * totalWeight;

        for (const variant of test.variants) {
            random -= variant.weight;
            if (random <= 0) {
                variant.impressions++;
                return variant;
            }
        }

        return test.variants[0];
    }

    /**
     * Registra conversão para uma variante
     */
    recordConversion(testId: string, variantId: string): boolean {
        const test = this.tests.get(testId);
        if (!test) return false;

        const variant = test.variants.find(v => v.id === variantId);
        if (!variant) return false;

        variant.conversions++;
        variant.conversionRate = variant.impressions > 0
            ? (variant.conversions / variant.impressions) * 100
            : 0;

        this.logRepo.create('INFO', 'AB_CONVERSION',
            `Test ${testId}, Variant ${variantId}: ${variant.conversionRate.toFixed(2)}%`, undefined);

        return true;
    }

    /**
     * Inicia um teste
     */
    startTest(testId: string): boolean {
        const test = this.tests.get(testId);
        if (!test) return false;

        test.status = 'RUNNING';
        test.startDate = new Date();

        this.logRepo.create('INFO', 'AB_TEST_STARTED', `Test ${test.name} started`, undefined);
        return true;
    }

    /**
     * Pausa um teste
     */
    pauseTest(testId: string): boolean {
        const test = this.tests.get(testId);
        if (!test) return false;

        test.status = 'PAUSED';
        return true;
    }

    /**
     * Finaliza e analisa um teste
     */
    completeTest(testId: string): TestResult | null {
        const test = this.tests.get(testId);
        if (!test) return null;

        test.status = 'COMPLETED';
        test.endDate = new Date();

        // Find winner
        const sortedVariants = [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate);
        const winner = sortedVariants[0];
        const runnerUp = sortedVariants[1];

        const improvement = runnerUp && runnerUp.conversionRate > 0
            ? ((winner.conversionRate - runnerUp.conversionRate) / runnerUp.conversionRate) * 100
            : 0;

        const totalSamples = test.variants.reduce((sum, v) => sum + v.impressions, 0);

        // Calculate confidence (simplified Z-test)
        const confidence = this.calculateConfidence(winner, runnerUp);

        test.winner = winner.id;

        this.logRepo.create('INFO', 'AB_TEST_COMPLETED',
            `Test ${test.name} completed. Winner: ${winner.name} (${winner.conversionRate.toFixed(2)}%)`, undefined);

        return {
            testId,
            winningVariant: winner.name,
            confidence,
            improvement,
            sampleSize: totalSamples
        };
    }

    /**
     * Calcula confiança estatística
     */
    private calculateConfidence(winner: ABVariant, runnerUp?: ABVariant): number {
        if (!runnerUp || winner.impressions < 30 || runnerUp.impressions < 30) {
            return 0; // Insufficient data
        }

        // Simplified confidence calculation
        const p1 = winner.conversionRate / 100;
        const p2 = runnerUp.conversionRate / 100;
        const n1 = winner.impressions;
        const n2 = runnerUp.impressions;

        const pPooled = (winner.conversions + runnerUp.conversions) / (n1 + n2);
        const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

        if (se === 0) return 0;

        const z = (p1 - p2) / se;

        // Convert Z to approximate confidence
        if (z > 2.58) return 99;
        if (z > 1.96) return 95;
        if (z > 1.65) return 90;
        if (z > 1.28) return 80;
        return Math.min(70, Math.max(0, z * 30));
    }

    /**
     * Retorna todos os testes
     */
    getAllTests(): ABTest[] {
        return Array.from(this.tests.values());
    }

    /**
     * Retorna um teste específico
     */
    getTest(testId: string): ABTest | null {
        return this.tests.get(testId) || null;
    }

    /**
     * Cria um novo teste customizado
     */
    createTest(test: Omit<ABTest, 'createdAt'>): ABTest {
        const newTest: ABTest = {
            ...test,
            createdAt: new Date()
        };
        this.tests.set(test.id, newTest);
        return newTest;
    }

    /**
     * Adiciona variante a um teste existente
     */
    addVariant(testId: string, variant: ABVariant): boolean {
        const test = this.tests.get(testId);
        if (!test || test.status === 'RUNNING') return false;

        test.variants.push(variant);
        this.rebalanceWeights(testId);
        return true;
    }

    /**
     * Rebalanceia pesos das variantes
     */
    private rebalanceWeights(testId: string): void {
        const test = this.tests.get(testId);
        if (!test) return;

        const equalWeight = Math.floor(100 / test.variants.length);
        test.variants.forEach(v => v.weight = equalWeight);

        // Distribute remainder
        const remainder = 100 - (equalWeight * test.variants.length);
        if (remainder > 0 && test.variants.length > 0) {
            test.variants[0].weight += remainder;
        }
    }

    /**
     * Retorna estatísticas agregadas
     */
    getStats(): {
        totalTests: number;
        runningTests: number;
        completedTests: number;
        avgConfidence: number;
        avgImprovement: number;
    } {
        const tests = Array.from(this.tests.values());
        const completed = tests.filter(t => t.status === 'COMPLETED');

        return {
            totalTests: tests.length,
            runningTests: tests.filter(t => t.status === 'RUNNING').length,
            completedTests: completed.length,
            avgConfidence: 0, // Would need stored results
            avgImprovement: 0
        };
    }
}
