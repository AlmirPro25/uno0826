/**
 * 🧪 COGNITO INTEGRATION TESTS
 * 
 * Testes automatizados para o módulo COGNITO
 */

import { cognitoBridge } from './cognito-bridge.js';

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    process.stdout.write(`${colors.cyan}Testing:${colors.reset} ${name}... `);

    try {
        fn();
        testsPassed++;
        console.log(`${colors.green}✓ PASS${colors.reset}`);
    } catch (error) {
        testsFailed++;
        console.log(`${colors.red}✗ FAIL${colors.reset}`);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

async function runTests() {
    console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  🧪 COGNITO Integration Tests         ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

    // Test 1: Bridge Initialization
    test('Bridge should initialize', () => {
        assert(cognitoBridge !== null, 'Bridge is null');
        assert(typeof cognitoBridge === 'object', 'Bridge is not an object');
    });

    // Test 2: Cache Stats
    test('Cache stats should be accessible', () => {
        const stats = cognitoBridge.getCacheStats();
        assert(stats !== null, 'Stats is null');
        assert(typeof stats.visionCacheActive === 'boolean', 'visionCacheActive is not boolean');
        assert(typeof stats.memoryCacheSize === 'number', 'memoryCacheSize is not number');
    });

    // Test 3: Clear Cache
    test('Cache should clear', () => {
        cognitoBridge.clearVisionCache();
        const stats = cognitoBridge.getCacheStats();
        assert(stats.visionCacheActive === false, 'Cache not cleared');
    });

    // Test 4: Memory Load
    test('Memory should load', async () => {
        const memories = await cognitoBridge.loadMemories();
        assert(Array.isArray(memories), 'Memories is not an array');
    });

    // Test 5: Skills Load
    test('Skills should load', async () => {
        const skills = await cognitoBridge.loadSkills();
        assert(Array.isArray(skills), 'Skills is not an array');
    });

    // Test 6: Grid to Pixel Conversion
    test('Grid to pixel conversion should work', () => {
        const result = cognitoBridge.gridToPixel?.('A1', 20, 1920, 1080);
        if (result) {
            assert(typeof result.x === 'number', 'X is not a number');
            assert(typeof result.y === 'number', 'Y is not a number');
            assert(result.x > 0 && result.x < 1920, 'X out of bounds');
            assert(result.y > 0 && result.y < 1080, 'Y out of bounds');
        }
    });

    // Summary
    console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  📊 Test Summary                       ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`  Total:  ${testsRun}`);
    console.log(`  ${colors.green}Passed: ${testsPassed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${testsFailed}${colors.reset}`);

    const percentage = ((testsPassed / testsRun) * 100).toFixed(1);
    console.log(`\n  ${colors.cyan}Success Rate: ${percentage}%${colors.reset}\n`);

    if (testsFailed === 0) {
        console.log(`${colors.green}✅ All tests passed!${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${colors.red}❌ Some tests failed!${colors.reset}\n`);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});
