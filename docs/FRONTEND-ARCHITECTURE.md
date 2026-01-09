# Arquitetura do Frontend PROST-QS

## Visão Geral

O frontend do PROST-QS usa uma arquitetura **dual** com dois sistemas separados por público-alvo:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL (CDN)                                │
│                 https://frontend-lime-seven-48.vercel.app           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────┐    ┌─────────────────────────┐       │
│   │   FRONTEND NEXT.JS      │    │   ADMIN CONSOLE         │       │
│   │   (Usuários)            │    │   (Administradores)     │       │
│   │                         │    │                         │       │
│   │   /                     │    │   /admin                │       │
│   │   /login                │    │   /admin/index.html     │       │
│   │   /register             │    │                         │       │
│   │   /dashboard/*          │    │   HTML + Tailwind CDN   │       │
│   │   /docs/*               │    │   Vanilla JS            │       │
│   │                         │    │   Chart.js              │       │
│   │   Next.js 16 + React 19 │    │                         │       │
│   │   Tailwind CSS 4        │    │                         │       │
│   │   TypeScript            │    │                         │       │
│   └─────────────────────────┘    └─────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND GO (Render)                            │
│                   https://uno0826.onrender.com                      │
│                         /api/v1/*                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Next.js (Usuários)

### Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS 4 + PostCSS
- **Animações**: Framer Motion
- **HTTP Client**: Axios
- **Notificações**: Sonner
- **Ícones**: Lucide React

### Estrutura de Pastas
```
frontend/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Área admin (não usada - migrada)
│   │   ├── (auth)/           # Login, Register, Forgot Password
│   │   ├── (dashboard)/      # Dashboard do usuário
│   │   │   └── dashboard/
│   │   │       ├── apps/     # Gerenciamento de apps
│   │   │       ├── billing/  # Planos e pagamentos
│   │   │       ├── events/   # Telemetria
│   │   │       └── settings/ # Configurações
│   │   ├── (docs)/           # Documentação
│   │   └── (marketing)/      # Landing page, payment callbacks
│   ├── components/
│   │   ├── dashboard/        # Sidebar, etc
│   │   └── ui/               # Button, Input, etc
│   ├── contexts/
│   │   └── auth-context.tsx  # Estado de autenticação
│   ├── lib/
│   │   ├── api.ts            # Cliente Axios configurado
│   │   └── utils.ts          # Helpers (cn, etc)
│   └── types/
│       └── index.ts          # TypeScript types
├── public/
│   ├── admin/                # Console Admin (HTML estático)
│   └── config.js             # Configuração global
└── package.json
```

### Rotas Principais
| Rota | Descrição | Autenticação |
|------|-----------|--------------|
| `/` | Landing page | Pública |
| `/login` | Login | Pública |
| `/register` | Cadastro | Pública |
| `/dashboard` | Home do usuário | Protegida |
| `/dashboard/apps` | Lista de apps | Protegida |
| `/dashboard/apps/[id]` | Detalhes + credenciais | Protegida |
| `/dashboard/billing` | Planos e upgrade | Protegida |
| `/dashboard/events` | Telemetria | Protegida |
| `/dashboard/settings` | Configurações | Protegida |

### Autenticação
- JWT armazenado em `localStorage`
- Interceptor Axios adiciona `Authorization: Bearer <token>`
- Context `AuthProvider` gerencia estado global
- Redirect automático baseado em role (user → dashboard, admin → /admin)

---

## 2. Admin Console (Administradores)

### Stack
- **HTML5** estático
- **Tailwind CSS** via CDN
- **Vanilla JavaScript**
- **Chart.js** para gráficos
- **Font Awesome** para ícones

### Localização
```
frontend/public/admin/
├── index.html          # Console principal
├── success.html        # Callback de pagamento
├── cancel.html         # Callback de cancelamento
└── src/
    ├── main.js         # Lógica principal
    ├── cognitive.js    # Dashboard cognitivo
    ├── applications.js # Gestão de apps
    ├── identity.js     # Gestão de identidades
    ├── financial.js    # Pipeline financeiro
    └── kernel_billing.js # Billing do kernel
```

### Funcionalidades
- **Dashboard Cognitivo**: Visão geral do sistema com métricas
- **Kill Switch**: Controle de emergência global
- **Crisis View**: Alertas e problemas críticos
- **Governance**: Policies, Approvals, Authority
- **Agents**: Autonomy Matrix, Shadow Mode, Decisions
- **Memory**: Institutional Memory, Audit Log
- **Financial**: Ledger, Reconciliation, Alerts
- **Kernel Billing**: Cobrança de apps

### Autenticação
- Mesmo JWT do frontend Next.js
- Armazenado em `localStorage` como `prost_token`
- Verificação de role `admin` ou `super_admin`

---

## 3. Configuração da Vercel

### vercel.json
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs"
}
```

### Variáveis de Ambiente
| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://uno0826.onrender.com/api/v1` | URL do backend |

### Deploy
```bash
# Via CLI
cd frontend
vercel --prod

# Via GitHub (automático)
# Push para main → Vercel detecta e faz deploy
```

---

## 4. Fluxo de Dados

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Vercel     │────▶│   Render     │
│              │     │   (CDN)      │     │   (Backend)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  1. Request        │                    │
       │─────────────────▶  │                    │
       │                    │  2. Serve HTML/JS  │
       │  ◀─────────────────│                    │
       │                    │                    │
       │  3. API Call (JWT) │                    │
       │────────────────────┼──────────────────▶ │
       │                    │                    │
       │  4. JSON Response  │                    │
       │ ◀──────────────────┼────────────────────│
       │                    │                    │
```

---

## 5. URLs de Produção

| Serviço | URL |
|---------|-----|
| **Frontend (Vercel)** | https://frontend-lime-seven-48.vercel.app |
| **Admin Console** | https://frontend-lime-seven-48.vercel.app/admin |
| **Backend (Render)** | https://uno0826.onrender.com |
| **API Base** | https://uno0826.onrender.com/api/v1 |
| **GitHub** | https://github.com/AlmirPro25/uno0826 |

---

## 6. Próximos Passos para Produção

### Domínio Customizado
1. Comprar domínio (ex: `prostqs.com`)
2. Configurar DNS na Vercel
3. Atualizar `NEXT_PUBLIC_API_URL` se necessário

### SSL/HTTPS
- ✅ Já configurado automaticamente pela Vercel e Render

### Monitoramento
- Adicionar Sentry para error tracking
- Configurar Vercel Analytics

### Performance
- Implementar ISR (Incremental Static Regeneration) onde possível
- Otimizar imagens com next/image
- Adicionar Service Worker para PWA

---

## 7. Comandos Úteis

```bash
# Desenvolvimento local
cd frontend
npm run dev

# Build de produção
npm run build

# Deploy manual
vercel --prod

# Ver logs
vercel logs

# Listar deployments
vercel ls
```

---

**Última atualização**: Janeiro 2026
**Versão**: 2.8.4
