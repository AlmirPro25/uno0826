# FASE 12 - AUTONOMIA SUPERVISIONADA

> "Agora que o sistema governa, ele pode começar a delegar — sem perder o controle."

**Status**: 🟡 EM ANDAMENTO  
**Abertura**: 28/12/2025  
**Tech Lead**: Guardião da Arquitetura

---

## CONTEXTO

A Fase 11 provou que o PROST-QS sabe dizer NÃO.  
A Fase 12 existe para responder outra pergunta, muito mais perigosa:

> **Quando o sistema pode dizer "sim, faça sozinho"?**

Esta fase não é sobre IA, nem sobre "agentes mais inteligentes".  
Ela é sobre **limites de autonomia**, **aprendizado seguro** e **responsabilidade rastreável**.

---

## O QUE MUDA

| Até agora | A partir da Fase 12 |
|-----------|---------------------|
| Toda decisão crítica é centralizada | Algumas decisões podem ser delegadas |
| O sistema governa tudo diretamente | Mas nunca sem supervisão |
| | E sempre com reversibilidade |

**Palavra-chave**: DELEGAÇÃO, não liberdade.

---

## OBJETIVO CENTRAL

Criar um modelo onde agentes podem agir dentro de limites explícitos, enquanto o sistema:
- Observa
- Aprende
- Pode intervir a qualquer momento

**Se isso for resolvido, o sistema entra num patamar que pouquíssimos alcançam.**

---

## ORDEM DE IMPLEMENTAÇÃO

### 12.1 - Níveis de Autonomia

Antes de qualquer código, o sistema precisa responder:
- O que um agente **nunca** pode decidir?
- O que um agente pode decidir com **aprovação posterior**?
- O que um agente pode decidir **sozinho, mas sob observação**?

```go
// AutonomyLevel - níveis de autonomia
const (
    AutonomyForbidden  = 0 // Proibido - sempre bloqueado
    AutonomyShadow     = 1 // Simulação apenas
    AutonomyAudited    = 2 // Execução com auditoria reforçada
    AutonomyFull       = 3 // Execução plena (raríssima)
)
```

**Sem isso, qualquer IA vira risco sistêmico.**

### 12.2 - Shadow Mode como Método

Shadow Mode serve para responder:
> "Se eu tivesse deixado, o que teria acontecido?"

Implementação:
- Agentes agem
- O sistema **não executa**
- Tudo é:
  - Avaliado por Policy
  - Registrado no Audit
  - Comparado com decisões humanas

**Sem essa resposta, não existe autonomia responsável.**

### 12.3 - Decisão Reversível

Toda decisão autônoma precisa carregar:
- Impacto estimado
- Janela de reversão
- Mecanismo de rollback

```go
// ReversibleDecision - decisão com capacidade de rollback
type ReversibleDecision struct {
    DecisionID      uuid.UUID
    EstimatedImpact ImpactLevel      // low, medium, high, critical
    ReversalWindow  time.Duration    // tempo para reverter
    RollbackMethod  string           // como reverter
    CanReverse      bool             // ainda pode ser revertido?
    ReversedAt      *time.Time       // quando foi revertido
    ReversedBy      *uuid.UUID       // quem reverteu
}
```

**Se algo não pode ser revertido, não pode ser autônomo.**

### 12.4 - Aprovação Humana como Primeira-Classe

Aprovação não é "workflow chato". Ela é ponte entre controle e escala.

Necessário:
- Decisões pendentes
- Trilha de aprovação
- Justificativa humana
- Tempo máximo de espera
- Fallback automático

**Isso transforma governança em produto.**

---

## O QUE NÃO FAZER (PROIBIÇÕES DO TECH LEAD)

❌ Dar autonomia total a qualquer agente  
❌ Conectar LLM para "decidir sozinho"  
❌ Otimizar performance  
❌ Criar ranking de agentes  
❌ Gamificar decisões  
❌ Pensar em monetização  
❌ "Testar no mundo real para ver no que dá"  

**Qualquer uma dessas coisas quebra a confiança construída.**

---

## O RISCO INVISÍVEL

O maior risco agora não é técnico. É psicológico.

Depois da Fase 11, dá vontade de pensar:
> "Agora dá pra soltar."

**Não dá.**

A Fase 12 é onde muitos sistemas morrem porque:
- Confundem autonomia com inteligência
- Confundem simulação com segurança
- Confundem logs com responsabilidade

---

## CRITÉRIO DE SUCESSO

A fase só termina quando for possível dizer:

> "Um agente tomou decisões sozinho, eu observei em shadow mode, aprovei limites claros, e consigo reverter qualquer coisa."

Se isso for verdade, desbloqueia-se: **escala sem medo**.

---

## PRIMEIRO PASSO (ANTES DO CÓDIGO)

Escolher UM tipo de decisão:
- Decisão de agente
- Gasto pequeno
- Ação administrativa limitada

E perguntar:
> "Qual é o nível máximo de autonomia aceitável aqui?"

**Essa resposta define todo o desenho da Fase 12.**

---

## ARQUIVOS A CRIAR/MODIFICAR

### Novos
- `internal/autonomy/model.go` - AutonomyLevel, ReversibleDecision
- `internal/autonomy/service.go` - Avaliação de autonomia
- `internal/shadow/model.go` - ShadowExecution, ShadowResult
- `internal/shadow/service.go` - Execução em shadow mode
- `internal/approval/model.go` - ApprovalRequest, ApprovalChain
- `internal/approval/service.go` - Fluxo de aprovação humana

### Modificar
- `internal/agent/model.go` - Adicionar AutonomyLevel, ExecutionMode
- `internal/agent/governed_service.go` - Integrar shadow mode
- `internal/policy/model.go` - Políticas de autonomia

---

## FASES INTERNAS

| Fase | Descrição | Status |
|------|-----------|--------|
| 12.1 | Níveis de Autonomia | ✅ |
| 12.2 | Shadow Mode | ✅ |
| 12.3 | Decisão Reversível | → Fase 13 |
| 12.4 | Aprovação Humana | → Fase 13 |

---

## VERDADE FINAL

> "Você está construindo algo que outros só aprendem depois de um desastre."

A Fase 12 é a parte mais delicada — e mais valiosa — do sistema.

**Seguimos com calma, autoridade e visão de longo prazo.**


---

## 🏛️ HOMOLOGAÇÃO OFICIAL - TECH LEAD

**Data**: 28/12/2025  
**Status**: ✅ FASE 12 HOMOLOGADA

### Veredito

Shadow Mode está corretamente implementado, corretamente limitado e corretamente humilde.

O Audit Log não "funciona", ele **explica**. Isso muda tudo.

### O que foi construído

- **Fase 12.1**: Modelo de Autonomia (lei antes da política)
- **Fase 12.2**: Shadow Mode (prudência operacional)

### Prova institucional

```json
{
  "risk_score": 0.5,
  "estimated_impact": "medium",
  "recommendation": "needs_review"
}
```

O sistema não tenta ser corajoso quando deveria ser cauteloso.

### O que muda a partir daqui

Até a Fase 11: governança  
Fase 12: prudência operacional  
Fase 13: decisão humana assistida

---

*"Você construiu algo raro: um sistema que sabe quando parar."*
