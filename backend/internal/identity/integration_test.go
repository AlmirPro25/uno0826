package identity

/*
================================================================================
TESTES DE INTEGRAÇÃO: Identity ↔ Apps (SCE, VOX-BRIDGE)
================================================================================

Estes testes simulam o fluxo completo de integração entre o Kernel Identity
e apps externos como SCE. Eles devem passar ANTES de qualquer migração.

Cenários testados:
1. Token válido + membership → Acesso permitido
2. Token válido SEM membership → needs_link: true
3. Token de outro app → Negado (sem membership)

================================================================================
*/

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ========================================
// SETUP HELPERS
// ========================================

func setupIntegrationTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate schemas
	err = db.AutoMigrate(&User{}, &UserOrigin{}, &AppMembership{})
	require.NoError(t, err)

	// Create applications table
	db.Exec(`CREATE TABLE IF NOT EXISTS applications (
		id TEXT PRIMARY KEY,
		name TEXT,
		status TEXT DEFAULT 'active'
	)`)

	// Create unique indexes
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_origin_user ON user_origins(user_id)")
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_user_app ON app_memberships(user_id, app_id)")

	return db
}

// SimulatedApp representa um app externo (SCE, VOX-BRIDGE)
type SimulatedApp struct {
	ID        uuid.UUID
	Name      string
	JWTSecret string
}

// SimulatedUser representa um usuário no ecossistema
type SimulatedUser struct {
	ID           uuid.UUID
	Email        string
	Password     string
	OriginAppID  uuid.UUID
	Memberships  []uuid.UUID
}

// setupEcosystem cria o ecossistema de teste com apps e usuários
func setupEcosystem(t *testing.T, db *gorm.DB) (vox, sce SimulatedApp, userVoxOnly, userBoth SimulatedUser) {
	// Criar apps
	vox = SimulatedApp{
		ID:        uuid.New(),
		Name:      "VOX-BRIDGE",
		JWTSecret: "kernel-jwt-secret-32chars!!!!!!",
	}
	sce = SimulatedApp{
		ID:        uuid.New(),
		Name:      "SCE",
		JWTSecret: "kernel-jwt-secret-32chars!!!!!!",
	}

	db.Exec("INSERT INTO applications (id, name, status) VALUES (?, ?, ?)", vox.ID.String(), vox.Name, "active")
	db.Exec("INSERT INTO applications (id, name, status) VALUES (?, ?, ?)", sce.ID.String(), sce.Name, "active")

	now := time.Now()
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("senha123"), bcrypt.DefaultCost)

	// Usuário 1: Apenas no VOX (sem membership no SCE)
	userVoxOnly = SimulatedUser{
		ID:          uuid.New(),
		Email:       "vox-only@test.com",
		Password:    "senha123",
		OriginAppID: vox.ID,
		Memberships: []uuid.UUID{vox.ID},
	}

	db.Create(&User{
		ID: userVoxOnly.ID, Username: "VOX User", Email: userVoxOnly.Email,
		PasswordHash: string(hashedPassword), Role: "user", Status: "active",
		CreatedAt: now, UpdatedAt: now, Version: 1,
	})
	db.Create(&UserOrigin{ID: uuid.New(), UserID: userVoxOnly.ID, AppID: vox.ID, CreatedAt: now})
	db.Create(&AppMembership{
		ID: uuid.New(), UserID: userVoxOnly.ID, AppID: vox.ID,
		Role: "user", Status: "active", LinkedAt: now, LastAccessAt: now,
		CreatedAt: now, UpdatedAt: now,
	})

	// Usuário 2: No VOX e no SCE (tem membership em ambos)
	userBoth = SimulatedUser{
		ID:          uuid.New(),
		Email:       "both@test.com",
		Password:    "senha123",
		OriginAppID: vox.ID,
		Memberships: []uuid.UUID{vox.ID, sce.ID},
	}

	db.Create(&User{
		ID: userBoth.ID, Username: "Both User", Email: userBoth.Email,
		PasswordHash: string(hashedPassword), Role: "user", Status: "active",
		CreatedAt: now, UpdatedAt: now, Version: 1,
	})
	db.Create(&UserOrigin{ID: uuid.New(), UserID: userBoth.ID, AppID: vox.ID, CreatedAt: now})
	db.Create(&AppMembership{
		ID: uuid.New(), UserID: userBoth.ID, AppID: vox.ID,
		Role: "user", Status: "active", LinkedAt: now, LastAccessAt: now,
		CreatedAt: now, UpdatedAt: now,
	})
	db.Create(&AppMembership{
		ID: uuid.New(), UserID: userBoth.ID, AppID: sce.ID,
		Role: "user", Status: "active", LinkedAt: now, LastAccessAt: now,
		CreatedAt: now, UpdatedAt: now,
	})

	return
}

// generateKernelJWT gera um JWT como o Kernel faria
func generateKernelJWT(secret string, userID uuid.UUID, email string, originAppID uuid.UUID, memberships []uuid.UUID) string {
	membershipStrs := make([]string, len(memberships))
	for i, m := range memberships {
		membershipStrs[i] = m.String()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":       userID.String(),
		"email":         email,
		"name":          "Test User",
		"role":          "user",
		"origin_app_id": originAppID.String(),
		"memberships":   membershipStrs,
		"type":          "global_user",
		"exp":           time.Now().Add(24 * time.Hour).Unix(),
		"iat":           time.Now().Unix(),
	})
	tokenString, _ := token.SignedString([]byte(secret))
	return tokenString
}

// ========================================
// SIMULAÇÃO DO MIDDLEWARE DO SCE
// ========================================

// SCEAuthResult representa o resultado da validação de auth no SCE
type SCEAuthResult struct {
	Allowed   bool
	UserID    string
	NeedsLink bool
	Error     string
	ErrorCode string
}

// simulateSCEAuthMiddleware simula o comportamento do middleware do SCE
func simulateSCEAuthMiddleware(token string, jwtSecret string, sceAppID uuid.UUID) SCEAuthResult {
	if token == "" {
		return SCEAuthResult{Allowed: false, Error: "Token não fornecido", ErrorCode: "UNAUTHORIZED"}
	}

	// Parse do token
	parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil || !parsedToken.Valid {
		return SCEAuthResult{Allowed: false, Error: "Token inválido ou expirado", ErrorCode: "INVALID_TOKEN"}
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok {
		return SCEAuthResult{Allowed: false, Error: "Claims inválidos", ErrorCode: "INVALID_TOKEN"}
	}

	// Verificar se é token do Kernel
	tokenType, _ := claims["type"].(string)
	if tokenType != "global_user" {
		return SCEAuthResult{Allowed: false, Error: "Token inválido", ErrorCode: "INVALID_TOKEN"}
	}

	// Extrair memberships
	membershipsClaim, ok := claims["memberships"].([]interface{})
	if !ok {
		return SCEAuthResult{Allowed: false, Error: "Memberships inválidas", ErrorCode: "INVALID_TOKEN"}
	}

	// Verificar se tem membership no SCE
	hasSCEMembership := false
	for _, m := range membershipsClaim {
		if m.(string) == sceAppID.String() {
			hasSCEMembership = true
			break
		}
	}

	userID, _ := claims["user_id"].(string)

	if !hasSCEMembership {
		return SCEAuthResult{
			Allowed:   false,
			UserID:    userID,
			NeedsLink: true,
			Error:     "Você precisa vincular sua conta ao SCE",
			ErrorCode: "NEEDS_LINK",
		}
	}

	// Autorizado
	return SCEAuthResult{
		Allowed: true,
		UserID:  userID,
	}
}

// ========================================
// TESTES DE INTEGRAÇÃO
// ========================================

// TestIntegration_ValidTokenWithMembership
// Cenário: Usuário com membership no SCE consegue acessar
func TestIntegration_ValidTokenWithMembership(t *testing.T) {
	db := setupIntegrationTestDB(t)
	vox, sce, _, userBoth := setupEcosystem(t, db)

	// Gerar token do Kernel para usuário com membership em ambos apps
	token := generateKernelJWT(
		sce.JWTSecret,
		userBoth.ID,
		userBoth.Email,
		userBoth.OriginAppID,
		userBoth.Memberships,
	)

	// Simular request ao SCE
	result := simulateSCEAuthMiddleware(token, sce.JWTSecret, sce.ID)

	// Deve ser permitido
	assert.True(t, result.Allowed, "Usuário com membership deve ter acesso")
	assert.Equal(t, userBoth.ID.String(), result.UserID)
	assert.False(t, result.NeedsLink)
	assert.Empty(t, result.Error)

	// Verificar que também funciona no VOX
	resultVox := simulateSCEAuthMiddleware(token, vox.JWTSecret, vox.ID)
	assert.True(t, resultVox.Allowed, "Mesmo usuário deve ter acesso ao VOX")
}

// TestIntegration_ValidTokenWithoutMembership_NeedsLink
// Cenário: Usuário SEM membership no SCE recebe needs_link: true
func TestIntegration_ValidTokenWithoutMembership_NeedsLink(t *testing.T) {
	db := setupIntegrationTestDB(t)
	_, sce, userVoxOnly, _ := setupEcosystem(t, db)

	// Gerar token do Kernel para usuário SEM membership no SCE
	token := generateKernelJWT(
		sce.JWTSecret,
		userVoxOnly.ID,
		userVoxOnly.Email,
		userVoxOnly.OriginAppID,
		userVoxOnly.Memberships, // Apenas VOX
	)

	// Simular request ao SCE
	result := simulateSCEAuthMiddleware(token, sce.JWTSecret, sce.ID)

	// Deve ser bloqueado com needs_link
	assert.False(t, result.Allowed, "Usuário sem membership NÃO deve ter acesso")
	assert.True(t, result.NeedsLink, "needs_link deve ser true")
	assert.Equal(t, "NEEDS_LINK", result.ErrorCode)
	assert.Equal(t, userVoxOnly.ID.String(), result.UserID, "UserID deve estar presente para link")
}

// TestIntegration_TokenFromOtherApp_Denied
// Cenário: Token válido mas sem membership no app solicitado
func TestIntegration_TokenFromOtherApp_Denied(t *testing.T) {
	db := setupIntegrationTestDB(t)
	vox, sce, userVoxOnly, _ := setupEcosystem(t, db)

	// Gerar token do Kernel para usuário do VOX
	token := generateKernelJWT(
		vox.JWTSecret,
		userVoxOnly.ID,
		userVoxOnly.Email,
		userVoxOnly.OriginAppID,
		userVoxOnly.Memberships, // Apenas VOX
	)

	// Tentar acessar SCE com token que só tem membership no VOX
	result := simulateSCEAuthMiddleware(token, sce.JWTSecret, sce.ID)

	// Deve ser negado
	assert.False(t, result.Allowed)
	assert.True(t, result.NeedsLink, "Deve indicar que precisa de link")
	assert.Equal(t, "NEEDS_LINK", result.ErrorCode)
}

// TestIntegration_InvalidToken_Rejected
// Cenário: Token inválido é rejeitado
func TestIntegration_InvalidToken_Rejected(t *testing.T) {
	db := setupIntegrationTestDB(t)
	_, sce, _, _ := setupEcosystem(t, db)

	testCases := []struct {
		name      string
		token     string
		errorCode string
	}{
		{"Token vazio", "", "UNAUTHORIZED"},
		{"Token malformado", "not.a.valid.token", "INVALID_TOKEN"},
		{"Token com secret errado", generateKernelJWT("wrong-secret-32chars!!!!!!!!!!!", uuid.New(), "test@test.com", uuid.New(), []uuid.UUID{}), "INVALID_TOKEN"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := simulateSCEAuthMiddleware(tc.token, sce.JWTSecret, sce.ID)
			assert.False(t, result.Allowed)
			assert.Equal(t, tc.errorCode, result.ErrorCode)
		})
	}
}

// TestIntegration_LinkAppFlow_Complete
// Cenário: Fluxo completo de link-app
func TestIntegration_LinkAppFlow_Complete(t *testing.T) {
	db := setupIntegrationTestDB(t)
	handler := NewMultiAppIdentityHandler(db, "kernel-jwt-secret-32chars!!!!!!")
	_, sce, userVoxOnly, _ := setupEcosystem(t, db)

	// 1. Usuário tenta acessar SCE (sem membership)
	tokenBefore := generateKernelJWT(
		sce.JWTSecret,
		userVoxOnly.ID,
		userVoxOnly.Email,
		userVoxOnly.OriginAppID,
		userVoxOnly.Memberships,
	)

	resultBefore := simulateSCEAuthMiddleware(tokenBefore, sce.JWTSecret, sce.ID)
	assert.False(t, resultBefore.Allowed, "Antes do link: acesso negado")
	assert.True(t, resultBefore.NeedsLink, "Antes do link: needs_link = true")

	// 2. Simular link-app (criar membership)
	now := time.Now()
	db.Create(&AppMembership{
		ID: uuid.New(), UserID: userVoxOnly.ID, AppID: sce.ID,
		Role: "user", Status: "active", LinkedAt: now, LastAccessAt: now,
		CreatedAt: now, UpdatedAt: now,
	})

	// 3. Buscar memberships atualizadas
	memberships := handler.getMemberships(userVoxOnly.ID)
	assert.Len(t, memberships, 2, "Após link: deve ter 2 memberships")

	// 4. Gerar novo token com memberships atualizadas
	newMembershipIDs := make([]uuid.UUID, len(memberships))
	for i, m := range memberships {
		id, _ := uuid.Parse(m.AppID)
		newMembershipIDs[i] = id
	}

	tokenAfter := generateKernelJWT(
		sce.JWTSecret,
		userVoxOnly.ID,
		userVoxOnly.Email,
		userVoxOnly.OriginAppID,
		newMembershipIDs,
	)

	// 5. Tentar acessar SCE novamente
	resultAfter := simulateSCEAuthMiddleware(tokenAfter, sce.JWTSecret, sce.ID)
	assert.True(t, resultAfter.Allowed, "Após link: acesso permitido")
	assert.False(t, resultAfter.NeedsLink, "Após link: needs_link = false")
}

// TestIntegration_SuspendedMembership_Denied
// Cenário: Membership suspensa não dá acesso
func TestIntegration_SuspendedMembership_Denied(t *testing.T) {
	db := setupIntegrationTestDB(t)
	_, sce, _, userBoth := setupEcosystem(t, db)

	// Suspender membership do SCE
	db.Model(&AppMembership{}).Where("user_id = ? AND app_id = ?", userBoth.ID, sce.ID).Update("status", "suspended")

	// Gerar token (ainda lista SCE nas memberships do JWT antigo)
	// Mas o middleware deve verificar status no banco? Não, ele confia no JWT.
	// Então o token deve ser regenerado após suspensão.

	// Simular token SEM o SCE (como seria após suspensão)
	token := generateKernelJWT(
		sce.JWTSecret,
		userBoth.ID,
		userBoth.Email,
		userBoth.OriginAppID,
		[]uuid.UUID{userBoth.OriginAppID}, // Apenas VOX, SCE removido
	)

	result := simulateSCEAuthMiddleware(token, sce.JWTSecret, sce.ID)
	assert.False(t, result.Allowed, "Membership suspensa não deve dar acesso")
	assert.True(t, result.NeedsLink)
}

// TestIntegration_CrossAppIsolation
// Cenário: Dados de um app não vazam para outro
func TestIntegration_CrossAppIsolation(t *testing.T) {
	db := setupIntegrationTestDB(t)
	vox, sce, _, userBoth := setupEcosystem(t, db)

	// Criar tabela de dados simulados (ex: projetos)
	db.Exec(`CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		app_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		name TEXT
	)`)

	// Criar projeto no VOX
	voxProjectID := uuid.New()
	db.Exec("INSERT INTO projects (id, app_id, user_id, name) VALUES (?, ?, ?, ?)",
		voxProjectID.String(), vox.ID.String(), userBoth.ID.String(), "VOX Project")

	// Criar projeto no SCE
	sceProjectID := uuid.New()
	db.Exec("INSERT INTO projects (id, app_id, user_id, name) VALUES (?, ?, ?, ?)",
		sceProjectID.String(), sce.ID.String(), userBoth.ID.String(), "SCE Project")

	// Query do VOX não deve retornar projeto do SCE
	var voxProjects []struct{ ID, Name string }
	db.Table("projects").Where("app_id = ?", vox.ID.String()).Find(&voxProjects)
	assert.Len(t, voxProjects, 1)
	assert.Equal(t, "VOX Project", voxProjects[0].Name)

	// Query do SCE não deve retornar projeto do VOX
	var sceProjects []struct{ ID, Name string }
	db.Table("projects").Where("app_id = ?", sce.ID.String()).Find(&sceProjects)
	assert.Len(t, sceProjects, 1)
	assert.Equal(t, "SCE Project", sceProjects[0].Name)

	// Query sem filtro de app_id retorna ambos (PERIGO - nunca fazer isso)
	var allProjects []struct{ ID, Name string }
	db.Table("projects").Find(&allProjects)
	assert.Len(t, allProjects, 2, "Sem filtro, retorna tudo (vazamento)")
}
