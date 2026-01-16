# 📋 Resumo Executivo - Deploy Oracle Cloud

> O que você precisa saber para colocar o PROST-QS no ar

**Data:** 15 de Janeiro de 2026  
**Tempo estimado:** 30-45 minutos  
**Custo:** R$ 0 (Always Free Tier)

---

## 🎯 O QUE VAMOS FAZER

Migrar o backend PROST-QS do Render (tier gratuito com limitações) para Oracle Cloud (VM dedicada, sempre ativa).

---

## ✅ VANTAGENS DA ORACLE CLOUD

| Aspecto | Render (Atual) | Oracle Cloud (Novo) |
|---------|----------------|---------------------|
| **Custo** | Grátis (com spin down) | Grátis (Always Free) |
| **Uptime** | Spin down após inatividade | 24/7 sempre ativo |
| **Performance** | Compartilhado | VM dedicada |
| **Controle** | Limitado | Total (root access) |
| **RAM** | 512 MB | 1 GB (Always Free) |
| **Storage** | Efêmero | 50 GB persistente |
| **IP** | Compartilhado | Dedicado |

---

## 📦 O QUE VOCÊ JÁ TEM

- ✅ Código do backend em Go funcionando
- ✅ Banco de dados no Supabase/Neon
- ✅ Domínio prostqs.com.br no Cloudflare
- ✅ Google OAuth configurado
- ✅ Frontend no Vercel

---

## 🚀 O QUE PRECISA FAZER

### 1. Criar Instância Oracle (5 min)
- Shape: VM.Standard.E2.1.Micro (Always Free)
- OS: Ubuntu 22.04
- Região: Brazil East (São Paulo)
- Baixar chave SSH

### 2. Configurar Servidor (10 min)
- Conectar via SSH
- Executar script `oracle-setup.sh`
- Instala: Go, Nginx, Certbot, etc.

### 3. Deploy da Aplicação (10 min)
- Clonar repositório
- Configurar `.env`
- Buildar aplicação
- Configurar systemd service

### 4. Configurar Nginx + SSL (10 min)
- Configurar reverse proxy
- Apontar DNS
- Obter certificado Let's Encrypt

### 5. Testar (5 min)
- Health check
- Endpoints da API
- CORS
- Google OAuth

---

## 📁 ARQUIVOS CRIADOS PARA VOCÊ

| Arquivo | Descrição |
|---------|-----------|
| `docs/DEPLOY-ORACLE-CLOUD.md` | Guia completo passo a passo |
| `docs/QUICK-START-ORACLE.md` | Guia rápido (30 min) |
| `docs/CHECKLIST-ORACLE-DEPLOY.md` | Lista de verificação |
| `docs/COMANDOS-ORACLE.md` | Comandos úteis |
| `scripts/oracle-setup.sh` | Script de configuração inicial |
| `scripts/oracle-deploy.sh` | Script de deploy automático |
| `scripts/prostqs.service` | Arquivo systemd service |

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### Variáveis de Ambiente (.env):
```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu-secret-min-32-chars
PORT=8080
GIN_MODE=release
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://api.prostqs.com.br/auth/google/callback
ALLOWED_ORIGINS=https://prostqs.com.br
```

### DNS (Cloudflare):
- **Type:** A
- **Name:** api
- **IPv4:** IP_DA_VM_ORACLE
- **Proxy:** DNS only (cinza)

### Firewall Oracle Cloud:
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 22 (SSH)

---

## 🎯 RESULTADO FINAL

Após o deploy:

```
┌─────────────────────────────────────────┐
│         ARQUITETURA FINAL               │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (Vercel)                      │
│  https://prostqs.com.br                 │
│         │                               │
│         ▼                               │
│  Backend (Oracle Cloud)                 │
│  https://api.prostqs.com.br             │
│         │                               │
│         ▼                               │
│  Database (Supabase/Neon)               │
│  PostgreSQL                             │
│                                         │
└─────────────────────────────────────────┘
```

**URLs:**
- Frontend: https://prostqs.com.br
- Backend: https://api.prostqs.com.br
- Health: https://api.prostqs.com.br/health

---

## 💰 CUSTO MENSAL

| Serviço | Custo |
|---------|-------|
| Oracle Cloud VM | R$ 0 (Always Free) |
| Supabase/Neon | R$ 0 (tier gratuito) |
| Vercel | R$ 0 (tier gratuito) |
| Cloudflare | R$ 0 (tier gratuito) |
| Domínio | R$ 3,33/mês |
| **TOTAL** | **R$ 3,33/mês** |

---

## 🚦 PRÓXIMOS PASSOS

### Imediato (hoje):
1. Criar instância Oracle Cloud
2. Executar `oracle-setup.sh`
3. Fazer deploy da aplicação
4. Configurar DNS e SSL
5. Testar tudo

### Curto prazo (esta semana):
1. Configurar monitoramento (Uptime Robot)
2. Configurar backup automático
3. Documentar credenciais
4. Testar rollback

### Médio prazo (próximas semanas):
1. Configurar CI/CD (GitHub Actions)
2. Configurar alertas
3. Otimizar performance
4. Adicionar mais apps

---

## 📚 DOCUMENTAÇÃO

### Para começar:
1. Leia: `docs/QUICK-START-ORACLE.md`
2. Siga: `docs/CHECKLIST-ORACLE-DEPLOY.md`
3. Consulte: `docs/COMANDOS-ORACLE.md`

### Para detalhes:
- `docs/DEPLOY-ORACLE-CLOUD.md` - Guia completo

---

## 🆘 SUPORTE

### Se algo der errado:

1. **Verificar logs:**
   ```bash
   sudo journalctl -u prostqs -f
   ```

2. **Verificar status:**
   ```bash
   sudo systemctl status prostqs
   ```

3. **Testar manualmente:**
   ```bash
   cd ~/apps/uno0826/backend
   ./prostqs-api
   ```

4. **Consultar:**
   - `docs/COMANDOS-ORACLE.md` - Comandos úteis
   - `docs/DEPLOY-ORACLE-CLOUD.md` - Troubleshooting

---

## ✅ CHECKLIST RÁPIDO

- [ ] Instância Oracle criada
- [ ] SSH funcionando
- [ ] Script setup executado
- [ ] Código clonado
- [ ] .env configurado
- [ ] Build funcionando
- [ ] Service rodando
- [ ] Nginx configurado
- [ ] DNS apontando
- [ ] SSL configurado
- [ ] API respondendo
- [ ] Frontend conectado

---

## 🎉 QUANDO ESTIVER PRONTO

Você terá:
- ✅ Backend rodando 24/7
- ✅ HTTPS configurado
- ✅ Performance melhor
- ✅ Controle total
- ✅ Custo zero (exceto domínio)

---

*Boa sorte com o deploy! 🚀*

*Última atualização: 15/01/2026*
