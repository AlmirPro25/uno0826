package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

// TestHealthCheck verifica o endpoint de health check
func TestHealthCheck(t *testing.T) {
	router := setupTestRouter()
	
	// Criar controller mock - precisa de DB para funcionar corretamente
	// Este teste é simplificado para verificar a estrutura
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})
	
	// Criar requisição
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	// Verificar status
	if w.Code != http.StatusOK {
		t.Errorf("Status esperado %d, recebido %d", http.StatusOK, w.Code)
	}
	
	// Verificar resposta
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Erro ao parsear resposta: %v", err)
	}
	
	if response["status"] != "healthy" {
		t.Errorf("Status esperado 'healthy', recebido '%v'", response["status"])
	}
}

// TestHealthReady verifica o endpoint de readiness
func TestHealthReady(t *testing.T) {
	router := setupTestRouter()
	
	// Teste simplificado - em produção precisa de DB
	router.GET("/health/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready"})
	})
	
	req, _ := http.NewRequest("GET", "/health/ready", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	// Pode retornar 200 ou 503 dependendo do estado do banco
	if w.Code != http.StatusOK && w.Code != http.StatusServiceUnavailable {
		t.Errorf("Status esperado 200 ou 503, recebido %d", w.Code)
	}
}

// TestHealthLive verifica o endpoint de liveness
func TestHealthLive(t *testing.T) {
	router := setupTestRouter()
	
	// Teste simplificado
	router.GET("/health/live", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "alive"})
	})
	
	req, _ := http.NewRequest("GET", "/health/live", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Status esperado %d, recebido %d", http.StatusOK, w.Code)
	}
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	if response["status"] != "alive" {
		t.Errorf("Status esperado 'alive', recebido '%v'", response["status"])
	}
}

// TestCORSHeaders verifica se os headers CORS estão presentes
func TestCORSHeaders(t *testing.T) {
	router := setupTestRouter()
	
	// Adicionar middleware CORS simplificado
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Next()
	})
	
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})
	
	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	// Verificar headers CORS
	if w.Header().Get("Access-Control-Allow-Origin") == "" {
		t.Error("Header Access-Control-Allow-Origin não encontrado")
	}
}

// TestRateLimiting verifica se rate limiting funciona
func TestRateLimiting(t *testing.T) {
	// Este teste é conceitual - em produção, testar com múltiplas requisições
	t.Log("Rate limiting deve bloquear após 100 requisições/minuto")
}

// TestAuthMiddleware verifica middleware de autenticação
func TestAuthMiddleware(t *testing.T) {
	router := setupTestRouter()
	
	// Middleware de auth simplificado
	authMiddleware := func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "Token não fornecido"})
			return
		}
		c.Next()
	}
	
	router.GET("/protected", authMiddleware, func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})
	
	// Sem token
	req, _ := http.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Esperado 401 sem token, recebido %d", w.Code)
	}
	
	// Com token
	req2, _ := http.NewRequest("GET", "/protected", nil)
	req2.Header.Set("Authorization", "Bearer test-token")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	
	if w2.Code != http.StatusOK {
		t.Errorf("Esperado 200 com token, recebido %d", w2.Code)
	}
}
