# 📤 TEMPLATE PARA ENVIAR O CÓDIGO

Quando você tiver o código gerado, copie este template e preencha:

---

## 🎯 ENVIO DE APP PARA AUDITORIA HARD LAW v1.1

**Nome do App**: EXPENSE TRACKER PRO

**Data de Geração**: [DATA]

**Sistema de Geração**: [Claude / ChatGPT / Outro]

---

## 📁 ESTRUTURA DE PASTAS

```
expense-tracker-pro/
├── src/
│   ├── core/
│   │   └── sdk-client.ts
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   └── useBillingStore.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── billing.service.ts
│   ├── components/
│   │   ├── KernelGuard.tsx
│   │   ├── AtomicPaywall.tsx
│   │   └── ExpenseForm.tsx
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

---

## 📄 ARQUIVOS PRINCIPAIS

### 1. src/core/sdk-client.ts

```typescript
[COLE O CÓDIGO AQUI]
```

### 2. src/stores/useAuthStore.ts

```typescript
[COLE O CÓDIGO AQUI]
```

### 3. src/stores/useBillingStore.ts

```typescript
[COLE O CÓDIGO AQUI]
```

### 4. src/services/auth.service.ts

```typescript
[COLE O CÓDIGO AQUI]
```

### 5. src/services/billing.service.ts

```typescript
[COLE O CÓDIGO AQUI]
```

### 6. src/components/KernelGuard.tsx

```typescript
[COLE O CÓDIGO AQUI]
```

### 7. src/components/AtomicPaywall.tsx

```typescript
[COLE O CÓDIGO AQUI]
```

### 8. src/pages/login.tsx

```typescript
[COLE O CÓDIGO AQUI]
```

### 9. src/pages/dashboard.tsx

```typescript
[COLE O CÓDIGO AQUI]
```

### 10. README.md

```markdown
[COLE O CÓDIGO AQUI]
```

### 11. COMPLIANCE.md

```markdown
[COLE O CÓDIGO AQUI]
```

### 12. ARCHITECTURE.md

```markdown
[COLE O CÓDIGO AQUI]
```

---

## ✅ CHECKLIST PRÉ-ENVIO

- [ ] Nenhum arquivo `auth.controller.ts` ou similar
- [ ] Nenhum `bcrypt`, `jwt.sign`, `crypto.hash`
- [ ] Nenhum `localStorage.setItem`
- [ ] Nenhum `const PROST_QS = { ... }`
- [ ] Nenhum `if (isPremium)` ou `if (isPro)`
- [ ] Nenhum `demo@`, `test@`, `free@`
- [ ] Nenhum `"para demonstração"` ou `"em produção"`
- [ ] Zustand SEM middleware de persistência
- [ ] KernelGuard renderizado se offline
- [ ] AtomicPaywall renderiza condicionalmente
- [ ] Todos os endpoints chamam PROST-QS real
- [ ] README menciona Hard Law v1.1
- [ ] COMPLIANCE.md com checklist completo
- [ ] ARCHITECTURE.md explicando design

---

## 🎯 OBSERVAÇÕES

[Adicione qualquer observação importante sobre o código gerado]

---

**Pronto para auditoria!** 🚀
