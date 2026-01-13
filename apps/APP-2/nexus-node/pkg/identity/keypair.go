package identity

import (
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/peer"
)

// LoadOrGenerateKey loads an existing private key or generates a new Ed25519 key pair.
func LoadOrGenerateKey(filepath, passphrase string) (crypto.PrivKey, error) {
	// Ensure the directory exists
	dir := "data"
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, fmt.Errorf("falha ao criar diretório de dados: %w", err)
	}

	fullPath := fmt.Sprintf("%s/%s", dir, filepath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		log.Println("[NEXUS] Gerando nova identidade Ed25519...")
		
		// Generate Ed25519 key pair (more widely supported than X25519)
		priv, _, err := crypto.GenerateKeyPair(crypto.Ed25519, -1)
		if err != nil {
			return nil, fmt.Errorf("falha ao gerar par de chaves: %w", err)
		}
		
		if err := savePrivateKey(fullPath, priv, passphrase); err != nil {
			return nil, fmt.Errorf("falha ao salvar chave privada: %w", err)
		}
		
		log.Printf("[NEXUS] ✓ Nova identidade gerada e salva em '%s'", fullPath)
		return priv, nil
	} else if err != nil {
		return nil, fmt.Errorf("erro ao verificar arquivo de identidade: %w", err)
	}

	log.Printf("[NEXUS] Carregando identidade de '%s'...", fullPath)
	priv, err := loadPrivateKey(fullPath, passphrase)
	if err != nil {
		return nil, fmt.Errorf("falha ao carregar chave privada: %w", err)
	}
	
	log.Println("[NEXUS] ✓ Identidade carregada")
	return priv, nil
}

// savePrivateKey encrypts and saves a private key to a PEM file.
func savePrivateKey(filepath string, privKey crypto.PrivKey, passphrase string) error {
	privBytes, err := crypto.MarshalPrivateKey(privKey)
	if err != nil {
		return fmt.Errorf("falha ao serializar chave privada: %w", err)
	}

	// Encrypt the PEM block
	block, err := x509.EncryptPEMBlock(rand.Reader, "LIBP2P PRIVATE KEY", privBytes, []byte(passphrase), x509.PEMCipherAES256)
	if err != nil {
		return fmt.Errorf("falha ao criptografar bloco PEM: %w", err)
	}

	pemBytes := pem.EncodeToMemory(block)
	if pemBytes == nil {
		return fmt.Errorf("falha ao encodar para PEM")
	}

	return os.WriteFile(filepath, pemBytes, 0600)
}

// loadPrivateKey loads and decrypts a private key from a PEM file.
func loadPrivateKey(filepath string, passphrase string) (crypto.PrivKey, error) {
	pemBytes, err := os.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("falha ao ler arquivo de chave: %w", err)
	}

	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, fmt.Errorf("falha ao decodificar bloco PEM")
	}

	var keyBytes []byte
	if x509.IsEncryptedPEMBlock(block) {
		keyBytes, err = x509.DecryptPEMBlock(block, []byte(passphrase))
		if err != nil {
			return nil, fmt.Errorf("falha ao descriptografar: senha incorreta ou arquivo corrompido: %w", err)
		}
	} else {
		keyBytes = block.Bytes
	}

	privKey, err := crypto.UnmarshalPrivateKey(keyBytes)
	if err != nil {
		return nil, fmt.Errorf("falha ao deserializar chave privada: %w", err)
	}
	
	return privKey, nil
}

// PeerIDFromPrivateKey returns the PeerID for a given private key.
func PeerIDFromPrivateKey(privKey crypto.PrivKey) peer.ID {
	id, _ := peer.IDFromPrivateKey(privKey)
	return id
}

// GenerateUUID generates a new UUID string.
func GenerateUUID() string {
	return uuid.New().String()
}
