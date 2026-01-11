# SCE + UNO.KERNEL Integration

## Arquitetura Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────┐
│                        UNO.KERNEL                               │
│                 (Infraestrutura Soberana)                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ App: User-A  │  │ App: User-B  │  │ App: User-C  │         │
│  │              │  │              │  │              │         │
│  │ Telemetria   │  │ Telemetria   │  │ Telemetria   │         │
│  │ Regras       │  │ Regras       │  │ Regras       │         │
│  │ Billing      │  │ Billing      │  │ Billing      │         │
│  │ Alertas      │  │ Alertas      │  │ Alertas      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         ▲                 ▲                 ▲                  │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          │ API Keys        │ API Keys        │ API Keys
          │ isoladas        │ isoladas        │ isoladas
          │                 │                 │
┌─────────┴─────────────────┴─────────────────┴──────────────────┐
│                           SCE                                   │
│                (Sovereign Cloud Engine)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   User A     │  │   User B     │  │   User C     │         │
│  │              │  │              │  │              │         │
│  │ - projeto1   │  │ - api-prod   │  │ - meu-site   │         │
│  │ - projeto2   │  │ - api-dev    │  │              │         │
│  │              │  │              │  │              │         │
│  │ kernel_app_A │  │ kernel_app_B │  │ kernel_app_C │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Cadastro

```typescript
// 1. Usuário se cadastra no SCE
POST /auth/register { email, password, name }

// 2. SCE cria identidade no Kernel
const kernelUser = await kernel.createIdentity(email, name, password);

// 3. SCE cria App no Kernel para este usuário
const kernelApp = await kernel.createApp(kernelUser.token, `SCE-${user.id}`);

// 4. SCE salva credenciais do Kernel no usuário
await prisma.user.update({
  where: { id: user.id },
  data: {
    kernelUserId: kernelUser.id,
    kernelAppId: kernelApp.id,
    kernelAppKey: kernelApp.api_key,
    kernelAppSecret: kernelApp.api_secret
  }
});
```

## Fluxo de Telemetria

```typescript
// Quando deploy acontece, emite para o App do usuário
const user = await getUser(projectOwnerId);
const kernelClient = kernel.createUserClient(
  user.kernelAppKey,
  user.kernelAppSecret
);

// Telemetria vai para o App isolado do usuário
await kernelClient.deployStarted(deployId, projectId, projectName);
```

## O que cada usuário vê

| Dado | Onde vê | Isolamento |
|------|---------|------------|
| Deploys | SCE Dashboard | Por projeto |
| Telemetria | Kernel Dashboard | Por App (isolado) |
| Alertas | Kernel Dashboard | Por App (isolado) |
| Regras | Kernel Dashboard | Por App (isolado) |
| Billing | Kernel Dashboard | Por App (isolado) |

## Benefícios

1. **Isolamento Total**: Cada usuário tem seu próprio "App" no Kernel
2. **Billing Separado**: Cada usuário paga pelo seu uso
3. **Regras Próprias**: Cada usuário configura suas próprias regras
4. **Auditoria**: Cada usuário tem seu próprio audit log
5. **Escalabilidade**: Kernel gerencia milhares de Apps

## Configuração

```env
# SCE .env
KERNEL_URL=https://uno0826.onrender.com
KERNEL_MASTER_KEY=pq_master_xxx  # Key do SCE como plataforma
```

## Próximos Passos

1. [x] Implementar registro com criação de App no Kernel
2. [x] Atualizar deploy service para usar kernel client do usuário
3. [x] Criar página de telemetria no SCE que busca do Kernel
4. [x] Adicionar rota de proxy no backend do SCE para telemetria
5. [ ] Rodar migration do Prisma para adicionar campos do Kernel
6. [ ] Implementar SSO entre SCE e Kernel Dashboard (opcional)

## Como Testar

```bash
# 1. Rodar migration do Prisma
cd apps/SCE/backend
npx prisma db push

# 2. Configurar .env
KERNEL_URL=https://uno0826.onrender.com

# 3. Registrar novo usuário (cria App no Kernel automaticamente)
POST /api/v1/auth/register
{ "email": "user@test.com", "password": "12345678", "name": "Test User" }

# 4. Fazer deploy (telemetria vai pro App isolado do usuário)
POST /api/v1/projects/:id/deploy

# 5. Ver telemetria (dados isolados)
GET /api/v1/telemetry/events
```
