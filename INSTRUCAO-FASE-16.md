# FASE 16 - Context Propagation (App Context)

## Status: ✅ COMPLETO

## Objetivo
Propagar o contexto de aplicação (`app_id`, `app_user_id`, `session_id`) em todas as operações governadas, permitindo:
- Audit por aplicativo
- Métricas por aplicativo
- Governança multi-tenant real

## Implementação

### 1. Audit Model (audit/model.go)
```go
// Campos adicionados ao AuditEvent
AppID        *uuid.UUID `gorm:"type:uuid;index:idx_audit_app" json:"app_id,omitempty"`
AppUserID    *uuid.UUID `gorm:"type:uuid;index" json:"app_user_id,omitempty"`
SessionID    *uuid.UUID `gorm:"type:uuid" json:"session_id,omitempty"`

// AuditContext para passar contexto
type AuditContext struct {
    AppID     *uuid.UUID
    AppUserID *uuid.UUID
    SessionID *uuid.UUID
    IP        string
    UserAgent string
}
```

### 2. Audit Service (audit/service.go)
- `LogWithAppContext()` - registra evento com contexto de app completo
- `LogAppEvent()` - registra evento simples com app_id
- `GetEventsByApp()` - busca eventos de um app específico
- `GetAppStats()` - retorna estatísticas de audit por app

### 3. Agent Model (agent/model.go)
```go
// Agent agora tem app_id
AppID *uuid.UUID `gorm:"type:text;index:idx_agent_app" json:"app_id,omitempty"`

// AgentDecision agora tem app_id e origin_app
AppID     *uuid.UUID `gorm:"type:text;index:idx_decision_app" json:"app_id,omitempty"`
OriginApp string     `gorm:"type:text" json:"origin_app,omitempty"`
```

### 4. GovernedAgentService (agent/governed_service.go)
- `AgentAppContext` struct para contexto de app
- Todos os métodos governados agora recebem `*AgentAppContext`
- Audit logs incluem app_id automaticamente

### 5. GovernedBillingService (billing/governed_service.go)
- `BillingAppContext` struct para contexto de app
- Todos os métodos governados agora recebem `*BillingAppContext`
- Audit logs incluem app_id automaticamente

### 6. Billing Model (billing/model.go)
```go
// Subscription agora tem app_id
AppID *uuid.UUID `gorm:"type:text;index:idx_sub_app" json:"app_id,omitempty"`
```

### 7. Auth Middleware (middleware/auth.go)
```go
// Novos context keys
ContextAppIDKey     = "appID"
ContextAppUserIDKey = "appUserID"
ContextSessionIDKey = "sessionID"

// Extração de headers
X-App-ID      -> appID
X-App-User-ID -> appUserID
X-Session-ID  -> sessionID
```

### 8. Handlers Atualizados
- `agent/handler.go` - extrai AppContext e passa para serviços governados
- `billing/handler.go` - extrai AppContext e passa para serviços governados

## Endpoints de Audit por App

### GET /api/v1/audit/apps/:appId/events
Retorna eventos de um app específico.

### GET /api/v1/audit/apps/:appId/stats
Retorna estatísticas de audit por app:
```json
{
    "app_id": "b609e73a-bf21-406f-b122-58a3ed21ce9c",
    "total_events": 2,
    "last_event_at": "2025-12-29T00:04:28Z",
    "events_by_type": {
        "AGENT_DECISION_PROPOSED": 1,
        "APPROVAL_REQUEST_AUTO_CREATED": 1
    }
}
```

## Como Usar

### SDK/Cliente deve enviar headers:
```javascript
const headers = {
    'Authorization': 'Bearer <token>',
    'X-App-ID': 'b609e73a-bf21-406f-b122-58a3ed21ce9c',
    'X-App-User-ID': '<app_user_uuid>',  // opcional
    'X-Session-ID': '<session_uuid>'      // opcional
};
```

## Teste Realizado

```powershell
# Propor decisão com X-App-ID
$headers = @{ 
    "Authorization" = "Bearer $token"
    "X-App-ID" = "b609e73a-bf21-406f-b122-58a3ed21ce9c" 
}
POST /api/v1/agents/decisions

# Resultado: Eventos de audit com app_id propagado
{
    "type": "AGENT_DECISION_PROPOSED",
    "app_id": "b609e73a-bf21-406f-b122-58a3ed21ce9c",
    ...
}
```

## Próximos Passos (Fase 17)

Após a Fase 16 completa, o sistema está pronto para:
1. Dashboard por App no Admin Console
2. Métricas de uso por App
3. Billing agregado por App
4. Governança com políticas por App

---

**Data**: 2025-12-29
**Autor**: Kiro (assistido por Tech Lead)
