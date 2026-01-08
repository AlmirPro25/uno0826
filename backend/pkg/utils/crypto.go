
package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
)

var aesKey []byte

// SetAESKey define a chave AES para criptografia e descriptografia.
// A chave deve ter 16, 24 ou 32 bytes para AES-128, AES-192 ou AES-256, respectivamente.
func SetAESKey(key []byte) {
	if len(key) != 16 && len(key) != 24 && len(key) != 32 {
		panic("A chave AES deve ter 16, 24 ou 32 bytes de comprimento.")
	}
	aesKey = key
}

// EncryptAES criptografa dados usando AES-GCM.
func EncryptAES(plaintext []byte) (string, error) {
	if aesKey == nil {
		return "", fmt.Errorf("chave AES não definida. Chame SetAESKey primeiro.")
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", fmt.Errorf("falha ao criar cifra AES: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("falha ao criar GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("falha ao gerar nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptAES descriptografa dados usando AES-GCM.
func DecryptAES(encryptedText string) ([]byte, error) {
	if aesKey == nil {
		return nil, fmt.Errorf("chave AES não definida. Chame SetAESKey primeiro.")
	}

	ciphertext, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return nil, fmt.Errorf("falha ao decodificar base64: %w", err)
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar cifra AES: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("texto cifrado muito curto")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("falha ao descriptografar: %w", err)
	}

	return plaintext, nil
}

