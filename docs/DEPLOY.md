# 🚀 PROST-QS - Guia de Deploy

> Documentação prática para deploy e operações. Leia antes de fazer qualquer coisa em produção.

---

## 📍 URLs de Produção

| Serviço | URL | Dashboard |
|---------|-----|-----------|
| **Backend** | https://uno0826.onrender.com | [Render](https://dashboard.render.com) |
| **Frontend** | https://frontend-prost.vercel.app | [Vercel](https://vercel.com/dashboard) |
| **Database** | Neon Postgres | [Neon](https://console.neon.tech) |
| **CI/CD** | GitHub Actions | [Actions](https://github.com/SEU_USER/UNO-main/actions) |

---

## ✅ Como Fazer Deploy

### Opção 1: Script (recomendado)
```powershell
# Windows
.\scripts\deploy.ps1 "descrição da mudança"

# Linux/Mac
./scripts/deploy.sh "descrição da mudança"
```

### Opção 2: Git direto
```bash
git add -A
git commit -m "sua mensagem"
git push origin main
```

**O que acontece automaticamente:**
1. GitHub Actions valida o código
2. Render rebuilda e deploya o backend (~2-3 min)
3. Vercel rebuilda e deploya o frontend (~1 min)

---

## 🔄 Como Fazer Rollback

### Backend (Render)
1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Vá em **Deploys**
3. Clique em **Rollback** no deploy anterior

### Frontend (Vercel)
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Vá em **Deployments**
3. Clique nos 3 pontos → **Promote to Production**

### Código (Git)
```bash
# Ver commits anteriores
git log --oneline -10

# Reverter para commit específico
git revert HEAD
git push origin main
```

---

## ⚠️ O QUE NÃO FAZER

### ❌ NUNCA em Produção:
- Rodar seeds de teste (`seed_ads.go`, `seed_rules.go`)
- Usar endpoints `/debug/*` 
- Resetar banco de dados
- Expor JWT_SECRET ou AES_SECRET_KEY
- Fazer deploy direto sem passar pelo Git

### ❌ NUNCA no Código:
- Commitar `.env` com secrets reais
- Deixar `console.log` com dados sensíveis
- Hardcodar URLs de produção (use env vars)

---

## 🧪 Como Testar Sem Quebrar Prod

### 1. Preview Deployments (Vercel)
Toda PR gera uma URL de preview automática.
```
https://frontend-prost-git-BRANCH-NAME.vercel.app
```

### 2. Ambiente Local
```bash
# Backend
cd backend
go run cmd/api/main.go

# Frontend (aponta pra localhost)
cd frontend
# Edite .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
npm run dev
```

### 3. Branch de Teste
```bash
git checkout -b feature/minha-feature
# faz mudanças
git push origin feature/minha-feature
# abre PR → preview automático
```

---

## 🔒 Checklist de Segurança (Produção)

- [ ] Rotas `/debug/*` protegidas ou removidas
- [ ] Seeds não rodam em prod (verificar ENV)
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] Secrets em variáveis de ambiente (não no código)
- [ ] Logs não expõem dados sensíveis

---

## 📊 Monitoramento

### Logs do Backend
```bash
# Render Dashboard → Logs
# ou via CLI (se configurado)
render logs --service prost-qs
```

### Health Check
```bash
curl https://uno0826.onrender.com/health
```

### Métricas
- Acessar `/api/v1/warobs/metrics` (se habilitado)
- Dashboard de invariantes no frontend

---

## 🆘 Troubleshooting

### Backend não sobe
1. Verificar logs no Render
2. Verificar se DATABASE_URL está correto
3. Verificar se build passou no GitHub Actions

### Frontend não atualiza
1. Verificar se push foi feito
2. Verificar build no Vercel
3. Limpar cache: `vercel --prod --force` (último recurso)

### Erro 401 em tudo
1. Verificar se JWT_SECRET é o mesmo em todos os ambientes
2. Verificar se token não expirou
3. Verificar CORS

### Banco não conecta
1. Verificar DATABASE_URL no Render
2. Verificar se IP está liberado no Neon
3. Verificar SSL mode

---

## 📅 Rotina de Manutenção

### Diário
- Verificar health check
- Olhar logs de erro

### Semanal
- Revisar métricas de uso
- Verificar custos (free tier limits)

### Mensal
- Atualizar dependências
- Revisar secrets (rotacionar se necessário)
- Backup do banco

---

## 🎯 Comandos Úteis

```bash
# Status do sistema
curl https://uno0826.onrender.com/health

# Testar leilão de ads
curl -X POST https://uno0826.onrender.com/api/v1/ads/decide \
  -H 'Content-Type: application/json' \
  -d '{"slot":"banner_top","app_id":"test","plan":"free","country":"BR"}'

# Ver invariantes
curl https://uno0826.onrender.com/api/v1/invariants/status

# Deploy rápido
.\scripts\deploy.ps1 "fix: correção rápida"
```

---

*Última atualização: Janeiro 2026*
