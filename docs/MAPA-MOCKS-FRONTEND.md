# 🎭 Mapa de Mocks do Frontend

> Documento gerado em 12/01/2026 - Lista todas as páginas que usam dados simulados

## Legenda

| Status | Significado |
|--------|-------------|
| 🔴 **100% MOCK** | Dados sempre simulados, não tenta API |
| 🟡 **FALLBACK** | Tenta API, usa mock se falhar |
| 🟢 **REAL** | Usa apenas dados reais da API |

---

## 📊 Resumo Geral

| Categoria | Total | Real | Fallback | Mock |
|-----------|-------|------|----------|------|
| Dashboard Core | 10 | 6 | 4 | 0 |
| Governança | 12 | 5 | 5 | 2 |
| Admin | 4 | 0 | 4 | 0 |
| Billing | 4 | 3 | 1 | 0 |
| **TOTAL** | **30** | **14** | **14** | **2** |

---

## 🔴 Páginas 100% MOCK (Prioridade Alta)

### 1. `/dashboard/decisions`
**Arquivo:** `src/app/(dashboard)/dashboard/decisions/page.tsx`
**O que mocka:** Lista de decisões do sistema
**Dados mockados:**
```typescript
const mockDecisions: Decision[] = [
  { id: '1', type: 'access_control', outcome: 'allowed', ... },
  { id: '2', type: 'rate_limit', outcome: 'denied', ... },
  ...
]
```
**API esperada:** `GET /decisions`
**Backend existe?** ✅ Sim - `internal/decision/handler.go`

---

### 2. `/dashboard/apps/[id]/users`
**Arquivo:** `src/app/(dashboard)/dashboard/apps/[id]/users/page.tsx`
**O que mocka:** Lista de usuários de um app
**Dados mockados:**
```typescript
const mockUsers: AppUser[] = [
  { id: "1", name: "João Silva", email: "joao@example.com", ... },
  { id: "2", name: "Maria Santos", email: "maria@example.com", ... },
  ...
]
```
**API esperada:** `GET /applications/{id}/users`
**Backend existe?** ✅ Sim - `internal/application/handler.go`

---

## 🟡 Páginas com FALLBACK (Mock se API falhar)

### 3. `/dashboard/financial`
**Arquivo:** `src/app/(dashboard)/dashboard/financial/page.tsx`
**O que mocka:** Métricas SaaS (MRR, ARR, LTV, CAC)
**Fallback:**
```typescript
setSummary({
  total_revenue: 125000, total_costs: 45000, net_profit: 80000,
  mrr: 12500, arr: 150000, growth_rate: 15.5, churn_rate: 2.3, ltv: 2500, cac: 150
});
```
**API chamada:** `GET /financial/summary`
**Backend existe?** ✅ Sim - `internal/financial/handler.go`

---

### 4. `/dashboard/usage`
**Arquivo:** `src/app/(dashboard)/dashboard/usage/page.tsx`
**O que mocka:** Contadores de uso do app
**Fallback:**
```typescript
setUsage({
  deploy_count: 12, api_calls: 45230, events_processed: 12500,
  storage_mb: 256, bandwidth_mb: 1024, active_users: 150
});
```
**API chamada:** `GET /usage/app/{id}`
**Backend existe?** ✅ Sim - `internal/usage/handler.go`

---

### 5. `/dashboard/capabilities`
**Arquivo:** `src/app/(dashboard)/dashboard/capabilities/page.tsx`
**O que mocka:** Plano e limites do app
**Fallback:**
```typescript
setEntitlements({
  plan: "free",
  limits: { api_calls: 10000, events: 5000, storage_mb: 100, ... }
});
setAvailableAddOns([
  { id: "addon-1", name: "Extra API Calls", price: 29.99, ... }
]);
```
**API chamada:** `GET /capabilities/entitlements`, `GET /capabilities/addons`
**Backend existe?** ✅ Sim - `pkg/capabilities/handler.go`

---

### 6. `/dashboard/observer`
**Arquivo:** `src/app/(dashboard)/dashboard/observer/page.tsx`
**O que mocka:** Status do observer
**Fallback:**
```typescript
setStatus({
  enabled: true, mode: "passive", last_check: new Date().toISOString(),
  anomalies_detected: 0, patterns_learned: 42
});
```
**API chamada:** `GET /observer/status`
**Backend existe?** ✅ Sim - `internal/observer/handler.go`

---

### 7. `/dashboard/notifications`
**Arquivo:** `src/app/(dashboard)/dashboard/notifications/page.tsx`
**O que mocka:** Lista de notificações
**Fallback:**
```typescript
setNotifications([
  { id: "1", type: "alert", title: "Novo alerta", message: "...", ... },
  { id: "2", type: "info", title: "Atualização", message: "...", ... }
]);
```
**API chamada:** `GET /notifications`
**Backend existe?** ✅ Sim - `internal/notification/handler.go`

---

### 8. `/dashboard/incidents`
**Arquivo:** `src/app/(dashboard)/dashboard/incidents/page.tsx`
**O que mocka:** Narrativas/incidentes
**Fallback:**
```typescript
setNarratives([
  { id: "inc-1", title: "Pico de latência", severity: "warning", ... },
  { id: "inc-2", title: "Falha de autenticação", severity: "critical", ... }
]);
```
**API chamada:** `GET /narrative/incidents`
**Backend existe?** ✅ Sim - `internal/narrative/handler.go`

---

### 9. `/dashboard/explainability`
**Arquivo:** `src/app/(dashboard)/dashboard/explainability/page.tsx`
**O que mocka:** Decisões explicáveis
**Fallback:**
```typescript
setDecisions([
  { id: "dec-1", decision_type: "upgrade_eligibility", output: "APPROVED", ... },
  { id: "dec-2", decision_type: "risk_assessment", output: "MEDIUM_RISK", ... }
]);
```
**API chamada:** `GET /explainability/decisions`
**Backend existe?** ✅ Sim - `internal/explainability/handler.go`

---

### 10. `/dashboard/autonomy`
**Arquivo:** `src/app/(dashboard)/dashboard/autonomy/page.tsx`
**O que mocka:** Matriz de autonomia
**Fallback:**
```typescript
setMatrix({ profiles: [], actions: [], permissions: {} });
```
**API chamada:** `GET /autonomy/matrix`
**Backend existe?** ✅ Sim - `internal/autonomy/handler.go`

---

### 11. `/dashboard/activity`
**Arquivo:** `src/app/(dashboard)/dashboard/activity/page.tsx`
**O que mocka:** Log de atividades
**Fallback:**
```typescript
setActivities([
  { id: "act-1", action: "login", user: "admin", timestamp: "...", ... },
  { id: "act-2", action: "create_app", user: "dev", timestamp: "...", ... }
]);
```
**API chamada:** `GET /activity`
**Backend existe?** ✅ Sim - `internal/activity/handler.go`

---

### 12. `/dashboard/memory`
**Arquivo:** `src/app/(dashboard)/dashboard/memory/page.tsx`
**O que mocka:** Padrões de memória (parcial)
**Fallback:**
```typescript
setPatterns([
  { id: "p1", name: "Login Pattern", frequency: 0.85, ... },
  { id: "p2", name: "API Usage", frequency: 0.72, ... }
]);
```
**API chamada:** `GET /memory/entries` (dados reais), padrões são mock
**Backend existe?** ✅ Sim - `internal/memory/handler.go`

---

### 13. `/dashboard/admin/reconciliation`
**Arquivo:** `src/app/(dashboard)/dashboard/admin/reconciliation/page.tsx`
**O que mocka:** Resultados de reconciliação
**Fallback:**
```typescript
setResults([
  { id: "rec-1", type: "billing", status: "matched", ... },
  { id: "rec-2", type: "usage", status: "mismatch", ... }
]);
```
**API chamada:** `GET /admin/reconciliation`
**Backend existe?** ⚠️ Parcial

---

### 14. `/dashboard/admin/intelligence`
**Arquivo:** `src/app/(dashboard)/dashboard/admin/intelligence/page.tsx`
**O que mocka:** Pontos de tensão do sistema
**Fallback:**
```typescript
setData({
  tension_points: [
    { area: "billing", level: 0.7, description: "..." },
    { area: "auth", level: 0.3, description: "..." }
  ]
});
```
**API chamada:** `GET /admin/intelligence`
**Backend existe?** ⚠️ Parcial

---

### 15. `/dashboard/apps/[id]`
**Arquivo:** `src/app/(dashboard)/dashboard/apps/[id]/page.tsx`
**O que mocka:** Eventos recentes (parcial)
**Mock fixo:**
```typescript
const [recentEvents] = useState<RecentEvent[]>([
  { id: "1", type: "identity.auth.success", timestamp: Date.now() - 60000, status: "success" },
  { id: "2", type: "identity.auth.failed", timestamp: Date.now() - 120000, status: "error" }
]);
```
**API esperada:** `GET /applications/{id}/events/recent`
**Backend existe?** ✅ Sim - `internal/events/handler.go`

---

## 🟢 Páginas 100% REAL (Sem Mock)

| Página | API |
|--------|-----|
| `/dashboard` | `/health`, `/apps/mine` |
| `/dashboard/apps` | `/apps/mine` |
| `/dashboard/rules` | `/rules` |
| `/dashboard/telemetry` | `/telemetry/metrics` |
| `/dashboard/audit` | `/audit` |
| `/dashboard/secrets` | `/secrets` |
| `/dashboard/webhooks` | `/webhooks` |
| `/dashboard/alerting` | `/alerts` |
| `/dashboard/payments` | `/billing/app/{id}/transactions` |
| `/dashboard/billing` | `/billing/plans`, `/billing/checkout` |
| `/dashboard/events` | `/events` |
| `/dashboard/policies` | `/policies` |
| `/dashboard/risk` | `/risk/scores` |
| `/dashboard/apikeys` | `/apikeys` |

---

## 🎯 Prioridade de Desmock

### Alta (Funcionalidade Core)
1. `/dashboard/decisions` - Decisões são core do sistema
2. `/dashboard/apps/[id]/users` - Gestão de usuários é essencial

### Média (UX/Demonstração)
3. `/dashboard/financial` - Métricas SaaS importantes
4. `/dashboard/usage` - Monitoramento de consumo
5. `/dashboard/apps/[id]` eventos - Visibilidade de eventos

### Baixa (Admin/Interno)
6. `/dashboard/admin/*` - Páginas administrativas
7. `/dashboard/memory` padrões - Feature avançada

---

## 📝 Notas

- **Dev Mode:** O sidebar tem um "Dev Mode" (`?dev=true`) que simula super_admin
- **Notifications Dropdown:** Também tem fallback mock
- **Backend Cold Start:** Render tem cold start, então fallbacks são úteis para UX
