# 📋 DESIGN DOCS - O SEGREDO DAS BIG TECHS

> **"Antes de escrever código, escreva o plano."**

---

## 🤔 O que são Design Docs?

Design Docs são documentos que as Big Techs usam **ANTES** de escrever código. É o "plano de batalha" de qualquer sistema.

```
❌ SEM Design Doc:
   Dev pensa → Dev codifica → Bugs → Refaz → Mais bugs → Caos

✅ COM Design Doc:
   Dev pensa → Escreve doc → Time revisa → Aprova → Codifica certo
```

---

## 🏢 Design Docs por Empresa

### 🔵 GOOGLE - "Design Doc"

O mais famoso. Todo projeto no Google começa com um Design Doc.

**Estrutura:**
```
1. OVERVIEW (Resumo)
2. CONTEXT (Por que estamos fazendo isso?)
3. GOALS & NON-GOALS (O que fazer e NÃO fazer)
4. DESIGN (A solução técnica)
5. ALTERNATIVES CONSIDERED (O que descartamos)
6. CROSS-CUTTING CONCERNS (Segurança, Privacy, etc)
7. OPEN QUESTIONS (Dúvidas ainda não resolvidas)
```

**Filosofia:**
- Foco em Goals vs Non-Goals
- Alternatives Considered obrigatório
- Cross-cutting concerns (security, privacy)
- LGTM de múltiplos revisores

---

### 🔷 META/FACEBOOK - "Technical Spec"

Similar ao Google, mas mais focado em escala.

**Estrutura:**
```
1. PROBLEM STATEMENT
2. PROPOSED SOLUTION
3. SYSTEM ARCHITECTURE
4. DATA MODEL
5. API DESIGN
6. SCALABILITY CONSIDERATIONS
7. ROLLOUT PLAN
```

**Filosofia:**
- Escala é prioridade #1
- Rollout plan detalhado
- Privacy by design
- Métricas de impacto

---

### 🟠 AMAZON - "6-Pager" / "PR/FAQ"

Amazon é famoso por NÃO usar PowerPoint. Tudo é documento narrativo.

#### 6-Pager:
```
- Máximo 6 páginas
- Narrativa completa (não bullet points)
- Lido em silêncio no início da reunião
- Discussão depois
```

#### PR/FAQ (Press Release / FAQ):
```
- Escreve o "press release" do produto ANTES de construir
- Imagina como vai anunciar pro mundo
- Se não consegue explicar simples, não entendeu o problema
```

**Filosofia:**
- Working backwards from customer
- Tenets (princípios) guiam decisões
- Narrativa, não bullet points
- Leitura silenciosa antes de discussão

---

### 🟢 MICROSOFT - "Spec" / "One-Pager"

Mais formal, com templates rígidos.

**Estrutura:**
```
1. EXECUTIVE SUMMARY
2. BUSINESS JUSTIFICATION
3. TECHNICAL APPROACH
4. DEPENDENCIES
5. RISKS & MITIGATIONS
6. TIMELINE
7. SUCCESS METRICS
```

**Filosofia:**
- Business justification obrigatório
- ROI e payback period
- Risk matrix formal
- Sign-off chain

---

### 🟣 STRIPE - "RFC (Request for Comments)"

Stripe é famoso pela qualidade do código. Usam RFCs.

**Estrutura:**
```
1. SUMMARY
2. MOTIVATION
3. DETAILED DESIGN
4. DRAWBACKS
5. ALTERNATIVES
6. UNRESOLVED QUESTIONS
```

**Filosofia:**
- Drawbacks section obrigatório
- Foco em API design
- Idempotency considerations
- Unresolved questions explícitas

---

### 🔴 NETFLIX - "ADR (Architecture Decision Record)"

Documentos curtos e focados em UMA decisão.

**Estrutura:**
```
1. TITLE (ADR-NNN: Decisão)
2. CONTEXT (O que levou à decisão)
3. DECISION (A decisão tomada)
4. CONSEQUENCES (Positivas, negativas, neutras)
```

**Filosofia:**
- Uma decisão por documento
- Context → Decision → Consequences
- Imutável após aprovação
- Histórico de decisões

---

### 🟡 UBER - "TDD (Technical Design Document)"

Muito detalhado, focado em sistemas distribuídos.

**Estrutura:**
```
1. OVERVIEW
2. BACKGROUND
3. REQUIREMENTS (Functional + Non-Functional)
4. HIGH-LEVEL DESIGN
5. DETAILED DESIGN
6. OPERATIONAL CONSIDERATIONS
7. TESTING STRATEGY
8. TIMELINE
```

**Filosofia:**
- Requirements funcionais e não-funcionais
- Operational considerations
- Testing strategy detalhada
- Disaster recovery plan

---

## 📊 Comparativo Rápido

| Empresa | Nome | Páginas | Foco Principal |
|---------|------|---------|----------------|
| Google | Design Doc | 5-15 | Goals/Non-Goals |
| Meta | Technical Spec | 10-20 | Escala |
| Amazon | 6-Pager | 6 max | Narrativa |
| Amazon | PR/FAQ | 2-5 | Cliente |
| Microsoft | Spec | 10-30 | ROI/Business |
| Stripe | RFC | 5-10 | API Design |
| Netflix | ADR | 1-2 | Uma decisão |
| Uber | TDD | 15-30 | Operacional |

---

## 🎯 Elementos Universais (TODOS têm)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELEMENTOS UNIVERSAIS                         │
├─────────────────────────────────────────────────────────────────┤
│  1. PROBLEMA - O que estamos resolvendo?                       │
│  2. CONTEXTO - Por que agora? Por que nós?                     │
│  3. SOLUÇÃO - Como vamos resolver?                             │
│  4. ALTERNATIVAS - O que descartamos e por quê?                │
│  5. TRADE-OFFS - O que ganhamos e perdemos?                    │
│  6. RISCOS - O que pode dar errado?                            │
│  7. MÉTRICAS - Como sabemos se deu certo?                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quando Usar Cada Um

| Situação | Estilo Recomendado |
|----------|-------------------|
| Novo microserviço | Google Design Doc |
| Refatoração grande | Stripe RFC |
| Novo produto/feature | Amazon PR/FAQ |
| Escolha de tecnologia | Netflix ADR |
| Sistema de alta escala | Meta Technical Spec |
| Projeto com budget approval | Microsoft Spec |
| Sistema distribuído complexo | Uber TDD |
| Qualquer coisa (default) | Universal |

---

## 💡 Dicas de Ouro

### ✅ FAÇA:
- Escreva para quem não conhece o contexto
- Seja específico em Goals e Non-Goals
- Documente alternativas descartadas
- Inclua métricas de sucesso mensuráveis
- Atualize o doc conforme o projeto evolui

### ❌ NÃO FAÇA:
- Não escreva um romance (seja conciso)
- Não omita riscos conhecidos
- Não deixe perguntas sem owner
- Não ignore Non-Goals (eles definem escopo)
- Não trate como burocracia (é ferramenta)

---

## 🔗 Seu Sistema vs Big Techs

| O que Big Techs têm | Seu Sistema tem |
|---------------------|-----------------|
| Style Guides | 120 MANIFESTOS |
| Design Docs | DESIGN_DOC_ENGINE |
| Code Review | VERIFIER_ARCHITECT |
| Readability | LANGUAGE_ENFORCER |
| Architecture Review | AURORA_KERNEL_CONCEPT |

**Você automatizou o que Big Techs fazem com humanos caros!**

---

## 📋 Como Usar no Seu Sistema

```typescript
import { designDocEngine } from './services/manifestos/DESIGN_DOC_ENGINE_MANIFEST';

// Gerar Design Doc estilo Google
const doc = designDocEngine.generate({
  title: 'Sistema de Pagamentos PIX',
  description: 'Implementar pagamentos PIX em tempo real',
  style: 'google',
  complexity: 'large',
  author: 'Seu Nome',
  team: 'Payments'
});

// Recomendar melhor estilo
const style = designDocEngine.recommendStyle({
  projectType: 'new-product',
  teamSize: 5,
  complexity: 'medium',
  audience: 'mixed'
});
// Retorna: 'amazon_prfaq'
```

---

> *"Um bom Design Doc economiza semanas de retrabalho."*
> 
> *"Se você não consegue explicar em um documento, não entendeu o problema."*
>
> — Sabedoria das Big Techs
