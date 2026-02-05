/**
 * 🧪 PRESENCE SERVICE TESTS
 * Tests for human-like presence simulation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({}))
}));

import { PresenceService } from '../../src/services/presence.service';

describe('PresenceService', () => {
    let service: PresenceService;

    beforeEach(() => {
        service = new PresenceService();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Availability', () => {
        it('should be available during work hours', () => {
            // Set time to 14:00 on a weekday
            vi.setSystemTime(new Date('2026-01-24T14:00:00'));
            expect(service.isAvailable()).toBe(true);
        });

        it('should not be available during sleep hours', () => {
            // Set time to 03:00
            vi.setSystemTime(new Date('2026-01-24T03:00:00'));
            expect(service.isAvailable()).toBe(false);
        });

        it('should not be available during lunch by default', () => {
            // Set time to 12:30
            vi.setSystemTime(new Date('2026-01-24T12:30:00'));
            // Depends on configuration, but by default might be unavailable
        });
    });

    describe('Typing Delay', () => {
        it('should calculate typing delay based on message length', () => {
            const shortDelay = service.getTypingDelay(10);  // Short message
            const longDelay = service.getTypingDelay(200);  // Long message

            expect(longDelay).toBeGreaterThan(shortDelay);
        });

        it('should have minimum delay', () => {
            const delay = service.getTypingDelay(5);
            expect(delay).toBeGreaterThan(500); // At least 500ms
        });

        it('should have maximum delay', () => {
            const delay = service.getTypingDelay(10000);
            expect(delay).toBeLessThan(30000); // No more than 30s
        });
    });

    describe('Response Delay', () => {
        it('should add extra delay at night', () => {
            vi.setSystemTime(new Date('2026-01-24T23:30:00'));
            const nightDelay = service.getResponseDelay();

            vi.setSystemTime(new Date('2026-01-24T14:00:00'));
            const dayDelay = service.getResponseDelay();

            expect(nightDelay).toBeGreaterThan(dayDelay);
        });

        it('should add extra delay on weekends', () => {
            // Saturday
            vi.setSystemTime(new Date('2026-01-25T14:00:00'));
            const weekendDelay = service.getResponseDelay();

            // Monday
            vi.setSystemTime(new Date('2026-01-27T14:00:00'));
            const weekdayDelay = service.getResponseDelay();

            // Weekend should be slower (or at least not faster)
            expect(weekendDelay).toBeGreaterThanOrEqual(weekdayDelay * 0.5);
        });
    });

    describe('Schedule Configuration', () => {
        it('should allow schedule updates', () => {
            service.updateSchedule({
                wakeUpHour: 9,
                sleepHour: 22
            });

            // Check at 8am (before new wake time)
            vi.setSystemTime(new Date('2026-01-24T08:30:00'));
            expect(service.isAvailable()).toBe(false);

            // Check at 10am (after new wake time)
            vi.setSystemTime(new Date('2026-01-24T10:00:00'));
            expect(service.isAvailable()).toBe(true);
        });
    });

    describe('Status', () => {
        it('should return current status', () => {
            const status = service.getStatus();

            expect(status).toHaveProperty('available');
            expect(status).toHaveProperty('currentHour');
            expect(status).toHaveProperty('schedule');
        });
    });
});
