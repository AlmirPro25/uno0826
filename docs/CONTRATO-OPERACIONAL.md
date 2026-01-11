# Contrato Operacional do Sistema

> O que o sistema FAZ quando as coisas dão errado.

## 1. Política de Retry

| Evento | Retry? | Quantas vezes | Intervalo | Quem paga |
|--------|--------|---------------|-----------|-----------|
| Deploy falhou (build) | Não | 0 | - | Usuário corrige |
| Deploy falhou (infra) | Sim | 3 | 30s, 60s, 120s | Sistema |
| Webhook falhou | Sim | 5 | exponential backoff | Sistema |
| Container crash | Sim | 3 | 10s | Sistema |
| Container OOM | Não | 0 | - | Usuário aumenta limite |

## 2. Política de Rollback

| Situação | Rollback automático? | Condição |
|----------|---------------------|----------|
| Deploy novo falha | Sim | Se container anterior existir |
| Health check falha | Sim | Após 3 tentativas |
| Crash loop | Sim | Após 5 crashes em 5min |
| Usuário solicita | Sim | Manual via API |

## 3. Limites por Tenant (Soft Limits)

| Recurso | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Apps | 1 | 10 | Ilimitado |
| Deploys/dia | 5 | 50 | Ilimitado |
| CPU por container | 0.5 core | 2 cores | 4 cores |
| RAM por container | 512MB | 2GB | 8GB |
| Storage | 1GB | 10GB | 100GB |
| Retenção de logs | 24h | 7 dias | 30 dias |
| Retenção de telemetria | 7 dias | 30 dias | 1 ano |

## 4. SLA (Service Level Agreement)

| Métrica | Target | Medição |
|---------|--------|---------|
| Uptime da plataforma | 99.5% | Mensal |
| Tempo de deploy | < 5min | P95 |
| Latência de API | < 200ms | P95 |
| Tempo de detecção de falha | < 30s | - |
| Tempo de notificação | < 1min | - |

## 5. Responsabilidades

### Sistema é responsável por:
- Manter infraestrutura disponível
- Detectar falhas automaticamente
- Notificar usuário sobre problemas
- Tentar recovery automático (dentro dos limites)
- Manter logs e telemetria
- Isolar dados entre tenants

### Usuário é responsável por:
- Código que funciona
- Configuração correta de env vars
- Dimensionamento adequado de recursos
- Monitorar alertas
- Pagar pelo uso

## 6. Eventos que geram alerta

| Evento | Severidade | Notifica? | Canal |
|--------|------------|-----------|-------|
| Deploy falhou | High | Sim | Email, Webhook |
| Container crash | High | Sim | Email, Webhook |
| CPU > 80% por 5min | Medium | Sim | Dashboard |
| RAM > 90% | High | Sim | Email |
| Disco > 85% | Medium | Sim | Dashboard |
| Health check falhou | High | Sim | Email, Webhook |
| Certificado expirando | Medium | Sim | Email |

## 7. Narrativa de Falha

Quando algo falha, o sistema DEVE responder:

```
O QUE: Deploy do app "meu-app" falhou
QUANDO: 2026-01-11 14:32:15 UTC
ONDE: Fase de build
POR QUE: npm install retornou exit code 1
CONTEXTO: Dependência "lodash@5.0.0" não encontrada
AÇÃO TOMADA: Nenhuma (erro de código)
PRÓXIMO PASSO: Usuário deve corrigir package.json
```

Isso não é log. É explicação.

## 8. Medição (Billing Foundation)

Mesmo sem cobrar, o sistema MEDE:

```go
type UsageRecord struct {
    TenantID      string
    Period        time.Time // Mês
    
    // Compute
    DeployCount   int
    ContainerHours float64
    CPUHours      float64
    MemoryGBHours float64
    
    // Storage
    StorageGB     float64
    BandwidthGB   float64
    
    // Events
    TelemetryEvents int
    WebhookCalls    int
    APIRequests     int
}
```

Billing não é cobrança. Billing é medição.
