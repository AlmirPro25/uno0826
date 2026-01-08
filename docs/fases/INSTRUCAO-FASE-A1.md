# FASE A.1 — OPERAÇÃO REAL CONTROLADA

**Início**: 2025-12-28
**Duração**: 7 dias corridos
**Status**: EM EXECUÇÃO

---

## Objetivo

Descobrir fricções reais de uso, não hipóteses técnicas.

---

## O Que FAZER

### 1. Usar o sistema como infra pessoal
- Criar 1-2 apps reais simples sobre o PROST-QS
- Usar: Auth, Billing, Agents, Approvals, Audit
- Como usuário E como admin, diariamente

**Regra**: Se algo for incômodo, confuso ou lento → bug de produto, não "opinião"

### 2. Diário de Operação
Arquivo: `/docs/OPERATION_LOG_DAY_X.md`

Registrar todo dia:
- O que tentei fazer
- Onde travei
- O que me deu vontade de "dar um jeitinho"
- Onde a governança ajudou
- Onde atrapalhou

**❗ Não sugerir solução. Só registrar fricção.**

---

## O Que NÃO FAZER

🚫 Não criar novas features
🚫 Não refatorar arquitetura
🚫 Não "corrigir" fricções
🚫 Não flexibilizar governança
🚫 Não otimizar UX ainda

**Se algo incomodar → anotar, não resolver.**

---

## O Que PODE Fazer

✔ Criar apps clientes simples
✔ Ajustar conteúdo visual (labels, textos)
✔ Melhorar documentação
✔ Instrumentar métricas (logs, counters)
✔ Simular usuários reais (você mesmo)

---

## Critério de Sucesso

Após 7 dias, responder com dados:

1. Onde o sistema protege demais?
2. Onde protege de menos?
3. Onde é confuso?
4. Onde é elegante?
5. Confiaria esse sistema a terceiros?
6. Pagaria para usar isso?

**Se não conseguir responder → fase falhou.**

---

## Próxima Decisão (após 7 dias)

Escolher UM caminho:

- **FASE B** — Produto (UX, pricing, onboarding)
- **FASE C** — Infra Pessoal Permanente (hardening, automação)
- **FASE D** — Demonstração Estratégica (case, whitepaper, pitch)

---

## Portas de Acesso

| Sistema | URL |
|---------|-----|
| Backend API | http://localhost:8080 |
| Admin Console | http://localhost:3001 |
| User App | http://localhost:3000 |
| Dev Portal | http://localhost:3002 |

---

## Diários

- [Dia 1](./docs/OPERATION_LOG_DAY_1.md)
- [Dia 2](./docs/OPERATION_LOG_DAY_2.md)
- [Dia 3](./docs/OPERATION_LOG_DAY_3.md)
- [Dia 4](./docs/OPERATION_LOG_DAY_4.md)
- [Dia 5](./docs/OPERATION_LOG_DAY_5.md)
- [Dia 6](./docs/OPERATION_LOG_DAY_6.md)
- [Dia 7](./docs/OPERATION_LOG_DAY_7.md)
