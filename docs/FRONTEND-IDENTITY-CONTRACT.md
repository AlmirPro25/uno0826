# PROST-QS — Contrato de Frontend para Identity
**Data:** 10 de Janeiro de 2026  
**Status:** CONGELADO — Não alterar sem revisão de Tech Lead

---

## 🎯 Contrato Mental

### Login pode retornar 3 estados

| Estado | `needs_link` | Significado | Ação do Frontend |
|--------|--------------|-------------|------------------|
| ✅ OK | `false` | Usuário autenticado E tem membership no app | Seguir para dashboard |
| 🔗 Needs Link | `true` | Usuário autenticado MAS não tem membership | Mostrar modal de confirmação |
| ❌ Error | - | Credenciais inválidas ou conta inativa | Mostrar erro |

### `needs_link` NÃO é erro

É um **estado legítimo do sistema**. O usuário existe, está autenticado, mas ainda não confirmou acesso a este app específico.

---

## 📋 Response do Login

```typescript
interface LoginResponse {
  user_id: string;
  email: string;
  name: string;
  token: string;
  expires_at: number;
  is_new_user: boolean;
  origin_app_id: string;
  memberships: Membership[];
  needs_link: boolean;        // ← IMPORTANTE
  plan: string;
  capabilities: string[];
}

interface Membership {
  app_id: string;
  app_name: string;
  role: string;               // user | admin | owner
  status: string;             // pending | active | suspended | revoked
  linked_at: string;
  last_access_at: string;
}
```

---

## 🔄 Fluxo de Frontend

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO DE LOGIN                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Usuário                    Frontend                         PROST-QS
  ┌─────┐                    ┌───────────────┐                ┌─────────┐
  │     │ ── email/senha ──► │               │                │         │
  │     │                    │ POST /login   │                │         │
  │     │                    │ + app_id      │ ─────────────► │         │
  │     │                    │               │                │         │
  │     │                    │               │ ◄───────────── │         │
  │     │                    │               │                │         │
  │     │                    │ if (needs_link) {              │         │
  │     │                    │   showLinkModal()              │         │
  │     │ ◄── Modal ───────  │ }                              │         │
  │     │                    │               │                │         │
  │     │ ── Confirma ─────► │               │                │         │
  │     │                    │ POST /link-app│                │         │
  │     │                    │ + app_id      │ ─────────────► │         │
  │     │                    │               │                │         │
  │     │                    │               │ ◄── new JWT ── │         │
  │     │                    │               │                │         │
  │     │                    │ saveToken()   │                │         │
  │     │                    │ redirect()    │                │         │
  │     │ ◄── Dashboard ───  │               │                │         │
  └─────┘                    └───────────────┘                └─────────┘
```

---

## ⚠️ Regras de Ouro

### 1. Frontend NÃO decide acesso

```typescript
// ❌ ERRADO
if (user.role === 'admin') {
  showAdminPanel();
}

// ✅ CERTO
// Backend já validou. Se chegou aqui, pode acessar.
// Use capabilities do JWT para features específicas.
if (capabilities.includes('sce:admin')) {
  showAdminPanel();
}
```

### 2. Sempre enviar `app_id` no login

```typescript
// ❌ ERRADO
const response = await fetch('/identity/login', {
  body: JSON.stringify({ email, password })
});

// ✅ CERTO
const response = await fetch('/identity/login', {
  body: JSON.stringify({ 
    email, 
    password,
    requesting_app_id: APP_ID  // ← OBRIGATÓRIO
  })
});
```

### 3. Tratar `needs_link` como estado, não erro

```typescript
// ❌ ERRADO
if (response.needs_link) {
  throw new Error('Acesso negado');
}

// ✅ CERTO
if (response.needs_link) {
  // Salvar token temporário
  setTempToken(response.token);
  // Mostrar modal de confirmação
  setShowLinkModal(true);
}
```

### 4. Após link, usar novo JWT

```typescript
const linkResponse = await fetch('/identity/link-app', {
  headers: { Authorization: `Bearer ${tempToken}` },
  body: JSON.stringify({ app_id: APP_ID })
});

// Novo JWT com membership atualizado
const { token } = await linkResponse.json();
saveToken(token);  // ← Substituir o token
```

---

## 🧩 Componente Reutilizável

Todo app do ecossistema PROST-QS deve ter um componente `LinkAppModal`:

```typescript
interface LinkAppModalProps {
  isOpen: boolean;
  appName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

Comportamento:
- Modal simples
- Texto claro: "Você já tem conta no PROST-QS. Deseja criar uma conta no {appName}?"
- Botão de confirmar
- Botão de cancelar
- Loading state durante confirmação

---

## 📝 Checklist de Implementação

- [ ] Login envia `requesting_app_id`
- [ ] Response `needs_link` é tratado como estado válido
- [ ] Modal de confirmação existe
- [ ] Após link, novo JWT é salvo
- [ ] Capabilities são usadas para features, não roles
- [ ] Nenhuma decisão de acesso no frontend

---

*Documento congelado em 10/01/2026 — Tech Lead Approved*
