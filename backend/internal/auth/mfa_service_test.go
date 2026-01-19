package auth

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupMFATestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	return db
}

func TestMFAService_GenerateSecret(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	secret, err := service.GenerateSecret()
	assert.NoError(t, err)
	assert.NotEmpty(t, secret)
	assert.Len(t, secret, 32) // Base32 encoded 20 bytes
}

func TestMFAService_GenerateBackupCodes(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	codes, err := service.GenerateBackupCodes(10)
	assert.NoError(t, err)
	assert.Len(t, codes, 10)

	// Verificar formato XXXX-XXXX
	for _, code := range codes {
		assert.Len(t, code, 9) // XXXX-XXXX
		assert.Equal(t, '-', rune(code[4]))
	}

	// Verificar unicidade
	seen := make(map[string]bool)
	for _, code := range codes {
		assert.False(t, seen[code], "Código duplicado: %s", code)
		seen[code] = true
	}
}

func TestMFAService_GenerateTOTP(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	// Secret conhecido para teste
	secret := "JBSWY3DPEHPK3PXP" // Base32 encoded "Hello!"

	// Gerar código
	code := service.GenerateTOTP(secret, time.Now())
	assert.NotEmpty(t, code)
	assert.Len(t, code, 6)

	// Código deve ser numérico
	for _, c := range code {
		assert.True(t, c >= '0' && c <= '9', "Código deve ser numérico")
	}
}

func TestMFAService_VerifyCode(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	secret := "JBSWY3DPEHPK3PXP"

	// Gerar código atual
	currentCode := service.GenerateTOTP(secret, time.Now())

	// Verificar código atual
	assert.True(t, service.VerifyCode(secret, currentCode))

	// Código inválido
	assert.False(t, service.VerifyCode(secret, "000000"))
	assert.False(t, service.VerifyCode(secret, "123456"))
}

func TestMFAService_SetupMFA(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	response, err := service.SetupMFA(userID, email)
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.NotEmpty(t, response.Secret)
	assert.NotEmpty(t, response.QRCodeURI)
	assert.Len(t, response.BackupCodes, 10)

	// Verificar URI
	assert.Contains(t, response.QRCodeURI, "otpauth://totp/")
	assert.Contains(t, response.QRCodeURI, email)
	assert.Contains(t, response.QRCodeURI, "PROST-QS")
}

func TestMFAService_SetupMFA_AlreadyEnabled(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Primeiro setup
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)

	// Habilitar MFA
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)

	// Tentar setup novamente
	_, err = service.SetupMFA(userID, email)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "já está habilitado")
}

func TestMFAService_VerifyAndEnable(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)

	// Verificar com código correto
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	assert.NoError(t, err)

	// Verificar que está habilitado
	assert.True(t, service.IsMFAEnabled(userID))
}

func TestMFAService_VerifyAndEnable_InvalidCode(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup
	_, err := service.SetupMFA(userID, email)
	require.NoError(t, err)

	// Verificar com código inválido
	err = service.VerifyAndEnable(userID, "000000")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "inválido")

	// Verificar que NÃO está habilitado
	assert.False(t, service.IsMFAEnabled(userID))
}

func TestMFAService_ValidateMFA(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup e habilitar
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)

	// Validar com código correto
	newCode := service.GenerateTOTP(response.Secret, time.Now())
	valid, err := service.ValidateMFA(userID, newCode)
	assert.NoError(t, err)
	assert.True(t, valid)

	// Validar com código inválido
	valid, err = service.ValidateMFA(userID, "000000")
	assert.Error(t, err)
	assert.False(t, valid)
}

func TestMFAService_ValidateMFA_BackupCode(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup e habilitar
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)

	// Validar com backup code
	backupCode := response.BackupCodes[0]
	valid, err := service.ValidateMFA(userID, backupCode)
	assert.NoError(t, err)
	assert.True(t, valid)

	// Backup code não pode ser usado novamente
	valid, err = service.ValidateMFA(userID, backupCode)
	assert.Error(t, err)
	assert.False(t, valid)
}

func TestMFAService_ValidateMFA_NotEnabled(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()

	// Validar sem MFA habilitado (deve permitir)
	valid, err := service.ValidateMFA(userID, "")
	assert.NoError(t, err)
	assert.True(t, valid)
}

func TestMFAService_DisableMFA(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup e habilitar
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)
	assert.True(t, service.IsMFAEnabled(userID))

	// Desabilitar com código correto
	newCode := service.GenerateTOTP(response.Secret, time.Now())
	err = service.DisableMFA(userID, newCode)
	assert.NoError(t, err)
	assert.False(t, service.IsMFAEnabled(userID))
}

func TestMFAService_DisableMFA_InvalidCode(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup e habilitar
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)

	// Tentar desabilitar com código inválido
	err = service.DisableMFA(userID, "000000")
	assert.Error(t, err)
	assert.True(t, service.IsMFAEnabled(userID))
}

func TestMFAService_RegenerateBackupCodes(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Setup e habilitar
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)

	// Regenerar backup codes
	newCode := service.GenerateTOTP(response.Secret, time.Now())
	newCodes, err := service.RegenerateBackupCodes(userID, newCode)
	assert.NoError(t, err)
	assert.Len(t, newCodes, 10)

	// Novos códigos devem ser diferentes dos antigos
	for _, newC := range newCodes {
		for _, oldC := range response.BackupCodes {
			assert.NotEqual(t, newC, oldC)
		}
	}
}

func TestMFAService_GetMFAStatus(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	userID := uuid.New()
	email := "test@example.com"

	// Status sem MFA
	status := service.GetMFAStatus(userID)
	assert.False(t, status.Enabled)
	assert.Equal(t, uuid.Nil, status.SetupID)

	// Setup
	response, err := service.SetupMFA(userID, email)
	require.NoError(t, err)

	// Status após setup (não habilitado)
	status = service.GetMFAStatus(userID)
	assert.False(t, status.Enabled)
	assert.NotEqual(t, uuid.Nil, status.SetupID)

	// Habilitar
	code := service.GenerateTOTP(response.Secret, time.Now())
	err = service.VerifyAndEnable(userID, code)
	require.NoError(t, err)

	// Status após habilitar
	status = service.GetMFAStatus(userID)
	assert.True(t, status.Enabled)
	assert.NotNil(t, status.VerifiedAt)
	assert.Equal(t, 10, status.BackupCodesRemaining)
}

func TestMFAService_GenerateOTPAuthURI(t *testing.T) {
	db := setupMFATestDB(t)
	service := NewMFAService(db)

	secret := "JBSWY3DPEHPK3PXP"
	email := "test@example.com"

	uri := service.GenerateOTPAuthURI(secret, email)

	assert.Contains(t, uri, "otpauth://totp/")
	assert.Contains(t, uri, "PROST-QS")
	assert.Contains(t, uri, email)
	assert.Contains(t, uri, secret)
	assert.Contains(t, uri, "algorithm=SHA1")
	assert.Contains(t, uri, "digits=6")
	assert.Contains(t, uri, "period=30")
}
