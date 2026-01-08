# INSTRUÇÃO DO TECH LEAD - FASE 10

## DIAGNÓSTICO RECEBIDO

### O que está certo (e é raro):
1. ✅ Separou kernel de produto
2. ✅ Definiu autoridade e papéis (User ≠ Admin ≠ Super Admin)
3. ✅ Identificou o problema real (clareza de fluxo, UX e papéis)

### O que está "pecando":

**Problema 1 — Identidade rasa demais**
- Usuário entra só com telefone
- Não cria "conta mental"
- Parece sessão descartável
- Correção: Telefone = método de auth, Conta = identidade persistente

**Problema 2 — Frontend mistura papéis**
- Painel mostra tudo
- Usuário vê coisas que não deveria
- Admin não tem sensação de "cockpit"
- Correção: Separação total de experiências

**Problema 3 — Falta de "manual de integração"**
- Precisa de passo a passo, código, documentação
- Modelo: Stripe e Google

---

## TAREFAS DA FASE 10

### 1. Identity — Ajuste de Modelo e Fluxo

Separar claramente:
- `AuthMethod` (telefone, Google, etc)
- `UserAccount` (entidade persistente)
- `UserProfile` (nome, email, avatar)

Fluxo obrigatório:
1. Verifica telefone (OTP)
2. Se novo usuário → onboarding obrigatório (nome, email)
3. Salvar conta no banco
4. Próximos logins não pedem cadastro novamente

JWT deve carregar:
- user_id
- role
- account_status

### 2. Separação Total de Frontends

**User App:**
- Login
- Perfil
- Carteira
- Pagamentos
- NADA de admin

**Admin Panel:**
- Acesso só para role admin ou super_admin
- Gestão total: usuários, ledgers, disputed, jobs, agentes
- Sensação de "torre de controle"

**Dev Portal:**
- Página "Conecte seu app"
- Passo a passo: criar app, gerar API key, instalar SDK
- Exemplos prontos (copiar e colar)

### 3. RBAC (Role-Based Access Control)

Implementar middleware claro:
- `requireUser`
- `requireAdmin`
- `requireSuperAdmin`

Admin nunca usa endpoints de usuário.
Usuário nunca vê endpoints admin.

### 4. Admin como Dono do Sistema

Pensar como Mercado Livre / Stripe:
- Admin vê TUDO
- Histórico completo
- Economia global
- Admin não é usuário comum com mais botões — é outra persona

### 5. Documentação Viva

Dentro do Admin Panel:
- Seção "Integre seu App"
- Exemplos reais usando o SDK
- Fluxo visual: App → Kernel → Ledger → Admin

---

## CRITÉRIO DE SUCESSO

> Um dev júnior consegue integrar um app em 30 minutos sem perguntar nada.

---

## STATUS

- [x] 1. Identity - Modelo e Fluxo ✅
- [x] 4. RBAC - Middlewares ✅
- [x] 2. User App - Separação completa ✅
- [x] 3. Admin Panel - Torre de controle ✅
- [x] 5. Dev Portal - Documentação viva ✅

## ✅ FASE 10 COMPLETA

## IMPLEMENTADO NA FASE 10.1 (JWT + RBAC)

### Backend
- ✅ JWT com `user_id`, `role`, `account_status`
- ✅ Middlewares: `RequireUser()`, `RequireAdmin()`, `RequireSuperAdmin()`
- ✅ Bloqueio automático de usuários suspensos/banidos
- ✅ Modelos: `User`, `UserProfile`, `AuthMethod`
- ✅ Fluxo de auth: OTP → Verificar → Cadastro (se novo) → Login
- ✅ Endpoint `/admin/bootstrap` para criar primeiro super_admin
- ✅ CORS configurado para todas as portas (3001, 3002, 3003)

### Primeiro Super Admin Criado
- Phone: +5511999999999
- Name: Almir Admin
- Email: admin@prostqs.com
- Role: super_admin

## IMPLEMENTADO NA FASE 10.2 (User App + Admin Panel)

### User App (porta 3001)
- ✅ Fluxo de login com OTP
- ✅ Cadastro de novo usuário (nome + email)
- ✅ Dashboard com saldo
- ✅ Carteira com histórico de transações
- ✅ Perfil do usuário
- ✅ Página de depósito
- ✅ Verificação de JWT válido no frontend
- ✅ Logout automático se token expirado

### Admin Panel (porta 3002)
- ✅ Login exclusivo para admin/super_admin
- ✅ Verificação de role no JWT
- ✅ Dashboard com estatísticas
- ✅ Gestão de usuários (listar, suspender, banir, reativar, promover)
- ✅ Visão da economia (ledger, balanço)
- ✅ Pagamentos
- ✅ Disputed (resolver)
- ✅ Agents (aprovar/rejeitar decisões)
- ✅ Jobs (retry)

## IMPLEMENTADO NA FASE 10.3 (Dev Portal)

### Dev Portal (porta 3003)
- ✅ Integração Rápida (5 minutos) - código completo para copiar
- ✅ Getting Started - instalação do SDK
- ✅ Autenticação - fluxo OTP completo
- ✅ Billing - saldo, pagamentos, assinaturas
- ✅ SDK Reference - todas as funções documentadas
- ✅ API Reference - tabela de endpoints
- ✅ Botão "Copiar" em todos os exemplos de código

## CRITÉRIO DE SUCESSO DO TECH LEAD

> "Um dev júnior consegue integrar um app em 30 minutos sem perguntar nada."

✅ **ATINGIDO** - O Dev Portal agora tem:
1. Código completo para copiar e colar
2. Exemplos funcionais de autenticação e pagamento
3. Documentação clara de todos os endpoints
4. SDK reference com todas as funções
