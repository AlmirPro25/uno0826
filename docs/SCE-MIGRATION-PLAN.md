# 🔄 PLANO DE MIGRAÇÃO: SCE → Kernel Identity

> **Data:** 11 de Janeiro de 2026  
> **Objetivo:** SCE não autentica ninguém. Apenas confia no Identity.  
> **Pré-requisito:** Contrato de Identity congelado e testado ✅

---

## 📊 ESTADO ATUAL (Diagnóstico)

### O que o SCE faz ERRADO hoje:

| Componente | Problema | Risco |
|------------|----------|-------|
| `auth.service.ts` | Cria usuário LOCAL no Prisma | Duplicação de identidade |
| `auth.service.ts` | Gera JWT próprio com secret diferente | Dois sistemas de auth |
| `auth.service.ts` | Hash de senha local (bcrypt) | Senha em dois lugares |
| `auth.middleware.ts` | Aceita token LOCAL em dev | Bypass de segurança |
| Prisma schema | Tabela `User` com `passwordHash` | Dados sensíveis duplicados |

### O que o SCE faz CERTO hoje:

| Componente | Acerto | Manter |
|------------|--------|--------|
| `useProstQSAuth.ts` | Já usa `/identity/login` do Kernel | ✅ Expandir |
| `useAuthStore.ts` | Já suporta `needs_link` | ✅ Manter |
| `auth.middleware.ts` | Já valida JWT do PROST-QS | ✅ Tornar único |
| `kernel-client.ts` | Já integra telemetria | ✅ Manter |
| `LinkAppModal.tsx` | Já existe UI de link | ✅ Manter |

---

## 🎯 ESTADO ALVO (Pós-Migração)

```
┌─────────────────────────────────────────────────────────────┐
│                         KERNEL                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Identity                          │    │
│  │  • /identity/register                               │    │
│  │  • /identity/login                                  │    │
│  │  • /identity/link-app                               │    │
│  │  • JWT único (fonte de verdade)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ JWT do Kernel
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          SCE                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              auth.middleware.ts                      │    │
│  │  • APENAS valida JWT do Kernel                      │    │
│  │  • REJEITA qualquer outro token                     │    │
│  │  • Extrai user_id, memberships, capabilities        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ❌ SEM auth.service.ts (deletado)                          │
│  ❌ SEM tabela User com senha (migrado)                     │
│  ❌ SEM JWT próprio (removido)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST DE MIGRAÇÃO

### FASE 1: Preparação (Sem quebrar nada)

- [x] **1.1** Criar testes de integração SCE ↔ Kernel (antes de mexer no código)
- [x] **1.2** Garantir que SCE tem `PROSTQS_APP_ID` configurado (via env)
- [x] **1.3** Verificar que Kernel está acessível do SCE (via PROSTQS_URL)
- [x] **1.4** Criar endpoints de admin para migração (SearchUser, CreateUser, CreateMembership)

### FASE 2: Backend - Middleware (Cirúrgico)

- [x] **2.1** Criar novo middleware `kernel-auth.middleware.ts` (APENAS Kernel)
- [x] **2.2** Tornar `PROST_QS_JWT_SECRET` obrigatório (não fallback)
- [x] **2.3** Adicionar verificação de `memberships` no middleware
- [x] **2.4** Retornar `NEEDS_LINK` quando sem membership no SCE
- [x] **2.5** Substituir imports nas rotas (auth → kernel-auth)

### FASE 3: Backend - Remover Auth Local

- [x] **3.1** Deprecar `auth.service.ts` (não deletar ainda)
- [x] **3.2** Remover rotas `/auth/login` e `/auth/register` locais (retornam 410 GONE)
- [x] **3.3** Redirecionar para Kernel Identity
- [x] **3.4** Manter apenas `provisionKernelApp` para migração

### FASE 4: Frontend - Consolidar

- [x] **4.1** Atualizar `AuthGuard` para tratar `needsLink`
- [x] **4.2** Atualizar `LinkAppModal` para integrar com store
- [x] **4.3** Remover qualquer chamada a `/auth/*` local
- [x] **4.4** Usar APENAS `useProstQSAuth` para autenticação
- [x] **4.5** Corrigir `axios.ts` e `api.ts` para usar token do store (não localStorage direto)
- [x] **4.6** Corrigir `deployment.service.ts` para usar token do store

### FASE 5: Migração de Dados

- [x] **5.1** Script para migrar usuários SCE → Kernel Identity (`scripts/migrate-users-to-kernel.ts`)
- [ ] **5.2** Executar script em staging
- [ ] **5.3** Criar AppMembership no Kernel para usuários existentes
- [ ] **5.4** Remover `passwordHash` da tabela User do SCE (após validação)

**Comandos para executar migração:**
```bash
cd apps/SCE/backend

# 1. Simular migração (dry-run)
KERNEL_ADMIN_TOKEN=xxx npx tsx scripts/migrate-users-to-kernel.ts --dry-run

# 2. Executar migração real
KERNEL_ADMIN_TOKEN=xxx npx tsx scripts/migrate-users-to-kernel.ts

# 3. Limpar senhas após migração
npx tsx scripts/post-migration-cleanup.ts --dry-run
npx tsx scripts/post-migration-cleanup.ts
```

### FASE 6: Limpeza Final

- [ ] **6.1** Deletar `auth.service.ts`
- [ ] **6.2** Remover dependências de bcrypt do SCE
- [ ] **6.3** Atualizar Prisma schema (usar `schema.post-migration.prisma`)
- [ ] **6.4** Documentar nova arquitetura

**Arquivos criados para limpeza:**
- `scripts/post-migration-cleanup.ts` — Limpa passwordHash após migração
- `prisma/schema.post-migration.prisma` — Schema sem campos de auth local

---

## 🧪 TESTES DE INTEGRAÇÃO (Escrever ANTES)

### Teste 1: Token válido com membership → Acesso permitido

```typescript
// test/integration/kernel-auth.test.ts
describe('SCE + Kernel Identity', () => {
  it('should allow access with valid Kernel JWT + SCE membership', async () => {
    // 1. Login no Kernel
    const loginRes = await fetch(`${KERNEL_URL}/api/v1/identity/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'user@test.com', password: 'senha123', requesting_app_id: SCE_APP_ID })
    });
    const { token, needs_link } = await loginRes.json();
    
    // 2. Se needs_link, fazer link
    if (needs_link) {
      await fetch(`${KERNEL_URL}/api/v1/identity/link-app`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ app_id: SCE_APP_ID })
      });
    }
    
    // 3. Acessar SCE com token do Kernel
    const sceRes = await fetch(`${SCE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(sceRes.status).toBe(200);
  });
});
```

### Teste 2: Token válido SEM membership → Bloqueado + needs_link

```typescript
it('should block access without SCE membership', async () => {
  // 1. Login no Kernel (usuário sem membership no SCE)
  const loginRes = await fetch(`${KERNEL_URL}/api/v1/identity/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'vox-only@test.com', password: 'senha123', requesting_app_id: SCE_APP_ID })
  });
  const { token, needs_link } = await loginRes.json();
  
  expect(needs_link).toBe(true);
  
  // 2. Tentar acessar SCE sem fazer link
  const sceRes = await fetch(`${SCE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  expect(sceRes.status).toBe(403);
  expect(await sceRes.json()).toMatchObject({ code: 'NEEDS_LINK' });
});
```

### Teste 3: Token de outro app → Negado

```typescript
it('should reject token from different app without SCE membership', async () => {
  // 1. Login no Kernel via VOX (sem membership no SCE)
  const loginRes = await fetch(`${KERNEL_URL}/api/v1/identity/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'vox@test.com', password: 'senha123', requesting_app_id: VOX_APP_ID })
  });
  const { token } = await loginRes.json();
  
  // 2. Tentar acessar SCE com token do VOX
  const sceRes = await fetch(`${SCE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  // Deve falhar porque não tem membership no SCE
  expect(sceRes.status).toBe(403);
});
```

---

## 🔧 MUDANÇAS ESPECÍFICAS

### auth.middleware.ts (NOVO)

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const PROSTQS_JWT_SECRET = process.env.PROST_QS_JWT_SECRET;
const SCE_APP_ID = process.env.PROSTQS_APP_ID;

if (!PROSTQS_JWT_SECRET) {
  throw new Error('PROST_QS_JWT_SECRET é obrigatório');
}

interface KernelJWTPayload {
  user_id: string;
  email: string;
  name: string;
  role: string;
  origin_app_id: string;
  memberships: string[];  // Lista de app_ids
  type: string;           // "global_user"
  exp: number;
  iat: number;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não fornecido', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.substring(7);
  
  try {
    // APENAS aceita JWT do Kernel
    const decoded = jwt.verify(token, PROSTQS_JWT_SECRET) as KernelJWTPayload;
    
    // Verificar se é token do Kernel
    if (decoded.type !== 'global_user') {
      return reply.status(401).send({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    }
    
    // Verificar membership no SCE
    const hasSCEMembership = decoded.memberships.includes(SCE_APP_ID);
    
    if (!hasSCEMembership) {
      return reply.status(403).send({ 
        error: 'Você precisa vincular sua conta ao SCE',
        code: 'NEEDS_LINK',
        link_url: `/identity/link-app?app_id=${SCE_APP_ID}`
      });
    }
    
    // Autorizado
    request.user = {
      id: decoded.user_id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      originAppId: decoded.origin_app_id,
      memberships: decoded.memberships,
    };
    
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido ou expirado', code: 'INVALID_TOKEN' });
  }
}
```

### Prisma Schema (DEPOIS da migração)

```prisma
// ANTES (com auth local)
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   // ❌ REMOVER
  role          String   @default("USER")
  kernelUserId  String?  // Referência ao Kernel
  kernelAppId   String?  // App do usuário no Kernel
  // ...
}

// DEPOIS (sem auth local)
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  role          String   @default("USER")
  kernelUserId  String   @unique  // ✅ Obrigatório, é a fonte de verdade
  // kernelAppId removido - cada usuário não precisa de App próprio
  // ...
}
```

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Kernel indisponível | Média | Alto | Circuit breaker + cache de JWT |
| Usuários sem kernelUserId | Alta | Médio | Script de migração obrigatório |
| JWT secret diferente | Baixa | Alto | Validar em staging primeiro |
| Frontend não atualizado | Média | Médio | Feature flag para rollout gradual |

---

## 📅 CRONOGRAMA SUGERIDO

| Fase | Duração | Dependência |
|------|---------|-------------|
| Fase 1: Preparação | 1 dia | - |
| Fase 2: Middleware | 1 dia | Fase 1 |
| Fase 3: Remover Auth | 1 dia | Fase 2 |
| Fase 4: Frontend | 1 dia | Fase 3 |
| Fase 5: Migração | 2 dias | Fase 4 |
| Fase 6: Limpeza | 1 dia | Fase 5 |

**Total: ~7 dias de trabalho focado**

---

## ✅ CRITÉRIO DE SUCESSO

A migração está completa quando:

1. [x] SCE não tem mais rotas `/auth/login` e `/auth/register` funcionais (retornam 410)
2. [x] SCE não gera JWT próprio (usa apenas JWT do Kernel)
3. [ ] SCE não armazena senha (após migração de dados)
4. [ ] Todos os usuários têm `kernelUserId`
5. [ ] Testes de integração passam
6. [x] `needs_link` funciona corretamente (frontend + backend)
7. [x] Nenhum token local é aceito (middleware só aceita Kernel JWT)

---

## 📞 PRÓXIMO PASSO IMEDIATO

**Executar script de migração em staging:**

```bash
cd apps/SCE/backend

# 1. Atualizar Prisma client
npx prisma generate

# 2. Simular migração (dry-run)
KERNEL_ADMIN_TOKEN=xxx npx tsx scripts/migrate-users-to-kernel.ts --dry-run

# 3. Executar migração real
KERNEL_ADMIN_TOKEN=xxx npx tsx scripts/migrate-users-to-kernel.ts
```

Após migração bem-sucedida:
- Testar fluxo completo de login → needs_link → link → acesso
- Remover `passwordHash` do schema Prisma
- Deletar `auth.service.ts`

---

*Documento criado em 11/01/2026*  
*Última atualização: 11/01/2026*  
*Baseado no contrato de Identity congelado em `multiapp_test.go`*

## 📝 CHANGELOG

### 12/01/2026 (tarde) — Scripts de Limpeza Pós-Migração
- ✅ `scripts/post-migration-cleanup.ts` — Script para limpar passwordHash após migração
- ✅ `prisma/schema.post-migration.prisma` — Schema Prisma sem campos de auth local
- ✅ Documentação atualizada com comandos de execução

### 12/01/2026 — Testes de Integração + Endpoints Admin
- ✅ `sce_integration_test.go` — 5 testes de integração SCE passando
- ✅ `admin/handler.go` — Endpoints para migração:
  - GET /admin/users/search?email=xxx
  - POST /admin/users
  - POST /admin/memberships
- ✅ `secrets_invariants.go` — Corrigido regex para Stripe keys

### 11/01/2026 — Migração Frontend + Script de Dados
- ✅ `axios.ts` — Corrigido para usar token do Zustand store
- ✅ `api.ts` — Corrigido para usar token do Zustand store  
- ✅ `deployment.service.ts` — Corrigido para usar token do Zustand store
- ✅ `LinkAppModal.tsx` — Interface expandida para suportar callbacks externos
- ✅ `auth.middleware.ts` — Marcado como DEPRECATED
- ✅ `scripts/migrate-users-to-kernel.ts` — Script de migração criado
