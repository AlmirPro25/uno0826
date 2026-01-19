# 📄 RFC-Frontend-Audit-V1: Strategic Alignment Map

**Projeto**: PROST-QS (Kernel Soberano)  
**Status**: Auditoria Inicial de Contratos (Frontend vs Backend)  
**Objetivo**: Identificar desvios, mocks e "pontas soltas" para consolidar a V1 de produção.

---

## 🏗️ 1. Panorama Geral das Rotas Admin

O Admin Panel possui **7 páginas núcleo**. Abaixo, o estado de conexão de cada uma com o Backend (Oracle/Neon).

| Rota Frontend | Status Conexão | Endpoint Backend Principal | Gravidade |
| :--- | :--- | :--- | :--- |
| `/admin` (War Dashboard) | 🟢 Conectado | `/api/v1/admin/dashboard` | Baixa |
| `/admin/users` (Identity Registry) | 🟡 Parcial | `/api/v1/admin/users` | **Alta (Mismatch)** |
| `/admin/payments` (Ledger) | 🟢 Conectado | `/api/v1/admin/payments` | Média |
| `/admin/intelligence` (Oracle) | 🟢 Conectado | `/api/v1/admin/cognitive/narrate` | Baixa |
| `/admin/governance` (Console) | 🟢 Conectado | `/api/v1/admin/kill-switch` | Baixa |
| `/admin/health` (Vitals) | 🟢 Conectado | `/api/v1/health` | Baixa |
| `/admin/settings` (Settings) | 🔴 **MOCK** | N/A | Média |

---

## 🔍 2. Auditoria Detalhada por Rota

### 2.1 Identity Registry (`/admin/users`)
*   **Problema Real**: Existe um choque estrutural entre o modelo de dados do frontend e a resposta do backend.
*   **Divergência**: 
    *   Backend retorna `User` com `Profile` aninhado (`user.profile.name`).
    *   Frontend espera `user.name` e `user.email` no nível raiz (conforme `types/index.ts`).
*   **Estado**: Lista carrega mas exibe "UNIDENTIFIED" pois não encontra as propriedades.
*   **Prioridade**: 🔴 **Quebra Funcional** (Visual)

### 2.2 War Dashboard (`/admin`)
*   **Problema Real**: Polling está ativo (10s), mas alguns KPIs de "Pressão" podem estar retornando zero se a telemetria não estiver ingerindo dados reais.
*   **Divergência**: O dashboard espera `warobs.data.data.pressure`, o backend retorna um objeto complexo. Verificar se o mapeamento de `overall_score` está correto.
*   **Prioridade**: 🟡 **Incompleto** (Validação de Dados)

### 2.3 Platform Settings (`/admin/settings`)
*   **Problema Real**: A página é puramente visual. O botão "Commit Changes" simula um `setTimeout`.
*   **Ação Necessária**: Criar `GET/PUT /api/v1/admin/settings` no backend ou mapear para as tabelas de configuração existentes.
*   **Prioridade**: 🔴 **Incompleto**

### 2.4 Cognitive Oracle (`/admin/intelligence`)
*   **Problema Real**: O path na `API_MAP_V1.md` estava `/admin/narrator/generate`, mas o código real do backend e frontend usam `/admin/cognitive/narrate`.
*   **Divergência**: Documentação desalinhada com a implementação.
*   **Prioridade**: 🟢 **OK** (Apenas alinhar Docs)

---

## 🛠️ 3. Checklist de Correção Incremental (O Plano de Guerra)

### Fase 1: Sincronização de Identidade (Prioridade Máxima)
- [ ] Ajustar `frontend/src/types/index.ts` para refletir o modelo `SovereignIdentity` do backend.
- [ ] Corrigir `AdminUsersPage` para acessar `user.profile.name` ou mapear a resposta no `api.ts`.
- [ ] Implementar as ações de Suspend/Ban (Backend já tem, Frontend não tem botões).

### Fase 2: Conexão de Settings
- [ ] Criar handler de Configurações no Backend.
- [ ] Substituir `setTimeout` do Frontend por chamadas `api.put`.

### Fase 3: Observabilidade Real
- [ ] Validar se o `WarObsMiddleware` está populando corretamente o buffer de pressão no Oracle.
- [ ] Adicionar estados de `Empty` e `Error` mais robustos nas tabelas (hoje ficam em loading eterno se falhar feio).

---

## 💡 4. Próxima Decisão

Eu identifiquei que o "nó" mais crítico agora é a **página de usuários** (dados aparecem mas ficam 'nulos' visualmente) e as **configurações** (que são mock).

**Onde você quer bater o martelo primeiro?**
1.  **Resolver a Identidade**: Ajustar os tipos e garantir que a lista de usuários mostre nomes e emails reais.
2.  **Materializar Settings**: Criar as rotas de backend para que as configurações de admin sejam persistentes.
3.  **Auditoria de Telemetria**: Verificar por que o War Dashboard pode estar mostrando "0% de Pressão" mesmo com tráfego.

Aguardando seu comando estratégico.
