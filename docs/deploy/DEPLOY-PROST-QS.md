# DEPLOY PROST-QS — GUIA DE SOBREVIVÊNCIA

## STATUS: 📋 DOCUMENTAÇÃO (Fase 21)

> "O sistema só existe se sobreviver ao primeiro deploy."

---

## VISÃO GERAL

Este guia cobre o deploy minimalista do PROST-QS:
- **1 servidor** (VPS ou Fly.io)
- **1 banco** (SQLite com WAL)
- **1 binário** (Go compilado)
- **Backup automático**
- **Restart automático**

---

## OPÇÃO 1: FLY.IO (RECOMENDADO PARA COMEÇAR)

### Por que Fly.io?
- Free tier generoso
- Deploy simples
- Volume persistente para SQLite
- HTTPS automático
- Restart automático

### Passo a Passo

#### 1. Instalar Fly CLI
```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux/Mac
curl -L https://fly.io/install.sh | sh
```

#### 2. Login e Criar App
```bash
fly auth login
fly apps create prost-qs-prod
```

#### 3. Criar Volume para SQLite
```bash
fly volumes create prostqs_data --size 1 --region gru
```

#### 4. Criar fly.toml
```toml
app = "prost-qs-prod"
primary_region = "gru"

[build]
  dockerfile = "Dockerfile"

[env]
  GIN_MODE = "release"
  SERVER_PORT = "8080"
  SQLITE_DB_PATH = "/data/prostqs.db"

[mounts]
  source = "prostqs_data"
  destination = "/data"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

  [[services.http_checks]]
    interval = "15s"
    timeout = "2s"
    path = "/health"
```

#### 5. Criar Dockerfile
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .
RUN CGO_ENABLED=1 GOOS=linux go build -o main ./cmd/api

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite

WORKDIR /app
COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]
```

#### 6. Configurar Secrets
```bash
# NUNCA commitar secrets no código!
fly secrets set JWT_SECRET="sua_chave_jwt_muito_forte_32chars"
fly secrets set AES_SECRET_KEY="sua_chave_aes_32_bytes_exatos!!"
fly secrets set SECRETS_MASTER_KEY="outra_chave_32bytes_para_secrets"
```

#### 7. Deploy
```bash
fly deploy
```

#### 8. Verificar
```bash
fly status
fly logs
curl https://prost-qs-prod.fly.dev/health
```

---

## OPÇÃO 2: VPS SIMPLES (DigitalOcean, Hetzner, etc)

### Requisitos Mínimos
- 1 vCPU
- 1GB RAM
- 10GB SSD
- Ubuntu 22.04

### Setup Inicial

#### 1. Criar usuário não-root
```bash
adduser prostqs
usermod -aG sudo prostqs
su - prostqs
```

#### 2. Instalar dependências
```bash
sudo apt update
sudo apt install -y sqlite3 nginx certbot python3-certbot-nginx
```

#### 3. Criar diretórios
```bash
mkdir -p ~/prost-qs/data
mkdir -p ~/prost-qs/backups
mkdir -p ~/prost-qs/logs
```

#### 4. Upload do binário
```bash
# No seu PC, compile:
cd backend
GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -o prost-qs-linux ./cmd/api

# Upload via scp:
scp prost-qs-linux prostqs@seu-servidor:~/prost-qs/
```

#### 5. Criar arquivo .env
```bash
cat > ~/prost-qs/.env << 'EOF'
GIN_MODE=release
SERVER_PORT=8080
SQLITE_DB_PATH=/home/prostqs/prost-qs/data/prostqs.db
JWT_SECRET=sua_chave_jwt_muito_forte_32chars
AES_SECRET_KEY=sua_chave_aes_32_bytes_exatos!!
SECRETS_MASTER_KEY=outra_chave_32bytes_para_secrets
EOF

chmod 600 ~/prost-qs/.env
```

#### 6. Criar systemd service
```bash
sudo cat > /etc/systemd/system/prostqs.service << 'EOF'
[Unit]
Description=PROST-QS Sovereign Kernel
After=network.target

[Service]
Type=simple
User=prostqs
WorkingDirectory=/home/prostqs/prost-qs
EnvironmentFile=/home/prostqs/prost-qs/.env
ExecStart=/home/prostqs/prost-qs/prost-qs-linux
Restart=always
RestartSec=5
StandardOutput=append:/home/prostqs/prost-qs/logs/stdout.log
StandardError=append:/home/prostqs/prost-qs/logs/stderr.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable prostqs
sudo systemctl start prostqs
```

#### 7. Configurar Nginx (reverse proxy)
```bash
sudo cat > /etc/nginx/sites-available/prostqs << 'EOF'
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/prostqs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 8. HTTPS com Let's Encrypt
```bash
sudo certbot --nginx -d seu-dominio.com
```

---

## BACKUP DO SQLITE

### Script de Backup
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/home/prostqs/prost-qs/backups"
DB_PATH="/home/prostqs/prost-qs/data/prostqs.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prostqs_$DATE.db"

# SQLite backup seguro (não corrompe com WAL)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Comprimir
gzip "$BACKUP_FILE"

# Manter apenas últimos 7 dias
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup criado: ${BACKUP_FILE}.gz"
```

### Agendar Backup (cron)
```bash
chmod +x ~/prost-qs/scripts/backup.sh

# Editar crontab
crontab -e

# Adicionar (backup diário às 3h)
0 3 * * * /home/prostqs/prost-qs/scripts/backup.sh >> /home/prostqs/prost-qs/logs/backup.log 2>&1
```

### Backup para Cloud (opcional)
```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Configurar (ex: Google Drive, S3, etc)
rclone config

# Adicionar ao script de backup:
rclone copy "$BACKUP_DIR" remote:prostqs-backups --max-age 7d
```

---

## LOGS E MONITORAMENTO

### Ver Logs em Tempo Real
```bash
# Fly.io
fly logs

# VPS
tail -f ~/prost-qs/logs/stdout.log
journalctl -u prostqs -f
```

### Rotação de Logs (VPS)
```bash
sudo cat > /etc/logrotate.d/prostqs << 'EOF'
/home/prostqs/prost-qs/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 prostqs prostqs
}
EOF
```

### Health Check Externo (opcional)
- [UptimeRobot](https://uptimerobot.com) - Free
- [Healthchecks.io](https://healthchecks.io) - Free
- Configurar para pingar `/health` a cada 5 minutos

---

## RESTART E RECUPERAÇÃO

### Fly.io
```bash
# Restart manual
fly apps restart prost-qs-prod

# Ver status
fly status
```

### VPS
```bash
# Restart manual
sudo systemctl restart prostqs

# Ver status
sudo systemctl status prostqs

# Ver últimos erros
journalctl -u prostqs --since "1 hour ago"
```

### Recuperação de Desastre
1. Provisionar novo servidor
2. Restaurar último backup:
   ```bash
   gunzip prostqs_YYYYMMDD_HHMMSS.db.gz
   cp prostqs_YYYYMMDD_HHMMSS.db /home/prostqs/prost-qs/data/prostqs.db
   ```
3. Reconfigurar .env com mesmas chaves
4. Iniciar serviço

---

## ATUALIZAÇÃO SEM DOWNTIME

### Fly.io
```bash
# Deploy automático faz rolling update
fly deploy
```

### VPS
```bash
# 1. Compilar nova versão
GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -o prost-qs-linux-new ./cmd/api

# 2. Upload
scp prost-qs-linux-new prostqs@servidor:~/prost-qs/

# 3. Trocar binário e restart
ssh prostqs@servidor << 'EOF'
cd ~/prost-qs
mv prost-qs-linux prost-qs-linux-old
mv prost-qs-linux-new prost-qs-linux
sudo systemctl restart prostqs
EOF

# 4. Verificar
curl https://seu-dominio.com/health
```

---

## CHECKLIST PRÉ-DEPLOY

- [ ] Secrets configurados (JWT_SECRET, AES_SECRET_KEY, SECRETS_MASTER_KEY)
- [ ] Todas as chaves têm exatamente 32 bytes
- [ ] Volume/diretório para SQLite criado
- [ ] Backup script configurado
- [ ] Health check respondendo
- [ ] HTTPS configurado
- [ ] Logs acessíveis
- [ ] Restart automático funcionando

---

## CUSTOS ESTIMADOS

| Opção | Custo Mensal |
|-------|--------------|
| Fly.io Free Tier | $0 (até 3 VMs pequenas) |
| Fly.io Hobby | ~$5-10 |
| DigitalOcean Droplet | $6 |
| Hetzner VPS | €4 |
| Oracle Cloud Free | $0 (sempre grátis) |

---

## O QUE NÃO FAZER

❌ Não usar SQLite em disco compartilhado (NFS)  
❌ Não escalar horizontalmente (SQLite é single-writer)  
❌ Não expor porta 8080 diretamente (usar reverse proxy)  
❌ Não commitar .env no git  
❌ Não usar mesma master key em dev e prod  

---

## QUANDO MIGRAR DE SQLITE

Só considere PostgreSQL quando:
- Mais de 10.000 requests/minuto
- Mais de 10GB de dados
- Necessidade de réplicas de leitura
- Multi-região obrigatória

Até lá: SQLite com WAL é suficiente e mais simples.

---

*Fase 21 - Deploy & Sobrevivência - Documentada em 29/12/2024*
