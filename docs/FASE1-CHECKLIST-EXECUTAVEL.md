# ✅ FASE 1 — CHECKLIST EXECUTÁVEL

> **Data:** 11/01/2026  
> **Responsável:** Tech Lead  
> **Objetivo:** Borda armada antes do Go

---

## 🔴 AÇÕES MANUAIS (VOCÊ FAZ NO CLOUDFLARE)

### PASSO 1: Criar conta e adicionar site
- [ ] Acessar https://dash.cloudflare.com
- [ ] Criar conta (se não tiver)
- [ ] Add Site → `prostqs.com` (ou seu domínio)
- [ ] Escolher plano Free
- [ ] Anotar nameservers fornecidos

### PASSO 2: Atualizar DNS no registrador
- [ ] Acessar painel do registrador (GoDaddy, Namecheap, etc)
- [ ] Trocar nameservers para os do Cloudflare
- [ ] Aguardar propagação (até 24h, geralmente minutos)

### PASSO 3: Configurar DNS Records
- [ ] A record: `@` → IP do Render (Proxied ✅)
- [ ] A record: `api` → IP do Render (Proxied ✅)
- [ ] CNAME: `www` → `@` (Proxied ✅)

### PASSO 4: SSL/TLS
- [ ] SSL/TLS → Overview → Full (strict)
- [ ] Edge Certificates → Always Use HTTPS: ON
- [ ] Edge Certificates → Minimum TLS: 1.2
- [ ] Edge Certificates → TLS 1.3: ON

### PASSO 5: WAF Managed Rules
- [ ] Security → WAF → Managed Rules
- [ ] Ativar: Cloudflare Managed Ruleset
- [ ] Ativar: Cloudflare OWASP Core Ruleset

### PASSO 6: Bot Protection
- [ ] Security → Bots → Bot Fight Mode: ON

### PASSO 7: Rate Limiting (criar 6 rules)

**Rule 1: Auth SEM Token (mais agressivo)**
```
Expression: (http.request.uri.path contains "/auth/") and not (http.request.headers["authorization"][0] ne "")
Rate: 5 requests per 1 minute
Per: IP
Action: Block for 10 minutes
```

**Rule 2: Auth COM Token (menos agressivo)**
```
Expression: (http.request.uri.path contains "/auth/") and (http.request.headers["authorization"][0] ne "")
Rate: 20 requests per 1 minute
Per: IP + Authorization header
Action: Block for 5 minutes
```

**Rule 3: Billing por Token**
```
Expression: (http.request.uri.path contains "/billing/")
Rate: 30 requests per 1 minute
Per: Authorization header (se presente) ou IP
Action: Block for 5 minutes
```

**Rule 4: API Autenticada**
```
Expression: (http.request.uri.path contains "/api/") and (http.request.headers["authorization"][0] ne "")
Rate: 100 requests per 1 minute
Per: Authorization header
Action: Challenge
```

**Rule 5: API Não Autenticada (mais restritivo)**
```
Expression: (http.request.uri.path contains "/api/") and not (http.request.headers["authorization"][0] ne "")
Rate: 30 requests per 1 minute
Per: IP
Action: Block for 5 minutes
```

**Rule 6: Global Fallback**
```
Expression: (all traffic)
Rate: 300 requests per 1 minute
Per: IP
Action: Challenge
```

> ⚠️ Rate limit por Authorization header é CRÍTICO para bloquear credential stuffing via botnet.

### PASSO 8: Webhooks IP Allowlist (CRÍTICO)

**Security → WAF → Custom Rules**

**Rule: Block Non-Stripe IPs on Webhooks**
```
Expression:
(http.request.uri.path contains "/webhooks/") and 
not (ip.src in {3.18.12.63 3.130.192.231 13.235.14.237 13.235.122.149 18.211.135.69 35.154.171.200 52.15.183.38 54.88.130.119 54.88.130.237 54.187.174.169 54.187.205.235 54.187.216.72})

Action: Block
```

- [ ] Regra criada
- [ ] Testado: seu IP é bloqueado em `/webhooks/`
- [ ] IPs do Stripe documentados para manutenção futura

> 📌 Fonte dos IPs: https://docs.stripe.com/ips

### PASSO 9: Custom WAF Rules (criar 3 rules)

**Rule 1: Block SQLi**
```
Expression: 
(http.request.uri.query contains "UNION SELECT") or
(http.request.uri.query contains "' OR '") or
(http.request.uri.query contains "1=1") or
(http.request.uri.query contains "DROP TABLE")

Action: Block
```

**Rule 2: Block Path Traversal**
```
Expression:
(http.request.uri.path contains "../") or
(http.request.uri.path contains "..%2f")

Action: Block
```

**Rule 3: Block Scanners**
```
Expression:
(http.user_agent contains "sqlmap") or
(http.user_agent contains "nikto") or
(http.user_agent contains "nmap")

Action: Block
```

### PASSO 10: Security Headers (Transform Rules)
- [ ] Rules → Transform Rules → Modify Response Header
- [ ] Create rule: "Security Headers"
- [ ] Add headers (ver lista no doc principal)

### PASSO 11: DDoS Settings
- [ ] Security → Settings → Security Level: High
- [ ] Security → Settings → Challenge Passage: 30 minutes
- [ ] Security → Settings → Browser Integrity Check: ON

---

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: Site acessível via HTTPS
```bash
curl -I https://seu-dominio.com
```
- [ ] Status 200
- [ ] Headers de segurança presentes

### Teste 2: HTTP redireciona para HTTPS
```bash
curl -I http://seu-dominio.com
```
- [ ] Status 301/302 redirect para HTTPS

### Teste 3: SQLi bloqueado
```bash
curl "https://seu-dominio.com/api/v1/test?id=1' OR '1'='1"
```
- [ ] Status 403 (Cloudflare block)

### Teste 4: Scanner bloqueado
```bash
curl -A "sqlmap/1.0" https://seu-dominio.com/api/v1/health
```
- [ ] Status 403

### Teste 5: Rate limit funciona
```bash
for i in {1..15}; do 
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://seu-dominio.com/api/v1/auth/login
done
```
- [ ] Após ~10 requests: 429 ou challenge

### Teste 6: Webhook IP Allowlist (CRÍTICO)
```bash
# Deve ser bloqueado (seu IP não é Stripe)
curl -X POST https://seu-dominio.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```
- [ ] Status 403 (Cloudflare block)

### Teste 7: Security Headers Scanner
- [ ] Acessar: https://securityheaders.com
- [ ] Testar seu domínio
- [ ] Grade esperada: A ou A+

---

## 📊 EVIDÊNCIAS A COLETAR

Após configurar, tirar screenshots de:

1. [ ] Cloudflare DNS (mostrando proxy ativo)
2. [ ] SSL/TLS settings
3. [ ] WAF Managed Rules (ativas)
4. [ ] Rate Limiting Rules (6 rules com Authorization header)
5. [ ] Webhooks IP Allowlist Rule (Custom WAF)
6. [ ] Custom WAF Rules (SQLi, Path Traversal, Scanners)
7. [ ] **Security → Events mostrando ataque bloqueado** ⚠️ CRÍTICO
8. [ ] securityheaders.com resultado (Grade A+)

---

## ✅ CRITÉRIOS DE CONCLUSÃO

| Critério | Verificação | Status |
|----------|-------------|--------|
| DNS via Cloudflare | dig mostra CF IPs | ⬜ |
| HTTPS obrigatório | HTTP redireciona | ⬜ |
| TLS 1.2+ | SSL Labs test | ⬜ |
| WAF ativo | SQLi bloqueado | ⬜ |
| Rate limit por Identity | Auth header considerado | ⬜ |
| Webhooks IP Allowlist | Apenas Stripe acessa | ⬜ |
| Bot protection | Scanner bloqueado | ⬜ |
| Headers | Grade A+ | ⬜ |

### 🔴 3 CRITÉRIOS CRÍTICOS (OBRIGATÓRIOS)

| # | Critério | Como Verificar | Status |
|---|----------|----------------|--------|
| 1 | Rate Limit por Identity | Rules usam Authorization header, não só IP | ⬜ |
| 2 | Webhooks IP Allowlist | Seu IP bloqueado em `/webhooks/`, Stripe passa | ⬜ |
| 3 | Evidência de Ataque | Screenshot de Security → Events com bloqueio real | ⬜ |

**Quando os 3 CRÍTICOS estiverem ✅ → FASE 1 VERDE**

---

## ⏭️ PRÓXIMO PASSO

Após FASE 1 verde, reportar:
1. Screenshots das configurações
2. Resultado do securityheaders.com (Grade A+)
3. **Screenshot de Security → Events com ataque bloqueado** ⚠️

### 🔴 FASE 1 SÓ ESTÁ VERDE QUANDO:
- [ ] Rate limit considera Authorization header (não só IP)
- [ ] Webhooks protegidos por IP allowlist do Stripe
- [ ] Print de ataque real bloqueado no Cloudflare

Então liberamos **FASE 2 — API Gate (cheap fail interno)**.

---

*Tempo estimado: 1-2 horas*  
*Dificuldade: Média (config manual)*
