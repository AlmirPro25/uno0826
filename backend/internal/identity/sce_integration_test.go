package identity

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// SCE INTEGRATION TESTS
// Valida o fluxo de autenticação SCE → Kernel
// ========================================

// setupSCETestDB cria um banco de dados de teste para SCE
func setupSCETestDB(t *testing.T) *gorm.DB {
	dbName := fmt.Sprintf("file:sce_test_%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	// Migrate all required tables
	db.AutoMigrate(&User{}, &UserOrigin{}, &AppMembership{})

	// Create applications table manually (simplified)
	db.Exec(`CREATE TABLE IF NOT EXISTS applications (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		slug TEXT,
		owner_id TEXT,
		status TEXT DEFAULT 'active',
		created_at DATETIME,
		updated_at DATETIME
	)`)

	return db
}

// setupSCETestRouter creates a test router with identity routes
func setupSCETestRouter(db *gorm.DB, jwtSecret string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Simple middleware that does nothing (for public routes)
	noopMiddleware := func(c *gin.Context) { c.Next() }

	// Auth middleware that extracts userID from JWT
	authMiddleware := func(c *gin.Context) {
		// For tests, we'll set userID from a header
		if userID := c.GetHeader("X-Test-User-ID"); userID != "" {
			c.Set("userID", userID)
		}
		c.Next()
	}

	api := router.Group("/api/v1")
	RegisterMultiAppIdentityRoutes(api, db, jwtSecret, authMiddleware, noopMiddleware)

	return router
}

// TestSCE_LoginFlow_NewUser testa o fluxo de login para usuário novo
// Cenário: Usuário se registra no SCE (origin_app = SCE)
func TestSCE_LoginFlow_NewUser(t *testing.T) {
	db := setupSCETestDB(t)
	jwtSecret := "test-jwt-secret-sce"
	router := setupSCETestRouter(db, jwtSecret)

	sceAppID := uuid.New()

	// Create SCE app
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		sceAppID.String(), "SCE", "sce", uuid.New().String(), "active", time.Now(), time.Now())

	// 1. Register user in SCE
	email := fmt.Sprintf("sce-user-%d@test.com", time.Now().UnixNano())
	registerBody := map[string]string{
		"email":         email,
		"password":      "password123",
		"name":          "SCE User",
		"origin_app_id": sceAppID.String(),
	}
	bodyBytes, _ := json.Marshal(registerBody)

	req := httptest.NewRequest("POST", "/api/v1/identity/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	var registerResp MultiAppAuthResponse
	json.Unmarshal(w.Body.Bytes(), &registerResp)

	t.Logf("✅ User registered: %s (origin: %s)", registerResp.UserID, registerResp.OriginAppID)

	// 2. Verify origin_app_id is SCE
	if registerResp.OriginAppID != sceAppID.String() {
		t.Fatalf("Expected origin_app_id to be SCE (%s), got %s", sceAppID, registerResp.OriginAppID)
	}
	t.Log("✅ Origin app is SCE")

	// 3. Verify membership was created automatically
	if len(registerResp.Memberships) != 1 {
		t.Fatalf("Expected 1 membership, got %d", len(registerResp.Memberships))
	}
	if registerResp.Memberships[0].AppID != sceAppID.String() {
		t.Fatalf("Expected membership in SCE, got %s", registerResp.Memberships[0].AppID)
	}
	t.Logf("✅ Membership created: %s (status: %s)", registerResp.Memberships[0].AppID, registerResp.Memberships[0].Status)

	// 4. Verify token
	if registerResp.Token == "" {
		t.Fatal("Expected token to be returned")
	}
	t.Log("✅ Token returned")

	// 5. Login should work without needs_link
	loginBody := map[string]string{
		"email":            email,
		"password":         "password123",
		"requesting_app_id": sceAppID.String(),
	}
	bodyBytes, _ = json.Marshal(loginBody)

	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var loginResp MultiAppAuthResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)

	if loginResp.NeedsLink {
		t.Fatal("Expected needs_link to be false for origin app")
	}
	t.Log("✅ Login successful without needs_link")

	t.Log("🎉 SCE New User Flow: PASSED")
}

// TestSCE_LoginFlow_CrossApp testa o fluxo de login cross-app
// Cenário: Usuário criado no VOX tenta acessar SCE
func TestSCE_LoginFlow_CrossApp(t *testing.T) {
	db := setupSCETestDB(t)
	jwtSecret := "test-jwt-secret-sce"
	router := setupSCETestRouter(db, jwtSecret)

	voxAppID := uuid.New()
	sceAppID := uuid.New()

	// Create apps
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		voxAppID.String(), "VOX-BRIDGE", "vox", uuid.New().String(), "active", time.Now(), time.Now())
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		sceAppID.String(), "SCE", "sce", uuid.New().String(), "active", time.Now(), time.Now())

	// 1. Register user in VOX
	email := fmt.Sprintf("vox-user-%d@test.com", time.Now().UnixNano())
	registerBody := map[string]string{
		"email":         email,
		"password":      "password123",
		"name":          "VOX User",
		"origin_app_id": voxAppID.String(),
	}
	bodyBytes, _ := json.Marshal(registerBody)

	req := httptest.NewRequest("POST", "/api/v1/identity/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	var registerResp MultiAppAuthResponse
	json.Unmarshal(w.Body.Bytes(), &registerResp)
	t.Logf("✅ User registered in VOX: %s", registerResp.UserID)

	// 2. Try login in SCE (should return needs_link)
	loginBody := map[string]string{
		"email":            email,
		"password":         "password123",
		"requesting_app_id": sceAppID.String(),
	}
	bodyBytes, _ = json.Marshal(loginBody)

	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var loginResp MultiAppAuthResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)

	if !loginResp.NeedsLink {
		t.Fatal("Expected needs_link to be true for cross-app login")
	}
	t.Log("✅ Login returned needs_link=true")

	// 3. Verify no membership in SCE
	var count int64
	db.Model(&AppMembership{}).Where("user_id = ? AND app_id = ?", registerResp.UserID, sceAppID).Count(&count)
	if count > 0 {
		t.Fatal("Expected no membership in SCE before link")
	}
	t.Log("✅ No membership in SCE (expected)")

	// 4. Link to SCE
	linkBody := map[string]string{
		"app_id": sceAppID.String(),
	}
	bodyBytes, _ = json.Marshal(linkBody)

	req = httptest.NewRequest("POST", "/api/v1/identity/link-app", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Test-User-ID", registerResp.UserID) // Simulate authenticated user
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", w.Code, w.Body.String())
	}
	t.Log("✅ User linked to SCE")

	// 5. Verify membership created
	db.Model(&AppMembership{}).Where("user_id = ? AND app_id = ?", registerResp.UserID, sceAppID).Count(&count)
	if count != 1 {
		t.Fatalf("Expected 1 membership in SCE, got %d", count)
	}
	t.Log("✅ Membership created in SCE")

	// 6. Login again (should work without needs_link)
	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	bodyBytes, _ = json.Marshal(loginBody)
	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	json.Unmarshal(w.Body.Bytes(), &loginResp)

	if loginResp.NeedsLink {
		t.Fatal("Expected needs_link to be false after link")
	}
	t.Log("✅ Login successful after link")

	// 7. Verify user has 2 memberships
	var memberships []AppMembership
	db.Where("user_id = ?", registerResp.UserID).Find(&memberships)
	if len(memberships) != 2 {
		t.Fatalf("Expected 2 memberships, got %d", len(memberships))
	}
	t.Logf("✅ User has %d memberships (VOX + SCE)", len(memberships))

	t.Log("🎉 SCE Cross-App Flow: PASSED")
}

// TestSCE_JWTContainsMemberships testa que o JWT contém as memberships
func TestSCE_JWTContainsMemberships(t *testing.T) {
	db := setupSCETestDB(t)
	jwtSecret := "test-jwt-secret-for-sce"
	router := setupSCETestRouter(db, jwtSecret)

	voxAppID := uuid.New()
	sceAppID := uuid.New()

	// Create apps
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		voxAppID.String(), "VOX", "vox", uuid.New().String(), "active", time.Now(), time.Now())
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		sceAppID.String(), "SCE", "sce", uuid.New().String(), "active", time.Now(), time.Now())

	// 1. Register user in VOX
	email := fmt.Sprintf("jwt-test-%d@test.com", time.Now().UnixNano())
	registerBody := map[string]string{
		"email":         email,
		"password":      "password123",
		"name":          "JWT Test User",
		"origin_app_id": voxAppID.String(),
	}
	bodyBytes, _ := json.Marshal(registerBody)

	req := httptest.NewRequest("POST", "/api/v1/identity/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var registerResp MultiAppAuthResponse
	json.Unmarshal(w.Body.Bytes(), &registerResp)

	// 2. Link to SCE
	linkBody := map[string]string{
		"app_id": sceAppID.String(),
	}
	bodyBytes, _ = json.Marshal(linkBody)

	req = httptest.NewRequest("POST", "/api/v1/identity/link-app", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Test-User-ID", registerResp.UserID)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", w.Code, w.Body.String())
	}
	t.Log("✅ User linked to SCE")

	// 3. Login and verify JWT
	loginBody := map[string]string{
		"email":            email,
		"password":         "password123",
		"requesting_app_id": sceAppID.String(),
	}
	bodyBytes, _ = json.Marshal(loginBody)

	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var loginResp MultiAppAuthResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)

	// 4. Verify memberships are in result
	if len(loginResp.Memberships) != 2 {
		t.Fatalf("Expected 2 memberships in login result, got %d", len(loginResp.Memberships))
	}
	t.Logf("✅ Login result contains %d memberships", len(loginResp.Memberships))

	// 5. Verify both apps are in memberships
	hasVOX := false
	hasSCE := false
	for _, m := range loginResp.Memberships {
		if m.AppID == voxAppID.String() {
			hasVOX = true
		}
		if m.AppID == sceAppID.String() {
			hasSCE = true
		}
	}

	if !hasVOX || !hasSCE {
		t.Fatalf("Expected both VOX and SCE in memberships, got VOX=%v SCE=%v", hasVOX, hasSCE)
	}
	t.Log("✅ Both VOX and SCE in memberships")

	t.Log("🎉 SCE JWT Memberships: PASSED")
}

// TestSCE_DuplicateRegistration testa que não permite registro duplicado
func TestSCE_DuplicateRegistration(t *testing.T) {
	db := setupSCETestDB(t)
	jwtSecret := "test-jwt-secret-sce"
	router := setupSCETestRouter(db, jwtSecret)

	sceAppID := uuid.New()
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		sceAppID.String(), "SCE", "sce", uuid.New().String(), "active", time.Now(), time.Now())

	email := fmt.Sprintf("duplicate-%d@test.com", time.Now().UnixNano())
	registerBody := map[string]string{
		"email":         email,
		"password":      "password123",
		"name":          "Test User",
		"origin_app_id": sceAppID.String(),
	}
	bodyBytes, _ := json.Marshal(registerBody)

	// First registration
	req := httptest.NewRequest("POST", "/api/v1/identity/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d", w.Code)
	}
	t.Log("✅ First registration successful")

	// Second registration (should fail)
	req = httptest.NewRequest("POST", "/api/v1/identity/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("Expected status 409 (Conflict), got %d", w.Code)
	}
	t.Log("✅ Duplicate registration rejected")

	t.Log("🎉 SCE Duplicate Registration: PASSED")
}

// TestSCE_InvalidCredentials testa login com credenciais inválidas
func TestSCE_InvalidCredentials(t *testing.T) {
	db := setupSCETestDB(t)
	jwtSecret := "test-jwt-secret-sce"
	router := setupSCETestRouter(db, jwtSecret)

	sceAppID := uuid.New()
	db.Exec("INSERT INTO applications (id, name, slug, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		sceAppID.String(), "SCE", "sce", uuid.New().String(), "active", time.Now(), time.Now())

	email := fmt.Sprintf("invalid-%d@test.com", time.Now().UnixNano())

	// Register user
	registerBody := map[string]string{
		"email":         email,
		"password":      "correctpassword",
		"name":          "Test User",
		"origin_app_id": sceAppID.String(),
	}
	bodyBytes, _ := json.Marshal(registerBody)
	req := httptest.NewRequest("POST", "/api/v1/identity/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Try login with wrong password
	loginBody := map[string]string{
		"email":    email,
		"password": "wrongpassword",
	}
	bodyBytes, _ = json.Marshal(loginBody)
	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected status 401, got %d", w.Code)
	}
	t.Log("✅ Invalid credentials rejected")

	// Try login with non-existent email
	loginBody = map[string]string{
		"email":    "nonexistent@test.com",
		"password": "anypassword",
	}
	bodyBytes, _ = json.Marshal(loginBody)
	req = httptest.NewRequest("POST", "/api/v1/identity/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected status 401, got %d", w.Code)
	}
	t.Log("✅ Non-existent user rejected")

	t.Log("🎉 SCE Invalid Credentials: PASSED")
}
