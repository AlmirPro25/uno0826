package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
)

// EncryptionService defines methods for encrypting and decrypting data.
type EncryptionService interface {
	Encrypt(data string) (string, error)
	Decrypt(encryptedData string) (string, error)
}

// aesEncryptionService implements EncryptionService using AES-256 GCM.
type aesEncryptionService struct {
	key []byte
}

// NewAESEncryptionService creates a new AES encryption service instance.
func NewAESEncryptionService(key string) EncryptionService {
	return &aesEncryptionService{key: []byte(key)}
}

// Encrypt encrypts a string using AES GCM.
func (s *aesEncryptionService) Encrypt(data string) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("could not create new cipher: %v", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("could not create new GCM: %v", err)
	}

	// Create a new nonce (Number used once)
	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("could not read nonce: %v", err)
	}

	encrypted := gcm.Seal(nonce, nonce, []byte(data), nil)
	return string(encrypted), nil
}

// Decrypt decrypts a string using AES GCM.
func (s *aesEncryptionService) Decrypt(encryptedData string) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("could not create new cipher: %v", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("could not create new GCM: %v", err)
	}

	// Extract nonce from the encrypted data
	nonceSize := gcm.NonceSize()
	if len(encryptedData) < nonceSize {
		return "", errors.New("invalid encrypted data size")
	}

	nonce, encryptedPayload := []byte(encryptedData)[:nonceSize], []byte(encryptedData)[nonceSize:]
	decrypted, err := gcm.Open(nil, nonce, encryptedPayload, nil)
	if err != nil {
		return "", fmt.Errorf("could not decrypt data: %v", err)
	}

	return string(decrypted), nil
}
