# RUNBOOK DE OPERAÇÕES — PROST-QS / UNO.KERNEL

> Procedimentos para situações operacionais comuns.

---

## 🚨 EMERGÊNCIAS

### Sistema Completamente Fora do Ar

**Sintomas:**
- Nenhum endpoint responde
- Health check falha
- Dashboard inacessível

**Ações:**
1. Verificar status do Render: https://status.render.com
2. Verificar logs no Render Dashboard
3. Se necessário, fazer redeploy manual
4. Comunicar usuários via canal de emergência

```bash
# Verificar se backend está respondendo
curl https://uno0826.onrender.com/health

# Se não responder, verificar no Render Dashboard
# Services → uno0826 → Logs
```

---

### Kill Switch — Parar Tudo

**Quando usar:**
- Ataque em andamento
- Bug crítico afetando dados
- Comportamento anômalo de agentes

**Como ativar:**
```bash
# Via API (requer super_admin)
curl -X POST https://uno0826.onrender.com/api/v1/killswitch/activate \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "global",
    "reason": "Motivo da ativação",
    "expires_at": "2026-01-11T15:00:00Z"
  }'
```

**Como desativar:**
```bash
curl -X POST https://uno0826.onrender.com/api/v1/killswitch/deactivate \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "global",
    "reason": "Motivo da desativação"
  }'
```

---

### Banco de Dados Corrompido

**Sintomas:**
- Erros de query
- Dados inconsistentes
- Migrations falhando

**Ações:**
1. Ativar Kill Switch (scope: global)
2. Acessar Neon Dashboard
3. Verificar status do banco
4. Se necessário, restaurar backup
5. Desativar Kill Switch

```bash
# Verificar conexão com banco
curl https://uno0826.onrender.com/ready
```

---

## 🔧 OPERAÇÕES COMUNS

### Promover Usuário a Admin

```bash
# Via script Go
cd backend
go run scripts/promote_admin.go USER_EMAIL
```

Ou via SQL direto:
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@email.com';
```

---

### Criar App Manualmente

```bash
curl -X POST https://uno0826.onrender.com/api/v1/applications \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nome-do-app",
    "description": "Descrição",
    "owner_id": "uuid-do-owner"
  }'
```

---

### Rotacionar API Keys de um App

```bash
curl -X POST https://uno0826.onrender.com/api/v1/applications/APP_ID/rotate-keys \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Verificar Métricas de um App

```bash
# Métricas atuais
curl https://uno0826.onrender.com/api/v1/admin/telemetry/apps/APP_ID/metrics \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Eventos recentes
curl https://uno0826.onrender.com/api/v1/admin/telemetry/apps/APP_ID/live?limit=20 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Limpar Sessões Zumbi

Sessões que não recebem heartbeat há mais de 5 minutos são automaticamente limpas. Para forçar limpeza:

```bash
curl -X POST https://uno0826.onrender.com/api/v1/admin/telemetry/cleanup \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 MONITORAMENTO

### Health Checks

```bash
# Health básico
curl https://uno0826.onrender.com/health
# Esperado: {"status":"ok"}

# Ready check (inclui banco)
curl https://uno0826.onrender.com/ready
# Esperado: {"ready":true,"checks":{"database":"ok","secrets":"ok"}}

# Métricas básicas
curl https://uno0826.onrender.com/metrics/basic
# Esperado: {"uptime_seconds":..., "version":"..."}
```

---

### Verificar Logs

**No Render:**
1. Acessar https://dashboard.render.com
2. Selecionar serviço "uno0826"
3. Ir em "Logs"
4. Filtrar por nível (error, warn, info)

**Padrões de log importantes:**
```
✅ - Serviço inicializado com sucesso
⚠️ - Warning (atenção mas não crítico)
❌ - Erro (requer investigação)
🚨 - Crítico (ação imediata)
```

---

### Verificar Alertas Financeiros

```bash
curl https://uno0826.onrender.com/api/v1/admin/financial/alerts \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

---

## 🔄 DEPLOY

### Deploy Manual (Render)

1. Acessar https://dashboard.render.com
2. Selecionar serviço "uno0826"
3. Clicar "Manual Deploy" → "Deploy latest commit"
4. Aguardar build e health check
5. Verificar logs por erros

---

### Rollback

1. No Render Dashboard, ir em "Events"
2. Encontrar deploy anterior que funcionava
3. Clicar "Rollback to this deploy"
4. Confirmar

---

### Deploy do Frontend (Vercel)

Frontend faz deploy automático em push para main. Para deploy manual:

1. Acessar https://vercel.com/dashboard
2. Selecionar projeto
3. Ir em "Deployments"
4. Clicar "Redeploy" no deploy desejado

---

## 🗄️ BANCO DE DADOS

### Backup Manual (Neon)

1. Acessar https://console.neon.tech
2. Selecionar projeto
3. Ir em "Branches"
4. Criar novo branch (funciona como snapshot)

---

### Executar Migration

Migrations rodam automaticamente no startup. Para forçar:

```bash
# No ambiente local
cd backend
go run cmd/api/main.go
# Migrations executam no início
```

---

### Query Direta (Emergência)

1. Acessar Neon Console
2. Ir em "SQL Editor"
3. Executar query

**⚠️ CUIDADO:** Nunca executar UPDATE/DELETE sem WHERE em produção.

---

## 📧 COMUNICAÇÃO

### Template: Sistema Fora do Ar

```
Assunto: [PROST-QS] Incidente em Andamento

Olá,

Identificamos uma instabilidade no sistema PROST-QS.

Status: Em investigação
Início: [HORÁRIO]
Impacto: [DESCRIÇÃO]

Estamos trabalhando para resolver o mais rápido possível.

Próxima atualização em 30 minutos.

Equipe PROST-QS
```

### Template: Sistema Restaurado

```
Assunto: [PROST-QS] Incidente Resolvido

Olá,

O incidente reportado anteriormente foi resolvido.

Início: [HORÁRIO INÍCIO]
Fim: [HORÁRIO FIM]
Duração: [DURAÇÃO]
Causa: [CAUSA RAIZ]
Ação: [O QUE FOI FEITO]

Pedimos desculpas pelo inconveniente.

Equipe PROST-QS
```

---

## 📋 CHECKLIST PÓS-INCIDENTE

- [ ] Incidente documentado
- [ ] Causa raiz identificada
- [ ] Ação corretiva implementada
- [ ] Usuários comunicados
- [ ] Post-mortem agendado (se necessário)
- [ ] Métricas de impacto coletadas
- [ ] Melhorias identificadas

---

## 📞 CONTATOS

| Função | Contato |
|--------|---------|
| Render Status | https://status.render.com |
| Neon Status | https://neonstatus.com |
| Vercel Status | https://vercel-status.com |
| Stripe Status | https://status.stripe.com |

---

*Documento atualizado em 11/01/2026*
