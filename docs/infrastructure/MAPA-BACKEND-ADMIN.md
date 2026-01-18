# MAPA-BACKEND-ADMIN.md - Kernel Soberano

Este documento mapeia o relacionamento entre os módulos do **Backend (Go)** e as interfaces do **Admin Panel (frontend-old)**.

## Módulos Core (AdminService)

| Módulo Backend | Endpoint API | Dashboard Admin | Arquivo JS |
| :--- | :--- | :--- | :--- |
| **Admin** | `/admin/dashboard` | Dashboard Overview | `main.js` |
| **Identity** | `/admin/users` | Usuários / Identidades | `identity.js` |
| **Billing** | `/admin/payments` | Billing & Payments | `financial.js` |
| **Subscription**| `/admin/subscriptions`| Subscriptions | `financial.js` |
| **Ledger** | `/admin/ledger` | Ledger / Economia | `main.js` |
| **Payouts** | `/admin/payouts` | Payouts | `financial.js` |
| **Jobs** | `/admin/jobs` | Background Jobs | `main.js` |
| **Kill Switch** | `/admin/kill-switch` | Crisis / Governance | `governance.js` |

## Módulos Cognitivos (Fase 26)

| Módulo Backend | Endpoint API | Dashboard Admin | Arquivo JS |
| :--- | :--- | :--- | :--- |
| **Cognitive** | `/admin/cognitive/dashboard` | Dashboard Cognitivo | `cognitive.js` |
| **Narrator** | `/admin/cognitive/narrate` | Narrador Gemini | `cognitive.js` |
| **Agents** | `/admin/cognitive/agents` | Agentes Cognitivos | `cognitive.js` |
| **Decisions** | `/admin/cognitive/decisions`| Decisões Humanas | `cognitive.js` |

## Novos Módulos (Fase 29)

| Módulo Backend | Endpoint API | Dashboard Admin | Arquivo JS |
| :--- | :--- | :--- | :--- |
| **Ads** | `/ads` | Ads Manager | `ads.js` |
| **Webhooks** | `/webhooks` | Webhooks | `webhooks.js` |
| **Events** | `/activity` | Events / Activity | `activity.js` [NOVO] |
| **API Keys** | `/apikeys` | API Keys | `apikeys.js` |
| **Explainability**| `/timeline` | Timeline / Divergence | `explainability.js` [NOVO] |
| **Usage** | `/usage` | Resource Usage | `usage.js` [NOVO] |

## Outros Serviços

- **Health Checks**: `/health` (Sistema e Serviços) -> `main.js` (System Health)
- **Commands**: `/commands` (System Console) -> `main.js` [PENDENTE]
- **Federation**: `/federation` (Status de links) -> `main.js` / `identity.js`
