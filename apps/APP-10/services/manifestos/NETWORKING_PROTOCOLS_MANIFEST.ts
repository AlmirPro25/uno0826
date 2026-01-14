/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🌐 NETWORKING & PROTOCOLS MANIFEST - MESTRE DAS CONEXÕES 🌐             ║
 * ║                                                                              ║
 * ║     "CADA PACOTE CONTA UMA HISTÓRIA.                                        ║
 * ║      CADA PROTOCOLO É UM CONTRATO."                                         ║
 * ║                                                                              ║
 * ║     NÍVEL: 94 (GOD MODE - NETWORK STACK)                                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - TCP/IP Stack Implementation
 * - UDP, QUIC, WebSocket
 * - Protocol Design & Implementation
 * - Network Drivers
 * - Zero-Copy Networking
 * - DPDK, io_uring, epoll
 * - Custom Protocol Development
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type NetworkLayer = 'physical' | 'datalink' | 'network' | 'transport' | 'application';
export type Protocol = 'tcp' | 'udp' | 'quic' | 'websocket' | 'http' | 'grpc' | 'custom';

export interface PacketHeader {
  version: number;
  type: number;
  flags: number;
  length: number;
  sequence?: number;
  checksum?: number;
}

export interface ProtocolDefinition {
  name: string;
  layer: NetworkLayer;
  headerFormat: PacketHeader;
  states?: string[];
  transitions?: Record<string, string[]>;
}

// ============================================================================
// PROTOCOL TEMPLATES
// ============================================================================

export const PROTOCOL_TEMPLATES = {
  'tcp-server-rust': `
// TCP Server in Rust (async with Tokio)
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server listening on port 8080");
    
    loop {
        let (socket, addr) = listener.accept().await?;
        println!("New connection from {}", addr);
        
        tokio::spawn(async move {
            handle_connection(socket).await;
        });
    }
}

async fn handle_connection(mut socket: TcpStream) {
    let mut buffer = [0u8; 1024];
    
    loop {
        match socket.read(&mut buffer).await {
            Ok(0) => break, // Connection closed
            Ok(n) => {
                // Echo back
                if socket.write_all(&buffer[..n]).await.is_err() {
                    break;
                }
            }
            Err(_) => break,
        }
    }
}
`,

  'udp-server-c': `
// UDP Server in C
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

#define PORT 8080
#define BUFFER_SIZE 1024

int main() {
    int sockfd;
    struct sockaddr_in server_addr, client_addr;
    char buffer[BUFFER_SIZE];
    socklen_t addr_len = sizeof(client_addr);
    
    // Create UDP socket
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }
    
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);
    
    // Bind socket
    if (bind(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }
    
    printf("UDP Server listening on port %d\\n", PORT);
    
    while (1) {
        ssize_t n = recvfrom(sockfd, buffer, BUFFER_SIZE, 0,
                            (struct sockaddr*)&client_addr, &addr_len);
        if (n > 0) {
            buffer[n] = '\\0';
            printf("Received: %s\\n", buffer);
            
            // Echo back
            sendto(sockfd, buffer, n, 0,
                   (struct sockaddr*)&client_addr, addr_len);
        }
    }
    
    close(sockfd);
    return 0;
}
`,

  'custom-protocol-go': `
// Custom Binary Protocol in Go
package main

import (
    "encoding/binary"
    "fmt"
    "net"
)

// Protocol Header (8 bytes)
type Header struct {
    Version  uint8
    Type     uint8
    Flags    uint16
    Length   uint32
}

const (
    MSG_PING    = 0x01
    MSG_PONG    = 0x02
    MSG_DATA    = 0x03
    MSG_ACK     = 0x04
    MSG_ERROR   = 0xFF
)

func (h *Header) Encode() []byte {
    buf := make([]byte, 8)
    buf[0] = h.Version
    buf[1] = h.Type
    binary.BigEndian.PutUint16(buf[2:4], h.Flags)
    binary.BigEndian.PutUint32(buf[4:8], h.Length)
    return buf
}

func DecodeHeader(buf []byte) *Header {
    return &Header{
        Version: buf[0],
        Type:    buf[1],
        Flags:   binary.BigEndian.Uint16(buf[2:4]),
        Length:  binary.BigEndian.Uint32(buf[4:8]),
    }
}

func handleConnection(conn net.Conn) {
    defer conn.Close()
    
    headerBuf := make([]byte, 8)
    
    for {
        // Read header
        _, err := conn.Read(headerBuf)
        if err != nil {
            return
        }
        
        header := DecodeHeader(headerBuf)
        
        // Read payload
        payload := make([]byte, header.Length)
        if header.Length > 0 {
            _, err = conn.Read(payload)
            if err != nil {
                return
            }
        }
        
        // Handle message
        switch header.Type {
        case MSG_PING:
            response := &Header{Version: 1, Type: MSG_PONG, Length: 0}
            conn.Write(response.Encode())
        case MSG_DATA:
            fmt.Printf("Received data: %s\\n", string(payload))
            ack := &Header{Version: 1, Type: MSG_ACK, Length: 0}
            conn.Write(ack.Encode())
        }
    }
}

func main() {
    listener, _ := net.Listen("tcp", ":8080")
    defer listener.Close()
    
    fmt.Println("Custom protocol server on :8080")
    
    for {
        conn, _ := listener.Accept()
        go handleConnection(conn)
    }
}
`
};

// ============================================================================
// DETECTOR
// ============================================================================

export function shouldEnableNetworkingProtocols(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // Protocolos
    'tcp', 'udp', 'quic', 'websocket', 'http/2', 'http/3',
    'grpc', 'protobuf', 'protocol buffer',
    
    // Networking
    'socket', 'network', 'rede', 'conexão', 'connection',
    'server', 'client', 'peer-to-peer', 'p2p',
    
    // Low-level
    'packet', 'pacote', 'frame', 'header',
    'checksum', 'handshake', 'ack', 'syn',
    
    // Performance
    'zero-copy', 'dpdk', 'io_uring', 'epoll', 'kqueue',
    'non-blocking', 'async io', 'event loop',
    
    // Específicos
    'network driver', 'nic', 'ethernet',
    'ip address', 'port', 'bind', 'listen',
    'custom protocol', 'protocolo customizado',
    'binary protocol', 'wire format'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const NETWORKING_PROTOCOLS_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🌐 NETWORKING & PROTOCOLS MANIFEST - MESTRE DAS CONEXÕES 🌐             ║
║                                                                              ║
║     "CADA PACOTE CONTA UMA HISTÓRIA.                                        ║
║      CADA PROTOCOLO É UM CONTRATO."                                         ║
║                                                                              ║
║     NÍVEL: 94 (GOD MODE - NETWORK STACK)                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🌐 MODELO OSI vs TCP/IP
═══════════════════════════════════════════════════════════════════════════════

OSI (7 camadas):          TCP/IP (4 camadas):
┌─────────────────┐       
│ 7. Application  │       ┌─────────────────┐
├─────────────────┤       │ 4. Application  │ HTTP, gRPC, WebSocket
│ 6. Presentation │       │    (L5-L7)      │
├─────────────────┤       └─────────────────┘
│ 5. Session      │       
├─────────────────┤       ┌─────────────────┐
│ 4. Transport    │       │ 3. Transport    │ TCP, UDP, QUIC
├─────────────────┤       └─────────────────┘
│ 3. Network      │       ┌─────────────────┐
├─────────────────┤       │ 2. Internet     │ IP, ICMP
│ 2. Data Link    │       └─────────────────┘
├─────────────────┤       ┌─────────────────┐
│ 1. Physical     │       │ 1. Link         │ Ethernet, WiFi
└─────────────────┘       └─────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📦 ESTRUTURA DE PACOTES
═══════════════════════════════════════════════════════════════════════════════

ETHERNET FRAME:
┌──────────┬──────────┬──────┬─────────┬─────┐
│ Preamble │ Dest MAC │ Src  │ Type    │ ... │
│ 8 bytes  │ 6 bytes  │ MAC  │ 2 bytes │     │
└──────────┴──────────┴──────┴─────────┴─────┘

IP HEADER:
┌─────────┬─────────┬─────────┬─────────┐
│ Version │ IHL     │ TOS     │ Length  │
│ 4 bits  │ 4 bits  │ 8 bits  │ 16 bits │
├─────────┴─────────┴─────────┴─────────┤
│ Identification │ Flags │ Fragment    │
├────────────────┴───────┴─────────────┤
│ TTL │ Protocol │ Header Checksum     │
├─────┴──────────┴─────────────────────┤
│ Source IP Address (32 bits)          │
├──────────────────────────────────────┤
│ Destination IP Address (32 bits)     │
└──────────────────────────────────────┘

TCP HEADER:
┌─────────────────┬─────────────────┐
│ Source Port     │ Dest Port       │
│ 16 bits         │ 16 bits         │
├─────────────────┴─────────────────┤
│ Sequence Number (32 bits)         │
├───────────────────────────────────┤
│ Acknowledgment Number (32 bits)   │
├───────┬───────┬───────────────────┤
│ Offset│ Flags │ Window Size       │
├───────┴───────┴───────────────────┤
│ Checksum      │ Urgent Pointer    │
└───────────────┴───────────────────┘

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS PARA NETWORKING
═══════════════════════════════════════════════════════════════════════════════

✅ TIER 1 - MÁXIMA PERFORMANCE:
├── C: Kernel networking, DPDK, drivers
├── Rust: Tokio, async networking, safety
├── C++: High-frequency trading, game servers
└── Go: Microservices, concurrent servers

✅ TIER 2 - BOA PERFORMANCE:
├── Java: Netty, enterprise servers
├── Erlang/Elixir: Telecom, WhatsApp
└── Zig: Modern systems networking

⚠️ TIER 3 - PROTOTIPAGEM:
├── Python: Twisted, asyncio
└── Node.js: WebSocket servers

═══════════════════════════════════════════════════════════════════════════════
⚡ TÉCNICAS DE ALTA PERFORMANCE
═══════════════════════════════════════════════════════════════════════════════

ZERO-COPY:
├── sendfile(): Kernel → NIC direto
├── splice(): Pipe entre file descriptors
├── mmap(): Memory-mapped I/O
└── DPDK: Bypass kernel, userspace networking

ASYNC I/O:
├── epoll (Linux): Event-driven, O(1)
├── kqueue (BSD/macOS): Similar ao epoll
├── io_uring (Linux 5.1+): Async syscalls
└── IOCP (Windows): Completion ports

CONNECTION HANDLING:
├── Thread-per-connection: Simples, não escala
├── Thread pool: Melhor, mas limitado
├── Event loop: Node.js, Nginx style
└── Work stealing: Tokio, Go runtime

═══════════════════════════════════════════════════════════════════════════════
📋 DESIGN DE PROTOCOLO CUSTOMIZADO
═══════════════════════════════════════════════════════════════════════════════

HEADER MÍNIMO:
┌─────────┬─────────┬─────────┬─────────┐
│ Magic   │ Version │ Type    │ Length  │
│ 2 bytes │ 1 byte  │ 1 byte  │ 4 bytes │
└─────────┴─────────┴─────────┴─────────┘

CONSIDERAÇÕES:
├── Endianness: Big-endian (network byte order)
├── Alignment: Alinhar campos para performance
├── Versioning: Sempre incluir versão
├── Checksum: CRC32, XXHash para integridade
├── Compression: LZ4, Zstd para payloads grandes
└── Encryption: TLS, ou custom com ChaCha20

═══════════════════════════════════════════════════════════════════════════════

"A REDE É O COMPUTADOR. DOMINE A REDE, DOMINE O MUNDO."

                    — Networking & Protocols Manifest, Level 94
`;

export default {
  PROTOCOL_TEMPLATES,
  shouldEnableNetworkingProtocols,
  NETWORKING_PROTOCOLS_MANIFEST
};
