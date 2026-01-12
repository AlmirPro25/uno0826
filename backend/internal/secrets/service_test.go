package secrets

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupSecretsTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&Secret{}, &SecretVersion{}, &SecretAccess{})
	return db
}

func createSecretsTestService(t *testing.T, db *gorm.DB) *SecretsService {
	// Master key deve ter exatamente 32 bytes para AES-256
	masterKey := "12345678901234567890123456789012"
	service, err := NewSecretsService(db, masterKey)
	require.NoError(t, err)
	return service
}

// ===========================================
// CONSTRUCTOR TESTS
// ===========================================

func TestNewSecretsService(t *testing.T) {
	db := setupSecretsTestDB(t)
	masterKey := "12345678901234567890123456789012"

	service, err := NewSecretsService(db, masterKey)

	assert.NoError(t, err)
	assert.NotNil(t, service)
}

func TestNewSecretsServiceInvalidKey(t *testing.T) {
	db := setupSecretsTestDB(t)
	masterKey := "short-key"

	// Agora a invariant causa panic para master key inválida
	defer func() {
		if r := recover(); r != nil {
			// Esperado: panic da invariant
			assert.Contains(t, r.(string), "FATAL INVARIANT")
			t.Log("✅ Master key inválida causou panic (comportamento correto)")
		}
	}()

	service, err := NewSecretsService(db, masterKey)

	// Se chegou aqui sem panic, o teste falhou
	if err == nil && service != nil {
		t.Fatal("Deveria ter causado panic ou erro para master key inválida")
	}
}

// ===========================================
// CREATE TESTS
// ===========================================

func TestCreate(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "API_KEY",
		Value:       "secret-value-12345",
		Environment: "production",
		Category:    "api_key",
		Description: "Test API key",
	}

	result, err := service.Create(req, uuid.New())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "API_KEY", result.Name)
	assert.Equal(t, "production", result.Environment)
	assert.Equal(t, "api_key", result.Category)
	assert.Equal(t, 1, result.Version)
	assert.True(t, result.IsActive)
	assert.Contains(t, result.LastChars, "****")
}

func TestCreateWithAppID(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	appID := uuid.New()
	req := CreateSecretRequest{
		AppID:       &appID,
		Name:        "APP_SECRET",
		Value:       "app-secret-value",
		Environment: "development",
		Category:    "database",
	}

	result, err := service.Create(req, uuid.New())

	assert.NoError(t, err)
	assert.Equal(t, &appID, result.AppID)
}

func TestCreateDuplicate(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "DUPLICATE_KEY",
		Value:       "value1",
		Environment: "production",
		Category:    "api_key",
	}

	_, err := service.Create(req, uuid.New())
	assert.NoError(t, err)

	// Tentar criar duplicata
	req.Value = "value2"
	_, err = service.Create(req, uuid.New())

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "já existe")
}

func TestCreateInvalidEnvironment(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "TEST_KEY",
		Value:       "value",
		Environment: "invalid",
		Category:    "api_key",
	}

	_, err := service.Create(req, uuid.New())

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "ambiente inválido")
}

func TestCreateInvalidCategory(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "TEST_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "invalid",
	}

	_, err := service.Create(req, uuid.New())

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "categoria inválida")
}

// ===========================================
// UPDATE TESTS
// ===========================================

func TestUpdate(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	// Criar secret
	req := CreateSecretRequest{
		Name:        "UPDATE_KEY",
		Value:       "original-value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	// Atualizar
	updateReq := UpdateSecretRequest{
		Value:  "new-value-12345",
		Reason: "rotation",
	}
	updated, err := service.Update(created.ID, updateReq, uuid.New())

	assert.NoError(t, err)
	assert.Equal(t, 2, updated.Version)
}

func TestUpdateNotFound(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	updateReq := UpdateSecretRequest{
		Value:  "new-value",
		Reason: "test",
	}
	_, err := service.Update(uuid.New(), updateReq, uuid.New())

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "não encontrado")
}

func TestUpdateRevoked(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	// Criar e revogar
	req := CreateSecretRequest{
		Name:        "REVOKED_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())
	service.Revoke(created.ID, uuid.New())

	// Tentar atualizar
	updateReq := UpdateSecretRequest{Value: "new", Reason: "test"}
	_, err := service.Update(created.ID, updateReq, uuid.New())

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "revogado")
}

// ===========================================
// REVOKE TESTS
// ===========================================

func TestRevoke(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "REVOKE_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	err := service.Revoke(created.ID, uuid.New())

	assert.NoError(t, err)

	// Verificar que foi revogado
	found, _ := service.GetByID(created.ID)
	assert.False(t, found.IsActive)
}

func TestRevokeNotFound(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	err := service.Revoke(uuid.New(), uuid.New())

	assert.Error(t, err)
}

// ===========================================
// QUERY TESTS
// ===========================================

func TestGetByID(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "GET_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	found, err := service.GetByID(created.ID)

	assert.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
}

func TestGetByIDNotFound(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	_, err := service.GetByID(uuid.New())

	assert.Error(t, err)
}

func TestList(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	// Criar vários secrets
	for i := 0; i < 5; i++ {
		req := CreateSecretRequest{
			Name:        "LIST_KEY_" + string(rune('A'+i)),
			Value:       "value",
			Environment: "production",
			Category:    "api_key",
		}
		service.Create(req, uuid.New())
	}

	result, err := service.List(nil, "production", true)

	assert.NoError(t, err)
	assert.Equal(t, int64(5), result.Total)
	assert.Len(t, result.Secrets, 5)
}

func TestListByEnvironment(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	// Criar em diferentes ambientes
	service.Create(CreateSecretRequest{Name: "PROD_KEY", Value: "v", Environment: "production", Category: "api_key"}, uuid.New())
	service.Create(CreateSecretRequest{Name: "DEV_KEY", Value: "v", Environment: "development", Category: "api_key"}, uuid.New())

	result, err := service.List(nil, "production", true)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Total)
}


// ===========================================
// INJECT TESTS
// ===========================================

func TestInject(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	appID := uuid.New()
	actorID := uuid.New()

	// Criar secrets para o app
	service.Create(CreateSecretRequest{
		AppID:       &appID,
		Name:        "APP_KEY_1",
		Value:       "value1",
		Environment: "production",
		Category:    "api_key",
	}, uuid.New())

	service.Create(CreateSecretRequest{
		AppID:       &appID,
		Name:        "APP_KEY_2",
		Value:       "value2",
		Environment: "production",
		Category:    "database",
	}, uuid.New())

	result, err := service.Inject(appID, "production", actorID, "system", "127.0.0.1", "Test")

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Count)
	assert.Equal(t, "value1", result.Secrets["APP_KEY_1"])
	assert.Equal(t, "value2", result.Secrets["APP_KEY_2"])
}

func TestInjectExcludesExpired(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	appID := uuid.New()
	expired := time.Now().Add(-1 * time.Hour)

	// Criar secret expirado
	service.Create(CreateSecretRequest{
		AppID:       &appID,
		Name:        "EXPIRED_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
		ExpiresAt:   &expired,
	}, uuid.New())

	result, err := service.Inject(appID, "production", uuid.New(), "system", "", "")

	assert.NoError(t, err)
	assert.Equal(t, 0, result.Count)
}

// ===========================================
// GET VALUE TESTS
// ===========================================

func TestGetValue(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "VALUE_KEY",
		Value:       "secret-value-here",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	value, err := service.GetValue(created.ID, uuid.New(), "user", "127.0.0.1", "Test")

	assert.NoError(t, err)
	assert.Equal(t, "secret-value-here", value)
}

func TestGetValueExpired(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	expired := time.Now().Add(-1 * time.Hour)
	req := CreateSecretRequest{
		Name:        "EXPIRED_VALUE",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
		ExpiresAt:   &expired,
	}
	created, _ := service.Create(req, uuid.New())

	_, err := service.GetValue(created.ID, uuid.New(), "user", "", "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "expirado")
}

func TestGetValueRevoked(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "REVOKED_VALUE",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())
	service.Revoke(created.ID, uuid.New())

	_, err := service.GetValue(created.ID, uuid.New(), "user", "", "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "não encontrado")
}

// ===========================================
// ACCESS LOG TESTS
// ===========================================

func TestGetAccessLog(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "LOG_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	// Acessar várias vezes
	for i := 0; i < 3; i++ {
		service.GetValue(created.ID, uuid.New(), "user", "127.0.0.1", "Test")
	}

	logs, err := service.GetAccessLog(created.ID, 10)

	assert.NoError(t, err)
	assert.Len(t, logs, 3)
}

// ===========================================
// VERSION TESTS
// ===========================================

func TestGetVersions(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "VERSION_KEY",
		Value:       "v1",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	// Atualizar várias vezes
	service.Update(created.ID, UpdateSecretRequest{Value: "v2", Reason: "update"}, uuid.New())
	service.Update(created.ID, UpdateSecretRequest{Value: "v3", Reason: "update"}, uuid.New())

	versions, err := service.GetVersions(created.ID)

	assert.NoError(t, err)
	assert.Len(t, versions, 3)
	// Valores devem estar redacted
	for _, v := range versions {
		assert.Equal(t, "[REDACTED]", v.EncryptedValue)
	}
}

// ===========================================
// ROTATION TESTS
// ===========================================

func TestRotate(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	req := CreateSecretRequest{
		Name:        "ROTATE_KEY",
		Value:       "old-value",
		Environment: "production",
		Category:    "api_key",
	}
	created, _ := service.Create(req, uuid.New())

	rotated, err := service.Rotate(created.ID, "new-rotated-value", uuid.New())

	assert.NoError(t, err)
	assert.Equal(t, 2, rotated.Version)
}

func TestGetExpiringSoon(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	// Criar secret que expira em 3 dias
	expiresSoon := time.Now().Add(3 * 24 * time.Hour)
	service.Create(CreateSecretRequest{
		Name:        "EXPIRING_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "api_key",
		ExpiresAt:   &expiresSoon,
	}, uuid.New())

	// Criar secret que expira em 30 dias
	expiresLater := time.Now().Add(30 * 24 * time.Hour)
	service.Create(CreateSecretRequest{
		Name:        "NOT_EXPIRING_KEY",
		Value:       "value",
		Environment: "production",
		Category:    "database",
		ExpiresAt:   &expiresLater,
	}, uuid.New())

	expiring, err := service.GetExpiringSoon(7)

	assert.NoError(t, err)
	assert.Len(t, expiring, 1)
	assert.Equal(t, "EXPIRING_KEY", expiring[0].Name)
}

// ===========================================
// ENCRYPTION TESTS
// ===========================================

func TestEncryptDecrypt(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	original := "my-secret-value-12345"

	encrypted, err := service.encrypt(original)
	assert.NoError(t, err)
	assert.NotEqual(t, original, encrypted)

	decrypted, err := service.decrypt(encrypted)
	assert.NoError(t, err)
	assert.Equal(t, original, decrypted)
}

func TestMaskValue(t *testing.T) {
	db := setupSecretsTestDB(t)
	service := createSecretsTestService(t, db)

	assert.Equal(t, "****5678", service.maskValue("12345678"))
	assert.Equal(t, "****", service.maskValue("abc"))
	assert.Equal(t, "****", service.maskValue(""))
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestSecretTableName(t *testing.T) {
	assert.Equal(t, "secrets", Secret{}.TableName())
}

func TestSecretVersionTableName(t *testing.T) {
	assert.Equal(t, "secret_versions", SecretVersion{}.TableName())
}

func TestSecretAccessTableName(t *testing.T) {
	assert.Equal(t, "secret_accesses", SecretAccess{}.TableName())
}

func TestIsValidEnvironment(t *testing.T) {
	assert.True(t, IsValidEnvironment("production"))
	assert.True(t, IsValidEnvironment("staging"))
	assert.True(t, IsValidEnvironment("development"))
	assert.False(t, IsValidEnvironment("invalid"))
}

func TestIsValidCategory(t *testing.T) {
	assert.True(t, IsValidCategory("api_key"))
	assert.True(t, IsValidCategory("database"))
	assert.True(t, IsValidCategory("oauth"))
	assert.True(t, IsValidCategory("custom"))
	assert.False(t, IsValidCategory("invalid"))
}
