# THREAT MODEL — PROST-QS

> "Quais são as 5 coisas que podem matar esse sistema hoje — e o que já fizemos para não morrer."

**Data:** 29/12/2024  
**Versão:** 1.0  
**Status:** Kernel Congelado

---

## 1. SUPERFÍCIE DE ATAQUE

| Componente | Exposição | Acesso |
|------------|-----------|--------|
| API Pública | Internet | Autenticado (JWT) |
| API Admin | Internet | Admin-only + SuperAdmin |
| Secrets API | Internet | Admin-only (nunca expõe valor) |
| Database | Interno | Apenas via aplicação |
| Infra (Fly.io) | Internet | SSH desabilitado, só deploy |

**Portas expostas:** Apenas 443 (HTTPS via Fly.io)

---

## 2. TOP 5 RISCOS REAIS

### 🔴 RISCO 1: Vazamento de Secrets/Chaves
**Impacto:** Crítico — Compromete todo o sistema  
**Vetor:** .env commitado, logs expondo valores, backup não criptografado

**Mitigação existente:**
- ✅ Secrets criptografados em repouso (AES-256-GCM)
- ✅ API nunca retorna valor completo (só últimos 4 chars)
- ✅ .env no .gitignore
- ✅ Secrets via `fly secrets` (não em código)
- ✅ Audit log de todo acesso a secrets

---

### 🔴 RISCO 2: Execução Administrativa Indevida
**Impacto:** Alto — Ações irreversíveis por atacante  
**Vetor:** Token admin roubado, escalação de privilégio

**Mitigação existente:**
- ✅ Kill Switch com escopo e expiração
- ✅ Approval workflow para ações sensíveis
- ✅ Authority resolution (quem pode aprovar o quê)
- ✅ Audit log completo de todas ações admin
- ✅ Middleware AdminOnly e RequireSuperAdmin separados
- ✅ JWT com expiração curta

---

### 🔴 RISCO 3: Corrupção do SQLite
**Impacto:** Alto — Perda de integridade dos dados  
**Vetor:** Escrita concorrente mal gerenciada, crash durante write

**Mitigação existente:**
- ✅ WAL mode habilitado (Write-Ahead Logging)
- ✅ Single-writer (Go + GORM)
- ✅ Volume persistente dedicado (Fly.io)
- ✅ Backup diário com `.backup` (seguro com WAL)

---

### 🔴 RISCO 4: Perda Total de Dados
**Impacto:** Crítico — Sistema irrecuperável  
**Vetor:** Falha de infra, deleção acidental, ransomware

**Mitigação existente:**
- ✅ Backup automático diário
- ✅ Retenção de 7 dias
- ✅ Script de restore documentado
- ✅ Volume separado do container

**Mitigação pendente:**
- ⏳ Backup offsite (rclone para cloud) — documentado, não implementado

---

### 🔴 RISCO 5: Agente Executando Ação Não Autorizada
**Impacto:** Alto — Violação das invariantes constitucionais  
**Vetor:** Bug no código, bypass de governança

**Mitigação existente:**
- ✅ 6 Invariantes Constitucionais verificadas em código
- ✅ `CanExecute()` obrigatório antes de qualquer ação
- ✅ Policy Engine avalia toda decisão
- ✅ Shadow Mode para testar sem executar
- ✅ Toda decisão tem `expires_at`
- ✅ Conflitos bloqueiam (não resolvem automaticamente)
- ✅ Timeline completa de decisões

---

## 3. MITIGAÇÃO ATUAL (O QUE JÁ EXISTE)

| Controle | Status | Módulo |
|----------|--------|--------|
| Criptografia em repouso | ✅ | Secrets |
| Audit log completo | ✅ | Audit |
| Kill Switch com escopo | ✅ | KillSwitch |
| Approval workflow | ✅ | Approval |
| Authority resolution | ✅ | Authority |
| Policy Engine | ✅ | Policy |
| Risk scoring | ✅ | Risk |
| Shadow mode | ✅ | Shadow |
| Decisões com expiração | ✅ | Memory |
| Backup automático | ✅ | Scripts |
| HTTPS obrigatório | ✅ | Fly.io |
| Rate limiting | ✅ | Middleware |
| JWT com expiração | ✅ | Auth |

---

## 4. RISCOS ACEITOS CONSCIENTEMENTE

| Risco | Justificativa |
|-------|---------------|
| Sem WAF dedicado | Fly.io tem proteção básica. Custo não justifica no estágio atual. |
| Sem MFA | Complexidade vs. benefício. Admin é único usuário inicial. |
| SQLite single-region | Suficiente para < 10k req/min. Migração documentada. |
| Sem IDS/IPS | Audit log cobre detecção. Resposta é manual. |
| Backup apenas local | Offsite documentado, não implementado. Risco aceito. |

---

## 5. O QUE NÃO ESTAMOS PROTEGENDO (EXPLICITAMENTE)

| Ameaça | Por quê não |
|--------|-------------|
| DDoS em larga escala | Fly.io absorve básico. Ataque real = problema de sucesso. |
| Ataques internos sofisticados | Único operador. Não há "interno" ainda. |
| Compliance regulatório (SOC2, ISO) | Não é requisito atual. Documentação existe para futuro. |
| Nation-state attacks | Fora do modelo de ameaça realista. |
| Supply chain attacks | Dependências mínimas. Go é compilado. |

---

## 6. RESPOSTA A INCIDENTES (SIMPLIFICADA)

### Se suspeitar de comprometimento:

1. **Ativar Kill Switch global**
   ```
   POST /api/v1/killswitch
   { "scope": "global", "reason": "Incidente de segurança" }
   ```

2. **Rotacionar secrets**
   ```bash
   fly secrets set JWT_SECRET="nova_chave..."
   fly secrets set AES_SECRET_KEY="nova_chave..."
   ```

3. **Revisar audit log**
   ```
   GET /api/v1/audit?since=2024-12-29T00:00:00Z
   ```

4. **Restaurar backup se necessário**
   ```bash
   ./scripts/restore.sh prostqs_YYYYMMDD.db.gz
   ```

---

## 7. REVISÃO

| Item | Frequência |
|------|------------|
| Revisar este documento | A cada deploy significativo |
| Testar restore de backup | Mensal |
| Rotacionar secrets | Trimestral ou após incidente |
| Revisar audit logs | Semanal |

---

## CONCLUSÃO

O PROST-QS está protegido contra os riscos mais prováveis para seu estágio atual:
- Vazamento de credenciais
- Ações administrativas indevidas
- Perda de dados
- Agentes fora de controle

Os riscos aceitos são documentados e justificados. O sistema pode evoluir sem dívida técnica de segurança oculta.

---

*Threat Model v1.0 — PROST-QS — 29/12/2024*
