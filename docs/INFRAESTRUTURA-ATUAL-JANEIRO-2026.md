# Infraestrutura PROST-QS + SCE — Janeiro 2026

> Documento de referência para continuidade de trabalho por outras IAs ou desenvolvedores.

## Visão Geral

O sistema PROST-QS é composto por dois componentes principais em produção:

1. **Kernel (PROST-QS)** — Backend central de identidade, telemetria e billing
2. **SCE (Sovereign Cloud Engine)** — PaaS self-hosted para deploy de apps

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │   ORACLE CLOUD (Kernel)   │   │   GOOGLE CLOUD (SCE)      │
    │   64.181.175.25           │   │   34.95.249.26            │
    │   api.prostqs.com.br      │   │   sce.prostqs.com.br      │
    └───────────────────────────┘   └───────────────────────────┘
```

---

## 1. Kernel (Oracle Cloud)

### Dados de Acesso

| Item | Valor |
|------|-------|
| **IP** | `64.181.175.25` |
| **SSH** | `ssh -i ~/.ssh/oracle_vm_key ubuntu@64.181.175.25` |
| **Chave SSH** | `C:\Users\almir\.ssh\oracle_vm_key` |
| **API URL** | `https://api.prostqs.com.br` |
| **Dashboard** | `https://prostqs.com.br` |

### Stack

- **Backend**: Go (Gin framework)
- **Database**: PostgreSQL
- **Proxy**: Caddy (SSL automático)
- **Runtime**: Systemd service

### Endpoints Principais

```
GET  /api/v1/health              — Health check
POST /api/v1/identity/register   — Registro de usuário
POST /api/v1/identity/login      — Login
POST /api/v1/apps                — Criar app (requer auth)
POST /api/v1/telemetry/events    — Enviar telemetria
GET  /api/v1/telemetry/events    — Buscar telemetria
```

### Comandos Úteis

```bash
# Conectar
ssh -i ~/.ssh/oracle_vm_key ubuntu@64.181.175.25

# Ver logs
sudo journalctl -u prostqs -f

# Reiniciar serviço
sudo systemctl restart prostqs

# Status
sudo systemctl status prostqs
```

---

## 2. SCE (Google Cloud)

### Dados de Acesso

| Item | Valor |
|------|-------|
| **IP** | `34.95.249.26` |
| **SSH** | `ssh -i ~/.ssh/gcloud_sce_key ubuntu@34.95.249.26` |
| **Chave SSH** | `C:\Users\almir\.ssh\gcloud_sce_key` |
| **Frontend** | `https://sce.prostqs.com.br` |
| **API** | `https://api.sce.prostqs.com.br` |
| **Traefik** | `https://traefik.sce.prostqs.com.br` |
| **Projeto GCP** | `prostqs-kernel` |
| **Região** | `southamerica-east1-a` |
| **Máquina** | `e2-standard-2` (2 vCPU, 8GB RAM, 50GB SSD) |

### Stack

- **Frontend**: Next.js 14 (standalone)
- **Backend**: Node.js + Fastify + Prisma
- **Database**: SQLite (local)
- **Proxy**: Traefik v3 (SSL via Let's Encrypt)
- **Containers**: Docker Compose

### Arquitetura de Containers

```
┌─────────────────────────────────────────────────────────────┐
│                      TRAEFIK (porta 80/443)                 │
│                      Reverse Proxy + SSL                    │
└─────────────────────────────────────────────────────────────┘
                │                           │
    ┌───────────┴───────────┐   ┌───────────┴───────────┐
    │   sce-frontend:3000   │   │   sce-backend:3001    │
    │   Next.js Dashboard   │   │   Fastify API         │
    └───────────────────────┘   └───────────────────────┘
```

### Comandos Úteis

```bash
# Conectar
ssh -i ~/.ssh/gcloud_sce_key ubuntu@34.95.249.26

# Diretório do projeto
cd ~/sce

# Ver status dos containers
sudo docker-compose ps

# Ver logs
sudo docker-compose logs -f
sudo docker-compose logs -f sce-backend
sudo docker-compose logs -f sce-frontend

# Reiniciar tudo
sudo docker-compose down && sudo docker-compose up -d

# Rebuild específico
sudo docker-compose build --no-cache sce-backend
sudo docker-compose up -d sce-backend
```

### Estrutura de Arquivos no Servidor

```
~/sce/
├── docker-compose.yml      # Orquestração
├── traefik.yml             # Config do Traefik
├── .env                    # Variáveis de ambiente
├── letsencrypt/            # Certificados SSL
│   └── acme.json
├── data/                   # Dados persistentes
└── SCE/
    ├── backend/            # Código do backend
    │   ├── Dockerfile
    │   ├── src/
    │   └── prisma/
    └── frontend/           # Código do frontend
        ├── Dockerfile
        └── src/
```

### Variáveis de Ambiente (.env)

```env
SUPER_DOMAIN=sce.prostqs.com.br
ACME_EMAIL=almir@prostqs.com.br
DATABASE_URL=file:./data/sce.db
PROSTQS_URL=https://api.prostqs.com.br
PROSTQS_APP_ID=sce-platform
PROSTQS_APP_KEY=pq_pk_sce_master
PROSTQS_APP_SECRET=pq_sk_sce_master
PROST_QS_JWT_SECRET=sce-jwt-secret-2026
ENCRYPTION_KEY=<gerada>
```

---

## 3. DNS Pendente

Para o SCE funcionar com HTTPS, configurar no provedor de DNS:

| Registro | Tipo | Valor |
|----------|------|-------|
| `sce.prostqs.com.br` | A | `34.95.249.26` |
| `api.sce.prostqs.com.br` | A | `34.95.249.26` |
| `traefik.sce.prostqs.com.br` | A | `34.95.249.26` |

Ou usar wildcard:
| `*.sce.prostqs.com.br` | A | `34.95.249.26` |

Após configurar DNS, o Traefik gera certificados SSL automaticamente.

---

## 4. Integração Kernel ↔ SCE

O SCE se integra ao Kernel para:

1. **Autenticação**: Usuários fazem login via Kernel
2. **Telemetria**: Eventos de deploy são enviados ao Kernel
3. **Multi-tenant**: Cada usuário SCE = 1 App no Kernel

### Fluxo de Autenticação

```
1. Usuário acessa sce.prostqs.com.br
2. Redireciona para prostqs.com.br/login
3. Após login, recebe JWT do Kernel
4. JWT é usado para autenticar no SCE
5. SCE valida JWT com secret compartilhado
```

### Código de Integração

- `UNO-main/apps/SCE/backend/src/lib/kernel-client.ts` — Cliente do Kernel
- `UNO-main/apps/SCE/backend/src/middleware/kernel-auth.middleware.ts` — Auth middleware

---

## 5. Deploy de Atualizações

### Para atualizar o SCE:

```powershell
# 1. Empacotar backend (do Windows)
tar --exclude="node_modules" --exclude="data" -cvf sce-backend.tar -C "UNO-main/apps/SCE" backend

# 2. Enviar para servidor
scp -i "$env:USERPROFILE\.ssh\gcloud_sce_key" sce-backend.tar ubuntu@34.95.249.26:~/sce/

# 3. No servidor: extrair e rebuildar
ssh -i "$env:USERPROFILE\.ssh\gcloud_sce_key" ubuntu@34.95.249.26
cd ~/sce
rm -rf SCE/backend && tar -xf sce-backend.tar && mv backend SCE/
sudo docker-compose build --no-cache sce-backend
sudo docker-compose up -d sce-backend
```

### Para atualizar o frontend:

```powershell
# Mesmo processo, trocando backend por frontend
tar --exclude="node_modules" --exclude=".next" -cvf sce-frontend.tar -C "UNO-main/apps/SCE" frontend
```

---

## 6. Troubleshooting

### Backend não inicia (Prisma)

Se aparecer erro de `libquery_engine`:
1. Verificar `binaryTargets` no `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
   }
   ```
2. Rebuildar imagem

### Certificado SSL não gerado

1. Verificar se DNS está apontando para o IP correto
2. Ver logs do Traefik: `sudo docker-compose logs traefik`
3. Verificar email no `traefik.yml`

### Container unhealthy

Normal se `wget` não estiver instalado. Verificar se serviço responde:
```bash
sudo docker exec sce-backend wget -qO- http://127.0.0.1:3001/api/v1/health
```

---

## 7. Custos

| Serviço | Custo |
|---------|-------|
| Oracle Cloud (Kernel) | **Grátis** (Always Free Tier) |
| Google Cloud (SCE) | ~$50/mês (e2-standard-2) |

---

## 8. Próximos Passos

1. [ ] Configurar DNS para `*.sce.prostqs.com.br`
2. [ ] Testar fluxo completo de login via Kernel
3. [ ] Deploy de app de teste no SCE
4. [ ] Configurar backup automático do SQLite
5. [ ] Monitoramento com alertas

---

*Documento gerado em 16/01/2026*
