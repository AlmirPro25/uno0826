# ⚡ Quick Start - Deploy Oracle Cloud

> Guia rápido para colocar o PROST-QS no ar em 30 minutos

---

## 🎯 OBJETIVO

Colocar o backend PROST-QS rodando em produção na Oracle Cloud com HTTPS.

---

## 📝 ANTES DE COMEÇAR

Você precisa ter:
1. ✅ Instância Oracle Cloud criada
2. ✅ IP público da instância
3. ✅ Chave SSH para acessar
4. ✅ Domínio `api.prostqs.com.br` (ou subdomínio)

---

## 🚀 PASSO A PASSO (30 MIN)

### 1️⃣ Conectar na VM (2 min)

**Windows:**
```powershell
ssh -i "C:\caminho\para\sua-chave.key" ubuntu@SEU_IP_PUBLICO
```

**Linux/Mac:**
```bash
ssh -i ~/sua-chave.key ubuntu@SEU_IP_PUBLICO
```

---

### 2️⃣ Configurar Servidor (5 min)

```bash
# Baixar script de setup
wget https://raw.githubusercontent.com/SEU_USUARIO/uno0826/main/scripts/oracle-setup.sh

# Executar
chmod +x oracle-setup.sh
./oracle-setup.sh
```

Aguarde a instalação de Go, Nginx, etc.

---

### 3️⃣ Clonar Projeto (2 min)

```bash
cd ~/apps
git clone https://github.com/SEU_USUARIO/uno0826.git
cd uno0826/backend
```

---

### 4️⃣ Configurar Variáveis (3 min)

```bash
nano .env
```

Cole (ajuste os valores):
```env
DATABASE_URL=postgresql://usuario:senha@host.supabase.co:5432/postgres
JWT_SECRET=seu-secret-super-seguro-min-32-chars
PORT=8080
GIN_MODE=release
ENVIRONMENT=production
GOOGLE_CLIENT_ID=seu-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-secret
GOOGLE_REDIRECT_URL=https://api.prostqs.com.br/auth/google/callback
ALLOWED_ORIGINS=https://prostqs.com.br
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 5️⃣ Buildar Aplicação (2 min)

```bash
go mod download
go build -o prostqs-api cmd/api/main.go
```

---

### 6️⃣ Configurar Serviço (3 min)

```bash
# Copiar arquivo de serviço
sudo cp ~/apps/uno0826/scripts/prostqs.service /etc/systemd/system/

# Criar diretório de logs
sudo mkdir -p /var/log/prostqs
sudo chown ubuntu:ubuntu /var/log/prostqs

# Habilitar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable prostqs
sudo systemctl start prostqs

# Verificar
sudo systemctl status prostqs
```

---

### 7️⃣ Configurar Nginx (3 min)

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/prostqs
```

Cole:
```nginx
server {
    listen 80;
    server_name api.prostqs.com.br;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/prostqs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 8️⃣ Configurar DNS (2 min)

No Cloudflare:
- **Type:** A
- **Name:** api
- **IPv4:** SEU_IP_PUBLICO_ORACLE
- **Proxy:** DNS only (nuvem cinza)

Aguarde 1-2 minutos para propagar.

---

### 9️⃣ Configurar Firewall Oracle (3 min)

No Console Oracle Cloud:
1. **Networking → Virtual Cloud Networks**
2. Sua VCN → **Security Lists → Default**
3. **Add Ingress Rules**

Adicionar:
- **Source:** 0.0.0.0/0, **Protocol:** TCP, **Port:** 80
- **Source:** 0.0.0.0/0, **Protocol:** TCP, **Port:** 443

---

### 🔟 Configurar SSL (5 min)

```bash
# Verificar DNS
nslookup api.prostqs.com.br
# Deve retornar o IP da sua VM

# Obter certificado
sudo certbot --nginx -d api.prostqs.com.br
```

Responder:
- Email: seu@email.com
- Termos: Y
- Newsletter: N
- Redirect: 2 (Yes)

---

## ✅ TESTAR

```bash
# Health check
curl https://api.prostqs.com.br/health

# Deve retornar:
# {"status":"ok","timestamp":"..."}
```

---

## 🎉 PRONTO!

Sua API está no ar em:
**https://api.prostqs.com.br**

---

## 🔄 ATUALIZAR CÓDIGO

Criar script de deploy:
```bash
nano ~/deploy.sh
```

Cole:
```bash
#!/bin/bash
cd ~/apps/uno0826/backend
git pull origin main
go build -o prostqs-api cmd/api/main.go
sudo systemctl restart prostqs
echo "✅ Deploy concluído!"
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

## 📊 MONITORAR

```bash
# Ver logs em tempo real
sudo journalctl -u prostqs -f

# Status do serviço
sudo systemctl status prostqs

# Recursos do servidor
htop
```

---

## 🚨 PROBLEMAS?

### Serviço não inicia:
```bash
sudo journalctl -u prostqs -n 50
```

### Nginx 502:
```bash
sudo systemctl status prostqs
sudo netstat -tulpn | grep 8080
```

### SSL não funciona:
```bash
sudo certbot certificates
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Ver: `docs/DEPLOY-ORACLE-CLOUD.md`

---

*Tempo estimado: 30 minutos*
*Última atualização: 15/01/2026*
