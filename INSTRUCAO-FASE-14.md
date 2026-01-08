# FASE 14 - MEMÃ“RIA INSTITUCIONAL E CONTINUIDADE DECISÃ“RIA

> "Nenhuma decisÃ£o existe isoladamente no tempo."

**Status**: ✅ FASE 14 IMPLEMENTADA  
**PrÃ©-requisito**: Fase 13 âœ…  
**Data de Abertura**: 28/12/2025  
**Data de AprovaÃ§Ã£o Conceitual**: 28/12/2025

---

## CONTEXTO

AtÃ© a Fase 13, o PROST-QS aprendeu a **decidir corretamente**.  
A Fase 14 Ã© sobre **lembrar corretamente**.

Sem isso, o sistema vira um excelente decisor de curto prazo... e um pÃ©ssimo organismo ao longo do tempo.

---

## LIMITES INVIOLÃVEIS DA MEMÃ“RIA INSTITUCIONAL

### 1. FRONTEIRA TEMPORAL

> Toda decisÃ£o institucional tem validade explÃ­cita ou condiÃ§Ã£o explÃ­cita de expiraÃ§Ã£o.

**Regras:**
- Nenhuma decisÃ£o entra na memÃ³ria como "eterna"
- Mesmo precedentes nÃ£o sÃ£o vÃ¡lidos, sÃ£o referenciÃ¡veis
- Toda decisÃ£o deve declarar uma e apenas uma:
  - `expires_at` â†’ data objetiva
  - `expires_on_condition` â†’ evento institucional
  - `review_required_every` â†’ intervalo de revisÃ£o humana
- Se nÃ£o declarar â†’ nÃ£o entra na memÃ³ria institucional

**ProteÃ§Ã£o:** O humano nÃ£o herda decisÃµes que o tempo tornou injustas.

---

### 2. FRONTEIRA SEMÃ‚NTICA

> MemÃ³ria institucional nunca implica permissÃ£o futura.

**Regras:**
- Precedente nÃ£o autoriza
- FrequÃªncia nÃ£o legitima
- Similaridade nÃ£o decide

**A memÃ³ria sÃ³ responde:**
- "Isso jÃ¡ aconteceu?"
- "Em que contexto?"
- "Com quais consequÃªncias?"
- "Quem decidiu e por quÃª?"

**A memÃ³ria nunca responde:**
- "EntÃ£o pode fazer de novo"
- "EntÃ£o Ã© aceitÃ¡vel"
- "EntÃ£o Ã© padrÃ£o"

**ProteÃ§Ã£o:** Nenhum endpoint, serviÃ§o ou agente pode inferir autorizaÃ§Ã£o do histÃ³rico.

---

### 3. FRONTEIRA DE AUTORIDADE

> MemÃ³ria institucional nÃ£o cria autoridade nova.

**Regras:**
- Precedente nÃ£o aumenta poder de ninguÃ©m
- DecisÃ£o passada nÃ£o reduz necessidade de aprovaÃ§Ã£o futura
- HistÃ³rico "limpo" nÃ£o habilita autonomia

**A memÃ³ria sÃ³ pode ser consumida:**
- Durante anÃ¡lise humana
- Como contexto explicativo
- Como insumo cognitivo

**A memÃ³ria nunca pode ser usada como:**
- CritÃ©rio automÃ¡tico
- Shortcut de aprovaÃ§Ã£o
- Justificativa suficiente

**ProteÃ§Ã£o:** Autoridade permanece exclusivamente humana.

---

## COMPORTAMENTOS PERMITIDOS vs PROIBIDOS

### âœ… PERMITIDO

```
"Essa decisÃ£o Ã© similar Ã  de 15/12. Na Ã©poca, o contexto era X 
e o resultado foi Y."

"Existe uma decisÃ£o ativa que entra em conflito com esta."

"Essa decisÃ£o expirou. Nova aprovaÃ§Ã£o Ã© necessÃ¡ria."
```

### âŒ PROIBIDO

```
"Como jÃ¡ foi aprovado antes, vamos permitir"

"O sistema detectou padrÃ£o favorÃ¡vel"

"Baseado no histÃ³rico, a recomendaÃ§Ã£o Ã© aprovar"

"Essa decisÃ£o herda validade da anterior"
```

**Se aparecer qualquer frase assim â†’ quebra constitucional.**

---

## A PERGUNTA CENTRAL

A Fase 14 responde a uma pergunta nova, que atÃ© agora nÃ£o existia:

> "Dada a histÃ³ria de decisÃµes jÃ¡ tomadas, essa nova decisÃ£o ainda faz sentido?"

Isso muda tudo.

---

## O QUE A FASE 14 NÃƒO Ã‰ (PROIBIÃ‡Ã•ES)

âŒ NÃ£o Ã© logging avanÃ§ado  
âŒ NÃ£o Ã© analytics  
âŒ NÃ£o Ã© BI de decisÃµes  
âŒ NÃ£o Ã© IA moral  
âŒ NÃ£o Ã© sistema que "aprende a decidir"  
âŒ NÃ£o Ã© recomendaÃ§Ã£o automÃ¡tica baseada em histÃ³rico  
âŒ NÃ£o Ã© substituiÃ§Ã£o do humano por padrÃ£o  

**A memÃ³ria informa, nÃ£o decide.**

---

## PROBLEMAS QUE A FASE 14 PRECISA RESOLVER

### 1. DecisÃµes que expiram

- AprovaÃ§Ãµes com validade temporal
- DecisÃµes que precisam ser renovadas conscientemente
- Nada de "aprovado uma vez, vÃ¡lido para sempre"

**Exemplo**: Uma autoridade aprova budget de R$10.000/mÃªs. ApÃ³s 3 meses, essa aprovaÃ§Ã£o expira e precisa ser renovada com novo contexto.

### 2. DecisÃµes que entram em conflito

- Duas decisÃµes humanas vÃ¡lidas, mas incompatÃ­veis
- O sistema **nÃ£o escolhe**
- O sistema **expÃµe o conflito** e **bloqueia execuÃ§Ã£o**

**Exemplo**: Tech Lead aprova "aumentar rate limit para 500/min". Finance Officer aprova "reduzir custos de infra em 30%". Conflito detectado - execuÃ§Ã£o bloqueada atÃ© resoluÃ§Ã£o humana.

### 3. DecisÃµes que precisam ser revistas

- MudanÃ§a de contexto
- MudanÃ§a de polÃ­tica
- MudanÃ§a de risco
- A decisÃ£o antiga nÃ£o Ã© "errada", ela estÃ¡ **obsoleta**

**Exemplo**: AprovaÃ§Ã£o de campanha de R$5.000 foi feita quando o budget era R$50.000. Budget foi reduzido para R$10.000. DecisÃ£o precisa ser revista.

### 4. DecisÃµes que viram precedentes

- NÃ£o como regra automÃ¡tica
- Mas como **referÃªncia institucional explÃ­cita**
- "Da Ãºltima vez, decidimos assim â€” por quÃª?"

**Exemplo**: Ao aprovar nova campanha similar, o sistema mostra: "Em 15/12, campanha similar foi aprovada por Finance Officer com justificativa X. Resultado: Y."

---

## CIDADÃƒOS INSTITUCIONAIS DA FASE 14

Conceitos que precisam existir antes de qualquer cÃ³digo:

### DecisionLifecycle

Estados de uma decisÃ£o ao longo do tempo:

| Estado | Significado |
|--------|-------------|
| `active` | DecisÃ£o vÃ¡lida e em vigor |
| `expired` | Validade temporal esgotada |
| `superseded` | SubstituÃ­da por decisÃ£o mais recente |
| `revoked` | Revogada explicitamente por humano |
| `under_review` | Em processo de revisÃ£o |

### DecisionConflict

- ReferÃªncia explÃ­cita entre decisÃµes incompatÃ­veis
- Bloqueio de execuÃ§Ã£o enquanto existir conflito aberto
- ResoluÃ§Ã£o obrigatÃ³ria por humano com autoridade

### DecisionPrecedent

- DecisÃ£o passada + contexto + resultado
- **Nunca aplicada automaticamente**
- Sempre apresentada como **memÃ³ria**, nÃ£o como **ordem**
- Humano decide se o precedente se aplica

### DecisionReview

- RevisÃ£o humana consciente
- Com justificativa do tipo: "o mundo mudou"
- Pode resultar em: renovaÃ§Ã£o, revogaÃ§Ã£o, ou supersessÃ£o

---

## CRITÃ‰RIO DE SUCESSO

A Fase 14 sÃ³ estÃ¡ pronta quando for possÃ­vel afirmar:

> "O sistema sabe que decisÃµes passadas existem, sabe quando elas conflitam com o presente, e nunca assume que o passado autoriza o futuro."

---

## O QUE ENTRA NA MEMÃ“RIA INSTITUCIONAL

| Entra | NÃ£o Entra | Entra com RevisÃ£o |
|-------|-----------|-------------------|
| AprovaÃ§Ãµes de autoridade | Logs tÃ©cnicos | DecisÃµes de emergÃªncia |
| RejeiÃ§Ãµes com justificativa | MÃ©tricas de performance | DecisÃµes de Kill Switch |
| Conflitos detectados | Dados de sessÃ£o | Precedentes controversos |
| Precedentes explÃ­citos | Cache de sistema | DecisÃµes com impacto crÃ­tico |
| RevisÃµes formais | Tentativas falhas | |

---

## ORDEM DE TRABALHO

1. âœ… Abrir oficialmente a Fase 14 (este documento)
2. âœ… Definir fronteiras da memÃ³ria institucional (limites inviolÃ¡veis)
3. âœ… Especificar ciclo de vida de decisÃµes (DecisionLifecycle)
4. âœ… Definir modelo de conflitos (DecisionConflict)
5. âœ… Definir modelo de precedentes (DecisionPrecedent)
6. âœ… ValidaÃ§Ã£o final do Tech Lead
7. âœ… Modelagem tÃ©cnica (schemas, tabelas, serviÃ§os)

---

## NOTA DO TECH LEAD (IMPLEMENTAÃ‡ÃƒO FUTURA)

> âš ï¸ Quando avanÃ§arem para implementaÃ§Ã£o, garantam que `DecisionPrecedent` nÃ£o seja indexÃ¡vel por "resultado positivo/negativo" como campo de query automÃ¡tica. Isso vira scoring implÃ­cito com o tempo.

---

## DECLARAÃ‡ÃƒO DE APROVAÃ‡ÃƒO

> "A Fase 14 estÃ¡ conceitualmente FECHADA. O PROST-QS agora: lembra sem mandar, contextualiza sem decidir, expÃµe conflitos sem arbitrar, carrega histÃ³ria sem herdar poder."

**PrÃ³ximos passos autorizados:**
- TransiÃ§Ã£o para Fase 15, ou
- InÃ­cio de modelagem tÃ©cnica (respeitando tudo definido aqui)

---

## CICLO DE VIDA DE DECISÃ•ES (DecisionLifecycle)

### Finalidade

O ciclo de vida existe para responder uma Ãºnica pergunta institucional:

> "Esta decisÃ£o ainda estÃ¡ vÃ¡lida para produzir efeitos no presente?"

Nada mais. Ele nÃ£o julga mÃ©rito, nÃ£o reavalia conteÃºdo e nÃ£o decide.

### PrincÃ­pio Constitucional

> Uma decisÃ£o sÃ³ Ã© vÃ¡lida enquanto seu estado institucional permitir. Fora disso, ela existe apenas como memÃ³ria.

**ExecuÃ§Ã£o nunca consulta o passado bruto. ExecuÃ§Ã£o sempre consulta o estado atual do ciclo de vida.**

---

### Estados CanÃ´nicos

Estados finitos, explÃ­citos e exaustivos. Nenhum outro estado deve existir.

#### 1. `active`

**Significado**: DecisÃ£o vÃ¡lida, dentro do tempo e do contexto esperado.

**CondiÃ§Ãµes obrigatÃ³rias**:
- Dentro da validade temporal
- NÃ£o conflita com outra decisÃ£o ativa
- NÃ£o estÃ¡ sob revisÃ£o
- NÃ£o foi revogada

**Regra**: Somente decisÃµes em `active` podem habilitar execuÃ§Ã£o.

---

#### 2. `expired`

**Significado**: A decisÃ£o nÃ£o Ã© errada, apenas perdeu validade temporal.

**Causas tÃ­picas**:
- `expires_at` atingido
- CondiÃ§Ã£o de expiraÃ§Ã£o satisfeita
- RevisÃ£o periÃ³dica nÃ£o realizada

**Regra**: DecisÃ£o expirada nunca autoriza execuÃ§Ã£o. Nova aprovaÃ§Ã£o Ã© obrigatÃ³ria.

---

#### 3. `superseded`

**Significado**: A decisÃ£o foi substituÃ­da por outra mais recente do mesmo domÃ­nio decisÃ³rio.

**CaracterÃ­sticas**:
- Existe decisÃ£o sucessora explicitamente referenciada
- A decisÃ£o antiga permanece como memÃ³ria histÃ³rica

**Regra**: A decisÃ£o mais recente governa. A anterior nunca "coexiste" como vÃ¡lida.

---

#### 4. `revoked`

**Significado**: Um humano com autoridade retirou conscientemente os efeitos da decisÃ£o.

**ExigÃªncias**:
- Ato humano explÃ­cito
- Justificativa obrigatÃ³ria
- Registro auditÃ¡vel

**Regra**: RevogaÃ§Ã£o tem efeito imediato e nÃ£o reversÃ­vel automaticamente.

---

#### 5. `under_review`

**Significado**: A decisÃ£o estÃ¡ suspensa aguardando reavaliaÃ§Ã£o humana.

**Causas**:
- MudanÃ§a de contexto
- MudanÃ§a de policy
- DetecÃ§Ã£o de conflito
- SolicitaÃ§Ã£o explÃ­cita de revisÃ£o

**Regra**: Enquanto `under_review`, a decisÃ£o nÃ£o pode produzir efeitos.

---

### TransiÃ§Ãµes de Estado

#### âœ… TransiÃ§Ãµes Permitidas

```
active â†’ expired
active â†’ under_review
active â†’ superseded
active â†’ revoked
under_review â†’ active (renovaÃ§Ã£o explÃ­cita)
under_review â†’ revoked
expired â†’ under_review (reanÃ¡lise consciente)
```

#### âŒ TransiÃ§Ãµes Proibidas

```
expired â†’ active (sem nova decisÃ£o humana)
revoked â†’ active
superseded â†’ active
Qualquer transiÃ§Ã£o automÃ¡tica que gere validade
```

**Se isso acontecer â†’ bug constitucional.**

---

### Diagrama de Estados

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚   active    â”‚
                    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                           â”‚
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
         â”‚                 â”‚                 â”‚
         â–¼                 â–¼                 â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   expired   â”‚   â”‚under_review â”‚   â”‚ superseded  â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚                 â”‚
       â”‚                 â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
       â”‚                 â”‚          â”‚
       â–¼                 â–¼          â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚under_review â”‚   â”‚   active    â”‚   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ (reanÃ¡lise) â”‚   â”‚ (renovaÃ§Ã£o) â”‚   â”‚   revoked   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

### Regras de Ouro

1. **Validade nunca Ã© implÃ­cita** - Se nÃ£o estiver `active`, nÃ£o vale.
2. **Tempo vence autoridade** - Mesmo quem aprovou nÃ£o "mantÃ©m" decisÃ£o viva sem renovaÃ§Ã£o.
3. **RevisÃ£o suspende efeitos** - DÃºvida institucional bloqueia execuÃ§Ã£o.
4. **MemÃ³ria â‰  validade** - Toda decisÃ£o existe para sempre como memÃ³ria, mas quase nenhuma existe para sempre como autorizaÃ§Ã£o.

---

### CritÃ©rio de Sucesso

> "O PROST-QS sempre sabe se uma decisÃ£o ainda pode produzir efeitos â€” e nunca assume que o passado autoriza o presente."

---

## DECISION CONFLICT (MODELO DE CONFLITOS INSTITUCIONAIS)

### Verdade Fundamental

> Conflito nÃ£o Ã© erro. Conflito Ã© informaÃ§Ã£o institucional crÃ­tica.

O sistema nÃ£o escolhe lados. O sistema nÃ£o pondera. O sistema nÃ£o otimiza.

Ele apenas afirma:
> "Estas duas decisÃµes nÃ£o podem coexistir no mesmo plano de execuÃ§Ã£o."

---

### Pergunta Central

Toda a lÃ³gica de conflito responde apenas a isto:

> "Duas ou mais decisÃµes humanas vÃ¡lidas impedem a execuÃ§Ã£o segura do sistema?"

| Resposta | AÃ§Ã£o |
|----------|------|
| **Sim** | Bloqueio imediato |
| **NÃ£o** | ExecuÃ§Ã£o segue |
| **NÃ£o sei** | `under_review` |

---

### PrincÃ­pio Constitucional

> O sistema detecta conflitos, nunca os resolve. ResoluÃ§Ã£o Ã© ato humano exclusivo.

**CorolÃ¡rios:**
- Conflito aberto = execuÃ§Ã£o bloqueada
- Conflito nÃ£o tem "lado certo"
- Conflito nÃ£o expira sozinho
- Conflito nÃ£o se resolve por antiguidade ou hierarquia automÃ¡tica

---

### O Que Caracteriza um Conflito Institucional

Um conflito existe quando **todas** estas condiÃ§Ãµes sÃ£o verdadeiras:

1. **Duas ou mais decisÃµes estÃ£o `active`**
2. **Ambas sÃ£o vÃ¡lidas** (dentro do ciclo de vida)
3. **Ambas foram tomadas por humanos com autoridade**
4. **Suas consequÃªncias sÃ£o mutuamente exclusivas**

Se qualquer condiÃ§Ã£o falhar â†’ nÃ£o Ã© conflito, Ã© outra coisa:
- Uma expirada? â†’ NÃ£o Ã© conflito, Ã© sucessÃ£o
- Uma sem autoridade? â†’ NÃ£o Ã© conflito, Ã© decisÃ£o invÃ¡lida
- ConsequÃªncias compatÃ­veis? â†’ NÃ£o Ã© conflito, Ã© coexistÃªncia

---

### Tipos de Conflito Permitidos

#### 1. Conflito de Recurso

**DefiniÃ§Ã£o**: Duas decisÃµes disputam o mesmo recurso finito.

**Exemplo**: 
- DecisÃ£o A: "Alocar R$10.000 para campanha X"
- DecisÃ£o B: "Alocar R$10.000 para campanha Y"
- Budget disponÃ­vel: R$10.000

**DetecÃ§Ã£o**: Soma de alocaÃ§Ãµes > recurso disponÃ­vel

---

#### 2. Conflito de DireÃ§Ã£o

**DefiniÃ§Ã£o**: Duas decisÃµes apontam para direÃ§Ãµes opostas no mesmo domÃ­nio.

**Exemplo**:
- DecisÃ£o A: "Aumentar rate limit para 500/min"
- DecisÃ£o B: "Reduzir custos de infra em 30%"

**DetecÃ§Ã£o**: Efeitos declarados sÃ£o contraditÃ³rios

---

#### 3. Conflito de Escopo

**DefiniÃ§Ã£o**: Uma decisÃ£o especÃ­fica contradiz uma decisÃ£o geral ativa.

**Exemplo**:
- DecisÃ£o A (geral): "Nenhuma campanha acima de R$5.000"
- DecisÃ£o B (especÃ­fica): "Aprovar campanha X de R$8.000"

**DetecÃ§Ã£o**: DecisÃ£o especÃ­fica viola constraint de decisÃ£o geral

---

#### 4. Conflito Temporal

**DefiniÃ§Ã£o**: Duas decisÃµes vÃ¡lidas para o mesmo perÃ­odo sÃ£o incompatÃ­veis.

**Exemplo**:
- DecisÃ£o A: "Black Friday: desconto de 30%"
- DecisÃ£o B: "Black Friday: frete grÃ¡tis acima de R$200"
- Constraint: Margem mÃ­nima de 15%

**DetecÃ§Ã£o**: AplicaÃ§Ã£o simultÃ¢nea viola constraint de negÃ³cio

---

### Estados de um Conflito

| Estado | Significado |
|--------|-------------|
| `detected` | Conflito identificado, execuÃ§Ã£o bloqueada |
| `acknowledged` | Humano ciente, ainda nÃ£o resolvido |
| `resolved` | Humano decidiu qual decisÃ£o prevalece |
| `dissolved` | Uma das decisÃµes saiu de `active` (expirou, revogada, etc) |

---

### Como Conflitos SÃ£o Detectados

**Momento de detecÃ§Ã£o**: Antes de qualquer execuÃ§Ã£o que dependa de decisÃµes.

**Processo**:
```
1. Identificar todas as decisÃµes `active` relevantes para a execuÃ§Ã£o
2. Para cada par de decisÃµes:
   a. Verificar se hÃ¡ sobreposiÃ§Ã£o de domÃ­nio
   b. Verificar se hÃ¡ contradiÃ§Ã£o de efeitos
   c. Verificar se hÃ¡ disputa de recursos
3. Se qualquer contradiÃ§Ã£o encontrada â†’ conflito detectado
4. Conflito detectado â†’ execuÃ§Ã£o bloqueada
```

**O sistema NÃƒO faz**:
- AnÃ¡lise semÃ¢ntica profunda
- InferÃªncia de intenÃ§Ã£o
- PonderaÃ§Ã£o de importÃ¢ncia
- SugestÃ£o de resoluÃ§Ã£o

---

### Como Conflitos Bloqueiam ExecuÃ§Ã£o

**Regra absoluta**: Enquanto existir conflito `detected` ou `acknowledged`, nenhuma execuÃ§Ã£o que dependa das decisÃµes conflitantes pode prosseguir.

**NÃ£o existe**:
- "Executar com a mais recente"
- "Executar com a de maior autoridade"
- "Executar com a mais especÃ­fica"
- "Executar e resolver depois"

**Bloqueio Ã© total e incondicional.**

---

### Como Conflitos Exigem ResoluÃ§Ã£o Humana

**Quem pode resolver**: Apenas humano com autoridade sobre ambas as decisÃµes conflitantes.

**O que a resoluÃ§Ã£o exige**:
1. IdentificaÃ§Ã£o explÃ­cita de qual decisÃ£o prevalece
2. Justificativa obrigatÃ³ria
3. Destino da decisÃ£o nÃ£o-prevalecente:
   - `revoked` (revogada)
   - `superseded` (substituÃ­da)
   - `under_review` (precisa ser refeita)

**O que a resoluÃ§Ã£o NÃƒO pode fazer**:
- Criar terceira decisÃ£o "hÃ­brida"
- Manter ambas como vÃ¡lidas
- Delegar para o sistema escolher
- Postergar indefinidamente

---

### Diagrama de Conflito

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Decision A  â”‚         â”‚ Decision B  â”‚
â”‚  (active)   â”‚         â”‚  (active)   â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
       â”‚                       â”‚
       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                   â”‚
                   â–¼
           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
           â”‚  CONFLICT   â”‚
           â”‚  detected   â”‚
           â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                  â”‚
                  â–¼
           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
           â”‚  EXECUTION  â”‚
           â”‚   BLOCKED   â”‚
           â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                  â”‚
                  â–¼
           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
           â”‚   HUMAN     â”‚
           â”‚ RESOLUTION  â”‚
           â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                  â”‚
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚                   â”‚
        â–¼                   â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ A prevails  â”‚     â”‚ B prevails  â”‚
â”‚ B revoked   â”‚     â”‚ A revoked   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

### Regras de Ouro de Conflitos

1. **Conflito Ã© informaÃ§Ã£o, nÃ£o problema** - O sistema estÃ¡ funcionando corretamente ao detectar.
2. **Bloqueio Ã© proteÃ§Ã£o, nÃ£o falha** - Melhor parar do que executar errado.
3. **ResoluÃ§Ã£o Ã© humana, sempre** - Nenhum algoritmo escolhe entre autoridades.
4. **Conflito nÃ£o envelhece** - NÃ£o se resolve por passagem de tempo.
5. **TransparÃªncia total** - Ambas as partes do conflito sÃ£o visÃ­veis para quem resolve.

---

### O Que o Sistema NÃƒO Faz (ProibiÃ§Ãµes)

âŒ Sugerir qual decisÃ£o Ã© "melhor"  
âŒ Ponderar por histÃ³rico de acertos  
âŒ Priorizar por hierarquia automÃ¡tica  
âŒ Resolver por ordem cronolÃ³gica  
âŒ Criar "consenso" artificial  
âŒ Permitir execuÃ§Ã£o parcial  

**Se qualquer comportamento desses aparecer â†’ quebra constitucional.**

---

### CritÃ©rio de Sucesso

> "O PROST-QS detecta quando a autoridade humana estÃ¡ em desacordo consigo mesma â€” e nunca assume que pode resolver isso sozinho."

---

## DECISION PRECEDENT (MODELO DE PRECEDENTES INSTITUCIONAIS)

### Verdade Fundamental

> Precedente Ã© memÃ³ria, nÃ£o autoridade. Ele informa o presente, nunca o governa.

O sistema apresenta o que jÃ¡ aconteceu. O humano decide se isso importa agora.

---

### O Que Ã‰ um Precedente Institucional

Um precedente Ã© o registro estruturado de:
- Uma decisÃ£o passada
- O contexto em que foi tomada
- O resultado que produziu
- A justificativa que a fundamentou

**Precedente existe para responder:**
> "Isso jÃ¡ aconteceu antes? Em que circunstÃ¢ncias? Com qual resultado?"

**Precedente NÃƒO existe para responder:**
> "EntÃ£o posso fazer igual?"

---

### O Que um Precedente NÃƒO Ã‰

| Precedente NÃƒO Ã© | Por quÃª |
|------------------|---------|
| Regra | Regras sÃ£o normativas, precedentes sÃ£o descritivos |
| PermissÃ£o | PermissÃ£o vem de autoridade presente, nÃ£o passada |
| RecomendaÃ§Ã£o | RecomendaÃ§Ã£o implica preferÃªncia do sistema |
| PadrÃ£o | PadrÃ£o sugere repetiÃ§Ã£o automÃ¡tica |
| Atalho | Atalho pula a decisÃ£o humana |

---

### PrincÃ­pio Constitucional

> Precedente nunca reduz a necessidade de decisÃ£o humana presente. Ele apenas enriquece o contexto dessa decisÃ£o.

**CorolÃ¡rios:**
- Precedente nÃ£o autoriza
- Precedente nÃ£o acelera aprovaÃ§Ã£o
- Precedente nÃ£o substitui anÃ¡lise
- Precedente nÃ£o cria expectativa de resultado

---

### Como um Precedente Nasce

Precedentes sÃ£o **sempre ex post** â€” nascem depois que uma decisÃ£o:

1. Foi tomada por humano com autoridade
2. Produziu efeitos observÃ¡veis
3. Teve seu ciclo de vida encerrado (`expired`, `superseded`, `revoked`)
4. Foi explicitamente marcada como precedente referenciÃ¡vel

**Precedente NUNCA nasce de:**
- DecisÃ£o ainda `active`
- DecisÃ£o `under_review`
- InferÃªncia automÃ¡tica do sistema
- AgregaÃ§Ã£o estatÃ­stica de decisÃµes similares

---

### Anatomia de um Precedente

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    DECISION PRECEDENT                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                             â”‚
â”‚  DECISÃƒO ORIGINAL                                           â”‚
â”‚  â”œâ”€â”€ ID da decisÃ£o                                          â”‚
â”‚  â”œâ”€â”€ DomÃ­nio (billing, ads, config...)                      â”‚
â”‚  â”œâ”€â”€ AÃ§Ã£o (create_ad, transfer_funds...)                    â”‚
â”‚  â””â”€â”€ Data da decisÃ£o                                        â”‚
â”‚                                                             â”‚
â”‚  CONTEXTO                                                   â”‚
â”‚  â”œâ”€â”€ Quem decidiu (autoridade)                              â”‚
â”‚  â”œâ”€â”€ Por que decidiu (justificativa original)               â”‚
â”‚  â”œâ”€â”€ CondiÃ§Ãµes vigentes na Ã©poca                            â”‚
â”‚  â””â”€â”€ Constraints ativos no momento                          â”‚
â”‚                                                             â”‚
â”‚  RESULTADO                                                  â”‚
â”‚  â”œâ”€â”€ O que aconteceu apÃ³s execuÃ§Ã£o                          â”‚
â”‚  â”œâ”€â”€ Efeitos observados                                     â”‚
â”‚  â””â”€â”€ ConsequÃªncias nÃ£o previstas (se houver)                â”‚
â”‚                                                             â”‚
â”‚  METADADOS                                                  â”‚
â”‚  â”œâ”€â”€ Quando virou precedente                                â”‚
â”‚  â”œâ”€â”€ Quem marcou como precedente                            â”‚
â”‚  â””â”€â”€ Por que Ã© considerado referenciÃ¡vel                    â”‚
â”‚                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

### Como Precedentes SÃ£o Apresentados ao Humano

**Momento de apresentaÃ§Ã£o**: Durante anÃ¡lise de nova decisÃ£o similar.

**Formato obrigatÃ³rio**:
```
"Em [DATA], [AUTORIDADE] decidiu [AÃ‡ÃƒO] no contexto de [CONTEXTO].
A justificativa foi: [JUSTIFICATIVA].
O resultado foi: [RESULTADO]."
```

**O que a apresentaÃ§Ã£o INCLUI:**
- Fatos objetivos
- Contexto completo
- Resultado real
- DiferenÃ§as de contexto atual (se detectÃ¡veis)

**O que a apresentaÃ§Ã£o NUNCA INCLUI:**
- "Recomendamos seguir este precedente"
- "Este precedente sugere aprovaÃ§Ã£o"
- "Baseado no histÃ³rico, a tendÃªncia Ã©..."
- "DecisÃµes similares foram aprovadas X vezes"
- Qualquer forma de scoring ou ranking

---

### Quando Precedentes SÃ£o Apresentados

| SituaÃ§Ã£o | Apresenta Precedente? |
|----------|----------------------|
| Nova decisÃ£o em domÃ­nio com histÃ³rico | Sim, como contexto |
| DecisÃ£o idÃªntica a uma anterior | Sim, com destaque para diferenÃ§as de contexto |
| Conflito sendo resolvido | Sim, se houver resoluÃ§Ã£o anterior similar |
| RevisÃ£o de decisÃ£o | Sim, mostrando decisÃµes anteriores no mesmo escopo |
| ExecuÃ§Ã£o automÃ¡tica | **Nunca** â€” precedente nÃ£o participa de automaÃ§Ã£o |

---

### Por Que Precedente Nunca Vira Regra AutomÃ¡tica

**Argumento institucional:**

1. **Contexto muda** â€” O que era correto em dezembro pode ser errado em janeiro
2. **Autoridade Ã© presente** â€” Quem decide agora nÃ£o herda a certeza de quem decidiu antes
3. **Responsabilidade Ã© individual** â€” Cada decisÃ£o tem um humano responsÃ¡vel por ela
4. **MemÃ³ria â‰  Governo** â€” Lembrar nÃ£o Ã© o mesmo que mandar

**Se precedente virasse regra:**
- O sistema estaria decidindo, nÃ£o o humano
- A responsabilidade se diluiria no tempo
- Erros passados se perpetuariam automaticamente
- A autoridade presente seria diminuÃ­da

---

### Estados de um Precedente

| Estado | Significado |
|--------|-------------|
| `active` | Precedente referenciÃ¡vel, apresentado quando relevante |
| `deprecated` | Precedente marcado como desatualizado (contexto mudou muito) |
| `contested` | Precedente cuja validade estÃ¡ sendo questionada |
| `archived` | Precedente mantido apenas para histÃ³rico, nÃ£o apresentado ativamente |

---

### Quem Pode Criar/Modificar Precedentes

| AÃ§Ã£o | Quem pode |
|------|-----------|
| Marcar decisÃ£o como precedente | Humano com autoridade no domÃ­nio |
| Deprecar precedente | Humano com autoridade no domÃ­nio |
| Contestar precedente | Qualquer humano com autoridade (abre revisÃ£o) |
| Arquivar precedente | Humano com autoridade superior |

**O sistema NUNCA pode:**
- Criar precedente automaticamente
- Promover decisÃ£o a precedente por frequÃªncia
- Deprecar precedente por "desuso"
- Sugerir que um precedente seja criado

---

### Regras de Ouro de Precedentes

1. **Precedente Ã© passado, nÃ£o futuro** â€” Descreve o que foi, nÃ£o o que deve ser
2. **Contexto Ã© rei** â€” Precedente sem contexto Ã© dado inÃºtil
3. **Resultado importa** â€” Precedente inclui consequÃªncias, nÃ£o sÃ³ intenÃ§Ãµes
4. **ApresentaÃ§Ã£o Ã© neutra** â€” Sem adjetivos, sem recomendaÃ§Ãµes, sem viÃ©s
5. **Humano interpreta** â€” O sistema mostra, o humano conclui

---

### O Que o Sistema NÃƒO Faz (ProibiÃ§Ãµes)

âŒ Scoring de precedentes ("este precedente tem peso 8/10")  
âŒ Ranking por relevÃ¢ncia automÃ¡tica  
âŒ "Precedentes similares aprovaram X vezes"  
âŒ "Baseado no histÃ³rico, recomendamos..."  
âŒ Aprendizado implÃ­cito de padrÃµes decisÃ³rios  
âŒ SugestÃ£o de decisÃ£o baseada em precedentes  
âŒ CriaÃ§Ã£o automÃ¡tica de precedentes por frequÃªncia  

**Se qualquer comportamento desses aparecer â†’ quebra constitucional.**

---

### CritÃ©rio de Sucesso

> "O PROST-QS apresenta o passado como informaÃ§Ã£o, nunca como instruÃ§Ã£o â€” e garante que cada decisÃ£o presente seja tomada por um humano que sabe o que veio antes, mas decide por si."

---

## MODELO CONCEITUAL (RASCUNHO)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    MEMÃ“RIA INSTITUCIONAL                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚
â”‚  â”‚  Decision   â”‚â”€â”€â”€â–¶â”‚  Lifecycle  â”‚â”€â”€â”€â–¶â”‚   Review    â”‚     â”‚
â”‚  â”‚  (Fase 13)  â”‚    â”‚  (Fase 14)  â”‚    â”‚  (Fase 14)  â”‚     â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚
â”‚         â”‚                  â”‚                  â”‚             â”‚
â”‚         â–¼                  â–¼                  â–¼             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚
â”‚  â”‚  Precedent  â”‚â—€â”€â”€â”€â”‚  Conflict   â”‚â”€â”€â”€â–¶â”‚  Resolution â”‚     â”‚
â”‚  â”‚  (memÃ³ria)  â”‚    â”‚  (bloqueio) â”‚    â”‚  (humano)   â”‚     â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚
â”‚                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## VERDADE FINAL

> "AtÃ© aqui, o sistema decide. A partir daqui, ele lembra."

A Fase 14 transforma o PROST-QS de "sistema que decide bem" para "sistema que constrÃ³i memÃ³ria institucional".

---

*Fase 14 aberta como documento conceitual. Aguardando definiÃ§Ã£o de fronteiras pelo Tech Lead.*

