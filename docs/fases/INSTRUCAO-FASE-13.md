# FASE 13 - DECISÃO ASSISTIDA (HITL REAL)

> "Toda ação sensível executada pelo sistema tem um humano identificável que conscientemente disse sim."

**Status**: 🟢 CONCLUÍDA - HOMOLOGADA PELO TECH LEAD  
**Pré-requisito**: Fase 12 ✅  
**Data de Conclusão**: 28/12/2025

---

## IMPLEMENTAÇÃO ATUAL

### 13.1 - Authority Resolution Engine ✅
- `DecisionAuthority` - entidade com poder limitado e rastreável
- `AuthorityRole` - papéis institucionais (super_admin, tech_lead, finance_officer, ops_manager, auditor)
- `AuthorityScope` - escopos de autoridade (domain, actions, max_amount, max_impact)
- `Resolve()` - função central que responde "quem pode aprovar isso?"
- `evaluateAuthority()` - avalia cada autoridade com razões de exclusão
- Bloqueio de auto-aprovação
- Detecção de escalação quando ninguém pode aprovar

### 13.2 - Approval Workflow ✅
- `ApprovalRequest` - entidade IMUTÁVEL após criação
- `ApprovalDecision` - EVENTO (nunca apagado, nunca modificado)
- Hash de integridade para cada decisão
- Snapshot de autoridades elegíveis no momento da criação
- Rastreabilidade completa (IP, UserAgent, Timestamp)
- Justificativa obrigatória (mínimo 10 caracteres)

### Testes Realizados ✅
- [x] Criar solicitação de aprovação
- [x] Aprovar solicitação (com justificativa)
- [x] Rejeitar solicitação (com justificativa)
- [x] Bloquear auto-aprovação
- [x] Detectar escalação para impacto crítico
- [x] Rastreabilidade completa na decisão

---

## CONTEXTO

Até a Fase 11, construímos **governança**.  
Na Fase 12, construímos **prudência operacional**.  
A Fase 13 é sobre **decisão humana assistida, sem perder soberania**.

---

## O PROBLEMA QUE A FASE 13 RESOLVE

Hoje o sistema sabe dizer:
- "isso é arriscado"
- "isso precisa revisão"

Mas **quem decide** ainda está fora do modelo.

A Fase 13 responde:
> Quem pode aprovar o quê, em qual contexto, com qual responsabilidade registrada?

---

## CONCEITO CENTRAL: DECISION AUTHORITY

Não é usuário genérico. Não é admin mágico.  
É uma **entidade com poder limitado e rastreável**.

### Exemplos

| Authority | Pode aprovar | Limite |
|-----------|--------------|--------|
| Tech Lead | `update_config` | até impacto médio |
| Finance Officer | `create_ad` | dentro de budget |
| Ninguém | `transfer_funds` | workflow externo obrigatório |

### Cada aprovação gera

- Evento auditável
- Justificativa obrigatória
- Responsabilidade explícita

---

## O QUE NÃO FAZER (PROIBIÇÕES)

❌ Não automatizar aprovação  
❌ Não usar score como decisão final  
❌ Não esconder o humano atrás de "AI recommendation"  
❌ Não permitir aprovação silenciosa  
❌ Não misturar identidade humana com identidade de agente  

**Se fizer qualquer um desses, destrói tudo que foi construído.**

---

## CRITÉRIO DE SUCESSO

A Fase 13 só está pronta quando for possível afirmar:

> "Toda ação sensível executada pelo sistema tem um humano identificável que conscientemente disse sim."

Não "o sistema decidiu". Não "foi automático".  
**Um humano. Um registro. Uma razão.**

---

## ARQUIVOS CRIADOS

```
internal/authority/
  ├── model.go      ✅ DecisionAuthority, AuthorityScope, ImpactLevel
  ├── service.go    ✅ Resolve(), Grant(), Revoke(), CanUserApprove()
  └── handler.go    ✅ REST API

internal/approval/
  ├── model.go      ✅ ApprovalRequest, ApprovalDecision, ApprovalChain
  ├── service.go    ✅ CreateRequest(), Decide(), GetPending()
  └── handler.go    ✅ REST API
```

---

## ENDPOINTS DA API

### Authority (Autoridades)
```
POST   /api/v1/authority/resolve      # Resolver quem pode aprovar
POST   /api/v1/authority/can-approve  # Verificar se usuário pode aprovar
GET    /api/v1/authority              # Listar todas autoridades
GET    /api/v1/authority/:id          # Buscar autoridade por ID
GET    /api/v1/authority/user/:userId # Buscar autoridades de usuário
POST   /api/v1/authority/grant        # Conceder autoridade (super_admin)
DELETE /api/v1/authority/:id          # Revogar autoridade (super_admin)
```

### Approval (Aprovações)
```
POST   /api/v1/approval/request       # Criar solicitação de aprovação
POST   /api/v1/approval/decide        # Registrar decisão humana
GET    /api/v1/approval/request/:id   # Buscar solicitação por ID
GET    /api/v1/approval/pending       # Listar pendentes
GET    /api/v1/approval/pending/me    # Listar pendentes para mim
GET    /api/v1/approval/chain/:id     # Buscar cadeia de decisões
GET    /api/v1/approval/history       # Histórico (admin)
GET    /api/v1/approval/domain/:domain # Por domínio (admin)
```

---

## MODELO CONCEITUAL

```go
// DecisionAuthority - quem pode aprovar o quê
type DecisionAuthority struct {
    ID          uuid.UUID
    UserID      uuid.UUID   // humano real
    Role        string      // tech_lead, finance_officer, etc
    Scopes      []AuthorityScope
    MaxImpact   ImpactLevel // até onde pode aprovar
    CreatedBy   uuid.UUID   // quem concedeu autoridade
    Reason      string      // por que tem essa autoridade
}

// AuthorityScope - escopo de autoridade
type AuthorityScope struct {
    Domain      string   // billing, ads, config
    Actions     []string // quais ações pode aprovar
    MaxAmount   int64    // limite de valor
}

// ApprovalRecord - registro de aprovação
type ApprovalRecord struct {
    ID              uuid.UUID
    RequestID       uuid.UUID
    AuthorityID     uuid.UUID
    Decision        string    // approved, rejected, escalated
    Justification   string    // obrigatório
    Timestamp       time.Time
    // Rastreabilidade
    IP              string
    UserAgent       string
}
```

---

## FLUXO DE APROVAÇÃO

```
1. Ação sensível detectada (Shadow Mode ou Policy)
2. Sistema cria ApprovalRequest
3. Notifica autoridades elegíveis
4. Humano analisa:
   - O que o agente quis fazer
   - O que teria acontecido
   - Recomendação do sistema
5. Humano decide:
   - Aprovar (com justificativa)
   - Rejeitar (com justificativa)
   - Escalar (para autoridade superior)
6. Decisão registrada no Audit Log
7. Se aprovado: execução real
8. Se rejeitado: agente notificado
```

---

## VERDADE FINAL

> "O caminho agora não é mais técnico. É institucional."

A Fase 13 transforma o PROST-QS de "sistema que governa" para "sistema que serve decisões humanas".

---

## PRÓXIMOS PASSOS

1. ✅ Integrar ApprovalService com GovernedAgentService
2. ✅ Criar fluxo automático: Shadow Mode → ApprovalRequest
3. ⬜ Implementar notificações para autoridades elegíveis
4. ⬜ Criar endpoint de execução pós-aprovação

---

## INTEGRAÇÃO REALIZADA

### GovernedAgentService + ApprovalService
- Quando uma ação entra em Shadow Mode com recomendação `safe_to_promote` ou `needs_review`, um `ApprovalRequest` é criado automaticamente
- O contexto do Shadow Mode (intent, simulação, risk score) é preservado no ApprovalRequest
- O fluxo completo: Agente → Autonomy Check → Shadow Mode → ApprovalRequest → Decisão Humana

### Fluxo End-to-End
```
1. Agente tenta ação (ex: create_ad)
2. Autonomy Service verifica matriz → Shadow Mode
3. Shadow Service simula ação
4. Se recomendação = safe_to_promote ou needs_review:
   → ApprovalRequest criado automaticamente
5. Humano com autoridade elegível decide
6. Decisão registrada com hash de integridade
7. Se aprovado: execução real pode prosseguir
```

---

*Fase 13 CONCLUÍDA e homologada pelo Tech Lead em 28/12/2025.*

---

## DECLARAÇÃO INSTITUCIONAL

> "O PROST-QS agora é incapaz, por arquitetura, de executar uma ação sensível sem autoria humana explícita, contextualizada e registrável no tempo."

### O que mudou ontologicamente:
- **Antes**: O sistema governava ações
- **Agora**: A decisão existe como entidade humana formal

### Garantias constitucionais:
- O agente não "pede permissão"; ele **submete intenção**
- O humano não "clica"; ele **assume autoria**
- A execução é **consequência**, não causa

### Próximo território (Fase 14):
- Decisões que expiram
- Decisões que entram em conflito
- Decisões que precisam ser revistas
- Decisões que viram precedentes

> "O PROST-QS deixou de ser apenas um sistema governado. Ele se tornou um sistema **responsável**."
