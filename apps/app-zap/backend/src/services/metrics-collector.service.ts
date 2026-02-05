/**
 * 📊 METRICS COLLECTOR SERVICE
 * Coleta métricas em tempo real do sistema.
 * Expõe dados para monitoramento e alertas.
 */

export interface SystemMetrics {
    timestamp: Date;
    uptime: number;

    // Message metrics
    messagesReceived: number;
    messagesSent: number;
    aiResponses: number;
    humanInterventions: number;

    // Performance
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;

    // Resources
    memoryUsage: number;
    activeSessions: number;

    // AI metrics
    geminiCalls: number;
    geminiTokensUsed: number;
    imageGenerations: number;
    audioGenerations: number;

    // Business metrics
    conversions: number;
    risksDetected: number;
    campaignsSent: number;
}

interface MetricEntry {
    value: number;
    timestamp: number;
}

export class MetricsCollectorService {
    private startTime = Date.now();
    private counters: Map<string, number> = new Map();
    private gauges: Map<string, number> = new Map();
    private histograms: Map<string, MetricEntry[]> = new Map();

    // Constants
    private readonly HISTOGRAM_MAX_ENTRIES = 1000;
    private readonly HISTOGRAM_WINDOW_MS = 60 * 60 * 1000; // 1 hora

    constructor() {
        this.initializeCounters();
        this.startPeriodicCollection();
    }

    private initializeCounters(): void {
        // Initialize all counters
        const counterNames = [
            'messages_received',
            'messages_sent',
            'ai_responses',
            'human_interventions',
            'gemini_calls',
            'gemini_tokens',
            'image_generations',
            'audio_generations',
            'conversions',
            'risks_detected',
            'campaigns_sent',
            'errors_total',
            'requests_total'
        ];

        counterNames.forEach(name => this.counters.set(name, 0));

        // Initialize gauges
        this.gauges.set('active_sessions', 0);
        this.gauges.set('active_contacts', 0);
        this.gauges.set('memory_usage', 0);
        this.gauges.set('cpu_usage', 0);
    }

    private startPeriodicCollection(): void {
        // Collect system metrics every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30 * 1000);
    }

    private collectSystemMetrics(): void {
        const memUsage = process.memoryUsage();
        this.gauges.set('memory_usage', memUsage.heapUsed);
        this.gauges.set('memory_total', memUsage.heapTotal);
    }

    // ==================== COUNTERS ====================

    /**
     * Incrementa um contador
     */
    increment(name: string, value: number = 1): void {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
    }

    /**
     * Obtém valor de um contador
     */
    getCounter(name: string): number {
        return this.counters.get(name) || 0;
    }

    /**
     * Reseta um contador
     */
    resetCounter(name: string): void {
        this.counters.set(name, 0);
    }

    // ==================== GAUGES ====================

    /**
     * Define valor de um gauge
     */
    setGauge(name: string, value: number): void {
        this.gauges.set(name, value);
    }

    /**
     * Obtém valor de um gauge
     */
    getGauge(name: string): number {
        return this.gauges.get(name) || 0;
    }

    /**
     * Incrementa um gauge
     */
    incrementGauge(name: string, value: number = 1): void {
        const current = this.gauges.get(name) || 0;
        this.gauges.set(name, current + value);
    }

    /**
     * Decrementa um gauge
     */
    decrementGauge(name: string, value: number = 1): void {
        const current = this.gauges.get(name) || 0;
        this.gauges.set(name, Math.max(0, current - value));
    }

    // ==================== HISTOGRAMS ====================

    /**
     * Registra valor em histograma (para percentis)
     */
    observe(name: string, value: number): void {
        let entries = this.histograms.get(name);
        if (!entries) {
            entries = [];
            this.histograms.set(name, entries);
        }

        entries.push({
            value,
            timestamp: Date.now()
        });

        // Cleanup old entries
        this.cleanupHistogram(name);
    }

    /**
     * Calcula percentil de um histograma
     */
    getPercentile(name: string, percentile: number): number {
        const entries = this.histograms.get(name);
        if (!entries || entries.length === 0) return 0;

        const values = entries.map(e => e.value).sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * values.length) - 1;
        return values[Math.max(0, index)];
    }

    /**
     * Calcula média de um histograma
     */
    getAverage(name: string): number {
        const entries = this.histograms.get(name);
        if (!entries || entries.length === 0) return 0;

        const sum = entries.reduce((acc, e) => acc + e.value, 0);
        return sum / entries.length;
    }

    /**
     * Limpa entradas antigas do histograma
     */
    private cleanupHistogram(name: string): void {
        const entries = this.histograms.get(name);
        if (!entries) return;

        const cutoff = Date.now() - this.HISTOGRAM_WINDOW_MS;
        const filtered = entries.filter(e => e.timestamp > cutoff);

        // Also limit max entries
        if (filtered.length > this.HISTOGRAM_MAX_ENTRIES) {
            filtered.splice(0, filtered.length - this.HISTOGRAM_MAX_ENTRIES);
        }

        this.histograms.set(name, filtered);
    }

    // ==================== CONVENIENCE METHODS ====================

    /**
     * Registra mensagem recebida
     */
    recordMessageReceived(): void {
        this.increment('messages_received');
        this.increment('requests_total');
    }

    /**
     * Registra mensagem enviada
     */
    recordMessageSent(isAI: boolean): void {
        this.increment('messages_sent');
        if (isAI) {
            this.increment('ai_responses');
        } else {
            this.increment('human_interventions');
        }
    }

    /**
     * Registra tempo de resposta
     */
    recordResponseTime(durationMs: number): void {
        this.observe('response_time', durationMs);
    }

    /**
     * Registra chamada ao Gemini
     */
    recordGeminiCall(tokensUsed: number = 0): void {
        this.increment('gemini_calls');
        this.increment('gemini_tokens', tokensUsed);
    }

    /**
     * Registra geração de imagem
     */
    recordImageGeneration(): void {
        this.increment('image_generations');
    }

    /**
     * Registra geração de áudio
     */
    recordAudioGeneration(): void {
        this.increment('audio_generations');
    }

    /**
     * Registra conversão
     */
    recordConversion(): void {
        this.increment('conversions');
    }

    /**
     * Registra risco detectado
     */
    recordRiskDetected(): void {
        this.increment('risks_detected');
    }

    /**
     * Registra erro
     */
    recordError(): void {
        this.increment('errors_total');
    }

    // ==================== EXPORT ====================

    /**
     * Obtém todas as métricas do sistema
     */
    getMetrics(): SystemMetrics {
        const now = Date.now();
        const requestsTotal = this.getCounter('requests_total');
        const errorsTotal = this.getCounter('errors_total');

        return {
            timestamp: new Date(),
            uptime: now - this.startTime,

            messagesReceived: this.getCounter('messages_received'),
            messagesSent: this.getCounter('messages_sent'),
            aiResponses: this.getCounter('ai_responses'),
            humanInterventions: this.getCounter('human_interventions'),

            avgResponseTime: this.getAverage('response_time'),
            p95ResponseTime: this.getPercentile('response_time', 95),
            errorRate: requestsTotal > 0 ? (errorsTotal / requestsTotal) * 100 : 0,

            memoryUsage: this.getGauge('memory_usage'),
            activeSessions: this.getGauge('active_sessions'),

            geminiCalls: this.getCounter('gemini_calls'),
            geminiTokensUsed: this.getCounter('gemini_tokens'),
            imageGenerations: this.getCounter('image_generations'),
            audioGenerations: this.getCounter('audio_generations'),

            conversions: this.getCounter('conversions'),
            risksDetected: this.getCounter('risks_detected'),
            campaignsSent: this.getCounter('campaigns_sent')
        };
    }

    /**
     * Exporta métricas em formato Prometheus
     */
    toPrometheus(): string {
        const lines: string[] = [];
        const prefix = 'ghost_protocol';

        // Counters
        for (const [name, value] of this.counters.entries()) {
            lines.push(`${prefix}_${name}_total ${value}`);
        }

        // Gauges
        for (const [name, value] of this.gauges.entries()) {
            lines.push(`${prefix}_${name} ${value}`);
        }

        // Histograms
        for (const name of this.histograms.keys()) {
            lines.push(`${prefix}_${name}_avg ${this.getAverage(name)}`);
            lines.push(`${prefix}_${name}_p50 ${this.getPercentile(name, 50)}`);
            lines.push(`${prefix}_${name}_p95 ${this.getPercentile(name, 95)}`);
            lines.push(`${prefix}_${name}_p99 ${this.getPercentile(name, 99)}`);
        }

        // System
        lines.push(`${prefix}_uptime_seconds ${(Date.now() - this.startTime) / 1000}`);

        return lines.join('\n');
    }

    /**
     * Reseta todas as métricas (para testes)
     */
    reset(): void {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
        this.startTime = Date.now();
        this.initializeCounters();
    }
}

// Singleton
let metricsInstance: MetricsCollectorService | null = null;

export function getMetrics(): MetricsCollectorService {
    if (!metricsInstance) {
        metricsInstance = new MetricsCollectorService();
    }
    return metricsInstance;
}
