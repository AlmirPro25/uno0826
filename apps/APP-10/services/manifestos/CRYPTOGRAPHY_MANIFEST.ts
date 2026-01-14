/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🔐 CRYPTOGRAPHY MANIFEST - MESTRE DOS SEGREDOS 🔐                       ║
 * ║                                                                              ║
 * ║     "A SEGURANÇA NÃO É UM PRODUTO, É UM PROCESSO.                           ║
 * ║      CADA BIT CONTA."                                                       ║
 * ║                                                                              ║
 * ║     NÍVEL: 93 (GOD MODE - SECURITY CORE)                                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - Symmetric Encryption (AES, ChaCha20)
 * - Asymmetric Encryption (RSA, ECC, Ed25519)
 * - Hash Functions (SHA-256, SHA-3, BLAKE3)
 * - Key Derivation (PBKDF2, Argon2, scrypt)
 * - Digital Signatures
 * - Zero-Knowledge Proofs
 * - Secure Random Generation
 * - TLS/SSL Implementation
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type CryptoAlgorithm = 
  | 'aes-256-gcm'
  | 'chacha20-poly1305'
  | 'rsa-oaep'
  | 'ecdh-p256'
  | 'ed25519'
  | 'x25519';

export type HashAlgorithm = 
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'sha3-256'
  | 'blake2b'
  | 'blake3';

export type KDFAlgorithm = 
  | 'pbkdf2'
  | 'argon2id'
  | 'scrypt'
  | 'hkdf';

export interface CryptoConfig {
  algorithm: CryptoAlgorithm;
  keySize: number;
  ivSize?: number;
  tagSize?: number;
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  algorithm: CryptoAlgorithm;
}

// ============================================================================
// TEMPLATES DE CÓDIGO
// ============================================================================

export const CRYPTO_TEMPLATES = {
  'aes-gcm-rust': `
// AES-256-GCM Encryption in Rust
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce
};
use rand::RngCore;

pub struct AesGcmCipher {
    cipher: Aes256Gcm,
}

impl AesGcmCipher {
    pub fn new(key: &[u8; 32]) -> Self {
        let cipher = Aes256Gcm::new_from_slice(key)
            .expect("Invalid key length");
        Self { cipher }
    }
    
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, aes_gcm::Error> {
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let ciphertext = self.cipher.encrypt(nonce, plaintext)?;
        
        // Prepend nonce to ciphertext
        let mut result = nonce_bytes.to_vec();
        result.extend(ciphertext);
        Ok(result)
    }
    
    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, aes_gcm::Error> {
        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        self.cipher.decrypt(nonce, ciphertext)
    }
}
`,

  'ed25519-c': `
// Ed25519 Digital Signatures in C (using libsodium)
#include <sodium.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    unsigned char public_key[crypto_sign_PUBLICKEYBYTES];
    unsigned char secret_key[crypto_sign_SECRETKEYBYTES];
} ed25519_keypair;

int ed25519_generate_keypair(ed25519_keypair *kp) {
    return crypto_sign_keypair(kp->public_key, kp->secret_key);
}

int ed25519_sign(
    unsigned char *signature,
    const unsigned char *message,
    size_t message_len,
    const unsigned char *secret_key
) {
    unsigned long long sig_len;
    return crypto_sign_detached(
        signature, &sig_len,
        message, message_len,
        secret_key
    );
}

int ed25519_verify(
    const unsigned char *signature,
    const unsigned char *message,
    size_t message_len,
    const unsigned char *public_key
) {
    return crypto_sign_verify_detached(
        signature,
        message, message_len,
        public_key
    ) == 0;
}
`,

  'argon2-go': `
// Argon2id Password Hashing in Go
package crypto

import (
    "crypto/rand"
    "crypto/subtle"
    "encoding/base64"
    "fmt"
    "strings"
    
    "golang.org/x/crypto/argon2"
)

type Argon2Config struct {
    Memory      uint32 // KB
    Iterations  uint32
    Parallelism uint8
    SaltLength  uint32
    KeyLength   uint32
}

var DefaultConfig = Argon2Config{
    Memory:      64 * 1024, // 64 MB
    Iterations:  3,
    Parallelism: 4,
    SaltLength:  16,
    KeyLength:   32,
}

func HashPassword(password string, config Argon2Config) (string, error) {
    salt := make([]byte, config.SaltLength)
    if _, err := rand.Read(salt); err != nil {
        return "", err
    }
    
    hash := argon2.IDKey(
        []byte(password),
        salt,
        config.Iterations,
        config.Memory,
        config.Parallelism,
        config.KeyLength,
    )
    
    // Encode as: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
    b64Salt := base64.RawStdEncoding.EncodeToString(salt)
    b64Hash := base64.RawStdEncoding.EncodeToString(hash)
    
    return fmt.Sprintf(
        "$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
        argon2.Version, config.Memory, config.Iterations,
        config.Parallelism, b64Salt, b64Hash,
    ), nil
}

func VerifyPassword(password, encodedHash string) (bool, error) {
    // Parse the encoded hash
    parts := strings.Split(encodedHash, "$")
    if len(parts) != 6 {
        return false, fmt.Errorf("invalid hash format")
    }
    
    var memory, iterations uint32
    var parallelism uint8
    fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
    
    salt, _ := base64.RawStdEncoding.DecodeString(parts[4])
    hash, _ := base64.RawStdEncoding.DecodeString(parts[5])
    
    // Compute hash with same parameters
    computedHash := argon2.IDKey(
        []byte(password),
        salt,
        iterations,
        memory,
        parallelism,
        uint32(len(hash)),
    )
    
    // Constant-time comparison
    return subtle.ConstantTimeCompare(hash, computedHash) == 1, nil
}
`
};

// ============================================================================
// DETECTOR
// ============================================================================

export function shouldEnableCryptography(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // Encryption
    'encryption', 'criptografia', 'encrypt', 'decrypt',
    'aes', 'chacha20', 'rsa', 'ecc', 'elliptic curve',
    
    // Hashing
    'hash', 'sha256', 'sha-256', 'sha3', 'blake2', 'blake3',
    'md5', 'checksum', 'digest',
    
    // Passwords
    'password hash', 'argon2', 'bcrypt', 'scrypt', 'pbkdf2',
    'key derivation', 'kdf',
    
    // Signatures
    'digital signature', 'assinatura digital', 'ed25519',
    'ecdsa', 'sign', 'verify signature',
    
    // Keys
    'public key', 'private key', 'keypair', 'key exchange',
    'diffie-hellman', 'x25519', 'ecdh',
    
    // TLS/SSL
    'tls', 'ssl', 'certificate', 'certificado', 'x509',
    'https', 'mtls', 'mutual tls',
    
    // Advanced
    'zero knowledge', 'zkp', 'zk-snark', 'zk-stark',
    'homomorphic', 'secure enclave', 'hsm',
    'random number', 'csprng', 'entropy'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const CRYPTOGRAPHY_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🔐 CRYPTOGRAPHY MANIFEST - MESTRE DOS SEGREDOS 🔐                       ║
║                                                                              ║
║     "A SEGURANÇA NÃO É UM PRODUTO, É UM PROCESSO.                           ║
║      CADA BIT CONTA."                                                       ║
║                                                                              ║
║     NÍVEL: 93 (GOD MODE - SECURITY CORE)                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🔐 HIERARQUIA DE ALGORITMOS
═══════════════════════════════════════════════════════════════════════════════

SYMMETRIC ENCRYPTION (Chave Única):
┌─────────────────────────────────────────────────────────────┐
│ RECOMENDADO                                                 │
├─────────────────────────────────────────────────────────────┤
│ AES-256-GCM      │ Padrão ouro, hardware acceleration     │
│ ChaCha20-Poly1305│ Alternativa, melhor em software        │
│ XChaCha20        │ Nonce maior (192-bit), mais seguro     │
├─────────────────────────────────────────────────────────────┤
│ EVITAR                                                      │
├─────────────────────────────────────────────────────────────┤
│ AES-CBC          │ Vulnerável a padding oracle            │
│ AES-ECB          │ NUNCA usar, padrões visíveis           │
│ DES/3DES         │ Obsoleto, chave pequena                │
│ RC4              │ Quebrado                                │
└─────────────────────────────────────────────────────────────┘

ASYMMETRIC ENCRYPTION (Par de Chaves):
┌─────────────────────────────────────────────────────────────┐
│ RECOMENDADO                                                 │
├─────────────────────────────────────────────────────────────┤
│ Ed25519          │ Assinaturas, rápido, seguro            │
│ X25519           │ Key exchange, Curve25519               │
│ ECDSA P-256      │ Assinaturas, compatibilidade           │
│ RSA-OAEP 4096    │ Encryption, legado                     │
├─────────────────────────────────────────────────────────────┤
│ EVITAR                                                      │
├─────────────────────────────────────────────────────────────┤
│ RSA < 2048       │ Chave muito pequena                    │
│ RSA-PKCS1v1.5    │ Vulnerável a Bleichenbacher            │
│ DSA              │ Obsoleto                                │
└─────────────────────────────────────────────────────────────┘

HASH FUNCTIONS:
┌─────────────────────────────────────────────────────────────┐
│ RECOMENDADO                                                 │
├─────────────────────────────────────────────────────────────┤
│ SHA-256          │ Padrão, amplamente suportado           │
│ SHA-3 (Keccak)   │ Alternativa, design diferente          │
│ BLAKE2b/BLAKE3   │ Mais rápido, tão seguro quanto         │
├─────────────────────────────────────────────────────────────┤
│ EVITAR                                                      │
├─────────────────────────────────────────────────────────────┤
│ MD5              │ Quebrado, colisões triviais            │
│ SHA-1            │ Quebrado, não usar para segurança      │
└─────────────────────────────────────────────────────────────┘

PASSWORD HASHING:
┌─────────────────────────────────────────────────────────────┐
│ RECOMENDADO                                                 │
├─────────────────────────────────────────────────────────────┤
│ Argon2id         │ Vencedor PHC, resistente a GPU/ASIC    │
│ scrypt           │ Memory-hard, boa alternativa           │
│ bcrypt           │ Clássico, ainda seguro                 │
├─────────────────────────────────────────────────────────────┤
│ EVITAR                                                      │
├─────────────────────────────────────────────────────────────┤
│ PBKDF2           │ Não memory-hard, vulnerável a GPU      │
│ SHA-256 direto   │ NUNCA, muito rápido para senhas        │
│ MD5/SHA-1        │ CRIME CONTRA A HUMANIDADE              │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS PARA CRIPTOGRAFIA
═══════════════════════════════════════════════════════════════════════════════

✅ TIER 1 - IDEAL:
├── Rust: ring, RustCrypto, sodiumoxide
├── C: libsodium, OpenSSL, mbedTLS
├── Go: crypto/*, x/crypto
└── C++: Crypto++, Botan

⚠️ TIER 2 - CUIDADO:
├── Python: cryptography (wrapper), PyCryptodome
├── Java: BouncyCastle, JCA
└── Node.js: crypto (built-in), libsodium-wrappers

🚫 NUNCA:
├── Implementar próprio algoritmo
├── Usar bibliotecas não auditadas
└── Confiar em "security through obscurity"

═══════════════════════════════════════════════════════════════════════════════
⚡ REGRAS DE OURO
═══════════════════════════════════════════════════════════════════════════════

1. NUNCA implemente criptografia do zero
2. Use bibliotecas auditadas e bem mantidas
3. Sempre use CSPRNG para gerar chaves/nonces
4. Nonces NUNCA devem ser reutilizados
5. Use constant-time comparison para verificações
6. Zere memória sensível após uso
7. Prefira authenticated encryption (GCM, Poly1305)
8. Mantenha bibliotecas atualizadas

═══════════════════════════════════════════════════════════════════════════════

"A CRIPTOGRAFIA É A ÚLTIMA LINHA DE DEFESA.
 NÃO HÁ SEGUNDA CHANCE."

                    — Cryptography Manifest, Level 93
`;

export default {
  CRYPTO_TEMPLATES,
  shouldEnableCryptography,
  CRYPTOGRAPHY_MANIFEST
};
