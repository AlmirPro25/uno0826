/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║     🧪 TESTES - CRYPTOGRAPHY (L93) & MEMORY MANAGEMENT (L92)                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DOS DETECTORES
// ═══════════════════════════════════════════════════════════════════════════════

function shouldEnableCryptography(prompt) {
    const promptLower = prompt.toLowerCase();
    const keywords = [
        'encryption', 'criptografia', 'aes', 'chacha20', 'rsa',
        'hash', 'sha256', 'argon2', 'bcrypt', 'password hash',
        'digital signature', 'ed25519', 'public key', 'private key',
        'tls', 'ssl', 'certificate', 'zero knowledge', 'zkp'
    ];
    return keywords.some(k => promptLower.includes(k));
}

function shouldEnableMemoryManagement(prompt) {
    const promptLower = prompt.toLowerCase();
    const keywords = [
        'malloc', 'free', 'alloc', 'memory allocation',
        'pointer', 'smart pointer', 'unique_ptr', 'shared_ptr',
        'ownership', 'borrow', 'borrow checker', 'raii', 'lifetime',
        'arena', 'pool allocator', 'garbage collection', 'gc',
        'memory leak', 'use after free', 'double free', 'valgrind'
    ];
    return keywords.some(k => promptLower.includes(k));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
    }
}

console.log('\n🔐🧠 CRYPTOGRAPHY & MEMORY MANAGEMENT - TESTES\n');
console.log('═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTOGRAPHY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔐 CRYPTOGRAPHY DETECTOR\n');

test('Crypto - ativa para "AES encryption"', () => {
    assert(shouldEnableCryptography('Implementar AES encryption'));
});

test('Crypto - ativa para "SHA256 hash"', () => {
    assert(shouldEnableCryptography('Calcular SHA256 hash'));
});

test('Crypto - ativa para "password hash com Argon2"', () => {
    assert(shouldEnableCryptography('Password hash com Argon2'));
});

test('Crypto - ativa para "Ed25519 signature"', () => {
    assert(shouldEnableCryptography('Assinar com Ed25519'));
});

test('Crypto - ativa para "TLS certificate"', () => {
    assert(shouldEnableCryptography('Gerar TLS certificate'));
});

test('Crypto - ativa para "RSA keypair"', () => {
    assert(shouldEnableCryptography('Gerar RSA keypair'));
});

test('Crypto - ativa para "zero knowledge proof"', () => {
    assert(shouldEnableCryptography('Implementar zero knowledge proof'));
});

test('Crypto - ativa para "criptografia" (português)', () => {
    assert(shouldEnableCryptography('Sistema de criptografia'));
});

test('Crypto - NÃO ativa para "website React"', () => {
    assert(!shouldEnableCryptography('Criar website com React'));
});

test('Crypto - NÃO ativa para "API REST"', () => {
    assert(!shouldEnableCryptography('Fazer API REST simples'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY MANAGEMENT DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🧠 MEMORY MANAGEMENT DETECTOR\n');

test('Memory - ativa para "malloc/free"', () => {
    assert(shouldEnableMemoryManagement('Usar malloc e free em C'));
});

test('Memory - ativa para "smart pointer"', () => {
    assert(shouldEnableMemoryManagement('Usar smart pointer em C++'));
});

test('Memory - ativa para "unique_ptr"', () => {
    assert(shouldEnableMemoryManagement('Converter para unique_ptr'));
});

test('Memory - ativa para "borrow checker"', () => {
    assert(shouldEnableMemoryManagement('Entender borrow checker do Rust'));
});

test('Memory - ativa para "ownership"', () => {
    assert(shouldEnableMemoryManagement('Sistema de ownership'));
});

test('Memory - ativa para "arena allocator"', () => {
    assert(shouldEnableMemoryManagement('Implementar arena allocator'));
});

test('Memory - ativa para "pool allocator"', () => {
    assert(shouldEnableMemoryManagement('Criar pool allocator'));
});

test('Memory - ativa para "garbage collection"', () => {
    assert(shouldEnableMemoryManagement('Como funciona garbage collection'));
});

test('Memory - ativa para "memory leak"', () => {
    assert(shouldEnableMemoryManagement('Detectar memory leak'));
});

test('Memory - ativa para "valgrind"', () => {
    assert(shouldEnableMemoryManagement('Usar valgrind para debug'));
});

test('Memory - ativa para "use after free"', () => {
    assert(shouldEnableMemoryManagement('Prevenir use after free'));
});

test('Memory - ativa para "RAII"', () => {
    assert(shouldEnableMemoryManagement('Padrão RAII em C++'));
});

test('Memory - NÃO ativa para "frontend React"', () => {
    assert(!shouldEnableMemoryManagement('Criar frontend React'));
});

test('Memory - NÃO ativa para "database SQL"', () => {
    assert(!shouldEnableMemoryManagement('Query database SQL'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
    process.exit(1);
}
