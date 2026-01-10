# TESTE MANUAL — Fluxo de Identity Multi-App
**Data:** 10 de Janeiro de 2026  
**Objetivo:** Validar modelo mental, não código

---

## ⚠️ PRÉ-REQUISITO: DEPLOY NECESSÁRIO

**Status:** As rotas de Multi-App Identity (`/identity/register`, `/identity/login`, `/identity/link-app`, `/identity/me`) ainda **NÃO estão em produção**.

### Verificação realizada em 10/01/2026:
- ✅ `/api/v1/health` — Funcionando
- ✅ `/api/v1/auth/login` — Funcionando (legacy)
- ✅ `/api/v1/identity/implicit-login` — Funcionando (Fase 29)
- ❌ `/api/v1/identity/register` — 404 (não deployado)
- ❌ `/api/v1/identity/login` — 404 (não deployado)

### Para executar o teste:
1. Fazer deploy do backend no Render (push para main ou trigger manual)
2. Aguardar build completar (~3-5 min)
3. Verificar logs: `✅ Multi-App Identity routes registradas`
4. Então executar o checklist abaixo

---

## 🎯 REGRA DE OURO

> "Nunca automatize um fluxo que você ainda não percorreu manualmente sem desconforto."

---

## 📋 CHECKLIST DO TESTE

### Passo 1: Criar conta no VOX-BRIDGE
- [ ] Acessar https://vox-bridge-ivory.vercel.app
- [ ] Criar conta nova (email que você controla)
- [ ] Anotar: email usado
- [ ] Verificar se entrou no app normalmente

### Passo 2: Fazer logout
- [ ] Sair do VOX-BRIDGE
- [ ] Limpar qualquer token local (se necessário)

### Passo 3: Acessar o SCE
- [ ] Acessar SCE (localhost:3000 ou produção)
- [ ] Tentar fazer login com MESMO email/senha

### Passo 4: Cair em needs_link
- [ ] Verificar se aparece tela/modal de confirmação
- [ ] Ler a mensagem com olhos críticos
- [ ] Perguntar: "Isso confunde alguém?"
- [ ] Anotar qualquer desconforto

### Passo 5: Confirmar o link
- [ ] Clicar em confirmar
- [ ] Verificar se entrou no SCE normalmente

### Passo 6: Validar dados
- [ ] Chamar `GET /identity/me` (via curl ou browser)
- [ ] Verificar:
  - [ ] `origin_app_id` = VOX-BRIDGE (onde criou conta)
  - [ ] `memberships` contém VOX-BRIDGE E SCE
  - [ ] Nada "mágico" aconteceu sem consentimento

---

## 🔍 PERGUNTAS CRÍTICAS

Durante o teste, responda honestamente:

1. **A mensagem de link é clara?**
   - Sim / Não / Precisa ajuste

2. **Você entendeu o que estava acontecendo?**
   - Sim / Não / Confuso

3. **Sentiu que tinha controle?**
   - Sim / Não / Forçado

4. **Algo pareceu "mágico" demais?**
   - Sim / Não

5. **Recomendaria esse fluxo para um usuário leigo?**
   - Sim / Não / Com ajustes

---

## 📝 ANOTAÇÕES DO TESTE

### O que funcionou bem:
```
(anotar aqui)
```

### O que causou desconforto:
```
(anotar aqui)
```

### Sugestões de melhoria:
```
(anotar aqui)
```

---

## ✅ RESULTADO

- [ ] **PASSOU** — Fluxo claro, sem confusão → Pode migrar SCE
- [ ] **AJUSTES** — Precisa melhorar UX antes de migrar
- [ ] **FALHOU** — Modelo confuso, revisar arquitetura

---

## 🛠️ COMANDOS ÚTEIS

### Testar endpoint de login (curl)
```bash
curl -X POST https://uno0826.onrender.com/api/v1/identity/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "SEU_EMAIL",
    "password": "SUA_SENHA",
    "requesting_app_id": "011c6e88-9556-43ff-ad4e-27e20a5f5ea5"
  }'
```

### Testar endpoint de link (curl)
```bash
curl -X POST https://uno0826.onrender.com/api/v1/identity/link-app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "app_id": "011c6e88-9556-43ff-ad4e-27e20a5f5ea5"
  }'
```

### Verificar perfil (curl)
```bash
curl https://uno0826.onrender.com/api/v1/identity/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

*Checklist criado em 10/01/2026 — Tech Lead Approved*
