# 🚀 Guia de Instalação - MediSync

## 📋 Pré-requisitos

### Desenvolvimento Local
- **Go** 1.21+ ([download](https://golang.org/dl/))
- **Node.js** 18+ ([download](https://nodejs.org/))
- **Git** ([download](https://git-scm.com/))

### Produção
- **Docker** e **Docker Compose** (recomendado)
- **PostgreSQL** 14+ (ou SQLite para testes)
- **Servidor SMTP** para emails (SendGrid, Mailgun, etc.)
- **Certificado SSL** (Let's Encrypt gratuito)

---

## 🖥️ Instalação Local (Desenvolvimento)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/medisync-platform.git
cd medisync-platform
```

### 2. Configurar Backend
```bash
cd backend

# Copiar arquivo de configuração
cp .env.example .env

# Editar variáveis de ambiente
# Windows: notepad .env
# Linux/Mac: nano .env
```

**Variáveis obrigatórias (.env):**
```env
PORT=8080
USE_SQLITE=true
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres
ENCRYPTION_KEY=chave-de-32-caracteres-exatos!!
```

```bash
# Instalar dependências e executar
go mod download
go run cmd/api/main.go
```

O backend estará disponível em: `http://localhost:8080`

### 3. Configurar Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

### 4. Acessar o Sistema
Abra `http://localhost:3000` e use um dos usuários de teste:

| Role | Email | Senha |
|------|-------|-------|
| Admin | admin@medisync.com | password123 |
| Médico | dr.costa@medisync.com | password123 |
| Paciente | joao.silva@email.com | password123 |

---

## 🐳 Instalação com Docker (Recomendado para Produção)

### 1. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env na raiz do projeto
cp .env.example .env
```

**Editar .env:**
```env
# Banco de Dados
DATABASE_URL=postgres://medisync:senha_segura@db:5432/medisync?sslmode=disable
USE_SQLITE=false

# Segurança
JWT_SECRET=sua-chave-jwt-super-secreta-minimo-32-caracteres
ENCRYPTION_KEY=chave-de-32-caracteres-exatos!!

# Email (produção)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=sua-api-key-sendgrid
SMTP_FROM=noreply@seudominio.com

# Pagamentos (opcional)
STRIPE_SECRET_KEY=sk_live_...
CONSULT_PRICE_CENTS=15000
```

### 2. Executar com Docker Compose
```bash
# Build e iniciar todos os serviços
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 3. Verificar Status
```bash
# Health check do backend
curl http://localhost:8080/health

# Resposta esperada:
# {"status":"healthy","database":"connected","timestamp":"..."}
```

---

## ☁️ Deploy em Produção

### Opção 1: Railway (Mais Fácil)

1. Crie uma conta em [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático!

### Opção 2: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

**Backend (Railway):**
1. Crie novo projeto no Railway
2. Adicione PostgreSQL
3. Configure variáveis de ambiente
4. Deploy do backend

### Opção 3: AWS (Escalável)

**Arquitetura recomendada:**
- **EC2** ou **ECS** para backend
- **RDS PostgreSQL** para banco
- **S3** para arquivos
- **CloudFront** para CDN
- **Route 53** para DNS
- **ACM** para SSL

```bash
# Exemplo com AWS CLI
aws ecs create-cluster --cluster-name medisync-cluster
```

### Opção 4: DigitalOcean App Platform

1. Crie conta em [digitalocean.com](https://digitalocean.com)
2. Vá em App Platform > Create App
3. Conecte repositório GitHub
4. Configure:
   - Backend: Go
   - Frontend: Node.js
   - Database: PostgreSQL

---

## 🔒 Configuração de SSL/HTTPS

### Let's Encrypt (Gratuito)

**Com Nginx:**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

**Configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📧 Configuração de Email

### SendGrid (Recomendado)

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Vá em Settings > API Keys > Create API Key
3. Configure no .env:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.sua-api-key-aqui
SMTP_FROM=noreply@seudominio.com
```

### Gmail (Desenvolvimento)

1. Ative "Acesso a apps menos seguros" ou use App Password
2. Configure:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM=seu-email@gmail.com
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@seudominio.mailgun.org
SMTP_PASSWORD=sua-api-key
SMTP_FROM=noreply@seudominio.com
```

---

## 💳 Configuração de Pagamentos (Stripe)

### Modo Teste
```env
STRIPE_SECRET_KEY=sk_test_...
CONSULT_PRICE_CENTS=15000
```

### Modo Produção
```env
STRIPE_SECRET_KEY=sk_live_...
CONSULT_PRICE_CENTS=15000
```

**Configurar Webhook:**
1. Vá em Stripe Dashboard > Developers > Webhooks
2. Adicione endpoint: `https://seudominio.com/api/webhooks/stripe`
3. Selecione eventos: `payment_intent.succeeded`, `payment_intent.failed`

---

## 🗄️ Configuração do Banco de Dados

### SQLite (Desenvolvimento)
```env
USE_SQLITE=true
```

### PostgreSQL (Produção)
```env
USE_SQLITE=false
DATABASE_URL=postgres://usuario:senha@host:5432/medisync?sslmode=require
```

**Criar banco manualmente:**
```sql
CREATE DATABASE medisync;
CREATE USER medisync WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE medisync TO medisync;
```

---

## 🔐 Segurança em Produção

### Checklist de Segurança

- [ ] HTTPS habilitado
- [ ] JWT_SECRET com pelo menos 32 caracteres aleatórios
- [ ] ENCRYPTION_KEY com exatamente 32 caracteres
- [ ] Rate limiting ativo
- [ ] CORS configurado apenas para seu domínio
- [ ] Headers de segurança (CSP, HSTS, etc.)
- [ ] Backup automático do banco
- [ ] Logs de auditoria ativos
- [ ] Firewall configurado

### Gerar Chaves Seguras
```bash
# JWT Secret (64 caracteres)
openssl rand -base64 48

# Encryption Key (32 caracteres)
openssl rand -base64 24 | head -c 32
```

---

## 📊 Monitoramento

### Health Checks
```bash
# Status geral
curl https://seudominio.com/api/health

# Readiness (pronto para requisições)
curl https://seudominio.com/api/health/ready

# Liveness (serviço vivo)
curl https://seudominio.com/api/health/live
```

### Uptime Monitoring
- [UptimeRobot](https://uptimerobot.com) - Gratuito
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

### Error Tracking
- [Sentry](https://sentry.io) - Recomendado
- [Bugsnag](https://bugsnag.com)
- [Rollbar](https://rollbar.com)

---

## 🔄 Backup e Recuperação

### Backup Automático (PostgreSQL)
```bash
# Criar backup
pg_dump -U medisync -h localhost medisync > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U medisync -h localhost medisync < backup_20241215.sql
```

### Backup via API (Admin)
```bash
# Criar backup
curl -X POST https://seudominio.com/api/admin/backups \
  -H "Authorization: Bearer SEU_TOKEN"

# Listar backups
curl https://seudominio.com/api/admin/backups \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## ✅ Verificação Final

Após a instalação, verifique:

1. [ ] Backend respondendo em `/health`
2. [ ] Frontend carregando corretamente
3. [ ] Login funcionando
4. [ ] Emails sendo enviados
5. [ ] WebSocket conectando (chat/videochamada)
6. [ ] SSL/HTTPS ativo
7. [ ] Backup funcionando

---

## 📞 Suporte

- **Documentação**: `/docs`
- **FAQ**: `/faq`
- **Email**: suporte@medisync.com
- **GitHub Issues**: [Reportar problema](https://github.com/seu-usuario/medisync/issues)

---

**MediSync - Telemedicina de qualidade! 🏥**
