# Ad Edge Gateway — PROST-QS

> "Motor Econômico de Decisão em Tempo Real"

## 🎯 O Que É

O Ad Edge Gateway não é um clone do Google Ads. É um **Motor Econômico de Decisão** que:

- Decide **quem pode ver** anúncio
- Decide **qual anúncio** mostrar
- Calcula **quanto vale** cada impressão
- Verifica **se pode render** (budget, policy, risk)
- Bloqueia **fraude em tempo real**

Tudo isso **antes do request chegar na aplicação**.

---

## 🏗️ Arquitetura

```
┌────────────────────────────────────────────────────────────┐
│                 AD EDGE GATEWAY                             │
│                                                            │
│  • Edge Decision (Cloudflare Worker / Fastly)              │
│  • Low-latency rules (<10ms)                               │
│  • Identity hint                                           │
│  • Anti-fraud precheck                                     │
└────────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────┐
│                    ADS CORE (KERNEL)                       │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AD INVENTORY │  │ AD DECISION  │  │ AD BILLING   │     │
│  │              │  │              │  │              │     │
│  │ • Campaigns  │  │ • Targeting  │  │ • CPM/CPC   │     │
│  │ • Creatives  │  │ • Policy     │  │ • Usage     │     │
│  │ • Budgets    │  │ • Risk       │  │ • Payout    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ AD GOVERN.   │  │ AD OBSERVER  │                       │
│  │              │  │              │                       │
│  │ • Policies   │  │ • Fraud det. │                       │
│  │ • Approval   │  │ • Metrics    │                       │
│  │ • Audit      │  │ • Alerts     │                       │
│  └──────────────┘  └──────────────┘                       │
└────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes

### 1. Decision Engine (`decision_engine.go`)

Motor central de decisão:

```go
// Fluxo de decisão
1. Validar request
2. Rate limit check
3. Fraud pre-check
4. Get slot
5. Find eligible campaigns
6. Auction / Selection
7. Get creative
8. Create impression
9. Build response
```

### 2. Models

| Model | Descrição |
|-------|-----------|
| `AdSlot` | Onde o anúncio aparece |
| `AdCreative` | Conteúdo do anúncio |
| `AdTargeting` | Regras de quem vê |
| `AdImpression` | Registro de impressão |
| `AdClick` | Registro de clique |

### 3. Integração com Kernel

| Componente | Papel nos Ads |
|------------|---------------|
| `ads` | Core econômico |
| `billing` | CPM / CPC / payout |
| `usage` | Metering de impressões |
| `risk` | Anti-fraud |
| `policy` | Quem pode anunciar |
| `audit` | Compliance |
| `apigate` | Validação estrutural |
| `warobs` | Métricas RED |
| `alerting` | Anomalias |
| `immunity` | Bloquear abuso |

---

## 🔌 API Endpoints

### Decision (Low Latency)
```
POST /api/v1/ads/decide
```

Request:
```json
{
  "slot": "homepage.hero",
  "app_id": "app_123",
  "user_id": "user_456",
  "plan": "free",
  "device_type": "mobile"
}
```

Response:
```json
{
  "request_id": "req_abc123",
  "ad_id": "ad_xyz",
  "campaign_id": "camp_123",
  "format": "native",
  "title": "Produto Incrível",
  "description": "Descrição do produto",
  "content_url": "https://cdn.example.com/ad.jpg",
  "click_url": "https://example.com/produto",
  "cta_text": "Saiba Mais",
  "impression_id": "imp_789",
  "tracking_url": "/ads/track/imp_789",
  "latency_ms": 8
}
```

### Tracking
```
POST /api/v1/ads/track/:impressionId/impression
POST /api/v1/ads/track/:impressionId/click
```

### Slot Management
```
POST /api/v1/ads/slots
GET  /api/v1/ads/slots/:appId
POST /api/v1/ads/slots/:slotId/enable
```

### Creative Management
```
POST /api/v1/ads/creatives
POST /api/v1/ads/creatives/:id/approve
POST /api/v1/ads/creatives/:id/reject
```

### Reporting
```
GET /api/v1/ads/reports/campaign/:campaignId
GET /api/v1/ads/metrics
```

---

## 📱 SDK JavaScript

### Instalação

```html
<script src="https://cdn.prostqs.com/sdk/ads/prost-ads.js"></script>
```

### Uso Básico

```javascript
const ads = new ProstAds({
  appId: 'app_123',
  baseUrl: 'https://api.prostqs.com',
  debug: true
});

// Renderizar anúncio
ads.render({
  slot: 'homepage.hero',
  container: 'ad-container',
  userId: 'user_456',
  plan: 'free'
});
```

### Auto-Init (Data Attributes)

```html
<div data-prost-ads-auto 
     data-prost-app-id="app_123"
     data-prost-base-url="https://api.prostqs.com">
</div>

<div id="hero-ad" data-prost-slot="homepage.hero"></div>
<div id="sidebar-ad" data-prost-slot="sidebar.banner"></div>
```

### Callbacks

```javascript
const ads = new ProstAds({
  appId: 'app_123',
  onImpression: (data) => {
    analytics.track('ad_impression', data);
  },
  onClick: (ad) => {
    analytics.track('ad_click', { adId: ad.ad_id });
  },
  onError: (error) => {
    console.error('Ad error:', error);
  }
});
```

---

## 💰 Modelo Econômico

### CPM (Custo por Mil Impressões)
- Cobrado quando anúncio é exibido
- Verificado via tracking pixel
- Fraud score aplicado

### CPC (Custo por Clique)
- Cobrado quando usuário clica
- Verificado via redirect
- Fraud detection em tempo real

### Fluxo de Cobrança

```
1. Impressão registrada (pending)
2. Tracking pixel confirma (verified)
3. Spend event criado
4. Job processa spend
5. Ledger entry criado
6. Budget atualizado
```

---

## 🛡️ Anti-Fraud

### Fraud Score

```go
score := 0.0

// Bot patterns
if userAgent == "" { score += 0.3 }

// Suspicious IP
if ip == "" || ip == "0.0.0.0" { score += 0.2 }

// Missing device info
if deviceId == "" && userId == "" { score += 0.2 }

// Threshold: 0.7
if score > 0.7 { BLOCK }
```

### Rate Limiting
- 1000 req/min por slot
- Por IP + Device ID
- Exponential backoff

### Verificação de Impressão
- Tracking pixel obrigatório
- Viewability check
- Time-on-page validation

---

## 📊 Métricas

```json
{
  "total_requests": 150000,
  "total_fills": 120000,
  "total_no_fills": 30000,
  "total_fraud": 500,
  "fill_rate": 80.0,
  "avg_latency_ms": 8.5
}
```

### Integração com War Observability

- RED metrics por endpoint
- Pressure indicators
- SLO tracking (latency < 50ms)

---

## 🔧 Configuração

### Criar Slot

```bash
curl -X POST https://api.prostqs.com/api/v1/ads/slots \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "app_id": "app_123",
    "name": "homepage.hero",
    "format": "native",
    "width": 300,
    "height": 250,
    "min_cpm": 100
  }'
```

### Criar Campanha

```bash
# 1. Criar Ad Account
curl -X POST /api/v1/ads/accounts \
  -d '{"name": "Minha Conta", "billing_account_id": "..."}'

# 2. Criar Budget
curl -X POST /api/v1/ads/budgets \
  -d '{"ad_account_id": "...", "amount": 100000, "currency": "BRL", "period": "monthly"}'

# 3. Criar Campaign
curl -X POST /api/v1/ads/campaigns \
  -d '{"ad_account_id": "...", "budget_id": "...", "name": "Campanha 1", "objective": "clicks", "bid_strategy": "lowest_cost"}'

# 4. Criar Creative
curl -X POST /api/v1/ads/creatives \
  -d '{"campaign_id": "...", "name": "Banner 1", "format": "native", "title": "...", "click_url": "..."}'

# 5. Aprovar Creative
curl -X POST /api/v1/ads/creatives/:id/approve

# 6. Ativar Campaign
curl -X POST /api/v1/ads/campaigns/:id/activate
```

---

## 📁 Arquivos

```
backend/internal/ads/
├── model.go              # Models base (Account, Budget, Campaign, Spend)
├── service.go            # Service principal
├── handler.go            # HTTP handlers (CRUD)
├── jobs.go               # Job handlers
├── decision_engine.go    # Motor de decisão
├── decision_handler.go   # HTTP handlers (Decision API)
└── service_test.go       # Testes

sdk/ads/
└── prost-ads.js          # SDK JavaScript
```

---

## ✅ Checklist

- [x] Decision Engine com fraud detection
- [x] Slot management
- [x] Creative management
- [x] Impression tracking
- [x] Click tracking
- [x] CPM/CPC billing
- [x] Rate limiting
- [x] SDK JavaScript
- [x] Reporting
- [x] Métricas
- [ ] Edge Worker (Cloudflare)
- [ ] A/B testing
- [ ] Frequency capping
- [ ] Retargeting

---

## 🔜 Próximos Passos

1. **Edge Worker** — Cloudflare Worker para decisão na borda
2. **Frequency Capping** — Limitar impressões por usuário
3. **A/B Testing** — Testar criativos
4. **Retargeting** — Remarketing baseado em eventos

---

*Documento criado em 11/01/2026*
