# 🧱 FASE 1 — WAF + FRONTEIRA (BORDA ARMADA)

> **Objetivo:** Nada perigoso chega no Go.  
> **Regra:** Se o ataque chega no handler.go, já falhamos.

---

## 📋 CHECKLIST DE CONCLUSÃO

- [ ] Cloudflare configurado como proxy
- [ ] WAF com OWASP Core Ruleset ON
- [ ] Bot Fight Mode ativado
- [ ] Rate Limit Rules configuradas (com Authorization header)
- [ ] **Webhooks IP Allowlist (Stripe)** 🔴 CRÍTICO
- [ ] Headers de segurança validados
- [ ] TLS 1.2+ obrigatório
- [ ] HTTP → HTTPS redirect
- [ ] **Print de ataque bloqueado (Security → Events)** 🔴 CRÍTICO

---

## 1️⃣ CLOUDFLARE SETUP

### 1.1 Adicionar Domínio

1. Acesse https://dash.cloudflare.com
2. Add Site → `seu-dominio.com`
3. Selecione plano (Free funciona para começar)
4. Atualize nameservers no registrador

### 1.2 DNS Records

```
Type    Name    Content                     Proxy
A       @       IP_DO_RENDER               ✅ Proxied
A       api     IP_DO_RENDER               ✅ Proxied
CNAME   www     seu-dominio.com            ✅ Proxied
```

**IMPORTANTE:** Proxy DEVE estar ativado (nuvem laranja) para WAF funcionar.

---

## 2️⃣ WAF CONFIGURATION

### 2.1 Managed Rules (Security → WAF)

Ativar:
- ✅ **Cloudflare Managed Ruleset**
- ✅ **Cloudflare OWASP Core Ruleset**
- ✅ **Cloudflare Exposed Credentials Check**

### 2.2 Custom Rules (criar manualmente)

#### Rule 1: Bloquear SQLi em Query Params
```
(http.request.uri.query contains "UNION" and http.request.uri.query contains "SELECT")
or (http.request.uri.query contains "DROP" and http.request.uri.query contains "TABLE")
or (http.request.uri.query contains "INSERT" and http.request.uri.query contains "INTO")
or http.request.uri.query contains "1=1"
or http.request.uri.query contains "' OR '"
```
**Action:** Block

#### Rule 2: Bloquear Path Traversal
```
http.request.uri.path contains "../"
or http.request.uri.path contains "..%2f"
or http.request.uri.path contains "%2e%2e"
```
**Action:** Block

#### Rule 3: Bloquear Scanners Conhecidos
```
http.user_agent contains "sqlmap"
or http.user_agent contains "nikto"
or http.user_agent contains "nmap"
or http.user_agent contains "masscan"
or http.user_agent contains "zgrab"
```
**Action:** Block

---

## 3️⃣ BOT FIGHT MODE

### Security → Bots

- ✅ **Bot Fight Mode:** ON
- ✅ **Block AI Scrapers:** ON (se disponível)
- ✅ **JavaScript Detections:** ON

---

## 4️⃣ RATE LIMITING

### Security → WAF → Rate Limiting Rules

#### Rule 1: Auth SEM Token (mais agressivo)
```
Expression: (http.request.uri.path contains "/auth/") and not (http.request.headers["authorization"][0] ne "")
Requests: 5 per 1 minute
Per: IP
Action: Block for 10 minutes
```

#### Rule 2: Auth COM Token (menos agressivo)
```
Expression: (http.request.uri.path contains "/auth/") and (http.request.headers["authorization"][0] ne "")
Requests: 20 per 1 minute
Per: IP + Authorization header
Action: Block for 5 minutes
```

#### Rule 3: Billing por Token
```
Expression: (http.request.uri.path contains "/billing/")
Requests: 30 per 1 minute
Per: Authorization header (se presente) ou IP
Action: Block for 5 minutes
```

#### Rule 4: API Autenticada
```
Expression: (http.request.uri.path contains "/api/") and (http.request.headers["authorization"][0] ne "")
Requests: 100 per 1 minute
Per: Authorization header
Action: Challenge
```

#### Rule 5: API Não Autenticada (mais restritivo)
```
Expression: (http.request.uri.path contains "/api/") and not (http.request.headers["authorization"][0] ne "")
Requests: 30 per 1 minute
Per: IP
Action: Block for 5 minutes
```

#### Rule 6: Webhooks (Stripe/Parceiros)
```
Expression: (http.request.uri.path contains "/webhooks/")
Requests: 100 per 1 minute
Per: IP
Action: Block for 5 minutes
```

#### Rule 7: Global Fallback
```
All traffic
Requests: 300 per 1 minute
Per: IP
Action: Challenge
```

> ⚠️ **IMPORTANTE:** Rate limit por IP sozinho NÃO protege contra botnets.
> Rate limit por Authorization header fecha a porta de credential stuffing.

---

## 5️⃣ WEBHOOKS IP ALLOWLIST (CRÍTICO)

### 🎯 Objetivo
Apenas IPs autorizados (Stripe, parceiros) podem acessar `/webhooks/*`.
Todos os outros IPs são bloqueados ANTES de chegar no Go.

### 5.1 IPs Oficiais do Stripe

> **Fonte:** https://docs.stripe.com/ips

```
# Stripe Webhook IPs (atualizar periodicamente)
3.18.12.63
3.130.192.231
13.235.14.237
13.235.122.149
18.211.135.69
35.154.171.200
52.15.183.38
54.88.130.119
54.88.130.237
54.187.174.169
54.187.205.235
54.187.216.72
```

### 5.2 Custom Rule: Webhooks IP Allowlist

**Security → WAF → Custom Rules**

#### Rule: Allow Only Stripe IPs on Webhooks
```
Expression:
(http.request.uri.path contains "/webhooks/") and 
not (ip.src in {3.18.12.63 3.130.192.231 13.235.14.237 13.235.122.149 18.211.135.69 35.154.171.200 52.15.183.38 54.88.130.119 54.88.130.237 54.187.174.169 54.187.205.235 54.187.216.72})

Action: Block
```

**Explicação:**
- Se o path contém `/webhooks/` E o IP NÃO está na lista do Stripe → BLOCK
- Isso garante que apenas Stripe pode chamar seus webhooks

### 5.3 Alternativa: IP Access Rules

**Security → WAF → Tools → IP Access Rules**

Criar allowlist:
```
IP: 3.18.12.63        Action: Allow    Note: Stripe Webhook
IP: 3.130.192.231     Action: Allow    Note: Stripe Webhook
IP: 13.235.14.237     Action: Allow    Note: Stripe Webhook
IP: 13.235.122.149    Action: Allow    Note: Stripe Webhook
IP: 18.211.135.69     Action: Allow    Note: Stripe Webhook
IP: 35.154.171.200    Action: Allow    Note: Stripe Webhook
IP: 52.15.183.38      Action: Allow    Note: Stripe Webhook
IP: 54.88.130.119     Action: Allow    Note: Stripe Webhook
IP: 54.88.130.237     Action: Allow    Note: Stripe Webhook
IP: 54.187.174.169    Action: Allow    Note: Stripe Webhook
IP: 54.187.205.235    Action: Allow    Note: Stripe Webhook
IP: 54.187.216.72     Action: Allow    Note: Stripe Webhook
```

### 5.4 Teste de Validação

```bash
# Deve ser bloqueado (seu IP não é Stripe)
curl -X POST https://seu-dominio.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Esperado:** 403 Forbidden (Cloudflare block)

### 5.5 Manutenção

⚠️ **IMPORTANTE:** IPs do Stripe podem mudar!

1. Verificar periodicamente: https://docs.stripe.com/ips
2. Assinar notificações de mudança de IP (se disponível)
3. Atualizar regra no Cloudflare quando necessário

---

## 6️⃣ SECURITY HEADERS

### Rules → Transform Rules → Modify Response Header

Adicionar headers em TODAS as respostas:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'` |

---

## 7️⃣ TLS HARDENING

### SSL/TLS → Overview

- **SSL/TLS encryption mode:** Full (strict)
- **Always Use HTTPS:** ON
- **Automatic HTTPS Rewrites:** ON

### SSL/TLS → Edge Certificates

- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** ON
- **Automatic HTTPS Rewrites:** ON

### SSL/TLS → Origin Server

- Gerar Origin Certificate se necessário
- Instalar no Render/servidor

---

## 8️⃣ DDOS PROTECTION

### Security → DDoS

- **HTTP DDoS attack protection:** ON (default)
- **Sensitivity:** High
- **Action:** Block

### Security → Settings

- **Security Level:** High
- **Challenge Passage:** 30 minutes
- **Browser Integrity Check:** ON

---

## 9️⃣ PAGE RULES (Fallback)

### Rules → Page Rules

#### Rule 1: Force HTTPS
```
URL: http://*seu-dominio.com/*
Setting: Always Use HTTPS
```

#### Rule 2: Cache API (opcional)
```
URL: *seu-dominio.com/api/*
Settings:
  - Cache Level: Bypass
  - Security Level: High
```

---

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: Headers de Segurança
```bash
curl -I https://seu-dominio.com/api/v1/health
```

**Esperado:** Todos os headers de segurança presentes.

### Teste 2: SQLi Bloqueado
```bash
curl "https://seu-dominio.com/api/v1/users?id=1' OR '1'='1"
```

**Esperado:** 403 Forbidden (Cloudflare block page)

### Teste 3: Rate Limit
```bash
for i in {1..20}; do curl -s -o /dev/null -w "%{http_code}\n" https://seu-dominio.com/api/v1/auth/login; done
```

**Esperado:** Após ~10 requests, começar a receber 429 ou challenge.

### Teste 4: Bot Detection
```bash
curl -A "sqlmap/1.0" https://seu-dominio.com/api/v1/health
```

**Esperado:** 403 Forbidden

### Teste 5: Scanner Online
- https://securityheaders.com/?q=seu-dominio.com
- **Esperado:** Grade A ou A+

---

## 📊 VERIFICAÇÃO FINAL

### Cloudflare Dashboard → Analytics

Verificar:
- [ ] Requests passando pelo proxy
- [ ] WAF events (ataques bloqueados)
- [ ] Rate limiting events
- [ ] Bot score distribution

### Logs de Ataque

Security → Events deve mostrar:
- Blocked requests
- Challenged requests
- Rate limited requests

---

## ⚠️ TROUBLESHOOTING

### Problema: Site não carrega após Cloudflare
1. Verificar se DNS está propagado: `dig seu-dominio.com`
2. Verificar SSL mode: deve ser "Full (strict)"
3. Verificar se origin server aceita conexões do Cloudflare

### Problema: Rate limit muito agressivo
1. Ajustar thresholds gradualmente
2. Adicionar IPs internos à allowlist
3. Usar "Challenge" ao invés de "Block" inicialmente

### Problema: WAF bloqueando requests legítimos
1. Verificar Security → Events
2. Criar exception rule para o caso específico
3. Ajustar sensitivity do ruleset

---

## 🎯 CRITÉRIOS DE SUCESSO

| Critério | Status |
|----------|--------|
| Ataque SQLi bloqueado na borda | ⬜ |
| Brute force rate limited | ⬜ |
| Rate limit considera Authorization header | ⬜ |
| Webhooks protegidos por IP allowlist (Stripe) | ⬜ |
| Headers validados (Grade A+) | ⬜ |
| TLS 1.2+ obrigatório | ⬜ |
| Bot scanners bloqueados | ⬜ |
| Logs de ataque visíveis | ⬜ |
| **EVIDÊNCIA: Print de ataque bloqueado (Security → Events)** | ⬜ |

### 🔴 CRITÉRIOS CRÍTICOS (OBRIGATÓRIOS PARA VERDE)

1. **Rate Limit por Identity** ✅
   - Rules consideram Authorization header, não apenas IP
   - Credential stuffing bloqueado mesmo com botnet

2. **Webhooks IP Allowlist** ⬜
   - Apenas IPs do Stripe acessam `/webhooks/*`
   - Qualquer outro IP → 403 Block

3. **Evidência de Ataque Bloqueado** ⬜
   - Screenshot de Security → Events
   - Mostrando pelo menos 1 ataque real bloqueado

**Quando TODOS os critérios críticos estiverem ✅, FASE 1 está VERDE.**

---

## 📝 PRÓXIMOS PASSOS

Após FASE 1 verde:
1. Documentar configuração final
2. Exportar rules como backup
3. Configurar alertas de ataque
4. Avançar para FASE 2 (API Gate)

---

*Documento criado: 11/01/2026*  
*Responsável: Tech Lead*  
*Status: PENDENTE*
