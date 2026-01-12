# 🔄 Migração de Middleware: auth → kernel-auth

## Estado Atual

O SCE tem dois middlewares de autenticação:

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `auth.middleware.ts` | ⚠️ DEPRECADO | Aceita token local + Kernel |
| `kernel-auth.middleware.ts` | ✅ NOVO | APENAS aceita token do Kernel |

## Como Migrar

### Passo 1: Substituir imports

```typescript
// ANTES
import { authMiddleware, adminMiddleware } from './middleware/auth.middleware';

// DEPOIS
import { kernelAuthMiddleware, kernelAdminMiddleware } from './middleware/kernel-auth.middleware';
```

### Passo 2: Substituir uso nas rotas

```typescript
// ANTES
app.get('/api/projects', { preHandler: [authMiddleware] }, handler);

// DEPOIS
app.get('/api/projects', { preHandler: [kernelAuthMiddleware] }, handler);
```

### Passo 3: Atualizar acesso ao usuário

```typescript
// ANTES
const userId = request.user?.id;

// DEPOIS
const userId = request.kernelUser?.id;
```

### Passo 4: Tratar NEEDS_LINK no frontend

O novo middleware retorna `403` com `code: 'NEEDS_LINK'` quando o usuário não tem membership no SCE.

```typescript
// Frontend deve interceptar esse erro
if (error.code === 'NEEDS_LINK') {
  // Mostrar modal de link
  showLinkAppModal({
    userId: error.user_id,
    email: error.email,
    appId: error.app_id,
  });
}
```

## Variáveis de Ambiente Necessárias

```env
# Obrigatório — secret do JWT do Kernel
PROST_QS_JWT_SECRET=mesmo-secret-do-kernel

# Obrigatório — ID do app SCE no Kernel
PROSTQS_APP_ID=uuid-do-sce-no-kernel
```

## Checklist de Migração

- [ ] Configurar `PROST_QS_JWT_SECRET`
- [ ] Configurar `PROSTQS_APP_ID`
- [ ] Substituir imports em todas as rotas
- [ ] Atualizar `request.user` → `request.kernelUser`
- [ ] Implementar tratamento de `NEEDS_LINK` no frontend
- [ ] Testar fluxo completo
- [ ] Remover `auth.middleware.ts`
- [ ] Remover `auth.service.ts`

## Rollback

Se precisar reverter, basta trocar os imports de volta:

```typescript
import { authMiddleware } from './middleware/auth.middleware';
```

O middleware antigo ainda aceita tokens do Kernel, então não há quebra.
