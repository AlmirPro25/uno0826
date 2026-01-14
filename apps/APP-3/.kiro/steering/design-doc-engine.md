# 📋 DESIGN DOC ENGINE

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Design Doc, Design Document, Technical Spec
- RFC, Request for Comments
- ADR, Architecture Decision Record
- 6-Pager, PR/FAQ
- Technical Design, System Design
- Spec, Specification
- Documentação técnica, Technical documentation
- Google design doc, Amazon 6-pager, Stripe RFC
- Netflix ADR, Uber TDD, Meta spec, Microsoft spec

## COMPORTAMENTO

Quando ativado, o sistema deve:

1. **Identificar o melhor estilo** baseado no contexto:
   - Projeto técnico geral → Google ou Universal
   - Novo produto → Amazon PR/FAQ
   - Decisão de arquitetura → Netflix ADR
   - Mudança técnica focada → Stripe RFC
   - Enterprise com ROI → Microsoft

2. **Gerar documento completo** com todas as seções obrigatórias

3. **Incluir sempre**:
   - TL;DR (resumo em 3 bullets)
   - Goals & Non-Goals
   - Alternatives Considered
   - Risks & Mitigations
   - Success Metrics

## ESTILOS DISPONÍVEIS

| Estilo | Empresa | Melhor Para |
|--------|---------|-------------|
| google | Google | Projetos técnicos gerais |
| meta | Meta | Sistemas de alta escala |
| amazon_6p | Amazon | Estratégia e planejamento |
| amazon_prfaq | Amazon | Novos produtos |
| microsoft | Microsoft | Enterprise com ROI |
| stripe | Stripe | Mudanças técnicas focadas |
| netflix | Netflix | Decisões de arquitetura |
| uber | Uber | Sistemas distribuídos |
| universal | Best of All | Qualquer projeto |

## REGRAS

1. SEMPRE pergunte qual estilo se não for óbvio
2. SEMPRE inclua seções obrigatórias
3. NUNCA omita Alternatives Considered
4. NUNCA omita Risks
5. Use diagramas ASCII quando possível
