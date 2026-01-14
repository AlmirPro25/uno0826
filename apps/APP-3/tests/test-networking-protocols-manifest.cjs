/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🧪 TESTES - NETWORKING & PROTOCOLS MANIFEST (Level 94)                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DOS TEMPLATES E FUNÇÕES
// ═══════════════════════════════════════════════════════════════════════════════

const PROTOCOL_TEMPLATES = {
    'tcp-server-rust': `
// TCP Server in Rust (async with Tokio)
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    // ... implementation
}
`,
    'udp-server-c': `
// UDP Server in C
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>

int main() {
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    // ... implementation
}
`,
    'custom-protocol-go': `
// Custom Binary Protocol in Go
package main

import (
    "encoding/binary"
    "net"
)

type Header struct {
    Version  uint8
    Type     uint8
    Flags    uint16
    Length   uint32
}
`
};

function shouldEnableNetworkingProtocols(prompt) {
    const promptLower = prompt.toLowerCase();
    const keywords = [
        'tcp', 'udp', 'quic', 'websocket', 'http/2', 'http/3',
        'grpc', 'protobuf', 'socket', 'network', 'rede',
        'packet', 'pacote', 'frame', 'header', 'checksum',
        'zero-copy', 'dpdk', 'io_uring', 'epoll',
        'custom protocol', 'protocolo customizado', 'binary protocol'
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

console.log('\n🌐 NETWORKING & PROTOCOLS MANIFEST - TESTES\n');
console.log('═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DOS TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 PROTOCOL TEMPLATES\n');

test('Template tcp-server-rust existe', () => {
    assert(PROTOCOL_TEMPLATES['tcp-server-rust'] !== undefined);
});

test('Template tcp-server-rust contém Tokio', () => {
    assert(PROTOCOL_TEMPLATES['tcp-server-rust'].includes('tokio'));
});

test('Template tcp-server-rust contém TcpListener', () => {
    assert(PROTOCOL_TEMPLATES['tcp-server-rust'].includes('TcpListener'));
});

test('Template udp-server-c existe', () => {
    assert(PROTOCOL_TEMPLATES['udp-server-c'] !== undefined);
});

test('Template udp-server-c contém SOCK_DGRAM', () => {
    assert(PROTOCOL_TEMPLATES['udp-server-c'].includes('SOCK_DGRAM'));
});

test('Template udp-server-c contém socket.h', () => {
    assert(PROTOCOL_TEMPLATES['udp-server-c'].includes('sys/socket.h'));
});

test('Template custom-protocol-go existe', () => {
    assert(PROTOCOL_TEMPLATES['custom-protocol-go'] !== undefined);
});

test('Template custom-protocol-go contém Header struct', () => {
    assert(PROTOCOL_TEMPLATES['custom-protocol-go'].includes('type Header struct'));
});

test('Template custom-protocol-go contém encoding/binary', () => {
    assert(PROTOCOL_TEMPLATES['custom-protocol-go'].includes('encoding/binary'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO DETECTOR - ATIVAÇÃO POSITIVA
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🎯 DETECTOR - ATIVAÇÃO POSITIVA\n');

test('Detector - ativa para "TCP server"', () => {
    assert(shouldEnableNetworkingProtocols('Criar um TCP server em Rust'));
});

test('Detector - ativa para "UDP"', () => {
    assert(shouldEnableNetworkingProtocols('Implementar UDP multicast'));
});

test('Detector - ativa para "WebSocket"', () => {
    assert(shouldEnableNetworkingProtocols('Preciso de WebSocket para chat'));
});

test('Detector - ativa para "socket"', () => {
    assert(shouldEnableNetworkingProtocols('Como criar um socket em C?'));
});

test('Detector - ativa para "network"', () => {
    assert(shouldEnableNetworkingProtocols('Network programming em Go'));
});

test('Detector - ativa para "packet"', () => {
    assert(shouldEnableNetworkingProtocols('Analisar packet headers'));
});

test('Detector - ativa para "gRPC"', () => {
    assert(shouldEnableNetworkingProtocols('Implementar gRPC service'));
});

test('Detector - ativa para "protobuf"', () => {
    assert(shouldEnableNetworkingProtocols('Usar protobuf para serialização'));
});

test('Detector - ativa para "QUIC"', () => {
    assert(shouldEnableNetworkingProtocols('Implementar QUIC protocol'));
});

test('Detector - ativa para "zero-copy"', () => {
    assert(shouldEnableNetworkingProtocols('Zero-copy networking com sendfile'));
});

test('Detector - ativa para "DPDK"', () => {
    assert(shouldEnableNetworkingProtocols('Usar DPDK para alta performance'));
});

test('Detector - ativa para "io_uring"', () => {
    assert(shouldEnableNetworkingProtocols('Async I/O com io_uring'));
});

test('Detector - ativa para "epoll"', () => {
    assert(shouldEnableNetworkingProtocols('Event loop com epoll'));
});

test('Detector - ativa para "custom protocol"', () => {
    assert(shouldEnableNetworkingProtocols('Criar custom protocol binário'));
});

test('Detector - ativa para "rede" (português)', () => {
    assert(shouldEnableNetworkingProtocols('Programação de rede em C'));
});

test('Detector - ativa para "pacote" (português)', () => {
    assert(shouldEnableNetworkingProtocols('Estrutura de pacote TCP'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO DETECTOR - NÃO ATIVAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🚫 DETECTOR - NÃO ATIVAÇÃO\n');

test('Detector - NÃO ativa para "website React"', () => {
    assert(!shouldEnableNetworkingProtocols('Criar website com React'));
});

test('Detector - NÃO ativa para "mobile app"', () => {
    assert(!shouldEnableNetworkingProtocols('Desenvolver mobile app Flutter'));
});

test('Detector - NÃO ativa para "database"', () => {
    assert(!shouldEnableNetworkingProtocols('Criar schema de database'));
});

test('Detector - NÃO ativa para "machine learning"', () => {
    assert(!shouldEnableNetworkingProtocols('Treinar modelo de machine learning'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DE LINGUAGENS NOS TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔧 LINGUAGENS NOS TEMPLATES\n');

test('Template Rust usa linguagem correta (não JS)', () => {
    const template = PROTOCOL_TEMPLATES['tcp-server-rust'];
    assert(!template.includes('const '));
    assert(!template.includes('require('));
    assert(template.includes('async fn'));
});

test('Template C usa linguagem correta (não Python)', () => {
    const template = PROTOCOL_TEMPLATES['udp-server-c'];
    assert(!template.includes('def '));
    assert(!template.includes('import '));
    assert(template.includes('#include'));
});

test('Template Go usa linguagem correta (não TypeScript)', () => {
    const template = PROTOCOL_TEMPLATES['custom-protocol-go'];
    assert(!template.includes('interface '));
    assert(!template.includes(': string'));
    assert(template.includes('package main'));
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
