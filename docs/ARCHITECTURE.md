# PROST-QS Architecture v1.0

> **STATUS: FROZEN** - Mudanças requerem versionamento

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROST-QS KERNEL                          │
├─────────────────────────────────────────────────────────────────┤
│  IDENTITY    │  BILLING     │  GOVERNANCE  │  AGENTS           │
│  ─────────   │  ─────────   │  ─────────   │  ─────────        │
│  • Users     │  • Accounts  │  • Policies  │  • Decisions      │
│  • Auth      │  • Payments  │  • Approvals │  • Autonomy       │
│  • Profiles  │  • Subscript │  • Authority │  • Shadow Mode    │
│  • Verify    │  • Ledger    │  • Kill Sw.  │  • Memory         │
├─────────────────────────────────────────────────────────────────┤
│                         AUDIT LAYER                             │
│              (Tudo é registrado, nada é esquecido)              │
├─────────────────────────────────────────────────────────────────┤
│  INFRA: SQLite/Postgres │ JWT Auth │ Rate Limit │ CORS         │
└─────────────────────────────────────────────────────────────────┘
```

## Módulos Core (Não Modificar)

| Módulo | Responsabilidade | Dependências |
|--------|------------------|--------------|
| `identity` | Usuários, perfis, verificação | audit |
| `billing` | Contas, pagamentos, ledger | identity, audit, policy |
| `policy` | Regras do sistema | audit |
| `approval` | Workflow de aprovação | policy, audit, authority |
| `authority` | Quem pode aprovar o quê | identity |
| `autonomy` | Perfis de autonomia de agentes | policy |
| `shadow` | Modo simulação | audit |
| `killswitch` | Emergência global | audit |
| `memory` | Memória institucional | audit |
| `audit` | Log imutável | - |
| `agent` | Decisões de agentes | autonomy, approval, shadow |
| `ads` | Campanhas publicitárias | billing, policy |

## Fluxo de Dados

```
Request → Auth Middleware → Rate Limit → Handler → Service → DB
                                              ↓
                                          Audit Log
                                              ↓
                                    Policy Check (se aplicável)
                                              ↓
                                    Approval (se necessário)
```

## Princípios Imutáveis

1. **Audit First**: Toda ação gera log antes de executar
2. **Policy Driven**: Regras são dados, não código
3. **Human in the Loop**: Ações críticas requerem aprovação
4. **Fail Safe**: Na dúvida, bloqueia
5. **Sovereignty**: Dados do usuário pertencem ao usuário

## Stack Técnica

- **Backend**: Go 1.21+
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT RS256
- **Frontend**: Vanilla JS + Tailwind
- **SDK**: JavaScript/TypeScript

## Versionamento

- API: `/api/v1/` (atual)
- Breaking changes → `/api/v2/`
- Deprecation: 6 meses de aviso

---
*Documento congelado em: 2024-12-28*
*Próxima revisão: Apenas com RFC formal*
