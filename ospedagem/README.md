# 🏛️ Sovereign Cloud Engine (SCE)

> **Sua infraestrutura, suas regras.** Uma plataforma PaaS privada para deploy ilimitado de aplicações.

## O que é?

O SCE é um **Railway/Vercel self-hosted** que permite:
- Deploy de apps Frontend e Backend via Git
- Subdomínios automáticos (app1.seudominio.com)
- SSL automático via Let's Encrypt
- Variáveis de ambiente criptografadas (AES-256)
- Logs em tempo real via SSE
- Métricas de CPU/RAM por container

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js 20, Fastify, Prisma |
| Frontend | Next.js 15, Tailwind, Zustand |
| Database | **SQLite** (local-first) |
| Proxy | Traefik v3 |
| Runtime | Docker Engine |

## Quick Start (Desenvolvimento Local)

### Pré-requisitos
- Node.js 20+
- Docker Desktop (opcional, para deploys)
- Git

### 1. Setup inicial

```powershell
cd ospedagem

# Copiar configuração
copy .env.example .env

# Criar pasta de dados
mkdir data

# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

### 2. Acessar

- **Dashboard:** http://localhost:3000
- **API:** http://localhost:3001/api/v1/health
- **Login:** admin@sce.local / admin123456

## Produção (Docker Compose)

```bash
# Subir tudo com SQLite
docker-compose up -d --build
```

Serviços disponíveis:
- `localhost:3000` → Dashboard
- `localhost:3001` → API

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      TRAEFIK                            │
│              (Reverse Proxy + SSL)                      │
├─────────────────────────────────────────────────────────┤
│                         │                               │
│    ┌────────────────────┼────────────────────┐         │
│    │                    │                    │         │
│    ▼                    ▼                    ▼         │
│ ┌──────────┐      ┌──────────┐      ┌──────────┐      │
│ │ Frontend │      │ Backend  │      │   Apps   │      │
│ │ Next.js  │      │ Fastify  │      │ (Docker) │      │
│ └──────────┘      └────┬─────┘      └──────────┘      │
│                        │                               │
│                        ▼                               │
│                  ┌──────────┐                          │
│                  │ Postgres │                          │
│                  └──────────┘                          │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /auth/login | Autenticação |
| GET | /projects | Listar projetos |
| POST | /projects | Criar projeto |
| POST | /projects/:id/deploy | Iniciar deploy |
| GET | /deployments/:id/logs/stream | SSE de logs |
| GET | /infra/stats | Métricas do sistema |

## Integração com Prost-QS

O SCE foi projetado para integrar com o Prost-QS como Identity Provider:

1. Usuários autenticam no Prost-QS
2. Token JWT é validado no SCE
3. Billing de projetos registrado no ledger do Prost-QS

## Licença

Proprietário - Todos os direitos reservados.
