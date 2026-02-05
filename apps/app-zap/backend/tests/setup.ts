/**
 * Test Setup File
 * Runs before all tests
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Mock console for cleaner test output
beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'info').mockImplementation(() => { });
});

afterAll(() => {
    vi.restoreAllMocks();
});

// Clear all mocks after each test
afterEach(() => {
    vi.clearAllMocks();
});
