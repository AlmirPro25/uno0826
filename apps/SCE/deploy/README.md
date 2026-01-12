# 🚀 SCE Deploy - VPS Guide

## Pré-requisitos

1. **VPS com Ubuntu 22.04+** (recomendado: Oracle Cloud Free Tier)
2. **Domínio** apontando para o IP da VPS
3. **Credenciais do Kernel** (PROSTQS_APP_ID, etc.)

## Oracle Cloud Free Tier

A Oracle oferece **GRÁTIS para sempre**:
- 4 CPUs ARM (Ampere A1)
- 24GB RAM
- 200GB Storage
- 10TB/mês de tráfego

### Como criar:

1. Acesse: https://cloud.oracle.com/
2. Crie conta (precisa de cartão, mas não cobra)
3. Vá em: Compute → Instances → Create Instance
4. Escolha:
   - Shape: VM.Standard.A1.Flex (ARM)
   - OCPUs: 4
   - Memory: 24GB
   - Image: Ubuntu 22.04
5. Baixe a SSH key
6. Anote o IP público

## Deploy

### 1. Conectar na VPS

```bash
ssh -i sua-chave.key ubuntu@IP_DA_VPS
```

### 2. Setup inicial

```bash
# Baixar script
curl -O https://raw.githubusercontent.com/AlmirPro25/uno0826/main/apps/SCE/deploy/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh

# Logout e login (para grupo docker)
exit
ssh -i sua-chave.key ubuntu@IP_DA_VPS
```

### 3. Configurar DNS

No seu provedor de domínio, adicione:

| Tipo | Nome | Valor |
|------|------|-------|
| A | sce | IP_DA_VPS |
| A | *.sce | IP_DA_VPS |
| A | api.sce | IP_DA_VPS |

Exemplo para `seudominio.com`:
- `sce.seudominio.com` → IP
- `*.sce.seudominio.com` → IP (wildcard para apps)
- `api.sce.seudominio.com` → IP

### 4. Deploy SCE

```bash
# Definir domínio
export SUPER_DOMAIN=sce.seudominio.com

# Baixar e executar deploy
curl -O https://raw.githubusercontent.com/AlmirPro25/uno0826/main/apps/SCE/deploy/deploy-sce.sh
chmod +x deploy-sce.sh
./deploy-sce.sh

# Editar configurações
nano ~/sce/.env

# Executar novamente após editar .env
./deploy-sce.sh
```

### 5. Verificar

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar API
curl https://api.sce.seudominio.com/api/v1/health
```

## Arquitetura

```
Internet
    │
    ▼
┌─────────────────────────────────────────────┐
│              TRAEFIK (443)                  │
│         Reverse Proxy + SSL                 │
├─────────────────────────────────────────────┤
│                    │                        │
│    ┌───────────────┼───────────────┐       │
│    │               │               │       │
│    ▼               ▼               ▼       │
│ sce.domain    api.sce.domain   app1.sce.domain
│    │               │               │       │
│    ▼               ▼               ▼       │
│ Frontend       Backend         User Apps   │
│ (Next.js)      (Node.js)       (Docker)    │
└─────────────────────────────────────────────┘
```

## Comandos Úteis

```bash
# Reiniciar tudo
docker-compose restart

# Ver logs do backend
docker logs -f sce-backend

# Ver containers dos usuários
docker ps --filter "network=sce-network"

# Atualizar código
cd ~/sce/UNO-main && git pull && cd ~/sce && docker-compose up -d --build
```

## Troubleshooting

### SSL não funciona
- Verifique se DNS está propagado: `dig sce.seudominio.com`
- Verifique logs do Traefik: `docker logs traefik`

### Backend não conecta no Docker
- Verifique se o socket está montado: `docker exec sce-backend ls -la /var/run/docker.sock`

### Apps não acessíveis
- Verifique se wildcard DNS está configurado
- Verifique rede: `docker network inspect sce-network`
