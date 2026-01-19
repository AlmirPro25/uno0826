package auth

import (
	"os"
	"testing"

	"prost-qs/backend/internal/identity"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func init() {
	// Configurar JWT_SECRET para todos os testes
	os.Setenv("JWT_SECRET", "test-secret-key-for-jwt-testing-32chars")
}

func setupAuthTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&identity.User{}, &identity.LoginEvent{})
	return db
}

func createAuthTestService(t *testing.T, db *gorm.DB) *AuthService {
	userRepo := identity.NewGORMUserRepository(db)
	loginEventService := identity.NewLoginEventService(db)
	return NewAuthService(userRepo, loginEventService)
}

// ===========================================
// REGISTER TESTS
// ===========================================

func TestRegisterUser(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	user, err := service.RegisterUser("testuser", "password123", "test@example.com")

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "testuser", user.Username)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "user", user.Role)
	assert.Equal(t, "active", user.Status)
	assert.NotEmpty(t, user.PasswordHash)
}

func TestRegisterUserDuplicate(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	// Primeiro registro
	_, err := service.RegisterUser("testuser", "password123", "test@example.com")
	assert.NoError(t, err)

	// Segundo registro com mesmo username
	_, err = service.RegisterUser("testuser", "password456", "test2@example.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "já existe")
}

func TestRegisterUserSuperAdmin(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	// Definir email de super admin e token de bootstrap
	os.Setenv("SUPER_ADMIN_EMAIL", "admin@example.com")
	os.Setenv("SUPER_ADMIN_BOOTSTRAP_TOKEN", "test-token-123")
	defer os.Unsetenv("SUPER_ADMIN_EMAIL")
	defer os.Unsetenv("SUPER_ADMIN_BOOTSTRAP_TOKEN")

	user, err := service.RegisterUser("admin", "password123", "admin@example.com")

	assert.NoError(t, err)
	assert.Equal(t, "super_admin", user.Role)
}

func TestRegisterUserNotSuperAdmin(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	// Definir email de super admin diferente
	os.Setenv("SUPER_ADMIN_EMAIL", "admin@example.com")
	defer os.Unsetenv("SUPER_ADMIN_EMAIL")

	user, err := service.RegisterUser("regular", "password123", "regular@example.com")

	assert.NoError(t, err)
	assert.Equal(t, "user", user.Role)
}

// ===========================================
// LOGIN TESTS
// ===========================================

func TestLoginUserInvalidPassword(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	// Registrar usuário
	_, err := service.RegisterUser("testuser", "password123", "test@example.com")
	require.NoError(t, err)

	// Login com senha errada
	_, _, _, err = service.LoginUser("testuser", "wrongpassword", "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "credenciais inválidas")
}

func TestLoginUserNotFound(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	// Login com usuário inexistente
	_, _, _, err := service.LoginUser("nonexistent", "password123", "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "credenciais inválidas")
}

// ===========================================
// EDGE CASES
// ===========================================

func TestRegisterUserEmptyPassword(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	// Registrar com senha vazia - bcrypt ainda funciona
	user, err := service.RegisterUser("testuser", "", "test@example.com")

	assert.NoError(t, err)
	assert.NotNil(t, user)
}

func TestNewAuthService(t *testing.T) {
	db := setupAuthTestDB(t)
	userRepo := identity.NewGORMUserRepository(db)
	loginEventService := identity.NewLoginEventService(db)

	service := NewAuthService(userRepo, loginEventService)

	assert.NotNil(t, service)
	assert.NotNil(t, service.userRepo)
	assert.NotNil(t, service.loginEventService)
}

func TestNewAuthServiceNilLoginEventService(t *testing.T) {
	db := setupAuthTestDB(t)
	userRepo := identity.NewGORMUserRepository(db)

	service := NewAuthService(userRepo, nil)

	assert.NotNil(t, service)
	assert.Nil(t, service.loginEventService)
}

// ===========================================
// HELPER TESTS
// ===========================================

func TestUserIDGeneration(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	user1, _ := service.RegisterUser("user1", "pass1", "user1@example.com")
	user2, _ := service.RegisterUser("user2", "pass2", "user2@example.com")

	assert.NotEqual(t, user1.ID, user2.ID)
	assert.NotEqual(t, uuid.Nil, user1.ID)
	assert.NotEqual(t, uuid.Nil, user2.ID)
}

func TestPasswordHashing(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	user, err := service.RegisterUser("testuser", "mypassword", "test@example.com")

	assert.NoError(t, err)
	assert.NotEqual(t, "mypassword", user.PasswordHash)
	assert.NotEmpty(t, user.PasswordHash)
}

func TestUserVersioning(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	user, err := service.RegisterUser("testuser", "password", "test@example.com")

	assert.NoError(t, err)
	assert.Equal(t, 1, user.Version)
}

func TestUserTimestamps(t *testing.T) {
	db := setupAuthTestDB(t)
	service := createAuthTestService(t, db)

	user, err := service.RegisterUser("testuser", "password", "test@example.com")

	assert.NoError(t, err)
	assert.False(t, user.CreatedAt.IsZero())
	assert.False(t, user.UpdatedAt.IsZero())
}
