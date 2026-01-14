# 🏛️ GUIA COMPLETO: AUDITORIA HARD LAW v1.1

## 📋 ÍNDICE

1. [O que você precisa fazer](#o-que-você-precisa-fazer)
2. [Arquivos de referência](#arquivos-de-referência)
3. [Passo a passo](#passo-a-passo)
4. [O que esperar](#o-que-esperar)
5. [Próximos passos](#próximos-passos)

---

## 🎯 O que você precisa fazer

### Objetivo
Gerar um app SaaS chamado **EXPENSE TRACKER PRO** que seja 100% conforme com **PROST-QS Hard Law v1.1**.

### Resultado esperado
- Score: **100/100**
- Decisão: **APPROVE**
- Zero violações críticas
- Zero violações severas
- Zero violações de warning

---

## 📁 Arquivos de referência

Você tem 3 arquivos criados para ajudar:

### 1. **PEDIDO_APP_PARA_AUDITORIA.md**
- Contém o prompt completo para gerar o app
- Copie e cole no seu sistema de geração
- Inclui exemplos de código correto e errado

### 2. **FLUXO_AUDITORIA_VISUAL.txt**
- Mostra o fluxo visual de auditoria
- 5 passos claros
- Fácil de seguir

### 3. **TEMPLATE_ENVIO_CODIGO.md**
- Template para enviar o código gerado
- Estrutura de pastas esperada
- Checklist pré-envio

---

## 🚀 Passo a passo

### PASSO 1: Gerar o app

1. Abra **PEDIDO_APP_PARA_AUDITORIA.md**
2. Copie o prompt (entre os backticks)
3. Cole no seu sistema de geração (Claude, ChatGPT, etc)
4. Aguarde a geração completa (5-10 minutos)

### PASSO 2: Verificar conformidade básica

Antes de enviar, procure por:

```
❌ localStorage.setItem
❌ const PROST_QS = { ... }
❌ if (isPremium)
❌ bcrypt, jwt.sign
❌ demo@, test@, free@
❌ Backend próprio
```

Se encontrar qualquer um desses, peça ao sistema para corrigir.

### PASSO 3: Enviar para auditoria

1. Copie o template de **TEMPLATE_ENVIO_CODIGO.md**
2. Preencha com o código gerado
3. Cole aqui no chat
4. Eu vou rodar a auditoria automaticamente

### PASSO 4: Auditoria Hard Law v1.1

Eu vou executar:

- **ProstQSAuditorV2** (15 padrões agressivos)
- **Hard Law Enforcer** (20 regras constitucionais)
- **Relatório de Conformidade** (score 0-100)

### PASSO 5: Resultado

**Se APPROVE (100/100)**:
- ✅ Zero violações
- ✅ App pronto para produção
- ✅ Conforme Hard Law v1.1

**Se REJECT (< 100/100)**:
- ❌ Violações encontradas
- ❌ Detalhes de cada uma
- ❌ Recomendações de correção
- ❌ Você refaz e reenvia

---

## 📊 O que esperar

### Estrutura esperada

```
expense-tracker-pro/
├── src/
│   ├── core/
│   │   └── sdk-client.ts (SDK wrapper real)
│   ├── stores/
│   │   ├── useAuthStore.ts (Zustand memory-only)
│   │   └── useBillingStore.ts (Zustand memory-only)
│   ├── services/
│   │   ├── auth.service.ts (Chamadas ao Kernel)
│   │   └── billing.service.ts (Chamadas ao Kernel)
│   ├── components/
│   │   ├── KernelGuard.tsx (Offline lock)
│   │   ├── AtomicPaywall.tsx (Gate atômico)
│   │   └── ExpenseForm.tsx (Formulário)
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── dashboard.tsx
│   │   └── expenses.tsx
│   └── App.tsx
├── README.md
├── COMPLIANCE.md
├── ARCHITECTURE.md
├── ENDPOINTS.md
├── package.json
└── tsconfig.json
```

### Funcionalidades esperadas

✅ Login via PROST-QS  
✅ Registro via PROST-QS  
✅ Dashboard com resumo (FREE)  
✅ Adicionar despesa (FREE)  
✅ Listar despesas (FREE)  
✅ Relatório de despesas (PRO)  
✅ Exportar para CSV (PRO)  
✅ Gráficos avançados (PRO)  
✅ Paywall para features PRO  
✅ Bloqueia tudo se kernel offline  

### Padrões obrigatórios

✅ SDK real (não mock)  
✅ Inicializar cliente PROST-QS  
✅ Chamar endpoints reais  
✅ Feature gating via hasActiveSubscription()  
✅ Kernel offline lock  
✅ Atomic paywall  

### Padrões proibidos

❌ localStorage  
❌ Mock de PROST-QS  
❌ Decisões locais de plano  
❌ Backend próprio  
❌ Hash de senha  
❌ JWT local  
❌ Credenciais de teste  
❌ Justificativas ("para demonstração")  

---

## 🎯 Próximos passos

### Imediato (hoje)

1. Leia este guia
2. Abra **PEDIDO_APP_PARA_AUDITORIA.md**
3. Copie o prompt
4. Cole no seu sistema de geração

### Curto prazo (próximas horas)

1. Aguarde a geração
2. Verifique conformidade básica
3. Envie para auditoria

### Médio prazo (próximos dias)

1. Receba resultado da auditoria
2. Se REJECT: corrija e reenvie
3. Se APPROVE: celebre! 🎉

---

## 💡 Dicas importantes

### Dica 1: Leia o prompt com atenção
O prompt é muito específico. Quanto melhor você o passar, melhor será o resultado.

### Dica 2: Verifique antes de enviar
Procure pelos padrões proibidos antes de enviar. Isso economiza tempo.

### Dica 3: Seja honesto
Se o sistema gerar algo que viole Hard Law v1.1, é melhor descobrir agora do que depois.

### Dica 4: Aprenda com o resultado
Se for REJECT, leia as violações com atenção. Isso vai ajudar você a entender melhor o Manifesto.

---

## 🚨 Importante

**Hard Law v1.1 é não-negociável.**

Não há exceções, não há relativizações, não há "para demonstração".

Se o código violar Hard Law v1.1, será rejeitado.

Ponto.

---

## 📞 Resumo executivo

| Etapa | O que fazer | Tempo |
|-------|-----------|-------|
| 1 | Gerar o app | 5-10 min |
| 2 | Verificar conformidade | 5 min |
| 3 | Enviar para auditoria | 2 min |
| 4 | Auditoria Hard Law v1.1 | 5 min |
| 5 | Resultado | Imediato |

**Total**: ~20 minutos

---

## 🎬 Comece agora

1. Abra **PEDIDO_APP_PARA_AUDITORIA.md**
2. Copie o prompt
3. Cole no seu sistema de geração
4. Aguarde a geração
5. Envie para auditoria

**Boa sorte!** 🚀

---

**Dúvidas?** Releia este guia ou os arquivos de referência.

**Pronto?** Comece agora!
