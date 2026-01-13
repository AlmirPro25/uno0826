# Diagrama de Integração dos Apps com Prost-QS Kernel

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ECOSSISTEMA UNO                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PROST-QS KERNEL                                  │   │
│  │                    https://uno0826.onrender.com                          │   │
│  │                                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │ Identity │ │ Billing  │ │  Rules   │ │Telemetry │ │ Immunity │      │   │
│  │  │ Multi-App│ │ Stripe   │ │ Engine   │ │ Events   │ │ Defense  │      │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │   │
│  │       │            │            │            │            │             │   │
│  │       └────────────┴────────────┴────────────┴────────────┘             │   │
│  │                              │                                           │   │
│  │                    ┌─────────▼─────────┐                                │   │
│  │                    │   REST API v1     │                                │   │
│  │                    │  /api/v1/*        │                                │   │
│  │                    └─────────┬─────────┘                                │   │
│  └──────────────────────────────┼──────────────────────────────────────────┘   │
│                                 │                                               │
│         ┌───────────────────────┼───────────────────────┐                      │
│         │                       │                       │                      │
│         ▼                       ▼                       ▼                      │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐              │
│  │   APP-1     │         │    SCE      │         │   APP-2     │              │
│  │  VOX-BRIDGE │         │  Platform   │         │   NEXUS     │              │
│  │             │         │             │         │    P2P      │              │
│  │ ┌─────────┐ │         │ ┌─────────┐ │         │ ┌─────────┐ │              │
│  │ │prostqs- │ │         │ │kernel-  │ │         │ │ kernel/ │ │              │
│  │ │client.js│ │         │ │client.ts│ │         │ │bridge.go│ │              │
│  │ └────┬────┘ │         │ └────┬────┘ │         │ └────┬────┘ │              │
│  │      │      │         │      │      │         │      │      │              │
│  │ Chat App    │         │ Deploy     │         │ P2P Social  │              │
│  │ WebSocket   │         │ Platform   │         │ libp2p      │              │
│  │ Node.js     │         │ TypeScript │         │ Go + React  │              │
│  └─────────────┘         └─────────────┘         └─────────────┘              │
│                                                                                 │
│  INTEGRAÇÃO:              INTEGRAÇÃO:              INTEGRAÇÃO:                 │
│  ✅ Obrigatória           ✅ Obrigatória           ⚡ Opcional (opt-in)        │
│  • Identity               • Identity               • Identity (vinculação)     │
│  • Telemetry              • Telemetry              • Telemetry (eventos P2P)   │
│  • Rules                  • Billing                • Billing (features premium)│
│                           • Capabilities           • Capabilities (limites)    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Comparação de Integração

| Aspecto | APP-1 (VOX-BRIDGE) | SCE | APP-2 (NEXUS) |
|---------|-------------------|-----|---------------|
| **Arquitetura** | Centralizada | Centralizada | Descentralizada P2P |
| **Backend** | Node.js | TypeScript | Go (libp2p) |
| **Frontend** | React | Next.js | React + Vite |
| **Integração** | Obrigatória | Obrigatória | Opcional |
| **Identity** | Kernel é fonte | Kernel é fonte | P2P local + vinculação |
| **Billing** | Controla acesso | Controla acesso | Desbloqueia features |
| **Telemetria** | Automática | Automática | Opt-in |
| **Offline** | Não funciona | Não funciona | Funciona 100% |

## Fluxo de Dados

### APP-1 e SCE (Centralizado)
```
User → App → Kernel API → Database
                ↓
           Telemetry
           Billing
           Rules
```

### APP-2 Nexus (Descentralizado)
```
User → Nexus Node → P2P Network (libp2p)
           │
           └──→ Kernel API (opcional)
                    ↓
               Telemetry
               Billing
               Identity Link
```

## Arquivos de Integração

### APP-1
- `apps/APP-1/backend-node/prostqs-client.js`

### SCE
- `apps/SCE/backend/src/lib/kernel-client.ts`
- `apps/SCE/backend/src/lib/prostqs-client.ts`
- `apps/SCE/KERNEL-INTEGRATION.md`

### APP-2 (Nexus)
- `apps/APP-2/nexus-node/pkg/kernel/` (Go)
- `apps/APP-2/web/src/stores/kernelStore.ts`
- `apps/APP-2/web/src/services/kernel.ts`
- `apps/APP-2/web/src/components/KernelSettings.tsx`
- `apps/APP-2/KERNEL-INTEGRATION.md`

---

*Atualizado em 12/01/2026*
