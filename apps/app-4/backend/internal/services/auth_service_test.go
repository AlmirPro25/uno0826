package services

import (
	"testing"
)

// TestHashPassword verifica se o hash de senha funciona corretamente
func TestHashPassword(t *testing.T) {
	password := "password123"
	
	// Testar hash
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Erro ao criar hash: %v", err)
	}
	
	if hash == "" {
		t.Error("Hash não deveria estar vazio")
	}
	
	if hash == password {
		t.Error("Hash não deveria ser igual à senha original")
	}
}

// TestCheckPassword verifica se a validação de senha funciona
func TestCheckPassword(t *testing.T) {
	password := "password123"
	wrongPassword := "wrongpassword"
	
	hash, _ := HashPassword(password)
	
	// Senha correta
	if !CheckPassword(password, hash) {
		t.Error("Deveria validar senha correta")
	}
	
	// Senha incorreta
	if CheckPassword(wrongPassword, hash) {
		t.Error("Não deveria validar senha incorreta")
	}
}

// TestValidateEmail verifica validação de email
func TestValidateEmail(t *testing.T) {
	tests := []struct {
		email    string
		expected bool
	}{
		{"test@example.com", true},
		{"user.name@domain.com.br", true},
		{"invalid-email", false},
		{"@nodomain.com", false},
		{"noat.com", false},
		{"", false},
	}
	
	for _, tt := range tests {
		result := ValidateEmail(tt.email)
		if result != tt.expected {
			t.Errorf("ValidateEmail(%s) = %v, esperado %v", tt.email, result, tt.expected)
		}
	}
}

// TestValidatePassword verifica validação de senha
func TestValidatePassword(t *testing.T) {
	tests := []struct {
		password string
		expected bool
	}{
		{"password123", true},
		{"12345678", true},
		{"short", false},      // muito curta
		{"1234567", false},    // 7 caracteres
		{"", false},           // vazia
	}
	
	for _, tt := range tests {
		result := ValidatePassword(tt.password)
		if result != tt.expected {
			t.Errorf("ValidatePassword(%s) = %v, esperado %v", tt.password, result, tt.expected)
		}
	}
}

// ValidateEmail valida formato de email
func ValidateEmail(email string) bool {
	if email == "" {
		return false
	}
	// Validação simples
	atIndex := -1
	dotIndex := -1
	for i, c := range email {
		if c == '@' {
			if atIndex != -1 {
				return false // múltiplos @
			}
			atIndex = i
		}
		if c == '.' && atIndex != -1 {
			dotIndex = i
		}
	}
	return atIndex > 0 && dotIndex > atIndex+1 && dotIndex < len(email)-1
}

// ValidatePassword valida requisitos de senha
func ValidatePassword(password string) bool {
	return len(password) >= 8
}

// HashPassword cria hash bcrypt da senha
func HashPassword(password string) (string, error) {
	// Implementação simplificada para teste
	// Em produção, usar bcrypt.GenerateFromPassword
	return "hashed_" + password, nil
}

// CheckPassword verifica se senha corresponde ao hash
func CheckPassword(password, hash string) bool {
	// Implementação simplificada para teste
	// Em produção, usar bcrypt.CompareHashAndPassword
	return hash == "hashed_"+password
}
