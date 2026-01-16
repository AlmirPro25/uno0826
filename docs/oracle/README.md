# 📚 Documentação - Deploy Oracle Cloud

> Guias completos para deploy do PROST-QS na Oracle Cloud Infrastructure

---

## 🎯 COMEÇAR AQUI

Se é sua primeira vez fazendo deploy na Oracle Cloud, siga esta ordem:

1. **📋 [RESUMO-DEPLOY-ORACLE.md](../RESUMO-DEPLOY-ORACLE.md)**
   - Visão geral do que será feito
   - Tempo estimado: 30-45 minutos
   - Custos: R$ 3,33/mês

2. **⚡ [QUICK-START-ORACLE.md](../QUICK-START-ORACLE.md)**
   - Guia rápido passo a passo
   - Para quem quer ir direto ao ponto

3. **✅ [CHECKLIST-ORACLE-DEPLOY.md](../CHECKLIST-ORACLE-DEPLOY.md)**
   - Lista de verificação
   - Marque cada item conforme avança

---

## 📖 DOCUMENTAÇÃO COMPLETA

### Guias Principais

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [DEPLOY-ORACLE-CLOUD.md](../DEPLOY-ORACLE-CLOUD.md) | Guia completo e detalhado | Primeira vez ou dúvidas |
| [QUICK-START-ORACLE.md](../QUICK-START-ORACLE.md) | Guia rápido (30 min) | Deploy rápido |
| [CHECKLIST-ORACLE-DEPLOY.md](../CHECKLIST-ORACLE-DEPLOY.md) | Lista de verificação | Durante o deploy |
| [COMANDOS-ORACLE.md](../COMANDOS-ORACLE.md) | Referência de comandos | Dia a dia |
| [CREDENCIAIS-ORACLE.md](../CREDENCIAIS-ORACLE.md) | Template para anotar info | Documentar credenciais |

### Scripts

| Script | Descrição | Como Usar |
|--------|-----------|-----------|
| `scripts/oracle-setup.sh` | Configuração inicial do servidor | `./oracle-setup.sh` |
| `scripts/oracle-deploy.sh` | Deploy automático | `~/deploy.sh` |
| `scripts/prostqs.service` | Arquivo systemd service | Copiar para `/etc/systemd/system/` |

---

## 🚀 FLUXO DE DEPLOY

```
1. Criar Instância Oracle
   └─> Baixar chave SSH
   
2. Conectar via SSH
   └─> ssh -i chave.key ubuntu@IP
   
3. Executar Setup
   └─> ./oracle-setup.sh
   
4. Clonar Projeto
   └─> git clone ...
   
5. Configurar .env
   └─> nano .env
   
6. Buildar Aplicação
   └─> go build -o prostqs-api cmd/api/main.go
   
7. Configurar Systemd
   └─> sudo cp prostqs.service /etc/systemd/system/
   
8. Configurar Nginx
   └─> sudo nano /etc/nginx/sites-available/prostqs
   
9. Configurar DNS
   └─> Cloudflare: A record → IP da VM
   
10. Configurar SSL
    └─> sudo certbot --nginx -d api.prostqs.com.br
    
11. Testar
    └─> curl https://api.prostqs.com.br/health
```

---

## 🔧 COMANDOS MAIS USADOS

```bash
# Ver status do serviço
sudo systemctl status prostqs

# Ver logs em tempo real
sudo journalctl -u prostqs -f

# Reiniciar serviço
sudo systemctl restart prostqs

# Deploy (atualizar código)
~/deploy.sh

# Testar API
curl https://api.prostqs.com.br/health

# Ver uso de recursos
htop
```

---

## 🆘 PROBLEMAS COMUNS

### Serviço não inicia
```bash
sudo journalctl -u prostqs -n 50
```

### Nginx retorna 502
```bash
sudo systemctl status prostqs
sudo netstat -tulpn | grep 8080
```

### SSL não funciona
```bash
sudo certbot certificates
nslookup api.prostqs.com.br
```

Ver mais em: [COMANDOS-ORACLE.md](../COMANDOS-ORACLE.md)

---

## 📊 ARQUITETURA FINAL

```
┌─────────────────────────────────────────┐
│         USUÁRIOS                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Frontend (Vercel)                      │
│  https://prostqs.com.br                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Backend (Oracle Cloud)                 │
│  https://api.prostqs.com.br             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Nginx (Reverse Proxy + SSL)     │   │
│  └──────────┬──────────────────────┘   │
│             │                           │
│             ▼                           │
│  ┌─────────────────────────────────┐   │
│  │ PROST-QS API (Go)               │   │
│  │ Port 8080                       │   │
│  └─────────────────────────────────┘   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Database (Supabase/Neon)               │
│  PostgreSQL                             │
└─────────────────────────────────────────┘
```

---

## 💰 CUSTOS

| Serviço | Tier | Custo |
|---------|------|-------|
| Oracle Cloud VM | Always Free | R$ 0 |
| Supabase/Neon | Free | R$ 0 |
| Vercel | Free | R$ 0 |
| Cloudflare | Free | R$ 0 |
| Domínio | Registro | R$ 3,33/mês |
| **TOTAL** | | **R$ 3,33/mês** |

---

## 📞 SUPORTE

- **Documentação Oracle:** https://docs.oracle.com/en-us/iaas/
- **Suporte Oracle:** https://cloud.oracle.com/support
- **Comunidade:** https://community.oracle.com/

---

## ✅ CHECKLIST RÁPIDO

- [ ] Instância criada
- [ ] SSH funcionando
- [ ] Setup executado
- [ ] Código clonado
- [ ] .env configurado
- [ ] Build OK
- [ ] Service rodando
- [ ] Nginx configurado
- [ ] DNS apontando
- [ ] SSL configurado
- [ ] API respondendo

---

## 🎉 PRÓXIMOS PASSOS

Após o deploy bem-sucedido:

1. Configurar monitoramento (Uptime Robot)
2. Configurar backup automático
3. Configurar CI/CD (GitHub Actions)
4. Otimizar performance
5. Adicionar mais apps

---

*Boa sorte com o deploy! 🚀*

*Última atualização: 15/01/2026*
