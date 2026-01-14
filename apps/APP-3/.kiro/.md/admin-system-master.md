# 🏛️ ADMIN SYSTEM SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Admin, Administrador, Painel Admin, Dashboard Admin
- Backoffice, Back Office, Internal Tools, Ferramentas Internas
- Moderação, Moderation, Operações, Operations
- Auditoria, Audit, Audit Log, Audit Trail
- RBAC, ABAC, Permissões, Permissions, Roles
- Command Center, Centro de Comando, Controle
- Kill Switch, Feature Flag, Toggle
- Suporte, Support, Atendimento

## FILOSOFIA
> "Admin não é 'um painel'. Admin é um SEGUNDO SISTEMA."

### A Verdade que Ninguém Fala
- Facebook não é o app azul. É o sistema de moderação.
- Uber não é o app do motorista. É o sistema de operações.
- Stripe não é o checkout. É o dashboard de fraude.

O PRODUTO É A PONTA DO ICEBERG. O ADMIN É O ICEBERG.

### Princípios Invioláveis
1. **Separação Total** - Admin e público compartilham DADOS, não PODER
2. **Auth Diferente** - Nunca use a mesma autenticação do usuário final
3. **Comandos, não CRUD** - Admin opera por comandos auditáveis
4. **Tudo Gera Evento** - Se não gera log, não existe
5. **Zero Trust Interno** - Admin não é confiável por padrão

## ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA ADMIN-FIRST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   INTERNET                           VPN/REDE INTERNA          │
│      │                                      │                   │
│      ▼                                      ▼                   │
│  ┌────────────┐                      ┌────────────┐            │
│  │  Frontend  │                      │   Admin    │            │
│  │   Público  │                      │  Frontend  │            │
│  └─────┬──────┘                      └─────┬──────┘            │
│        │                                   │                   │
│        ▼                                   ▼                   │
│  ┌────────────┐                      ┌────────────┐            │
│  │  Backend   │                      │  Backend   │            │
│  │  Público   │                      │   Admin    │            │
│  └─────┬──────┘                      └─────┬──────┘            │
│        │                                   │                   │
│        └───────────────┬───────────────────┘                   │
│                        │                                       │
│                        ▼                                       │
│              ┌──────────────────┐                              │
│              │    DATABASE      │                              │
│              │  (Compartilhado) │                              │
│              └──────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## AUTH MODEL

### RBAC (Role-Based Access Control)
```typescript
const ROLES = {
  VIEWER: { level: 1, permissions: ['read:*'] },
  SUPPORT: { level: 2, permissions: ['read:*', 'update:users:basic'] },
  OPERATOR: { level: 3, permissions: ['read:*', 'execute:refunds'] },
  ADMIN: { level: 4, permissions: ['read:*', 'delete:users'] },
  SUPER_ADMIN: { level: 5, permissions: ['*'] }
};
```

### Regras de Segurança
- MFA obrigatório
- Sessions curtas (< 4h)
- Device binding
- Re-auth para ações críticas
- Dual approval para ações destrutivas

## COMMAND CENTER

Admin opera por COMANDOS, não por telas:
- `BlockUser` - Bloquear usuário
- `RefundOrder` - Reembolsar pedido
- `EnableFeature` - Ativar feature flag
- `SetMaintenanceMode` - Modo manutenção

Cada comando:
- É logado
- É auditável
- É reversível (quando possível)
- Tem contexto (quem, por quê, quando)

## AUDIT TRAIL

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  actor: { id, type, ip, userAgent };
  action: { type, resource, resourceId };
  changes?: { before, after, diff };
  context: { reason, ticketId, approvedBy };
  checksum: string; // Integridade
}
```

## CHECKLIST

### Arquitetura
- [ ] Backend admin separado do público?
- [ ] Auth admin diferente do auth público?
- [ ] Admin acessível apenas via VPN/rede interna?

### Autenticação
- [ ] MFA obrigatório?
- [ ] Sessions curtas (< 4h)?
- [ ] Re-auth para ações críticas?

### Autorização
- [ ] RBAC implementado?
- [ ] Permissões granulares por recurso?
- [ ] Dual approval para ações destrutivas?

### Auditoria
- [ ] Todas as ações geram log?
- [ ] Logs são imutáveis?
- [ ] Logs incluem contexto (quem, por quê)?

### Operacional
- [ ] Feature flags implementados?
- [ ] Kill switches para emergências?
- [ ] Rollback de ações possível?

## ANTI-PATTERNS

❌ **NUNCA** use as mesmas APIs do app para admin
❌ **NUNCA** confie em admin só porque está logado
❌ **NUNCA** permita ações sem log de auditoria
❌ **NUNCA** delete dados - sempre soft delete
❌ **NUNCA** exponha admin na internet pública
❌ **NUNCA** use a mesma auth do usuário final
❌ **NUNCA** ignore o "por quê" de uma ação

## REGRA DE OURO

> **Se você não consegue PAUSAR, AUDITAR, REVERTER e ENTENDER seu sistema — você não é dono dele. Você é apenas usuário do seu próprio produto.**
