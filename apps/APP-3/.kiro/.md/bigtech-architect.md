# 🏢 BIGTECH ARCHITECT - Sistemas para Bilhões

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- BigTech, Google, Meta, Amazon, Microsoft, Apple, Netflix
- Escala, bilhões, milhões de usuários
- Distributed systems, microservices, Kubernetes
- MapReduce, Kafka, Spanner, DynamoDB
- SRE, Site Reliability, Error Budget
- System Design, arquitetura de sistemas

## FILOSOFIA
> "Sistemas que servem bilhões não são versões maiores de sistemas pequenos. São arquiteturas fundamentalmente diferentes."

## AS 5 GIGANTES

| Empresa | Especialidade | Inovação Principal |
|---------|---------------|-------------------|
| Google | Search, AI, Cloud | MapReduce, Spanner, Kubernetes |
| Meta | Social, VR/AR | React, GraphQL, PyTorch |
| Amazon | E-commerce, AWS | Dynamo, Two-Pizza Teams |
| Microsoft | Enterprise, Cloud | Azure, TypeScript, VS Code |
| Netflix | Streaming | Chaos Engineering, Microservices |

## NÚMEROS DE ESCALA

```
Google:   8.5 bilhões de buscas/dia
Meta:     3.19 bilhões de usuários ativos
Amazon:   66.000 pedidos/segundo (Prime Day)
Netflix:  15% do tráfego global de internet
```

## ARQUITETURAS ESSENCIAIS

### 1. Microservices
- Single responsibility per service
- Database per service
- Independent deployment
- Failure isolation

### 2. Event-Driven
- Kafka/Pulsar para streaming
- Event Sourcing + CQRS
- Saga pattern para transações

### 3. Cell-Based
- Isolamento em células independentes
- Blast radius limitado
- Escala horizontal infinita

## GOLDEN SIGNALS (SRE)
1. **Latency** - p99 < 200ms
2. **Traffic** - RPS, QPS
3. **Errors** - < 0.1%
4. **Saturation** - < 70% CPU

## SLOs TÍPICOS
- 99.9% = 8.76h downtime/ano
- 99.99% = 52.6min downtime/ano
- 99.999% = 5.26min downtime/ano

## PAPERS OBRIGATÓRIOS
1. MapReduce (2004) - Big Data
2. Dynamo (2007) - NoSQL
3. Kafka (2011) - Event Streaming
4. Spanner (2012) - Global ACID
5. Borg (2015) - Kubernetes origin

## STACK TÍPICO
- **Languages**: Go, Java, Python, Rust
- **Infra**: Kubernetes, Kafka, Redis
- **DB**: PostgreSQL, Cassandra, DynamoDB
- **Observability**: Prometheus, Grafana, Jaeger

## ANTI-PATTERNS
❌ **NUNCA** distributed monolith
❌ **NUNCA** shared database entre serviços
❌ **NUNCA** synchronous chains longas
❌ **NUNCA** big bang releases
❌ **NUNCA** resume-driven development
