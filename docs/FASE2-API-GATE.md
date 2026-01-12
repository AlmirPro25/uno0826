# 🛂 FASE 2 — API GATE (PEDÁGIO ARMADO)

> **Objetivo:** Toda requisição passa por validação estrutural ANTES do handler.  
> **Regra:** O Go só processa requisição legítima.

---

## 📋 CHECKLIST DE CONCLUSÃO

- [x] Payload size limits implementados
- [x] Schema validation estrutural
- [x] Cheap fail (rejeição antecipada)
- [x] Input sanitization (SQL injection, XSS)
- [x] Query parameter validation
- [x] Header validation
- [x] Path traversal detection
- [x] Metrics e monitoramento
- [x] Testes automatizados

---

## 1️⃣ ARQUITETURA DO API GATE

```
Request → [API Gate] → Handler → Response
              │
              ├── 1. Payload Size Check (CHEAP)
              ├── 2. JSON Structure Validation
              ├── 3. Input Sanitization
              ├── 4. Header Validation
              └── 5. Query Parameter Validation
```

### Princípio: Cheap Fail

Validações são ordenadas do mais barato ao mais caro:
1. **Content-Length** → Leitura de header (nanosegundos)
2. **JSON Parse** → Parsing básico (microsegundos)
3. **Structure Validation** → Recursão (milisegundos)
4. **Sanitization** → Regex matching (milisegundos)

Se falhar no passo 1, não gasta recursos nos passos 2-4.

---

## 2️⃣ COMPONENTES

### 2.1 api_gate.go — Core

```go
// Configuração padrão
config := apigate.DefaultConfig()
config.MaxBodySize = 1 * 1024 * 1024  // 1MB
config.MaxJSONDepth = 10               // Previne ataques de nesting
config.MaxArrayLength = 1000           // Previne array bombs
config.EnableSanitization = true

// Criar gate
gate := apigate.NewAPIGate(config)

// Usar como middleware
r.Use(gate.GateMiddleware())
```

### 2.2 request_validator.go — Validação Estrutural

Valida:
- Profundidade de JSON (previne stack overflow)
- Tamanho de arrays (previne memory exhaustion)
- Tamanho de strings (previne buffer overflow)
- Número de campos (previne field explosion)
- Caracteres suspeitos em nomes de campos

### 2.3 input_sanitizer.go — Sanitização

Detecta e bloqueia:
- **SQL Injection**: UNION SELECT, OR 1=1, DROP TABLE, etc.
- **XSS**: `<script>`, javascript:, onclick=, etc.
- **Path Traversal**: ../, ..%2f, etc.
- **Command Injection**: ;, |, &&, ``, $(), etc.

---

## 3️⃣ LIMITES POR ENDPOINT

```go
EndpointLimits: map[string]int64{
    "/auth/":     10 * 1024,       // 10KB - login/register
    "/billing/":  50 * 1024,       // 50KB - operações financeiras
    "/webhooks/": 100 * 1024,      // 100KB - webhooks externos
    "/upload/":   10 * 1024 * 1024, // 10MB - uploads
    "/telemetry/": 500 * 1024,     // 500KB - batches de telemetria
}
```

### Por que limites diferentes?

| Endpoint | Limite | Justificativa |
|----------|--------|---------------|
| `/auth/` | 10KB | Login não precisa de payload grande |
| `/billing/` | 50KB | Dados de pagamento são pequenos |
| `/webhooks/` | 100KB | Stripe pode enviar eventos maiores |
| `/upload/` | 10MB | Uploads de arquivos |
| `/telemetry/` | 500KB | Batches de eventos |

---

## 4️⃣ VALIDAÇÃO DE SCHEMA

```go
// Schema para login
schema := &apigate.Schema{
    Fields: map[string]apigate.SchemaRule{
        "email":    {Required: true, Type: "string", MinLength: 5, MaxLength: 255},
        "password": {Required: true, Type: "string", MinLength: 8, MaxLength: 128},
    },
    Strict: false, // Permite campos extras
}

// Validar
err := validator.ValidateAgainstSchema(data, schema)
```

---

## 5️⃣ DETECÇÃO DE ATAQUES

### SQL Injection

```go
// Detectado e bloqueado:
"1 UNION SELECT * FROM users"
"' OR '1'='1"
"'; DROP TABLE users;--"
"admin'--"
"1; SLEEP(5)"
```

### XSS

```go
// Detectado e bloqueado:
"<script>alert('xss')</script>"
"javascript:alert(1)"
"<div onclick=alert(1)>"
"<img src=x onerror=alert(1)>"
```

### Path Traversal

```go
// Detectado e bloqueado:
"../../../etc/passwd"
"..%2f..%2f..%2fetc/passwd"
"..\\..\\windows\\system32"
```

---

## 6️⃣ MÉTRICAS

### Endpoint: GET /api/v1/apigate/metrics

```json
{
    "total_requests": 15000,
    "blocked_requests": 45,
    "sanitized_requests": 120,
    "validation_errors": 30,
    "payload_oversize": 15,
    "block_rate_percent": 0.3
}
```

### Endpoint: GET /api/v1/apigate/status

```json
{
    "status": "healthy",      // healthy | elevated | under_attack
    "block_rate": 0.3,
    "total": 15000,
    "blocked": 45,
    "gate_active": true
}
```

---

## 7️⃣ INTEGRAÇÃO NO MAIN.GO

```go
import "prost-qs/backend/pkg/apigate"

func main() {
    // ... setup ...

    // Criar API Gate
    gateConfig := apigate.DefaultConfig()
    gate := apigate.NewAPIGate(gateConfig)

    // Aplicar como middleware global (ANTES de outros middlewares)
    r.Use(gate.GateMiddleware())

    // Registrar rotas de admin
    gateHandler := apigate.NewHandler(gate)
    gateHandler.RegisterRoutes(v1, middleware.AuthMiddleware(), middleware.AdminOnly())
}
```

---

## 8️⃣ TESTES

### Executar testes

```bash
cd backend
go test ./pkg/apigate/... -v
```

### Cobertura

```bash
go test ./pkg/apigate/... -cover
```

### Testes incluídos

| Teste | Descrição |
|-------|-----------|
| TestPayloadSizeLimit | Verifica limites de tamanho |
| TestEndpointSpecificLimits | Limites por endpoint |
| TestJSONDepthLimit | Profundidade de JSON |
| TestArrayLengthLimit | Tamanho de arrays |
| TestSQLInjectionDetection | Detecção de SQLi |
| TestXSSDetection | Detecção de XSS |
| TestQueryParameterValidation | Validação de query params |
| TestHeaderValidation | Validação de headers |
| TestPathTraversalDetection | Detecção de path traversal |
| TestSchemaValidation | Validação de schema |
| TestFullIntegration | Teste de integração completo |

---

## 9️⃣ RESPOSTA DE BLOQUEIO

Quando uma requisição é bloqueada:

```json
{
    "error": "PAYLOAD_TOO_LARGE",
    "message": "payload size 150 exceeds limit 100",
    "blocked": true,
    "gate": "api_gate",
    "timestamp": "2026-01-11T15:30:00Z"
}
```

### Códigos de erro

| Código | HTTP Status | Descrição |
|--------|-------------|-----------|
| PAYLOAD_TOO_LARGE | 413 | Body excede limite |
| INVALID_BODY | 400 | JSON inválido ou estrutura ruim |
| INVALID_HEADERS | 400 | Headers suspeitos |
| INVALID_QUERY | 400 | Query params inválidos |

---

## 🎯 CRITÉRIOS DE SUCESSO

| Critério | Status |
|----------|--------|
| Payload oversize bloqueado | ✅ |
| JSON depth attack bloqueado | ✅ |
| Array bomb bloqueado | ✅ |
| SQL injection detectado | ✅ |
| XSS detectado | ✅ |
| Path traversal detectado | ✅ |
| Métricas funcionando | ✅ |
| Testes passando | ✅ |

---

## 📝 PRÓXIMOS PASSOS

Após FASE 2 verde:
1. Integrar no main.go
2. Monitorar métricas em produção
3. Ajustar limites conforme uso real
4. Avançar para FASE 3 (Observabilidade de Guerra)

---

*Documento criado: 11/01/2026*  
*Responsável: Tech Lead*  
*Status: IMPLEMENTADO*
