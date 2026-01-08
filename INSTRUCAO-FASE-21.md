# FASE 21 - DEPLOY & SOBREVIVÊNCIA

## STATUS: ✅ DOCUMENTADO

## O QUE É

Guia completo para colocar o PROST-QS em produção de forma minimalista e segura.

---

## PROBLEMA RESOLVIDO

Antes:
- Sistema só roda local
- Sem backup
- Sem restart automático
- Sem HTTPS
- Sem logs persistentes

Depois:
- Deploy em 1 comando (Fly.io) ou VPS
- Backup diário automático
- Restart automático em falha
- HTTPS gratuito
- Logs rotativos

---

## ARQUIVOS CRIADOS

```
meu-projeto-ia/
├── DEPLOY-PROST-QS.md    ← Guia completo
├── Dockerfile            ← Build de produção
├── fly.toml              ← Config Fly.io
└── scripts/
    └── backup.sh         ← Script de backup SQLite
```

---

## OPÇÕES DE DEPLOY

### Fly.io (Recomendado para começar)
- Free tier generoso
- Deploy em 1 comando
- Volume persistente
- HTTPS automático

### VPS (DigitalOcean, Hetzner, etc)
- Mais controle
- Custo fixo baixo (~$5/mês)
- Requer mais setup manual

---

## COMANDOS RÁPIDOS

### Fly.io
```bash
# Instalar CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Criar app e volume
fly apps create prost-qs-prod
fly volumes create prostqs_data --size 1 --region gru

# Configurar secrets
fly secrets set JWT_SECRET="..."
fly secrets set AES_SECRET_KEY="..."
fly secrets set SECRETS_MASTER_KEY="..."

# Deploy
fly deploy

# Verificar
fly status
fly logs
```

### VPS
```bash
# Compilar para Linux
GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -o prost-qs-linux ./cmd/api

# Upload e configurar systemd (ver DEPLOY-PROST-QS.md)
```

---

## BACKUP

Script automático que:
- Usa `.backup` do SQLite (seguro com WAL)
- Comprime com gzip
- Mantém últimos 7 dias
- Pode enviar para cloud (rclone)

```bash
# Executar manualmente
./scripts/backup.sh

# Agendar no cron (diário às 3h)
0 3 * * * /path/to/backup.sh >> /path/to/backup.log 2>&1
```

---

## CHECKLIST PRÉ-DEPLOY

- [ ] Secrets configurados (32 bytes cada)
- [ ] Volume/diretório para SQLite
- [ ] Backup script funcionando
- [ ] Health check respondendo
- [ ] HTTPS configurado
- [ ] Logs acessíveis

---

## CUSTOS

| Opção | Custo/Mês |
|-------|-----------|
| Fly.io Free | $0 |
| Fly.io Hobby | ~$5-10 |
| DigitalOcean | $6 |
| Hetzner | €4 |
| Oracle Free | $0 |

---

## PRÓXIMOS PASSOS

Após deploy funcionando:
1. **Threat Model** - Documentar riscos e mitigações
2. **Monitoramento** - UptimeRobot ou similar
3. (Opcional) IA como assistente observador

---

*Fase 21 - Deploy & Sobrevivência - Documentada em 29/12/2024*
