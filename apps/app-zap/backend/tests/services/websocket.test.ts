/**
 * 🧪 WEBSOCKET SERVICE TESTS
 * Tests for real-time WebSocket functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock socket.io
vi.mock('socket.io', () => ({
    Server: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        emit: vi.fn(),
        to: vi.fn().mockReturnThis()
    }))
}));

// Mock log repository
vi.mock('../../src/repositories/log.repository', () => ({
    LogRepository: vi.fn().mockImplementation(() => ({
        create: vi.fn()
    }))
}));

import { WebSocketService } from '../../src/services/websocket.service';

describe('WebSocketService', () => {
    let service: WebSocketService;

    beforeEach(() => {
        service = new WebSocketService();
    });

    describe('Event Types', () => {
        it('should have all required event types defined', () => {
            expect(WebSocketService.EVENTS.MESSAGE_RECEIVED).toBe('message:received');
            expect(WebSocketService.EVENTS.MESSAGE_SENT).toBe('message:sent');
            expect(WebSocketService.EVENTS.CONTACT_UPDATED).toBe('contact:updated');
            expect(WebSocketService.EVENTS.RISK_DETECTED).toBe('risk:detected');
            expect(WebSocketService.EVENTS.METRICS_UPDATE).toBe('metrics:update');
            expect(WebSocketService.EVENTS.LEAD_SCORE_UPDATED).toBe('lead:score_updated');
            expect(WebSocketService.EVENTS.CONVERSION).toBe('lead:conversion');
        });
    });

    describe('Without Initialization', () => {
        it('should not throw when broadcasting without server', () => {
            expect(() => {
                service.broadcast('test:event', { data: 'test' });
            }).not.toThrow();
        });

        it('should not throw when emitting to room without server', () => {
            expect(() => {
                service.emitToRoom('room1', 'test:event', { data: 'test' });
            }).not.toThrow();
        });

        it('should not throw when emitting to client without server', () => {
            expect(() => {
                service.emitToClient('client1', 'test:event', { data: 'test' });
            }).not.toThrow();
        });

        it('should return 0 connected clients without server', () => {
            expect(service.getConnectedCount()).toBe(0);
        });

        it('should return empty array for connected clients', () => {
            expect(service.getConnectedClients()).toEqual([]);
        });

        it('should return not running status', () => {
            expect(service.isRunning()).toBe(false);
        });
    });

    describe('Status Methods', () => {
        it('should return correct status structure', () => {
            const status = service.getStatus();

            expect(status).toHaveProperty('running');
            expect(status).toHaveProperty('connectedClients');
            expect(status).toHaveProperty('uptime');
        });
    });

    describe('Convenience Methods (without server)', () => {
        it('should not throw on notifyMessageReceived', () => {
            expect(() => {
                service.notifyMessageReceived('contact1', {
                    id: 'msg1',
                    body: 'Hello',
                    fromMe: false,
                    timestamp: new Date()
                });
            }).not.toThrow();
        });

        it('should not throw on notifyMessageSent', () => {
            expect(() => {
                service.notifyMessageSent('contact1', {
                    id: 'msg1',
                    body: 'Hi there!',
                    isAI: true,
                    timestamp: new Date()
                });
            }).not.toThrow();
        });

        it('should not throw on notifyContactUpdated', () => {
            expect(() => {
                service.notifyContactUpdated({
                    id: 'contact1',
                    name: 'John',
                    isPaused: false,
                    intimacyLevel: 50,
                    salesReadiness: 30
                });
            }).not.toThrow();
        });

        it('should not throw on notifyRiskDetected', () => {
            expect(() => {
                service.notifyRiskDetected({
                    contactId: 'contact1',
                    contactName: 'John',
                    level: 'HIGH',
                    category: 'LAW_ENFORCEMENT',
                    message: 'Risk detected'
                });
            }).not.toThrow();
        });

        it('should not throw on notifyMetricsUpdate', () => {
            expect(() => {
                service.notifyMetricsUpdate({
                    messagesReceived: 100,
                    messagesSent: 90,
                    activeContacts: 25,
                    aiResponseRate: 85
                });
            }).not.toThrow();
        });

        it('should not throw on notifyLeadScoreUpdated', () => {
            expect(() => {
                service.notifyLeadScoreUpdated({
                    contactId: 'contact1',
                    contactName: 'John',
                    oldScore: 50,
                    newScore: 75,
                    tier: 'GOLD'
                });
            }).not.toThrow();
        });

        it('should not throw on notifyConversion', () => {
            expect(() => {
                service.notifyConversion({
                    contactId: 'contact1',
                    contactName: 'John',
                    value: 99.90
                });
            }).not.toThrow();
        });
    });
});
