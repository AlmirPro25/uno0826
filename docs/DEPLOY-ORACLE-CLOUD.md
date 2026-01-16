# 🚀 Deploy PROST-QS Backend na Oracle Cloud

> Guia completo para configurar o backend Go na VM Oracle Cloud Infrastructure (OCI)

**Data:** 15 de Janeiro de 2026  
**Autor:** Almir Felix  
**Região:** Brasil Leste (São Paulo)

---

## 📋 PRÉ-REQUISITOS

- [ ] Instância Oracle Cloud criada (Always Free ou paga)
- [ ] Chave SSH gerada e baixada
- [ ] IP público da instância anotado
- [ ] Acesso SSH funcionando

---

## 🖥️ ESPECIFICAÇÕES DA INSTÂNCIA

### Recomendado (Always Free):
- **Shape:** VM.Standard.E2.1.Micro
- **CPU:** 1 OCPU (2 vCPUs)
- **RAM:** 1 GB
- **Storage:** 50 GB Boot Volume
- **OS:** Ubuntu 22.04 LTS
- **Região:** Brazil East (São Paulo)

### Ideal (Pago):
- **Shape:** VM.Standard.E4.Flex
- **CPU:** 2 OCPUs
- **RAM:** 8 GB
- **Storage:** 100 GB

---

## 🔐 PASSO 1: CONECTAR NA VM

### Windows (PowerShell):
```powershell
# Ajustar permissões da chave SSH
icacls "C:\caminho\para\sua-chave.key" /inheritance:r
icacls "C:\caminho\para\sua-chave.key" /grant:r "%USERNAME%:R"

# Conectar
ssh -i "C:\caminho\para\sua-chave.key" ubuntu@SEU_IP_PUBLICO
```

### Linux/Mac:
```bash
chmod 400 ~/sua-chave.key
ssh -i ~/sua-chave.key ubuntu@SEU_IP_PUBLICO
```

---

## 🛠️ PASSO 2: CONFIGURAR O SERVIDOR

Execute este script na VM:

```bash
#!/bin/bash
# Script de setup inicial - Oracle Cloud

echo "🚀 Configurando servidor PROST-QS..."

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y \
    git \
    curl \
    wget \
    build-essential \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx

# Instalar Go 1.21
cd /tmp
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz

# Configurar Go no PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
source ~/.bashrc

# Verificar instalação
go version

# Instalar PostgreSQL Client (para conectar no Supabase/Neon)
sudo apt install -y postgresql-client

# Configurar Firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8080/tcp    # Backend (temporário)
sudo ufw --force enable

echo "✅ Servidor configurado!"
```

Salve como `setup.sh` e execute:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 📦 PASSO 3: CLONAR E BUILDAR O PROJETO

```bash
# Criar diretório de trabalho
mkdir -p ~/apps
cd ~/apps

# Clonar repositório (substitua pela sua URL)
git clone https://github.com/SEU_USUARIO/uno0826.git
cd uno0826/backend

# Instalar dependências Go
go mod download

# Buildar aplicação
go build -o prostqs-api cmd/api/main.go

# Verificar build
./prostqs-api --version
```

---

## 🔧 PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

```bash
# Criar arquivo .env
nano ~/apps/uno0826/backend/.env
```

Cole este conteúdo (ajuste os valores):

```env
# Database (Supabase ou Neon)
DATABASE_URL=postgresql://usuario:senha@host.supabase.co:5432/postgres

# JWT
JWT_SECRET=seu-secret-super-seguro-aqui-min-32-chars

# Server
PORT=8080
GIN_MODE=release
ENVIRONMENT=production

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URL=https://api.prostqs.com.br/auth/google/callback

# Stripe (quando configurar)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
ALLOWED_ORIGINS=https://prostqs.com.br,https://www.prostqs.com.br

# Logs
LOG_LEVEL=info
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🔄 PASSO 5: CRIAR SERVIÇO SYSTEMD

Criar arquivo de serviço:

```bash
sudo nano /etc/systemd/system/prostqs.service
```

Cole este conteúdo:

```ini
[Unit]
Description=PROST-QS Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/uno0826/backend
ExecStart=/home/ubuntu/apps/uno0826/backend/prostqs-api
Restart=always
RestartSec=10
StandardOutput=append:/var/log/prostqs/access.log
StandardError=append:/var/log/prostqs/error.log

# Variáveis de ambiente
EnvironmentFile=/home/ubuntu/apps/uno0826/backend/.env

# Limites
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Criar diretório de logs:

```bash
sudo mkdir -p /var/log/prostqs
sudo chown ubuntu:ubuntu /var/log/prostqs
```

Habilitar e iniciar serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable prostqs
sudo systemctl start prostqs
sudo systemctl status prostqs
```

Ver logs:
```bash
sudo journalctl -u prostqs -f
```

---

## 🌐 PASSO 6: CONFIGURAR NGINX COMO REVERSE PROXY

```bash
sudo nano /etc/nginx/sites-available/prostqs
```

Cole este conteúdo:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.prostqs.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.prostqs.com.br;

    # SSL certificates (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/api.prostqs.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.prostqs.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logs
    access_log /var/log/nginx/prostqs-access.log;
    error_log /var/log/nginx/prostqs-error.log;

    # Proxy to Go backend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (sem auth)
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
```

Ativar site:

```bash
sudo ln -s /etc/nginx/sites-available/prostqs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 PASSO 7: CONFIGURAR SSL COM LET'S ENCRYPT

**IMPORTANTE:** Antes de executar, configure o DNS!

### Configurar DNS no Cloudflare:

1. Acesse Cloudflare
2. Adicione registro A:
   - **Type:** A
   - **Name:** api
   - **IPv4 address:** SEU_IP_PUBLICO_ORACLE
   - **Proxy status:** DNS only (nuvem cinza)
   - **TTL:** Auto

3. Aguarde propagação (1-5 minutos)

### Verificar DNS:
```bash
nslookup api.prostqs.com.br
# Deve retornar o IP da sua VM Oracle
```

### Obter certificado SSL:
```bash
sudo certbot --nginx -d api.prostqs.com.br
```

Responda:
- Email: seu@email.com
- Termos: Y
- Newsletter: N
- Redirect HTTP to HTTPS: 2 (Yes)

Renovação automática:
```bash
sudo certbot renew --dry-run
```

---

## 🔥 PASSO 8: CONFIGURAR FIREWALL ORACLE CLOUD

### No Console Oracle Cloud:

1. Acesse: **Networking → Virtual Cloud Networks**
2. Clique na sua VCN
3. Clique em **Security Lists → Default Security List**
4. Clique em **Add Ingress Rules**

Adicione estas regras:

| Source CIDR | Protocol | Port | Description |
|-------------|----------|------|-------------|
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 22 | SSH |

---

## ✅ PASSO 9: TESTAR A API

```bash
# Health check
curl https://api.prostqs.com.br/health

# Deve retornar:
# {"status":"ok","timestamp":"2026-01-15T..."}
```

---

## 🔄 PASSO 10: SCRIPT DE DEPLOY AUTOMÁTICO

Criar script para atualizar código:

```bash
nano ~/deploy.sh
```

Cole:

```bash
#!/bin/bash
# Script de deploy - PROST-QS Oracle Cloud

set -e

echo "🚀 Iniciando deploy..."

# Ir para diretório do projeto
cd ~/apps/uno0826/backend

# Fazer backup do binário atual
if [ -f prostqs-api ]; then
    cp prostqs-api prostqs-api.backup
fi

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Buildar nova versão
echo "🔨 Buildando..."
go build -o prostqs-api cmd/api/main.go

# Reiniciar serviço
echo "🔄 Reiniciando serviço..."
sudo systemctl restart prostqs

# Aguardar 3 segundos
sleep 3

# Verificar status
if sudo systemctl is-active --quiet prostqs; then
    echo "✅ Deploy concluído com sucesso!"
    echo "📊 Status do serviço:"
    sudo systemctl status prostqs --no-pager
else
    echo "❌ Erro no deploy! Revertendo..."
    if [ -f prostqs-api.backup ]; then
        mv prostqs-api.backup prostqs-api
        sudo systemctl restart prostqs
    fi
    exit 1
fi

# Testar API
echo "🧪 Testando API..."
curl -f https://api.prostqs.com.br/health || echo "⚠️  API não respondeu"

echo "🎉 Deploy finalizado!"
```

Tornar executável:
```bash
chmod +x ~/deploy.sh
```

Usar:
```bash
~/deploy.sh
```

---

## 📊 MONITORAMENTO

### Ver logs em tempo real:
```bash
# Logs do serviço
sudo journalctl -u prostqs -f

# Logs do Nginx
sudo tail -f /var/log/nginx/prostqs-access.log
sudo tail -f /var/log/nginx/prostqs-error.log

# Logs da aplicação
tail -f /var/log/prostqs/access.log
tail -f /var/log/prostqs/error.log
```

### Verificar recursos:
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Status do serviço
sudo systemctl status prostqs
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Reiniciar serviço
sudo systemctl restart prostqs

# Parar serviço
sudo systemctl stop prostqs

# Ver logs
sudo journalctl -u prostqs -n 100

# Testar configuração Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar portas abertas
sudo netstat -tulpn | grep LISTEN
```

---

## 🚨 TROUBLESHOOTING

### Serviço não inicia:
```bash
# Ver erro detalhado
sudo journalctl -u prostqs -n 50 --no-pager

# Verificar variáveis de ambiente
sudo systemctl show prostqs | grep Environment

# Testar binário manualmente
cd ~/apps/uno0826/backend
./prostqs-api
```

### Nginx retorna 502 Bad Gateway:
```bash
# Verificar se backend está rodando
sudo systemctl status prostqs

# Verificar se porta 8080 está aberta
sudo netstat -tulpn | grep 8080

# Ver logs do Nginx
sudo tail -f /var/log/nginx/prostqs-error.log
```

### SSL não funciona:
```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Testar SSL
curl -vI https://api.prostqs.com.br
```

---

## 📈 PRÓXIMOS PASSOS

- [ ] Configurar backup automático do banco
- [ ] Configurar monitoramento (Uptime Robot, Grafana)
- [ ] Configurar alertas (email, Slack)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Configurar rate limiting no Nginx
- [ ] Configurar WAF (Web Application Firewall)

---

## 📞 SUPORTE

Se algo der errado:

1. Verificar logs: `sudo journalctl -u prostqs -f`
2. Verificar status: `sudo systemctl status prostqs`
3. Testar manualmente: `cd ~/apps/uno0826/backend && ./prostqs-api`

---

*Documento criado em 15/01/2026*
*Última atualização: 15/01/2026*
