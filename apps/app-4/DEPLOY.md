# 🚀 Guia de Deploy - MediSync

## Opção 1: Railway (Backend) + Vercel (Frontend) - GRATUITO

### Passo 1: Deploy do Backend no Railway

1. **Crie uma conta no Railway**
   - Acesse: https://railway.app
   - Faça login com GitHub

2. **Crie um novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha o repositório `saude`

3. **Configure o serviço**
   - Railway vai detectar a pasta `backend`
   - Se não detectar, clique em "Add Service" > "GitHub Repo"
   - Selecione a pasta `/backend`

4. **Configure as variáveis de ambiente**
   - Vá em "Variables" e adicione:
   ```
   PORT=8080
   USE_SQLITE=true
   SQLITE_FILE=medisync.db
   JWT_SECRET=gere_uma_string_aleatoria_de_64_caracteres_aqui_muito_segura
   ENCRYPTION_KEY=gere_32_caracteres_exatos
   FRONTEND_URL=https://seu-app.vercel.app
   ```

5. **Gere o domínio público**
   - Vá em "Settings" > "Networking"
   - Clique em "Generate Domain"
   - Anote a URL (ex: `medisync-api.up.railway.app`)

### Passo 2: Deploy do Frontend na Vercel

1. **Crie uma conta na Vercel**
   - Acesse: https://vercel.com
   - Faça login com GitHub

2. **Importe o projeto**
   - Clique em "Add New" > "Project"
   - Selecione o repositório `saude`
   - **Root Directory**: `frontend`

3. **Configure as variáveis de ambiente**
   ```
   NEXT_PUBLIC_API_URL=https://sua-url.up.railway.app
   ```

4. **Deploy!**
   - Clique em "Deploy"
   - Aguarde o build (2-3 minutos)

### Passo 3: Atualize o CORS no Backend

Depois de ter a URL da Vercel, volte no Railway e adicione:
```
FRONTEND_URL=https://seu-app.vercel.app
```

---

## Opção 2: Render (Tudo em um lugar)

### Backend

1. Acesse https://render.com
2. New > Web Service
3. Conecte o GitHub
4. Root Directory: `backend`
5. Build Command: `go build -o main ./cmd/api/main.go`
6. Start Command: `./main`
7. Adicione as variáveis de ambiente

### Frontend

1. New > Static Site
2. Root Directory: `frontend`
3. Build Command: `npm run build`
4. Publish Directory: `.next`

---

## Opção 3: DigitalOcean App Platform

1. Acesse https://cloud.digitalocean.com/apps
2. Create App
3. Conecte o GitHub
4. Configure backend e frontend como componentes separados

---

## 🔐 Gerando Chaves Seguras

### JWT_SECRET (64 caracteres)
```bash
# No terminal:
openssl rand -base64 48
```

### ENCRYPTION_KEY (32 caracteres)
```bash
# No terminal:
openssl rand -base64 24
```

Ou use: https://randomkeygen.com/

---

## 📧 Configurando Email (SendGrid)

1. Crie conta em https://sendgrid.com (grátis até 100 emails/dia)
2. Vá em Settings > API Keys
3. Crie uma API Key
4. Configure no Railway:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USERNAME=apikey
   SMTP_PASSWORD=SG.sua_api_key_aqui
   SMTP_FROM=noreply@seudominio.com
   ```

---

## 💳 Configurando Stripe (Pagamentos)

1. Crie conta em https://stripe.com
2. Vá em Developers > API Keys
3. Copie a Secret Key
4. Configure no Railway:
   ```
   STRIPE_SECRET_KEY=sk_live_xxx
   CONSULT_PRICE_CENTS=15000
   ```

---

## ✅ Checklist de Produção

- [ ] Backend deployado no Railway
- [ ] Frontend deployado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado com URL da Vercel
- [ ] Testou login com usuários de teste
- [ ] Testou agendamento de consulta
- [ ] Testou videochamada
- [ ] Email funcionando (opcional)
- [ ] Stripe funcionando (opcional)

---

## 🐛 Troubleshooting

### "CORS error"
- Verifique se `FRONTEND_URL` está correto no Railway
- A URL deve ser exatamente igual (com https://)

### "Connection refused"
- Verifique se o backend está rodando (Railway logs)
- Verifique se a porta 8080 está exposta

### "Database error"
- Para SQLite, o arquivo é criado automaticamente
- Para PostgreSQL, adicione o addon no Railway

### "Build failed"
- Verifique os logs no Railway/Vercel
- Certifique-se que go.mod e package.json estão corretos

---

## 🎉 Pronto!

Seu MediSync está em produção! 

URLs de exemplo:
- Frontend: `https://medisync.vercel.app`
- Backend: `https://medisync-api.up.railway.app`
- Health Check: `https://medisync-api.up.railway.app/health`

---

## 💰 Custos

| Serviço | Plano Gratuito | Pago |
|---------|----------------|------|
| Railway | 500h/mês | $5/mês |
| Vercel | Ilimitado | $20/mês |
| SendGrid | 100 emails/dia | $15/mês |
| Stripe | 2.9% + R$0.30 por transação | - |

**Total para começar: R$ 0** 🎉
