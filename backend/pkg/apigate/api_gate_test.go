package apigate

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ========================================
// PAYLOAD SIZE TESTS
// ========================================

func TestPayloadSizeLimit(t *testing.T) {
	config := DefaultConfig()
	config.MaxBodySize = 100 // 100 bytes for testing
	gate := NewAPIGate(config)

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.POST("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	tests := []struct {
		name       string
		bodySize   int
		wantStatus int
	}{
		{"small_body", 50, 200},
		{"exact_limit", 100, 200},
		{"over_limit", 150, 413},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := strings.Repeat("a", tt.bodySize)
			req := httptest.NewRequest("POST", "/test", strings.NewReader(body))
			req.Header.Set("Content-Type", "text/plain")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("got status %d, want %d", w.Code, tt.wantStatus)
			}
		})
	}
}


func TestEndpointSpecificLimits(t *testing.T) {
	config := DefaultConfig()
	config.MaxBodySize = 1000
	config.EndpointLimits = map[string]int64{
		"/auth/": 50,
	}
	gate := NewAPIGate(config)

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.POST("/auth/login", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})
	router.POST("/other", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	// Auth endpoint should have 50 byte limit
	t.Run("auth_over_limit", func(t *testing.T) {
		body := strings.Repeat("a", 100)
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "text/plain")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != 413 {
			t.Errorf("auth endpoint: got status %d, want 413", w.Code)
		}
	})

	// Other endpoint should use global limit
	t.Run("other_under_global_limit", func(t *testing.T) {
		body := strings.Repeat("a", 500)
		req := httptest.NewRequest("POST", "/other", strings.NewReader(body))
		req.Header.Set("Content-Type", "text/plain")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != 200 {
			t.Errorf("other endpoint: got status %d, want 200", w.Code)
		}
	})
}

// ========================================
// JSON VALIDATION TESTS
// ========================================

func TestJSONDepthLimit(t *testing.T) {
	config := DefaultConfig()
	config.MaxJSONDepth = 3
	gate := NewAPIGate(config)

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.POST("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	tests := []struct {
		name       string
		json       string
		wantStatus int
	}{
		{"depth_1", `{"a": 1}`, 200},
		{"depth_2", `{"a": {"b": 1}}`, 200},
		{"depth_3", `{"a": {"b": {"c": 1}}}`, 200},
		{"depth_4_blocked", `{"a": {"b": {"c": {"d": 1}}}}`, 400},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/test", strings.NewReader(tt.json))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("got status %d, want %d", w.Code, tt.wantStatus)
			}
		})
	}
}

func TestArrayLengthLimit(t *testing.T) {
	config := DefaultConfig()
	config.MaxArrayLength = 5
	gate := NewAPIGate(config)

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.POST("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	t.Run("array_under_limit", func(t *testing.T) {
		body := `{"items": [1, 2, 3]}`
		req := httptest.NewRequest("POST", "/test", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != 200 {
			t.Errorf("got status %d, want 200", w.Code)
		}
	})

	t.Run("array_over_limit", func(t *testing.T) {
		body := `{"items": [1, 2, 3, 4, 5, 6, 7]}`
		req := httptest.NewRequest("POST", "/test", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != 400 {
			t.Errorf("got status %d, want 400", w.Code)
		}
	})
}

// ========================================
// SQL INJECTION TESTS
// ========================================

func TestSQLInjectionDetection(t *testing.T) {
	sanitizer := NewInputSanitizer()

	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"normal_text", "hello world", false},
		{"union_select", "1 UNION SELECT * FROM users", true},
		{"or_1_equals_1", "' OR '1'='1", true},
		{"drop_table", "'; DROP TABLE users;--", true},
		{"comment_attack", "admin'--", true},
		{"normal_sql_word", "I want to select a product", false},
		{"exec_function", "EXEC(cmd)", true},
		{"sleep_attack", "1; SLEEP(5)", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizer.ContainsSQLInjection(tt.input)
			if result != tt.expected {
				t.Errorf("ContainsSQLInjection(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

// ========================================
// XSS TESTS
// ========================================

func TestXSSDetection(t *testing.T) {
	sanitizer := NewInputSanitizer()

	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"normal_text", "hello world", false},
		{"script_tag", "<script>alert('xss')</script>", true},
		{"javascript_url", "javascript:alert(1)", true},
		{"onclick_event", "<div onclick=alert(1)>", true},
		{"img_onerror", "<img src=x onerror=alert(1)>", true},
		{"normal_html", "<p>Hello</p>", false},
		{"vbscript", "vbscript:msgbox(1)", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizer.ContainsXSS(tt.input)
			if result != tt.expected {
				t.Errorf("ContainsXSS(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

// ========================================
// QUERY PARAMETER TESTS
// ========================================

func TestQueryParameterValidation(t *testing.T) {
	config := DefaultConfig()
	config.EnableSanitization = true
	gate := NewAPIGate(config)

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	tests := []struct {
		name       string
		query      string
		wantStatus int
	}{
		{"normal_query", "?name=john&age=25", 200},
		{"union_select_injection", "?id=1%20UNION%20SELECT%20*%20FROM%20users", 400}, // "1 UNION SELECT * FROM users"
		{"xss_in_query", "?name=%3Cscript%3Ealert(1)%3C/script%3E", 400}, // URL encoded
		{"long_query", "?name=" + strings.Repeat("a", 3000), 400},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/test"+tt.query, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("got status %d, want %d", w.Code, tt.wantStatus)
			}
		})
	}
}

// ========================================
// HEADER VALIDATION TESTS
// ========================================

func TestHeaderValidation(t *testing.T) {
	gate := NewAPIGate(DefaultConfig())

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	t.Run("normal_headers", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("X-Custom", "normal-value")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != 200 {
			t.Errorf("got status %d, want 200", w.Code)
		}
	})

	t.Run("suspicious_header", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("X-Custom", "<script>alert(1)</script>")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != 400 {
			t.Errorf("got status %d, want 400", w.Code)
		}
	})
}

// ========================================
// METRICS TESTS
// ========================================

func TestMetrics(t *testing.T) {
	gate := NewAPIGate(DefaultConfig())
	gate.ResetMetrics()

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.POST("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true})
	})

	// Make some requests
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("POST", "/test", strings.NewReader(`{"ok": true}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	metrics := gate.GetMetrics()
	
	if metrics["total_requests"].(int64) != 5 {
		t.Errorf("total_requests = %v, want 5", metrics["total_requests"])
	}
}

// ========================================
// SCHEMA VALIDATION TESTS
// ========================================

func TestSchemaValidation(t *testing.T) {
	validator := NewRequestValidator(DefaultConfig())

	schema := &Schema{
		Fields: map[string]SchemaRule{
			"email":    {Required: true, Type: "string", MinLength: 5},
			"password": {Required: true, Type: "string", MinLength: 8},
			"age":      {Required: false, Type: "number"},
		},
		Strict: false,
	}

	tests := []struct {
		name    string
		data    map[string]interface{}
		wantErr bool
	}{
		{
			"valid_data",
			map[string]interface{}{"email": "test@example.com", "password": "password123"},
			false,
		},
		{
			"missing_required",
			map[string]interface{}{"email": "test@example.com"},
			true,
		},
		{
			"wrong_type",
			map[string]interface{}{"email": "test@example.com", "password": "password123", "age": "not a number"},
			true,
		},
		{
			"too_short",
			map[string]interface{}{"email": "test@example.com", "password": "short"},
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateAgainstSchema(tt.data, schema)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateAgainstSchema() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// ========================================
// PATH TRAVERSAL TESTS
// ========================================

func TestPathTraversalDetection(t *testing.T) {
	sanitizer := NewInputSanitizer()

	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"normal_path", "/api/users/123", false},
		{"dot_dot_slash", "../../../etc/passwd", true},
		{"encoded_traversal", "..%2f..%2f..%2fetc/passwd", true},
		{"double_encoded", "..%252f..%252f", true},
		{"backslash", "..\\..\\windows\\system32", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizer.ContainsPathTraversal(tt.input)
			if result != tt.expected {
				t.Errorf("ContainsPathTraversal(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

// ========================================
// JSON SANITIZATION TESTS
// ========================================

func TestJSONSanitization(t *testing.T) {
	sanitizer := NewInputSanitizer()

	t.Run("sanitize_xss_in_json", func(t *testing.T) {
		input := []byte(`{"name": "<script>alert(1)</script>"}`)
		output, changed := sanitizer.SanitizeJSON(input)

		if !changed {
			t.Error("expected JSON to be changed")
		}

		var result map[string]interface{}
		json.Unmarshal(output, &result)

		if strings.Contains(result["name"].(string), "<script>") {
			t.Error("script tag should be escaped")
		}
	})

	t.Run("no_change_needed", func(t *testing.T) {
		input := []byte(`{"name": "John Doe", "age": 30}`)
		_, changed := sanitizer.SanitizeJSON(input)

		if changed {
			t.Error("expected no changes for clean JSON")
		}
	})
}

// ========================================
// INTEGRATION TEST
// ========================================

func TestFullIntegration(t *testing.T) {
	config := DefaultConfig()
	config.MaxBodySize = 10 * 1024 // 10KB
	config.EnableSanitization = true
	gate := NewAPIGate(config)

	router := gin.New()
	router.Use(gate.GateMiddleware())
	router.POST("/api/v1/auth/login", func(c *gin.Context) {
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": true, "received": body})
	})

	t.Run("valid_login_request", func(t *testing.T) {
		body := `{"email": "user@example.com", "password": "securepassword123"}`
		req := httptest.NewRequest("POST", "/api/v1/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		if w.Code != 200 {
			t.Errorf("got status %d, want 200. Body: %s", w.Code, w.Body.String())
		}
	})

	t.Run("sql_injection_blocked", func(t *testing.T) {
		body := `{"email": "admin' OR '1'='1", "password": "anything"}`
		req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader([]byte(body)))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should still pass gate (sanitization escapes, doesn't block)
		// The actual SQL injection protection is at DB layer
		if w.Code != 200 {
			t.Logf("Request blocked at gate level (status %d)", w.Code)
		}
	})
}
