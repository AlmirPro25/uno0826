# 🚀 PROST-QS

**Sovereign Cognitive State Kernel** — Infraestrutura de identidade, billing e governança para apps.

## 🌐 Produção

| Serviço | URL |
|---------|-----|
| Backend API | https://uno0826.onrender.com |
| Frontend Admin | https://uno0826-pr57.vercel.app |

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/AlmirPro25/uno0826.git
cd uno0826

# Local (Docker)
docker-compose up --build

# Acesse
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

## 🏗️ Stack

- **Backend**: Go 1.21 + Gin + SQLite + GORM
- **Frontend**: HTML + Tailwind CSS (CDN)
- **Hosting**: Render (backend) + Vercel (frontend)

## 📁 Estrutura

```
├── backend/           # API Go
│   ├── cmd/api/       # Entry point
│   └── internal/      # Módulos (auth, billing, identity, etc)
├── frontend/          # UI
│   ├── admin/         # Console Soberano
│   └── user-app/      # App do usuário
├── docs/              # Documentação organizada
│   ├── arquitetura/   # Diagramas, threat model
│   ├── billing/       # Stripe, pagamentos
│   ├── deploy/        # Guias de deploy
│   ├── fases/         # Instruções por fase
│   └── guias/         # Manuais e tutoriais
└── scripts/           # Utilitários
```

## 📚 Documentação

| Objetivo | Documento |
|----------|-----------|
| Entender o sistema | [docs/arquitetura/ENTENDIMENTO-TOTAL-PROST-QS.md](docs/arquitetura/ENTENDIMENTO-TOTAL-PROST-QS.md) |
| Deploy em produção | [docs/deploy/DEPLOY-PRODUCAO-RESUMO.md](docs/deploy/DEPLOY-PRODUCAO-RESUMO.md) |
| Configurar Stripe | [docs/billing/DESTRAVAR-STRIPE-AGORA.md](docs/billing/DESTRAVAR-STRIPE-AGORA.md) |
| Criar um app | [docs/guias/QUICK-START-APPS.md](docs/guias/QUICK-START-APPS.md) |
| Visão executiva | [docs/guias/PROST-QS-PARA-CEO.md](docs/guias/PROST-QS-PARA-CEO.md) |

## 🔑 Principais Features

- **Identity Kernel**: Autenticação JWT, OAuth, phone verification
- **Billing Kernel**: Stripe integration, ledger, subscriptions
- **Policy Engine**: Regras de negócio configuráveis
- **Agent Governance**: Autonomia controlada, human-in-the-loop
- **Kill Switch**: Controle de emergência
- **Audit Log**: Rastreabilidade completa

## 🛠️ API Endpoints

```bash
# Health
GET /health

# Auth
POST /api/v1/auth/login
POST /api/v1/auth/register

# Identity
GET /api/v1/identity/me

# Billing
GET /api/v1/billing/account
POST /api/v1/billing/payment-intent

# Admin (requer role admin/super_admin)
GET /api/v1/admin/dashboard
GET /api/v1/admin/users
```

## 📄 License

MIT
