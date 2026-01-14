# 👁️ Admin Observability Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Observability, Observabilidade, Monitoramento
- Métricas, Metrics, KPIs, Dashboard
- Logs, Logging, Traces, Tracing
- Alertas, Alerts, Anomalias
- Grafana, Prometheus, Datadog

## FILOSOFIA
> "Se você só mede CPU, você não entende seu negócio."

## TRÊS PILARES
1. **Logs** - O que aconteceu (eventos)
2. **Métricas** - Quanto aconteceu (números)
3. **Traces** - Como aconteceu (fluxo)

## MÉTRICAS DE NEGÓCIO
| Métrica | Tipo | Alerta |
|---------|------|--------|
| Revenue/min | Business | < threshold |
| Signups/hour | Growth | Anomalia |
| Error rate | Technical | > 1% |
| Latency p99 | Performance | > 500ms |

## GOLDEN SIGNALS
- **Latency** - Tempo de resposta
- **Traffic** - Volume de requests
- **Errors** - Taxa de erros
- **Saturation** - Uso de recursos

## CHECKLIST
- [ ] Métricas de negócio definidas?
- [ ] Alertas configurados?
- [ ] Dashboards criados?
- [ ] Logs estruturados?
- [ ] Traces implementados?

## ANTI-PATTERNS
❌ **NUNCA** monitore só infraestrutura
❌ **NUNCA** ignore métricas de negócio
❌ **NUNCA** crie alertas sem runbook
❌ **NUNCA** deixe logs não estruturados
