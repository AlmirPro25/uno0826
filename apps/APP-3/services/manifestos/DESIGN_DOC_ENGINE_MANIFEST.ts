/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     📋 DESIGN DOC ENGINE - MOTOR DE DESIGN DOCS BIG TECH 📋                 ║
 * ║                                                                              ║
 * ║     "ANTES DE ESCREVER CÓDIGO, ESCREVA O PLANO."                            ║
 * ║                                                                              ║
 * ║     NÍVEL: 85 (Arquiteto de Documentação)                                   ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este manifesto implementa os padrões de Design Docs de:
 * - Google (Design Doc)
 * - Meta/Facebook (Technical Spec)
 * - Amazon (6-Pager, PR/FAQ)
 * - Microsoft (Spec, One-Pager)
 * - Stripe (RFC)
 * - Netflix (ADR - Architecture Decision Record)
 * - Uber (Technical Design Document)
 * - Airbnb (RFC)
 * - Twitter/X (TDD - Technical Design Document)
 * - LinkedIn (Design Review)
 */

// ============================================================================
// TIPOS DE DESIGN DOCS
// ============================================================================

export type DesignDocStyle = 
  | 'google'      // Google Design Doc
  | 'meta'        // Meta Technical Spec
  | 'amazon_6p'   // Amazon 6-Pager
  | 'amazon_prfaq'// Amazon PR/FAQ
  | 'microsoft'   // Microsoft Spec
  | 'stripe'      // Stripe RFC
  | 'netflix'     // Netflix ADR
  | 'uber'        // Uber TDD
  | 'airbnb'      // Airbnb RFC
  | 'universal';  // Combinação de todos

export type ProjectComplexity = 'small' | 'medium' | 'large' | 'enterprise';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DesignDocRequest {
  title: string;
  description: string;
  style: DesignDocStyle;
  complexity: ProjectComplexity;
  author?: string;
  team?: string;
  deadline?: string;
  stakeholders?: string[];
}

export interface DesignDocSection {
  id: string;
  title: string;
  required: boolean;
  description: string;
  template: string;
  examples?: string[];
}

export interface DesignDocTemplate {
  style: DesignDocStyle;
  company: string;
  sections: DesignDocSection[];
  maxPages?: number;
  reviewProcess: string;
}

// ============================================================================
// GOOGLE DESIGN DOC TEMPLATE
// ============================================================================

export const GOOGLE_DESIGN_DOC: DesignDocTemplate = {
  style: 'google',
  company: 'Google',
  reviewProcess: 'LGTM (Looks Good To Me) de 2+ revisores',
  sections: [
    {
      id: 'metadata',
      title: 'Metadata',
      required: true,
      description: 'Informações básicas do documento',
      template: `
## Metadata
- **Author:** [Nome]
- **Reviewers:** [Lista de revisores]
- **Status:** Draft | In Review | Approved | Implemented
- **Last Updated:** [Data]
- **Design Doc ID:** [ID único]
`
    },
    {
      id: 'overview',
      title: 'Overview',
      required: true,
      description: 'Resumo executivo em 2-3 parágrafos',
      template: `
## Overview

[Descreva o problema e a solução proposta em 2-3 parágrafos. 
Um leitor deve entender o essencial apenas lendo esta seção.]
`
    },
    {
      id: 'context',
      title: 'Context',
      required: true,
      description: 'Contexto e motivação',
      template: `
## Context

### Background
[Por que este projeto existe? Qual problema de negócio resolve?]

### Current State
[Como funciona hoje? Quais são as limitações?]

### Why Now?
[Por que resolver isso agora? Qual a urgência?]
`
    },
    {
      id: 'goals',
      title: 'Goals and Non-Goals',
      required: true,
      description: 'O que fazer e NÃO fazer',
      template: `
## Goals and Non-Goals

### Goals
- [ ] Goal 1: [Descrição clara e mensurável]
- [ ] Goal 2: [Descrição clara e mensurável]
- [ ] Goal 3: [Descrição clara e mensurável]

### Non-Goals
- [ ] Non-Goal 1: [O que explicitamente NÃO faremos]
- [ ] Non-Goal 2: [O que explicitamente NÃO faremos]

> **Importante:** Non-Goals são tão importantes quanto Goals. 
> Eles definem o escopo e evitam scope creep.
`
    },
    {
      id: 'design',
      title: 'Design',
      required: true,
      description: 'A solução técnica detalhada',
      template: `
## Design

### System Architecture
\`\`\`
[Diagrama ASCII ou link para diagrama]
\`\`\`

### API Design
\`\`\`typescript
// Interfaces principais
interface Example {
  // ...
}
\`\`\`

### Data Model
\`\`\`sql
-- Schema principal
CREATE TABLE example (
  -- ...
);
\`\`\`

### Key Components
1. **Component A:** [Descrição]
2. **Component B:** [Descrição]
3. **Component C:** [Descrição]
`
    },
    {
      id: 'alternatives',
      title: 'Alternatives Considered',
      required: true,
      description: 'Soluções descartadas e por quê',
      template: `
## Alternatives Considered

### Alternative 1: [Nome]
- **Descrição:** [O que seria]
- **Prós:** [Vantagens]
- **Contras:** [Desvantagens]
- **Por que descartamos:** [Razão]

### Alternative 2: [Nome]
- **Descrição:** [O que seria]
- **Prós:** [Vantagens]
- **Contras:** [Desvantagens]
- **Por que descartamos:** [Razão]
`
    },
    {
      id: 'cross_cutting',
      title: 'Cross-Cutting Concerns',
      required: true,
      description: 'Segurança, privacidade, escalabilidade',
      template: `
## Cross-Cutting Concerns

### Security
- [ ] Autenticação: [Como?]
- [ ] Autorização: [Como?]
- [ ] Criptografia: [O que é criptografado?]
- [ ] Auditoria: [O que é logado?]

### Privacy
- [ ] PII handling: [Como tratamos dados pessoais?]
- [ ] Data retention: [Por quanto tempo guardamos?]
- [ ] GDPR/LGPD compliance: [Como garantimos?]

### Scalability
- [ ] Expected load: [QPS, usuários, dados]
- [ ] Bottlenecks: [Onde pode travar?]
- [ ] Scaling strategy: [Horizontal? Vertical?]

### Reliability
- [ ] SLA target: [99.9%? 99.99%?]
- [ ] Failure modes: [O que pode falhar?]
- [ ] Recovery: [Como recuperamos?]
`
    },
    {
      id: 'open_questions',
      title: 'Open Questions',
      required: false,
      description: 'Dúvidas ainda não resolvidas',
      template: `
## Open Questions

1. **[Pergunta 1]**
   - Contexto: [Por que é importante]
   - Opções: [Possíveis respostas]
   - Owner: [Quem vai resolver]

2. **[Pergunta 2]**
   - Contexto: [Por que é importante]
   - Opções: [Possíveis respostas]
   - Owner: [Quem vai resolver]
`
    }
  ]
};

// ============================================================================
// AMAZON 6-PAGER TEMPLATE
// ============================================================================

export const AMAZON_6_PAGER: DesignDocTemplate = {
  style: 'amazon_6p',
  company: 'Amazon',
  maxPages: 6,
  reviewProcess: 'Leitura silenciosa de 20min + discussão',
  sections: [
    {
      id: 'intro',
      title: 'Introduction',
      required: true,
      description: 'Contexto e problema (máx 1 página)',
      template: `
# [Título do Projeto]

## Introduction

[Narrativa que explica o contexto, o problema e por que é importante.
Amazon valoriza prosa clara, não bullet points. Escreva como se 
estivesse contando uma história para alguém inteligente mas que 
não conhece o contexto.]
`
    },
    {
      id: 'tenets',
      title: 'Tenets',
      required: true,
      description: 'Princípios que guiam as decisões',
      template: `
## Tenets (Princípios)

1. **[Princípio 1]** - [Explicação de como guia decisões]
2. **[Princípio 2]** - [Explicação de como guia decisões]
3. **[Princípio 3]** - [Explicação de como guia decisões]

> Tenets são princípios que ajudam a tomar decisões quando 
> há trade-offs. "Customer obsession over competitor focus"
`
    },
    {
      id: 'state_of_business',
      title: 'State of the Business',
      required: true,
      description: 'Situação atual com dados',
      template: `
## State of the Business

### Current Metrics
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| [Métrica 1] | [Valor] | [Valor] | [%] |
| [Métrica 2] | [Valor] | [Valor] | [%] |

### Key Challenges
[Descreva os principais desafios em prosa narrativa]
`
    },
    {
      id: 'lessons_learned',
      title: 'Lessons Learned',
      required: true,
      description: 'O que aprendemos até agora',
      template: `
## Lessons Learned

### What Worked
[O que funcionou bem em tentativas anteriores]

### What Didn't Work
[O que não funcionou e por quê]

### Key Insights
[Insights que mudaram nossa forma de pensar]
`
    },
    {
      id: 'strategic_priorities',
      title: 'Strategic Priorities',
      required: true,
      description: 'Prioridades e plano',
      template: `
## Strategic Priorities

### Priority 1: [Nome]
- **Goal:** [O que queremos alcançar]
- **Approach:** [Como vamos fazer]
- **Success Metric:** [Como medimos sucesso]
- **Owner:** [Quem é responsável]

### Priority 2: [Nome]
[Mesmo formato]

### Priority 3: [Nome]
[Mesmo formato]
`
    },
    {
      id: 'appendix',
      title: 'Appendix',
      required: false,
      description: 'Dados de suporte (não conta nas 6 páginas)',
      template: `
## Appendix

### Supporting Data
[Gráficos, tabelas, dados detalhados]

### Technical Details
[Detalhes técnicos que suportam as decisões]
`
    }
  ]
};

// ============================================================================
// AMAZON PR/FAQ TEMPLATE
// ============================================================================

export const AMAZON_PRFAQ: DesignDocTemplate = {
  style: 'amazon_prfaq',
  company: 'Amazon',
  reviewProcess: 'Working backwards from customer',
  sections: [
    {
      id: 'press_release',
      title: 'Press Release',
      required: true,
      description: 'O anúncio do produto como se já existisse',
      template: `
# PRESS RELEASE

## [Nome do Produto] - [Tagline]

**[Cidade], [Data]** — [Empresa] anuncia hoje o lançamento de 
[Nome do Produto], [descrição em uma frase do que é].

### O Problema
[Descreva o problema que os clientes enfrentam hoje]

### A Solução
[Descreva como o produto resolve o problema]

### Quote do Líder
> "[Quote inspiracional sobre o produto]"
> — [Nome], [Cargo]

### Como Funciona
[Explique em 2-3 parágrafos como o cliente usa o produto]

### Quote do Cliente
> "[Quote de um cliente fictício sobre como o produto mudou sua vida]"
> — [Nome], [Empresa/Contexto]

### Disponibilidade
[Quando e onde estará disponível]

### Call to Action
[O que o cliente deve fazer agora]
`
    },
    {
      id: 'faq_external',
      title: 'FAQ - External (Customer)',
      required: true,
      description: 'Perguntas que clientes fariam',
      template: `
## FAQ - External (Customer)

### Q: O que é [Produto]?
A: [Resposta clara e simples]

### Q: Por que devo usar [Produto] em vez de [Alternativa]?
A: [Diferenciação clara]

### Q: Quanto custa?
A: [Modelo de preço]

### Q: Como começo a usar?
A: [Passos simples]

### Q: E se eu tiver problemas?
A: [Suporte disponível]

### Q: Meus dados estão seguros?
A: [Garantias de segurança]
`
    },
    {
      id: 'faq_internal',
      title: 'FAQ - Internal (Stakeholders)',
      required: true,
      description: 'Perguntas que stakeholders internos fariam',
      template: `
## FAQ - Internal (Stakeholders)

### Q: Qual o TAM (Total Addressable Market)?
A: [Tamanho do mercado com dados]

### Q: Qual o investimento necessário?
A: [Recursos: pessoas, dinheiro, tempo]

### Q: Quais são os riscos?
A: [Lista de riscos e mitigações]

### Q: Como isso se alinha com a estratégia da empresa?
A: [Alinhamento estratégico]

### Q: Qual o timeline?
A: [Cronograma com milestones]

### Q: Como medimos sucesso?
A: [KPIs e metas]

### Q: Quem são os competidores?
A: [Análise competitiva]

### Q: Por que nós? Por que agora?
A: [Vantagem competitiva e timing]
`
    }
  ]
};

// ============================================================================
// META/FACEBOOK TECHNICAL SPEC
// ============================================================================

export const META_TECHNICAL_SPEC: DesignDocTemplate = {
  style: 'meta',
  company: 'Meta/Facebook',
  reviewProcess: 'Diff review + oncall approval',
  sections: [
    {
      id: 'summary',
      title: 'Summary',
      required: true,
      description: 'TL;DR do projeto',
      template: `
# [Título do Projeto]

## Summary

**TL;DR:** [Uma frase que resume tudo]

**Problem:** [O problema em uma frase]

**Solution:** [A solução em uma frase]

**Impact:** [O impacto esperado]
`
    },
    {
      id: 'motivation',
      title: 'Motivation',
      required: true,
      description: 'Por que fazer isso',
      template: `
## Motivation

### User Problem
[Qual problema o usuário enfrenta?]

### Business Impact
[Qual o impacto no negócio?]
- Revenue impact: [Estimativa]
- User impact: [Quantos usuários afetados]
- Efficiency impact: [Ganhos de eficiência]

### Why Now
[Por que é urgente resolver agora?]
`
    },
    {
      id: 'detailed_design',
      title: 'Detailed Design',
      required: true,
      description: 'Design técnico completo',
      template: `
## Detailed Design

### Architecture Overview
\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   API       │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

### Data Flow
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### API Contracts
\`\`\`graphql
type Query {
  # [Descrição]
  example(id: ID!): Example
}

type Mutation {
  # [Descrição]
  createExample(input: ExampleInput!): Example
}
\`\`\`

### Database Schema
\`\`\`sql
-- [Descrição da tabela]
CREATE TABLE examples (
  id BIGINT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  -- ...
);
\`\`\`

### Privacy Considerations
- [ ] PII Classification: [Qual categoria?]
- [ ] Data Retention: [Política]
- [ ] User Controls: [O que o usuário pode fazer?]
`
    },
    {
      id: 'rollout',
      title: 'Rollout Plan',
      required: true,
      description: 'Como vamos lançar',
      template: `
## Rollout Plan

### Phases
| Phase | % Users | Duration | Success Criteria |
|-------|---------|----------|------------------|
| Dogfood | 0.1% | 1 week | No P0 bugs |
| Alpha | 1% | 2 weeks | Metrics stable |
| Beta | 10% | 2 weeks | Positive feedback |
| GA | 100% | - | All metrics green |

### Feature Flags
- \`feature_x_enabled\`: [Descrição]
- \`feature_x_percentage\`: [Descrição]

### Rollback Plan
[Como reverter se der errado]

### Monitoring
- Dashboard: [Link]
- Alerts: [Quais alertas configurar]
- On-call: [Quem é responsável]
`
    },
    {
      id: 'scale',
      title: 'Scale Considerations',
      required: true,
      description: 'Como escala para bilhões',
      template: `
## Scale Considerations

### Expected Load
- QPS: [Queries por segundo]
- Storage: [Dados esperados]
- Compute: [CPU/Memory]

### Bottlenecks
| Component | Limit | Mitigation |
|-----------|-------|------------|
| [Component] | [Limit] | [Como resolver] |

### Caching Strategy
- L1 Cache: [O que cachear localmente]
- L2 Cache: [O que cachear distribuído]
- TTL: [Tempo de expiração]

### Database Sharding
[Estratégia de sharding se aplicável]
`
    }
  ]
};

// ============================================================================
// STRIPE RFC TEMPLATE
// ============================================================================

export const STRIPE_RFC: DesignDocTemplate = {
  style: 'stripe',
  company: 'Stripe',
  reviewProcess: 'RFC review com comentários inline',
  sections: [
    {
      id: 'header',
      title: 'RFC Header',
      required: true,
      description: 'Metadados do RFC',
      template: `
# RFC: [Título]

- **RFC ID:** RFC-[YYYY]-[NNN]
- **Author:** [Nome]
- **Status:** Draft | Proposed | Accepted | Implemented | Deprecated
- **Created:** [Data]
- **Updated:** [Data]
`
    },
    {
      id: 'summary',
      title: 'Summary',
      required: true,
      description: 'Resumo em um parágrafo',
      template: `
## Summary

[Um parágrafo que explica o que este RFC propõe. Deve ser 
compreensível por qualquer engenheiro da empresa.]
`
    },
    {
      id: 'motivation',
      title: 'Motivation',
      required: true,
      description: 'Por que precisamos disso',
      template: `
## Motivation

### Problem Statement
[Qual problema estamos resolvendo?]

### User Stories
- Como [persona], eu quero [ação] para [benefício]
- Como [persona], eu quero [ação] para [benefício]

### Success Metrics
- [Métrica 1]: [Target]
- [Métrica 2]: [Target]
`
    },
    {
      id: 'detailed_design',
      title: 'Detailed Design',
      required: true,
      description: 'Design técnico completo',
      template: `
## Detailed Design

### Overview
[Visão geral da solução]

### API Design
\`\`\`ruby
# Stripe usa Ruby internamente
class PaymentIntent
  def self.create(params)
    # ...
  end
end
\`\`\`

### Data Model
[Modelo de dados]

### Error Handling
[Como erros são tratados]

### Idempotency
[Como garantir idempotência]
`
    },
    {
      id: 'drawbacks',
      title: 'Drawbacks',
      required: true,
      description: 'Desvantagens da proposta',
      template: `
## Drawbacks

### Why might we NOT want to do this?

1. **[Drawback 1]:** [Explicação]
   - Mitigation: [Como mitigar]

2. **[Drawback 2]:** [Explicação]
   - Mitigation: [Como mitigar]
`
    },
    {
      id: 'alternatives',
      title: 'Alternatives',
      required: true,
      description: 'Outras opções consideradas',
      template: `
## Alternatives

### Alternative 1: [Nome]
- **Approach:** [Descrição]
- **Pros:** [Vantagens]
- **Cons:** [Desvantagens]
- **Why not:** [Por que não escolhemos]

### Alternative 2: [Nome]
[Mesmo formato]
`
    },
    {
      id: 'unresolved',
      title: 'Unresolved Questions',
      required: false,
      description: 'Perguntas em aberto',
      template: `
## Unresolved Questions

1. [Pergunta que precisa ser respondida antes de implementar]
2. [Pergunta que pode ser respondida durante implementação]
3. [Pergunta para versões futuras]
`
    }
  ]
};

// ============================================================================
// NETFLIX ADR (Architecture Decision Record)
// ============================================================================

export const NETFLIX_ADR: DesignDocTemplate = {
  style: 'netflix',
  company: 'Netflix',
  reviewProcess: 'Architecture review board',
  sections: [
    {
      id: 'title',
      title: 'Title',
      required: true,
      description: 'Título descritivo da decisão',
      template: `
# ADR-[NNN]: [Título da Decisão]

**Date:** [YYYY-MM-DD]
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Deciders:** [Lista de pessoas que tomaram a decisão]
`
    },
    {
      id: 'context',
      title: 'Context',
      required: true,
      description: 'Contexto que levou à decisão',
      template: `
## Context

[Descreva o contexto e o problema que motivou esta decisão.
Inclua fatores técnicos, políticos, sociais e de projeto.
A linguagem deve ser neutra, descrevendo fatos.]
`
    },
    {
      id: 'decision',
      title: 'Decision',
      required: true,
      description: 'A decisão tomada',
      template: `
## Decision

**We will [decisão em uma frase].**

[Elabore a decisão com mais detalhes. Use voz ativa.
"We will use X" não "X will be used".]
`
    },
    {
      id: 'consequences',
      title: 'Consequences',
      required: true,
      description: 'Consequências da decisão',
      template: `
## Consequences

### Positive
- [Consequência positiva 1]
- [Consequência positiva 2]

### Negative
- [Consequência negativa 1]
- [Consequência negativa 2]

### Neutral
- [Consequência neutra 1]
`
    },
    {
      id: 'compliance',
      title: 'Compliance',
      required: false,
      description: 'Como verificar conformidade',
      template: `
## Compliance

### How to verify
[Como verificar se a decisão está sendo seguida]

### Exceptions
[Quando é aceitável não seguir esta decisão]
`
    }
  ]
};

// ============================================================================
// UBER TECHNICAL DESIGN DOCUMENT
// ============================================================================

export const UBER_TDD: DesignDocTemplate = {
  style: 'uber',
  company: 'Uber',
  reviewProcess: 'Design review meeting + async comments',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      required: true,
      description: 'Visão geral do projeto',
      template: `
# [Título do Projeto]

## Overview

### Problem Statement
[O problema que estamos resolvendo]

### Proposed Solution
[A solução proposta em alto nível]

### Scope
- **In Scope:** [O que está incluído]
- **Out of Scope:** [O que NÃO está incluído]
`
    },
    {
      id: 'background',
      title: 'Background',
      required: true,
      description: 'Contexto e história',
      template: `
## Background

### Current Architecture
[Como funciona hoje]

### Pain Points
1. [Problema 1]
2. [Problema 2]
3. [Problema 3]

### Previous Attempts
[O que já tentamos antes]
`
    },
    {
      id: 'requirements',
      title: 'Requirements',
      required: true,
      description: 'Requisitos funcionais e não-funcionais',
      template: `
## Requirements

### Functional Requirements
- FR1: [Requisito funcional]
- FR2: [Requisito funcional]

### Non-Functional Requirements
- NFR1: Latency < [X]ms p99
- NFR2: Availability > [X]%
- NFR3: Throughput > [X] QPS

### Constraints
- [Constraint 1]
- [Constraint 2]
`
    },
    {
      id: 'high_level_design',
      title: 'High-Level Design',
      required: true,
      description: 'Arquitetura de alto nível',
      template: `
## High-Level Design

### System Architecture
\`\`\`
[Diagrama de arquitetura]
\`\`\`

### Component Interactions
[Como os componentes interagem]

### Data Flow
[Fluxo de dados pelo sistema]
`
    },
    {
      id: 'detailed_design',
      title: 'Detailed Design',
      required: true,
      description: 'Design detalhado',
      template: `
## Detailed Design

### Component A: [Nome]
- **Responsibility:** [O que faz]
- **Interface:** [API/Contrato]
- **Implementation:** [Detalhes de implementação]

### Component B: [Nome]
[Mesmo formato]

### Database Design
[Schema e índices]

### Caching Strategy
[O que cachear e como]
`
    },
    {
      id: 'operational',
      title: 'Operational Considerations',
      required: true,
      description: 'Considerações operacionais',
      template: `
## Operational Considerations

### Deployment
- Strategy: [Blue-green, canary, etc]
- Rollback: [Como reverter]

### Monitoring
- Metrics: [Quais métricas]
- Alerts: [Quais alertas]
- Dashboards: [Links]

### On-Call
- Runbook: [Link para runbook]
- Escalation: [Processo de escalação]

### Disaster Recovery
- RTO: [Recovery Time Objective]
- RPO: [Recovery Point Objective]
- DR Plan: [Plano de DR]
`
    },
    {
      id: 'testing',
      title: 'Testing Strategy',
      required: true,
      description: 'Estratégia de testes',
      template: `
## Testing Strategy

### Unit Tests
[Cobertura esperada e abordagem]

### Integration Tests
[Como testar integrações]

### Load Tests
[Cenários de carga]

### Chaos Engineering
[Testes de resiliência]
`
    },
    {
      id: 'timeline',
      title: 'Timeline',
      required: true,
      description: 'Cronograma do projeto',
      template: `
## Timeline

| Milestone | Date | Owner | Status |
|-----------|------|-------|--------|
| Design Complete | [Data] | [Nome] | 🟡 |
| Implementation | [Data] | [Nome] | ⚪ |
| Testing | [Data] | [Nome] | ⚪ |
| Rollout | [Data] | [Nome] | ⚪ |
| GA | [Data] | [Nome] | ⚪ |
`
    }
  ]
};

// ============================================================================
// MICROSOFT SPEC TEMPLATE
// ============================================================================

export const MICROSOFT_SPEC: DesignDocTemplate = {
  style: 'microsoft',
  company: 'Microsoft',
  reviewProcess: 'Spec review meeting + sign-off chain',
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      description: 'Resumo para executivos',
      template: `
# [Título do Projeto]

## Executive Summary

### Business Justification
[Por que este projeto é importante para o negócio?]

### Investment Required
- **Headcount:** [X] engineers for [Y] months
- **Infrastructure:** $[X]
- **Total Cost:** $[X]

### Expected ROI
- **Revenue Impact:** $[X]/year
- **Cost Savings:** $[X]/year
- **Payback Period:** [X] months
`
    },
    {
      id: 'problem',
      title: 'Problem Statement',
      required: true,
      description: 'Definição clara do problema',
      template: `
## Problem Statement

### Current State
[Como funciona hoje]

### Desired State
[Como queremos que funcione]

### Gap Analysis
| Aspect | Current | Desired | Gap |
|--------|---------|---------|-----|
| [Aspecto] | [Valor] | [Valor] | [Delta] |
`
    },
    {
      id: 'solution',
      title: 'Proposed Solution',
      required: true,
      description: 'Solução proposta',
      template: `
## Proposed Solution

### Solution Overview
[Descrição da solução]

### Key Features
1. **[Feature 1]:** [Descrição]
2. **[Feature 2]:** [Descrição]
3. **[Feature 3]:** [Descrição]

### Architecture
\`\`\`
[Diagrama de arquitetura]
\`\`\`
`
    },
    {
      id: 'dependencies',
      title: 'Dependencies',
      required: true,
      description: 'Dependências do projeto',
      template: `
## Dependencies

### Internal Dependencies
| Team | Dependency | Status | Risk |
|------|------------|--------|------|
| [Team] | [O que precisamos] | [Status] | [H/M/L] |

### External Dependencies
| Vendor | Dependency | Status | Risk |
|--------|------------|--------|------|
| [Vendor] | [O que precisamos] | [Status] | [H/M/L] |
`
    },
    {
      id: 'risks',
      title: 'Risks and Mitigations',
      required: true,
      description: 'Riscos e mitigações',
      template: `
## Risks and Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| [Risk 1] | H/M/L | H/M/L | [Mitigation] | [Name] |
| [Risk 2] | H/M/L | H/M/L | [Mitigation] | [Name] |
`
    },
    {
      id: 'success_metrics',
      title: 'Success Metrics',
      required: true,
      description: 'Como medir sucesso',
      template: `
## Success Metrics

### Key Performance Indicators (KPIs)
| KPI | Baseline | Target | Measurement Method |
|-----|----------|--------|-------------------|
| [KPI 1] | [Current] | [Target] | [How to measure] |
| [KPI 2] | [Current] | [Target] | [How to measure] |

### Success Criteria
- [ ] [Critério 1]
- [ ] [Critério 2]
- [ ] [Critério 3]
`
    }
  ]
};

// ============================================================================
// UNIVERSAL TEMPLATE (COMBINAÇÃO DE TODOS)
// ============================================================================

export const UNIVERSAL_DESIGN_DOC: DesignDocTemplate = {
  style: 'universal',
  company: 'Universal (Best of All)',
  reviewProcess: 'Adaptável ao contexto',
  sections: [
    {
      id: 'header',
      title: '📋 Document Header',
      required: true,
      description: 'Metadados essenciais',
      template: `
# [TÍTULO DO PROJETO]

| Campo | Valor |
|-------|-------|
| **Author** | [Nome] |
| **Status** | 🟡 Draft / 🔵 In Review / 🟢 Approved / ⚫ Implemented |
| **Created** | [Data] |
| **Last Updated** | [Data] |
| **Reviewers** | [Lista] |
| **Approvers** | [Lista] |

---
`
    },
    {
      id: 'tldr',
      title: '⚡ TL;DR',
      required: true,
      description: 'Resumo em 3 bullets',
      template: `
## ⚡ TL;DR

- **Problema:** [Uma frase]
- **Solução:** [Uma frase]
- **Impacto:** [Uma frase]
`
    },
    {
      id: 'context',
      title: '🎯 Context & Problem',
      required: true,
      description: 'Contexto e problema (Amazon style)',
      template: `
## 🎯 Context & Problem

### Background
[Narrativa explicando o contexto - estilo Amazon]

### Problem Statement
[O problema específico que estamos resolvendo]

### Why Now?
[Por que é urgente resolver agora]

### User Stories
- Como [persona], eu quero [ação] para [benefício]
- Como [persona], eu quero [ação] para [benefício]
`
    },
    {
      id: 'goals',
      title: '🎯 Goals & Non-Goals',
      required: true,
      description: 'Escopo claro (Google style)',
      template: `
## 🎯 Goals & Non-Goals

### ✅ Goals (O que VAMOS fazer)
1. [Goal mensurável]
2. [Goal mensurável]
3. [Goal mensurável]

### ❌ Non-Goals (O que NÃO vamos fazer)
1. [Non-goal explícito]
2. [Non-goal explícito]

### 📊 Success Metrics
| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| [Metric] | [Value] | [Value] | [Method] |
`
    },
    {
      id: 'solution',
      title: '🏗️ Proposed Solution',
      required: true,
      description: 'Design técnico (Uber style)',
      template: `
## 🏗️ Proposed Solution

### High-Level Architecture
\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Diagrama ASCII da arquitetura]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

### Key Components
| Component | Responsibility | Technology |
|-----------|---------------|------------|
| [Name] | [What it does] | [Stack] |

### Data Model
\`\`\`sql
-- Core entities
CREATE TABLE [entity] (
  id UUID PRIMARY KEY,
  -- fields
);
\`\`\`

### API Design
\`\`\`typescript
// Key interfaces
interface [Name] {
  // fields
}
\`\`\`
`
    },
    {
      id: 'alternatives',
      title: '🔄 Alternatives Considered',
      required: true,
      description: 'Opções descartadas (Stripe style)',
      template: `
## 🔄 Alternatives Considered

### Option 1: [Nome]
| Aspect | Details |
|--------|---------|
| **Approach** | [Descrição] |
| **Pros** | [Vantagens] |
| **Cons** | [Desvantagens] |
| **Why Not** | [Razão para descartar] |

### Option 2: [Nome]
[Mesmo formato]

### Decision Matrix
| Criteria | Weight | Option 1 | Option 2 | Chosen |
|----------|--------|----------|----------|--------|
| [Criteria] | [1-5] | [Score] | [Score] | [Score] |
| **Total** | - | [Sum] | [Sum] | [Sum] |
`
    },
    {
      id: 'cross_cutting',
      title: '🛡️ Cross-Cutting Concerns',
      required: true,
      description: 'Segurança, escala, etc (Google style)',
      template: `
## 🛡️ Cross-Cutting Concerns

### 🔐 Security
- [ ] Authentication: [Method]
- [ ] Authorization: [Method]
- [ ] Data Encryption: [At rest / In transit]
- [ ] Audit Logging: [What's logged]

### 📈 Scalability
- Expected Load: [QPS / Users / Data]
- Scaling Strategy: [Horizontal / Vertical]
- Bottlenecks: [Identified bottlenecks]

### 🔒 Privacy
- PII Handling: [How]
- Data Retention: [Policy]
- User Controls: [What users can do]

### ⚡ Performance
- Latency Target: [p50, p99]
- Throughput Target: [QPS]
- Caching Strategy: [What/How]

### 🔄 Reliability
- SLA Target: [99.X%]
- Failure Modes: [What can fail]
- Recovery: [How to recover]
`
    },
    {
      id: 'rollout',
      title: '🚀 Rollout Plan',
      required: true,
      description: 'Plano de lançamento (Meta style)',
      template: `
## 🚀 Rollout Plan

### Phases
| Phase | % Users | Duration | Success Criteria | Rollback Trigger |
|-------|---------|----------|------------------|------------------|
| Dogfood | 0.1% | 1 week | No P0 bugs | Any P0 |
| Alpha | 1% | 2 weeks | Metrics stable | >5% regression |
| Beta | 10% | 2 weeks | Positive feedback | >10% regression |
| GA | 100% | - | All green | - |

### Feature Flags
\`\`\`
feature_x_enabled: boolean
feature_x_rollout_percentage: number
\`\`\`

### Rollback Plan
[Step-by-step rollback procedure]

### Monitoring & Alerts
- Dashboard: [Link]
- Key Alerts: [List]
- On-Call: [Team/Person]
`
    },
    {
      id: 'timeline',
      title: '📅 Timeline',
      required: true,
      description: 'Cronograma (Microsoft style)',
      template: `
## 📅 Timeline

### Milestones
| Milestone | Target Date | Owner | Status |
|-----------|-------------|-------|--------|
| Design Approved | [Date] | [Name] | 🟡 |
| Implementation Complete | [Date] | [Name] | ⚪ |
| Testing Complete | [Date] | [Name] | ⚪ |
| Rollout Start | [Date] | [Name] | ⚪ |
| GA | [Date] | [Name] | ⚪ |

### Dependencies
| Dependency | Team | Status | Risk |
|------------|------|--------|------|
| [Dep] | [Team] | [Status] | [H/M/L] |
`
    },
    {
      id: 'risks',
      title: '⚠️ Risks & Mitigations',
      required: true,
      description: 'Riscos (Microsoft style)',
      template: `
## ⚠️ Risks & Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| [Risk] | 🔴 High / 🟡 Med / 🟢 Low | 🔴/🟡/🟢 | [Plan] | [Name] |
`
    },
    {
      id: 'open_questions',
      title: '❓ Open Questions',
      required: false,
      description: 'Perguntas em aberto (Stripe style)',
      template: `
## ❓ Open Questions

### Must Answer Before Implementation
1. [Question] - Owner: [Name]

### Can Answer During Implementation
1. [Question]

### Future Considerations
1. [Question]
`
    },
    {
      id: 'appendix',
      title: '📎 Appendix',
      required: false,
      description: 'Material de suporte',
      template: `
## 📎 Appendix

### References
- [Link 1]
- [Link 2]

### Glossary
| Term | Definition |
|------|------------|
| [Term] | [Definition] |

### Revision History
| Date | Author | Changes |
|------|--------|---------|
| [Date] | [Name] | [What changed] |
`
    }
  ]
};

// ============================================================================
// DESIGN DOC ENGINE - CLASSE PRINCIPAL
// ============================================================================

export class DesignDocEngine {
  private templates: Map<DesignDocStyle, DesignDocTemplate>;

  constructor() {
    this.templates = new Map([
      ['google', GOOGLE_DESIGN_DOC],
      ['meta', META_TECHNICAL_SPEC],
      ['amazon_6p', AMAZON_6_PAGER],
      ['amazon_prfaq', AMAZON_PRFAQ],
      ['microsoft', MICROSOFT_SPEC],
      ['stripe', STRIPE_RFC],
      ['netflix', NETFLIX_ADR],
      ['uber', UBER_TDD],
      ['universal', UNIVERSAL_DESIGN_DOC]
    ]);
  }

  /**
   * Retorna o template para um estilo específico
   */
  getTemplate(style: DesignDocStyle): DesignDocTemplate | undefined {
    return this.templates.get(style);
  }

  /**
   * Lista todos os estilos disponíveis
   */
  listStyles(): DesignDocStyle[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Gera um Design Doc completo
   */
  generate(request: DesignDocRequest): string {
    const template = this.templates.get(request.style);
    if (!template) {
      throw new Error(`Unknown style: ${request.style}`);
    }

    let doc = '';

    // Header com metadados
    doc += `<!--
  Design Doc generated by Aurora Design Doc Engine
  Style: ${template.company} (${request.style})
  Generated: ${new Date().toISOString()}
  Author: ${request.author || 'Unknown'}
  Team: ${request.team || 'Unknown'}
-->\n\n`;

    // Gera cada seção
    for (const section of template.sections) {
      doc += section.template;
      doc += '\n\n---\n\n';
    }

    return doc;
  }

  /**
   * Recomenda o melhor estilo baseado no contexto
   */
  recommendStyle(context: {
    projectType: string;
    teamSize: number;
    complexity: ProjectComplexity;
    audience: 'technical' | 'business' | 'mixed';
  }): DesignDocStyle {
    // Projetos pequenos e técnicos → Stripe RFC
    if (context.complexity === 'small' && context.audience === 'technical') {
      return 'stripe';
    }

    // Projetos com foco em produto → Amazon PR/FAQ
    if (context.audience === 'business' || context.projectType.includes('product')) {
      return 'amazon_prfaq';
    }

    // Decisões de arquitetura → Netflix ADR
    if (context.projectType.includes('architecture') || context.projectType.includes('decision')) {
      return 'netflix';
    }

    // Projetos enterprise grandes → Microsoft
    if (context.complexity === 'enterprise' && context.teamSize > 10) {
      return 'microsoft';
    }

    // Projetos com escala → Meta
    if (context.projectType.includes('scale') || context.teamSize > 5) {
      return 'meta';
    }

    // Default → Universal (melhor de todos)
    return 'universal';
  }

  /**
   * Valida se um Design Doc está completo
   */
  validate(doc: string, style: DesignDocStyle): { valid: boolean; missing: string[] } {
    const template = this.templates.get(style);
    if (!template) {
      return { valid: false, missing: ['Unknown style'] };
    }

    const missing: string[] = [];

    for (const section of template.sections) {
      if (section.required) {
        // Verifica se a seção existe no documento
        const sectionTitle = section.title.replace(/[^\w\s]/g, '');
        if (!doc.toLowerCase().includes(sectionTitle.toLowerCase())) {
          missing.push(section.title);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

// ============================================================================
// MANIFESTO PRINCIPAL
// ============================================================================

export const DESIGN_DOC_ENGINE_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     📋 DESIGN DOC ENGINE - MOTOR DE DESIGN DOCS BIG TECH 📋                 ║
║                                                                              ║
║     "ANTES DE ESCREVER CÓDIGO, ESCREVA O PLANO."                            ║
║                                                                              ║
║     NÍVEL: 85 (Arquiteto de Documentação)                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 ATIVAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Este manifesto é ativado quando o usuário menciona:
- Design Doc, Design Document, Technical Spec
- RFC, Request for Comments
- ADR, Architecture Decision Record
- 6-Pager, PR/FAQ
- Technical Design, System Design
- Spec, Specification
- Documentação técnica, Technical documentation

═══════════════════════════════════════════════════════════════════════════════
📚 ESTILOS DISPONÍVEIS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ ESTILO          │ EMPRESA    │ MELHOR PARA                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ google          │ Google     │ Projetos técnicos gerais                    │
│ meta            │ Meta       │ Sistemas de alta escala                     │
│ amazon_6p       │ Amazon     │ Estratégia e planejamento                   │
│ amazon_prfaq    │ Amazon     │ Novos produtos (customer-first)             │
│ microsoft       │ Microsoft  │ Enterprise com ROI claro                    │
│ stripe          │ Stripe     │ Mudanças técnicas focadas                   │
│ netflix         │ Netflix    │ Decisões de arquitetura                     │
│ uber            │ Uber       │ Sistemas distribuídos complexos             │
│ universal       │ Best of All│ Qualquer projeto (recomendado)              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
🏢 FILOSOFIAS POR EMPRESA
═══════════════════════════════════════════════════════════════════════════════

🔵 GOOGLE - "Design Doc"
   • Foco em Goals vs Non-Goals
   • Alternatives Considered obrigatório
   • Cross-cutting concerns (security, privacy)
   • LGTM de múltiplos revisores

🔷 META - "Technical Spec"
   • Escala é prioridade #1
   • Rollout plan detalhado
   • Privacy by design
   • Métricas de impacto

🟠 AMAZON - "6-Pager / PR/FAQ"
   • Narrativa, não bullet points
   • Working backwards from customer
   • Tenets (princípios) guiam decisões
   • Leitura silenciosa antes de discussão

🟢 MICROSOFT - "Spec"
   • Business justification obrigatório
   • ROI e payback period
   • Risk matrix formal
   • Sign-off chain

🟣 STRIPE - "RFC"
   • Drawbacks section obrigatório
   • Foco em API design
   • Idempotency considerations
   • Unresolved questions explícitas

🔴 NETFLIX - "ADR"
   • Uma decisão por documento
   • Context → Decision → Consequences
   • Imutável após aprovação
   • Histórico de decisões

🟡 UBER - "TDD"
   • Requirements funcionais e não-funcionais
   • Operational considerations
   • Testing strategy detalhada
   • Disaster recovery plan

═══════════════════════════════════════════════════════════════════════════════
📋 ELEMENTOS UNIVERSAIS (TODOS TÊM)
═══════════════════════════════════════════════════════════════════════════════

1. PROBLEMA - O que estamos resolvendo?
2. CONTEXTO - Por que agora? Por que nós?
3. SOLUÇÃO - Como vamos resolver?
4. ALTERNATIVAS - O que descartamos e por quê?
5. TRADE-OFFS - O que ganhamos e perdemos?
6. RISCOS - O que pode dar errado?
7. MÉTRICAS - Como sabemos se deu certo?

═══════════════════════════════════════════════════════════════════════════════
🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════════

1. ESCOLHA O ESTILO:
   - Projeto técnico geral → Google ou Universal
   - Novo produto → Amazon PR/FAQ
   - Decisão de arquitetura → Netflix ADR
   - Mudança focada → Stripe RFC
   - Enterprise com ROI → Microsoft

2. PREENCHA AS SEÇÕES:
   - Comece pelo TL;DR
   - Depois Context & Problem
   - Então Goals & Non-Goals
   - Por fim, Design técnico

3. REVISE:
   - Peça feedback de stakeholders
   - Itere até aprovação
   - Documente decisões

═══════════════════════════════════════════════════════════════════════════════
💡 DICAS DE OURO
═══════════════════════════════════════════════════════════════════════════════

✅ FAÇA:
- Escreva para quem não conhece o contexto
- Seja específico em Goals e Non-Goals
- Documente alternativas descartadas
- Inclua métricas de sucesso mensuráveis
- Atualize o doc conforme o projeto evolui

❌ NÃO FAÇA:
- Não escreva um romance (seja conciso)
- Não omita riscos conhecidos
- Não deixe perguntas sem owner
- Não ignore Non-Goals (eles definem escopo)
- Não trate como burocracia (é ferramenta)

═══════════════════════════════════════════════════════════════════════════════
📊 QUANDO USAR CADA UM
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ SITUAÇÃO                          │ ESTILO RECOMENDADO                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Novo microserviço                 │ Google Design Doc                       │
│ Refatoração grande                │ Stripe RFC                              │
│ Novo produto/feature              │ Amazon PR/FAQ                           │
│ Escolha de tecnologia             │ Netflix ADR                             │
│ Sistema de alta escala            │ Meta Technical Spec                     │
│ Projeto com budget approval       │ Microsoft Spec                          │
│ Sistema distribuído complexo      │ Uber TDD                                │
│ Qualquer coisa (default)          │ Universal                               │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

"Um bom Design Doc economiza semanas de retrabalho."

"Se você não consegue explicar em um documento, não entendeu o problema."

— Sabedoria das Big Techs

═══════════════════════════════════════════════════════════════════════════════
`;

// ============================================================================
// EXPORTS
// ============================================================================

export const designDocEngine = new DesignDocEngine();

export default DESIGN_DOC_ENGINE_MANIFEST;
