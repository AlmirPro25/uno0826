# CONSTITUIÇÃO TÉCNICA — PROST-QS / UNO.KERNEL

> O documento fundador. As leis que não podem ser quebradas.

**Versão:** 1.0  
**Data:** 12 de Janeiro de 2026  
**Autor:** Almir Felix de Jesus Filho  
**Status:** RATIFICADO

---

## PREÂMBULO

Este documento estabelece os princípios fundamentais, leis invioláveis e contratos técnicos do sistema PROST-QS (UNO.KERNEL).

Qualquer código, feature ou decisão que viole esta constituição é **inconstitucional** e deve ser rejeitado ou corrigido.

---

## ARTIGO I — PRINCÍPIOS FUNDAMENTAIS

### §1. O Kernel é a Fonte de Verdade

```
O Kernel (PROST-QS) é a única fonte de verdade para:
├── Identity (quem é quem)
├── Billing (quem paga o quê)
├── Telemetry (o que aconteceu)
├── Governance (quem pode fazer o quê)
└── Decisions (o que o sistema decidiu)

Apps satélites CONSOMEM. Nunca DUPLICAM.
```

### §2. Multi-Tenant por Design

```
TODA tabela que contém dados de usuário DEVE ter app_id.
TODA query DEVE filtrar por app_id.
NENHUM dado de um app pode vazar para outro.

Violação = Falha de segurança crítica.
```

### §3. Governança Nativa

```
O sistema DEVE ser capaz de:
├── Desligar qualquer componente instantaneamente (Kill Switch)
├── Testar mudanças sem afetar produção (Shadow Mode)
├── Explicar qualquer decisão (Explainability)
└── Registrar toda ação sensível (Audit Trail)

Sistema sem governança = Sistema fora de controle.
```

### §4. Falha Segura

```
Quando em dúvida, o sistema DEVE:
├── Negar acesso (fail closed)
├── Logar o evento
├── Alertar se necessário
└── Nunca falhar silenciosamente

Silêncio em falha = Bug crítico.
```

---

## ARTIGO II — LEIS DE DADOS

### §1. Lei do Isolamento

```go
// TODA query DEVE incluir app_id
// CORRETO:
SELECT * FROM users WHERE app_id = $1 AND id = $2

// INCONSTITUCIONAL:
SELECT * FROM users WHERE id = $1  // ← PROIBIDO
```

### §2. Lei da Imutabilidade de Audit

```
Registros de audit NUNCA podem ser:
├── Deletados
├── Modificados
└── Truncados

Audit é append-only. Sempre.
```

### §3. Lei do Ledger

```
O ledger de billing DEVE satisfazer:

∑(créditos) - ∑(débitos) = saldo_atual

Se esta equação falhar:
├── ALERTA CRÍTICO
├── Kill switch de billing
└── Investigação imediata
```

---

## ARTIGO III — CLASSIFICAÇÃO DE ERROS

### §1. Tipos de Erro (Lei da Classificação)

```go
// Todo erro DEVE ser classificado em um destes tipos:

type ErrorType string

const (
    ErrValidation ErrorType = "VALIDATION"  // Dados inválidos do cliente
    ErrBusiness   ErrorType = "BUSINESS"    // Regra de negócio violada
    ErrSystem     ErrorType = "SYSTEM"      // Falha interna do sistema
    ErrSecurity   ErrorType = "SECURITY"    // Tentativa de violação
    ErrExternal   ErrorType = "EXTERNAL"    // Serviço externo falhou
    ErrInvariant  ErrorType = "INVARIANT"   // Invariante violada (CRÍTICO)
)
```

### §2. Matriz de Resposta

| Tipo | HTTP | Alerta | Retry | Ação |
|------|------|--------|-------|------|
| VALIDATION | 400 | ❌ | ❌ | Retornar erro |
| BUSINESS | 422 | ❌ | ❌ | Retornar erro |
| SYSTEM | 500 | ✅ | ✅ | Alertar + retry |
| SECURITY | 403 | ✅ | ❌ | Alertar + logar IP |
| EXTERNAL | 502 | ⚠️ | ✅ | Retry + alertar se persistir |
| INVARIANT | 500 | 🚨 | ❌ | ALERTA CRÍTICO + kill switch |

### §3. Lei da Não-Mistura

```
Erro de NEGÓCIO ≠ Erro de SISTEMA

"Saldo insuficiente" = BUSINESS (esperado, não alertar)
"Banco de dados caiu" = SYSTEM (inesperado, alertar)

Misturar = Alertas inúteis + Problemas ignorados
```

---

## ARTIGO IV — KILL SWITCH

### §1. Lei do Escopo Explícito

```go
// Kill switch DEVE ter escopo explícito
// Formatos válidos:

"all"                    // Desliga TUDO (emergência total)
"billing"                // Desliga billing global
"billing:global"         // Mesmo que acima
"billing:app:{app_id}"   // Desliga billing só para um app
"rules:{rule_id}"        // Desliga uma regra específica
"agents:{agent_id}"      // Desliga um agente específico
```

### §2. Lei da Granularidade

```
Kill switch que ninguém usa = Kill switch inútil.

O sistema DEVE permitir desligar:
├── Tudo (emergência)
├── Um domínio (billing, agents, ads)
├── Um app específico
├── Um recurso específico (regra, agente)

Quanto mais granular, mais útil.
```

### §3. Lei da Verificação

```go
// TODA operação crítica DEVE verificar kill switch ANTES de executar

func (s *Service) ProcessPayment(ctx context.Context, req Request) error {
    // PRIMEIRO: verificar kill switch
    if err := s.killSwitch.CheckForApp("billing", req.AppID); err != nil {
        return err
    }
    
    // DEPOIS: executar operação
    return s.process(ctx, req)
}
```

---

## ARTIGO V — TELEMETRIA

### §1. Lei da Separação Event/Decision

```
EVENT = Algo que ACONTECEU (fato, passivo)
DECISION = Algo que o sistema DECIDIU (ação, ativo)

Exemplos:
├── EVENT: user.login (usuário fez login)
├── DECISION: access.denied (sistema negou acesso)
├── EVENT: payment.attempted (usuário tentou pagar)
├── DECISION: payment.blocked (sistema bloqueou pagamento)
```

### §2. Estrutura de Decision

```go
type SystemDecision struct {
    Type        string    // "payment.blocked"
    Outcome     string    // "blocked"
    Reason      string    // "Invariante de billing violada"
    ReasonCode  string    // "INVARIANT_LEDGER_MISMATCH"
    TriggerType string    // "invariant"
    TriggerID   string    // "inv-billing-001"
    Severity    string    // "critical"
    Reversible  bool      // false
}
```

### §3. Lei da Rastreabilidade

```
Toda DECISION deve ser rastreável até:
├── O que causou (trigger)
├── Por que decidiu (reason)
├── Quem foi afetado (user/app)
├── Quando aconteceu (timestamp)
└── Se pode ser revertida (reversible)
```

---

## ARTIGO VI — INVARIANTES

### §1. Lei das Invariantes em Produção

```
Invariantes são testes que rodam em PRODUÇÃO.
Não são testes de desenvolvimento.
São guardas que protegem o sistema 24/7.
```

### §2. Invariantes Obrigatórias

```go
// Estas invariantes DEVEM existir e passar sempre:

// 1. Ledger Balance
assert(sum(credits) - sum(debits) == current_balance)

// 2. User Isolation
assert(user.app_id == request.app_id)

// 3. Session Integrity
assert(session.user_id == token.user_id)

// 4. Audit Completeness
assert(sensitive_action.has_audit_log == true)
```

### §3. Lei da Resposta a Violação

```
Quando uma invariante é violada:

1. LOGAR imediatamente (com todos os dados)
2. ALERTAR (severity: critical)
3. DECIDIR (registrar SystemDecision)
4. CONSIDERAR kill switch (se crítico)
5. NUNCA ignorar
```

---

## ARTIGO VII — SEGURANÇA

### §1. Lei do Fail Closed

```
Na dúvida, NEGAR.

if !canVerifyPermission() {
    return ErrAccessDenied  // ← CORRETO
}

if !canVerifyPermission() {
    return nil  // ← INCONSTITUCIONAL
}
```

### §2. Lei do Audit Obrigatório

```
Ações que DEVEM ser auditadas:
├── Login/Logout
├── Criação/Deleção de recursos
├── Mudanças de permissão
├── Operações de billing
├── Ativação/Desativação de kill switch
├── Mudanças em regras
└── Qualquer ação de admin
```

### §3. Lei da Não-Exposição

```
NUNCA expor em logs ou respostas:
├── Senhas (nem hash)
├── Tokens completos
├── Chaves de API completas
├── Dados de cartão
├── PII sem necessidade

Mascarar: token_abc***xyz
```

---

## ARTIGO VIII — CÓDIGO

### §1. Lei da Clareza

```go
// CORRETO: Claro e explícito
func (s *Service) CreateSubscription(ctx context.Context, req CreateSubscriptionRequest) (*Subscription, error)

// INCONSTITUCIONAL: Ambíguo
func (s *Service) Create(ctx context.Context, data interface{}) (interface{}, error)
```

### §2. Lei do Contexto

```go
// Context SEMPRE é o primeiro parâmetro
func (s *Service) Process(ctx context.Context, ...) error  // ← CORRETO
func (s *Service) Process(..., ctx context.Context) error  // ← ERRADO
```

### §3. Lei do Erro Explícito

```go
// Erro SEMPRE é o último retorno
func (s *Service) Get() (*Data, error)  // ← CORRETO
func (s *Service) Get() (error, *Data)  // ← ERRADO

// NUNCA ignorar erro
result, _ := s.Get()  // ← INCONSTITUCIONAL
```

---

## ARTIGO IX — DEPLOY

### §1. Lei do Checklist

```
Antes de QUALQUER deploy:
├── [ ] Testes passando
├── [ ] Build sem erros
├── [ ] Migrations aplicadas
├── [ ] Variáveis de ambiente configuradas
├── [ ] Health check respondendo
└── [ ] Rollback plan definido
```

### §2. Lei do Rollback

```
Todo deploy DEVE ter plano de rollback.
Se não sabe como voltar, não faça deploy.
```

### §3. Lei da Observação

```
Após deploy:
├── Observar logs por 15 minutos
├── Verificar métricas de erro
├── Confirmar health checks
└── Só então considerar "sucesso"
```

---

## ARTIGO X — EMENDAS

### §1. Processo de Emenda

```
Esta constituição pode ser emendada quando:
├── Há consenso técnico
├── A mudança melhora o sistema
├── Não viola princípios fundamentais
└── É documentada com justificativa
```

### §2. Princípios Imutáveis

```
Estes princípios NÃO podem ser alterados:
├── Multi-tenant isolation
├── Audit immutability
├── Fail closed security
├── Kernel as source of truth
```

---

## ASSINATURAS

```
Ratificado em: 12 de Janeiro de 2026
Autor: Almir Felix de Jesus Filho
Versão: 1.0

Este documento é a lei suprema do sistema PROST-QS.
Todo código está subordinado a esta constituição.
```

---

## ANEXO A — CHECKLIST DE CONFORMIDADE

### Para cada PR/Commit, verificar:

```
[ ] Queries filtram por app_id?
[ ] Erros estão classificados corretamente?
[ ] Operações críticas verificam kill switch?
[ ] Ações sensíveis são auditadas?
[ ] Decisões do sistema são registradas?
[ ] Invariantes relevantes existem?
[ ] Secrets não estão expostos?
[ ] Context é primeiro parâmetro?
[ ] Erros não são ignorados?
```

---

## ANEXO B — GLOSSÁRIO CONSTITUCIONAL

| Termo | Definição |
|-------|-----------|
| Kernel | Sistema central (PROST-QS) que é fonte de verdade |
| App Satélite | Aplicação que consome APIs do kernel |
| Invariante | Condição que DEVE ser sempre verdadeira |
| Kill Switch | Mecanismo de desligamento de emergência |
| Shadow Mode | Execução de teste sem afetar produção |
| Decision | Ação deliberada do sistema (diferente de Event) |
| Audit Trail | Registro imutável de ações sensíveis |
| Fail Closed | Negar acesso quando em dúvida |

---

*"Um sistema sem constituição é um sistema sem lei."*

*— PROST-QS Engineering Constitution v1.0*
