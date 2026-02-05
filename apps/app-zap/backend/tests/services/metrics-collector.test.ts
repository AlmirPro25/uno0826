/**
 * 🧪 METRICS COLLECTOR SERVICE TESTS
 * Tests for system metrics collection and export
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetricsCollectorService } from '../../src/services/metrics-collector.service';

describe('MetricsCollectorService', () => {
    let service: MetricsCollectorService;

    beforeEach(() => {
        service = new MetricsCollectorService();
    });

    describe('Counters', () => {
        it('should increment counter', () => {
            service.increment('test_counter');
            expect(service.getCounter('test_counter')).toBe(1);

            service.increment('test_counter', 5);
            expect(service.getCounter('test_counter')).toBe(6);
        });

        it('should return 0 for non-existent counter', () => {
            expect(service.getCounter('non_existent')).toBe(0);
        });

        it('should reset counter', () => {
            service.increment('test_counter', 10);
            service.resetCounter('test_counter');
            expect(service.getCounter('test_counter')).toBe(0);
        });
    });

    describe('Gauges', () => {
        it('should set gauge value', () => {
            service.setGauge('test_gauge', 42);
            expect(service.getGauge('test_gauge')).toBe(42);
        });

        it('should increment gauge', () => {
            service.setGauge('test_gauge', 10);
            service.incrementGauge('test_gauge', 5);
            expect(service.getGauge('test_gauge')).toBe(15);
        });

        it('should decrement gauge', () => {
            service.setGauge('test_gauge', 10);
            service.decrementGauge('test_gauge', 3);
            expect(service.getGauge('test_gauge')).toBe(7);
        });

        it('should not go below 0 when decrementing', () => {
            service.setGauge('test_gauge', 5);
            service.decrementGauge('test_gauge', 10);
            expect(service.getGauge('test_gauge')).toBe(0);
        });
    });

    describe('Histograms', () => {
        it('should observe values', () => {
            service.observe('response_time', 100);
            service.observe('response_time', 200);
            service.observe('response_time', 300);

            expect(service.getAverage('response_time')).toBe(200);
        });

        it('should calculate percentiles', () => {
            // Add 100 values: 1, 2, 3, ..., 100
            for (let i = 1; i <= 100; i++) {
                service.observe('test_histogram', i);
            }

            expect(service.getPercentile('test_histogram', 50)).toBeCloseTo(50, -1);
            expect(service.getPercentile('test_histogram', 95)).toBeCloseTo(95, -1);
        });

        it('should return 0 for empty histogram', () => {
            expect(service.getAverage('empty_histogram')).toBe(0);
            expect(service.getPercentile('empty_histogram', 50)).toBe(0);
        });
    });

    describe('Convenience Methods', () => {
        it('should record message received', () => {
            service.recordMessageReceived();
            expect(service.getCounter('messages_received')).toBe(1);
            expect(service.getCounter('requests_total')).toBe(1);
        });

        it('should record message sent (AI)', () => {
            service.recordMessageSent(true);
            expect(service.getCounter('messages_sent')).toBe(1);
            expect(service.getCounter('ai_responses')).toBe(1);
            expect(service.getCounter('human_interventions')).toBe(0);
        });

        it('should record message sent (Human)', () => {
            service.recordMessageSent(false);
            expect(service.getCounter('messages_sent')).toBe(1);
            expect(service.getCounter('ai_responses')).toBe(0);
            expect(service.getCounter('human_interventions')).toBe(1);
        });

        it('should record response time', () => {
            service.recordResponseTime(150);
            expect(service.getAverage('response_time')).toBe(150);
        });

        it('should record Gemini call', () => {
            service.recordGeminiCall(500);
            expect(service.getCounter('gemini_calls')).toBe(1);
            expect(service.getCounter('gemini_tokens')).toBe(500);
        });

        it('should record image generation', () => {
            service.recordImageGeneration();
            expect(service.getCounter('image_generations')).toBe(1);
        });

        it('should record audio generation', () => {
            service.recordAudioGeneration();
            expect(service.getCounter('audio_generations')).toBe(1);
        });

        it('should record conversion', () => {
            service.recordConversion();
            expect(service.getCounter('conversions')).toBe(1);
        });

        it('should record risk detected', () => {
            service.recordRiskDetected();
            expect(service.getCounter('risks_detected')).toBe(1);
        });

        it('should record error', () => {
            service.recordError();
            expect(service.getCounter('errors_total')).toBe(1);
        });
    });

    describe('Get Metrics', () => {
        it('should return all metrics', () => {
            service.recordMessageReceived();
            service.recordMessageSent(true);

            const metrics = service.getMetrics();

            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('uptime');
            expect(metrics).toHaveProperty('messagesReceived');
            expect(metrics).toHaveProperty('messagesSent');
            expect(metrics).toHaveProperty('aiResponses');
            expect(metrics.messagesReceived).toBe(1);
            expect(metrics.messagesSent).toBe(1);
        });

        it('should calculate error rate correctly', () => {
            // 10 requests, 2 errors = 20% error rate
            for (let i = 0; i < 10; i++) {
                service.recordMessageReceived();
            }
            service.recordError();
            service.recordError();

            const metrics = service.getMetrics();
            expect(metrics.errorRate).toBeCloseTo(20, 0);
        });
    });

    describe('Prometheus Export', () => {
        it('should export in Prometheus format', () => {
            service.recordMessageReceived();
            service.recordGeminiCall();

            const prometheus = service.toPrometheus();

            expect(prometheus).toContain('ghost_protocol_messages_received_total');
            expect(prometheus).toContain('ghost_protocol_gemini_calls_total');
            expect(prometheus).toContain('ghost_protocol_uptime_seconds');
        });

        it('should include histogram stats in export', () => {
            service.observe('response_time', 100);

            const prometheus = service.toPrometheus();

            expect(prometheus).toContain('ghost_protocol_response_time_avg');
            expect(prometheus).toContain('ghost_protocol_response_time_p50');
            expect(prometheus).toContain('ghost_protocol_response_time_p95');
        });
    });

    describe('Reset', () => {
        it('should reset all metrics', () => {
            service.recordMessageReceived();
            service.recordGeminiCall(1000);
            service.observe('test', 100);

            service.reset();

            expect(service.getCounter('messages_received')).toBe(0);
            expect(service.getCounter('gemini_tokens')).toBe(0);
            expect(service.getAverage('test')).toBe(0);
        });
    });
});
