# 🔮 GraphQL Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- GraphQL, GQL, query, mutation, subscription
- Apollo, Apollo Server, Apollo Client
- Hasura, Pothos, GraphQL Yoga, Nexus
- Schema, resolver, type definitions
- Federation, Gateway, Subgraph
- DataLoader, N+1, batching

## FILOSOFIA
> "Peça exatamente o que precisa. Nada mais, nada menos."

## STACK RECOMENDADA
- **Server**: Apollo Server, GraphQL Yoga
- **Client**: Apollo Client, urql
- **Code-First**: Pothos, Nexus
- **Instant API**: Hasura

## PADRÕES ESSENCIAIS
- Use DataLoader para resolver N+1
- Implemente query complexity limits
- Use depth limiting para segurança
- Separe schema em módulos

## ANTI-PATTERNS
❌ **NUNCA** exponha dados sensíveis sem auth
❌ **NUNCA** ignore o problema N+1
❌ **NUNCA** permita queries infinitamente profundas
