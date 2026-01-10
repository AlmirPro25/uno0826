# 🏛️ Sovereign Cloud Engine (SCE)

> **APP-2 do Ecossistema PROST-QS** — Sua infraestrutura, suas regras.

Uma plataforma PaaS privada para deploy ilimitado de aplicações, totalmente integrada ao PROST-QS para observabilidade e governança.

## O que é?

O SCE é um **Railway/Vercel self-hosted** que permite:
- Deploy de apps Frontend e Backend via Git
- Subdomínios automáticos (app1.seudominio.com)
- SSL automático via Let's Encrypt
- Variáveis de ambiente criptografadas (AES-256)
- Logs em tempo real via SSE
- Métricas de CPU/RAM por container
- **Telemetria completa via PROST-QS**

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

## Integração com PROST-QS

O SCE envia eventos de telemetria para o PROST-QS automaticamente:

### Eventos de Deploy
| Evento | Quando |
|--------|--------|
| `deploy.started` | Deploy iniciado |
| `deploy.building` | Build em progresso |
| `deploy.healthy` | Deploy concluído com sucesso |
| `deploy.failed` | Deploy falhou |

### Eventos de Container
| Evento | Quando |
|--------|--------|
| `container.started` | Container iniciado |
| `container.stopped` | Container parado |
| `container.crashed` | Container crashou |
| `container.metrics` | Métricas de CPU/RAM |

### Eventos de Projeto
| Evento | Quando |
|--------|--------|
| `project.created` | Projeto criado |
| `project.deleted` | Projeto deletado |

### Configuração

1. Criar app "SCE" no admin dashboard do PROST-QS
2. Copiar App ID e API Keys
3. Configurar no `.env`:

```env
PROSTQS_URL=https://uno0826.onrender.com
PROSTQS_APP_ID=seu_app_id
PROSTQS_APP_KEY=pq_pk_xxx
PROSTQS_APP_SECRET=pq_sk_xxx
```

### Regras Sugeridas

No PROST-QS, criar regras para o SCE:

- **Deploy Falhou**: Alerta quando `deploy.failed` acontece
- **Container Crash**: Alerta crítico quando `container.crashed`
- **CPU Alta**: Alerta quando `container.metrics.cpu > 80%`
- **Muitos Deploys**: Alerta quando mais de 10 deploys/hora

## Licença

Proprietário - Todos os direitos reservados.
