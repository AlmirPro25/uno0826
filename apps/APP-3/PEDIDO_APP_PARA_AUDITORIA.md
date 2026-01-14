# 🎯 PEDIDO DE APP PARA AUDITORIA HARD LAW v1.1

## 📋 INSTRUÇÕES PARA VOCÊ

Copie e cole **EXATAMENTE** este prompt no seu sistema de geração (Claude, ChatGPT, etc):

---

## 🚀 PROMPT PARA GERAR O APP

```
🏛️ ARQUITETO SOBERANO - MODO HARD LAW v1.1 ENFORCEMENT

Você vai gerar uma aplicação SaaS chamada "EXPENSE TRACKER PRO" que seja 100% conforme com PROST-QS Hard Law v1.1.

⚖️ REGRAS ABSOLUTAS (NÃO NEGOCIÁVEIS):

1. ZERO BACKEND PRÓPRIO
   ❌ Nenhuma implementação de auth
   ❌ Nenhuma implementação de billing
   ❌ Nenhuma implementação de usuários
   ❌ Nenhuma tabela de dados
   ✅ Backend = PROXY PURO para PROST-QS Kernel (http://localhost:8080)

2. FRONTEND ONLY (TERMINAL BURRO)
   ✅ React + TypeScript
   ✅ Zustand para estado (SEM persistência)
   ✅ Axios para chamadas HTTP
   ✅ TailwindCSS para UI
   ❌ ZERO localStorage
   ❌ ZERO sessionStorage
   ❌ ZERO cookies
   ❌ ZERO IndexedDB

3. INTEGRAÇÃO COM PROST-QS KERNEL
   Endpoint base: http://localhost:8080/api/v1
   
   Endpoints obrigatórios:
   - POST /auth/login (email, password)
   - POST /auth/register (email, password, name)
   - GET /identity/me (retorna user + plan)
   - GET /billing/subscriptions/active (retorna subscription status)
   - POST /billing/checkout (cria sessão de pagamento)

4. PADRÕES OBRIGATÓRIOS
   ✅ Import SDK real (não mock)
   ✅ Inicializar cliente PROST-QS
   ✅ Chamar endpoints reais
   ✅ Feature gating via hasActiveSubscription()
   ✅ Kernel offline lock (bloqueio total se kernel cair)
   ✅ Atomic paywall (renderização condicional)

5. PADRÕES PROIBIDOS (DETECÇÃO AUTOMÁTICA)
   ❌ localStorage.setItem('auth', ...)
   ❌ localStorage.setItem('isPro', ...)
   ❌ localStorage.setItem('user', ...)
   ❌ const PROST_QS = { ... } (mock)
   ❌ if (isPremium) { ... } (decisão local)
   ❌ if (isPro) { ... } (decisão local)
   ❌ bcrypt, jwt.sign, crypto.hash (qualquer hash local)
   ❌ demo@example.com, test@, free@ (credenciais de teste)
   ❌ \"para demonstração\", \"em produção será\" (justificativas)
   ❌ Backend com auth próprio
   ❌ Backend com JWT local
   ❌ Backend com hash de senha
   ❌ Backend com tabela de usuários
   ❌ Backend com lógica de plano

6. ESTRUTURA OBRIGATÓRIA
   /src
   ├── core/
   │   └── sdk-client.ts (SDK wrapper real)
   ├── stores/
   │   ├── useAuthStore.ts (Zustand memory-only)
   │   └── useBillingStore.ts (Zustand memory-only)
   ├── services/
   │   ├── auth.service.ts (Chamadas ao Kernel)
   │   └── billing.service.ts (Chamadas ao Kernel)
   ├── components/
   │   ├── KernelGuard.tsx (Offline lock)
   │   ├── AtomicPaywall.tsx (Gate atômico)
   │   └── ExpenseForm.tsx (Formulário de despesa)
   ├── pages/
   │   ├── login.tsx
   │   ├── register.tsx
   │   ├── dashboard.tsx
   │   └── expenses.tsx
   └── App.tsx

7. FUNCIONALIDADES
   ✅ Login via PROST-QS
   ✅ Registro via PROST-QS
   ✅ Dashboard com resumo de despesas (FREE)
   ✅ Adicionar despesa (FREE)
   ✅ Listar despesas (FREE)
   ✅ Relatório de despesas (PRO)
   ✅ Exportar para CSV (PRO)
   ✅ Gráficos avançados (PRO)
   ✅ Paywall para features PRO
   ✅ Bloqueia tudo se kernel offline

8. DOCUMENTAÇÃO OBRIGATÓRIA
   ✅ README.md com conformidade Hard Law v1.1
   ✅ COMPLIANCE.md com checklist de regras
   ✅ ARCHITECTURE.md explicando por que não há backend
   ✅ ENDPOINTS.md com lista de endpoints PROST-QS

🎯 OBJETIVO FINAL:

Gerar uma aplicação que:
- Passe 100% na auditoria Hard Law v1.1
- Score: 100/100
- Decisão: APPROVE
- Zero violações críticas
- Zero violações severas
- Zero violações de warning

📝 EXEMPLO DE CÓDIGO CORRETO:

// ✅ CORRETO - SDK real
import { ProstQSClient } from './prost-qs-sdk';
window.prostqs = new ProstQSClient('http://localhost:8080');

// ✅ CORRETO - Chamada ao Kernel
const response = await window.prostqs.post('/api/v1/auth/login', { 
  email, 
  password 
});

// ✅ CORRETO - Feature gating
if (window.hasActiveSubscription()) {
  showPremiumFeature();
} else {
  showPaywall();
}

// ✅ CORRETO - Kernel offline lock
if (isKernelOffline) {
  return <KernelGuard />; // Bloqueia tudo
}

🚫 EXEMPLO DE CÓDIGO ERRADO:

// ❌ ERRADO - Mock
const PROST_QS = { getAuthStatus() { return true; } };

// ❌ ERRADO - localStorage
localStorage.setItem('isPro', true);

// ❌ ERRADO - Decisão local
if (isPremium) { showFeature(); }

// ❌ ERRADO - Backend próprio
func (s *UserService) Login(email, password string) { ... }

// ❌ ERRADO - Hash local
const hash = await bcrypt.hash(password, 10);

⚡ COMECE AGORA:

Gere a estrutura completa de um app SaaS chamado "EXPENSE TRACKER PRO" que:
1. Faz login via PROST-QS
2. Mostra dashboard com features free
3. Paywall para features pro
4. Bloqueia tudo se kernel offline
5. ZERO backend próprio
6. ZERO persistência local
7. 100% conforme Hard Law v1.1

Inicie com:
1. Estrutura de pastas
2. Arquivos críticos (SDK, stores, services)
3. Componentes principais
4. Documentação de conformidade

Não gere:
- Backend próprio
- Banco de dados
- Docker Compose
- CI/CD
- Testes (a menos que sejam de conformidade)
```

---

## ✅ CHECKLIST ANTES DE ENVIAR

Antes de enviar o código gerado para análise, verifique:

- [ ] Nenhum arquivo `auth.controller.ts` ou similar
- [ ] Nenhum `bcrypt`, `jwt.sign`, `crypto.hash`
- [ ] Nenhum `localStorage.setItem`
- [ ] Nenhum `const PROST_QS = { ... }`
- [ ] Nenhum `if (isPremium)` ou `if (isPro)`
- [ ] Nenhum `demo@`, `test@`, `free@`
- [ ] Nenhum `\"para demonstração\"` ou `\"em produção\"`
- [ ] Zustand SEM middleware de persistência
- [ ] KernelGuard renderizado se offline
- [ ] AtomicPaywall renderiza condicionalmente
- [ ] Todos os endpoints chamam PROST-QS real
- [ ] README menciona Hard Law v1.1
- [ ] COMPLIANCE.md com checklist completo
- [ ] ARCHITECTURE.md explicando design

---

## 🎬 PRÓXIMOS PASSOS

1. **Cole o prompt acima** no seu sistema de geração
2. **Aguarde a geração completa**
3. **Copie TODO o código gerado**
4. **Cole aqui no chat** ou **crie um arquivo** com o código
5. **Eu audito com Hard Law v1.1**
6. **Resultado: APPROVE ou REJECT com detalhes**

---

## 📊 O QUE ESPERAR NA AUDITORIA

Quando você enviar o código gerado, eu vou:

✅ Rodar **ProstQSAuditorV2** (15 padrões agressivos)  
✅ Rodar **Hard Law Enforcer** (20 regras constitucionais)  
✅ Gerar **relatório de conformidade**  
✅ Resultado esperado: **100/100 - APPROVE**

---

## 🚨 IMPORTANTE

**Se o sistema gerar algo que viole Hard Law v1.1:**
- Eu vou rejeitar com detalhes
- Vou mostrar exatamente onde está errado
- Vou sugerir correção
- Você refaz e reenvia

**Objetivo**: Treinar o sistema a ser obediente ao Manifesto.

---

**Boa sorte! Manda o código quando estiver pronto.** 🚀
