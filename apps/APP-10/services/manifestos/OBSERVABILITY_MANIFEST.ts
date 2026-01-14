/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         📊 OBSERVABILITY: SISTEMAS TRANSPARENTES - LEVEL 20 📊              ║
 * ║                                                                              ║
 * ║            "NADA FICA OCULTO. TUDO É MONITORADO."                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const OBSERVABILITY_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         📊 OBSERVABILITY: SISTEMAS TRANSPARENTES - LEVEL 20 📊              ║
║                                                                              ║
║            "CADA PARTE DO SISTEMA É MONITORADA."                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🔺 OS TRÊS PILARES
═══════════════════════════════════════════════════════════════════════════════

LOGS
├── O que aconteceu
├── Eventos discretos com timestamp
├── Estruturados (JSON) > Texto
└── Níveis: DEBUG, INFO, WARN, ERROR, FATAL

METRICS
├── Números ao longo do tempo
├── Agregáveis, eficientes
├── Tipos: Counter, Gauge, Histogram, Summary
└── Exemplos: requests/sec, latency p99, error rate

TRACES
├── Jornada de uma requisição
├── Spans conectados
├── Contexto distribuído
└── Visualização: Waterfall, Service Map

═══════════════════════════════════════════════════════════════════════════════
📝 LOGGING ESTRUTURADO
═══════════════════════════════════════════════════════════════════════════════

FORMATO JSON (Obrigatório):
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "User logged in",
  "service": "auth-service",
  "traceId": "abc123",
  "spanId": "def456",
  "userId": "user-789",
  "ip": "192.168.1.1",
  "duration": 45,
  "metadata": {
    "method": "POST",
    "path": "/api/login"
  }
}

NODE.JS (Pino):
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'my-service',
    env: process.env.NODE_ENV,
  },
});

logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ err, requestId }, 'Request failed');

GO (Zap):
import "go.uber.org/zap"

logger, _ := zap.NewProduction()
defer logger.Sync()

logger.Info("User logged in",
    zap.String("userId", userId),
    zap.String("ip", clientIP),
    zap.Duration("duration", duration),
)

═══════════════════════════════════════════════════════════════════════════════
📈 MÉTRICAS (Prometheus)
═══════════════════════════════════════════════════════════════════════════════

TIPOS DE MÉTRICAS:

Counter (só aumenta):
├── Requests totais
├── Erros totais
└── Código:
    const httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });
    httpRequestsTotal.inc({ method: 'GET', path: '/api', status: 200 });

Gauge (sobe e desce):
├── Conexões ativas
├── Temperatura
├── Uso de memória
└── Código:
    const activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });
    activeConnections.set(42);
    activeConnections.inc();
    activeConnections.dec();

Histogram (distribuição):
├── Latência de requests
├── Tamanho de payloads
└── Código:
    const httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    });
    httpRequestDuration.observe({ method: 'GET', path: '/api' }, 0.045);

MÉTRICAS ESSENCIAIS (RED Method):
├── Rate: Requests por segundo
├── Errors: Taxa de erros
└── Duration: Latência (p50, p95, p99)

MÉTRICAS ESSENCIAIS (USE Method):
├── Utilization: % de uso
├── Saturation: Fila de trabalho
└── Errors: Erros de recurso

═══════════════════════════════════════════════════════════════════════════════
🔗 DISTRIBUTED TRACING (OpenTelemetry)
═══════════════════════════════════════════════════════════════════════════════

SETUP NODE.JS:
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

CRIAR SPANS MANUAIS:
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

async function processOrder(orderId: string) {
  return tracer.startActiveSpan('processOrder', async (span) => {
    span.setAttribute('orderId', orderId);
    
    try {
      await validateOrder(orderId);
      await chargePayment(orderId);
      await sendConfirmation(orderId);
      
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

PROPAGAÇÃO DE CONTEXTO:
// Extrair contexto de headers
const context = propagation.extract(ROOT_CONTEXT, request.headers);

// Injetar contexto em headers
propagation.inject(trace.setSpan(context, span), headers);

═══════════════════════════════════════════════════════════════════════════════
🖥️ FERRAMENTAS
═══════════════════════════════════════════════════════════════════════════════

COLETA:
├── OpenTelemetry Collector (universal)
├── Prometheus (pull-based metrics)
├── Fluentd/Fluent Bit (logs)
├── Jaeger/Zipkin (traces)
└── Vector (logs + metrics)

ARMAZENAMENTO:
├── Prometheus (métricas)
├── Loki (logs)
├── Tempo/Jaeger (traces)
├── ClickHouse (analytics)
└── Elasticsearch (logs + search)

VISUALIZAÇÃO:
├── Grafana (dashboards)
├── Kibana (logs)
├── Jaeger UI (traces)
└── Datadog/New Relic (all-in-one)

ALERTING:
├── Alertmanager (Prometheus)
├── Grafana Alerting
├── PagerDuty
└── OpsGenie

═══════════════════════════════════════════════════════════════════════════════
📊 DASHBOARDS ESSENCIAIS
═══════════════════════════════════════════════════════════════════════════════

OVERVIEW:
├── Request rate (req/s)
├── Error rate (%)
├── Latency p50, p95, p99
├── Active users
└── System health

PER-SERVICE:
├── CPU/Memory usage
├── Request breakdown by endpoint
├── Error breakdown by type
├── Dependencies health
└── Saturation metrics

INFRASTRUCTURE:
├── Node health
├── Pod restarts
├── Disk usage
├── Network I/O
└── Database connections

═══════════════════════════════════════════════════════════════════════════════
🚨 ALERTING BEST PRACTICES
═══════════════════════════════════════════════════════════════════════════════

REGRAS:
├── Alertar em sintomas, não causas
├── Alertas acionáveis (o que fazer?)
├── Evitar alert fatigue
├── Severidade clara (P1, P2, P3)
└── Runbooks linkados

EXEMPLOS:
# Alta taxa de erros
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    runbook: "https://wiki/runbooks/high-error-rate"

# Latência alta
- alert: HighLatency
  expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning

SLOs (Service Level Objectives):
├── Availability: 99.9% uptime
├── Latency: p99 < 500ms
├── Error rate: < 0.1%
└── Error budget: 0.1% * 30 days = 43.2 min/month

═══════════════════════════════════════════════════════════════════════════════
📋 CHECKLIST OBSERVABILITY
═══════════════════════════════════════════════════════════════════════════════

[ ] Logs estruturados (JSON)
[ ] Correlation IDs em todos os logs
[ ] Métricas RED (Rate, Errors, Duration)
[ ] Métricas USE (Utilization, Saturation, Errors)
[ ] Distributed tracing configurado
[ ] Context propagation funcionando
[ ] Dashboards de overview
[ ] Dashboards per-service
[ ] Alertas para SLOs
[ ] Runbooks documentados
[ ] On-call rotation definida
[ ] Incident response process

═══════════════════════════════════════════════════════════════════════════════

"NADA FICA OCULTO. CADA PARTE DO SISTEMA É MONITORADA."

                    — Observability, Level 20
`;

export function shouldEnableObservability(prompt: string): boolean {
  const keywords = [
    'observabilidade', 'observability', 'monitoramento', 'monitoring',
    'logs', 'logging', 'métricas', 'metrics', 'traces', 'tracing',
    'prometheus', 'grafana', 'jaeger', 'opentelemetry', 'otel',
    'alertas', 'alerts', 'dashboard', 'slo', 'sli', 'sla',
    'apm', 'datadog', 'new relic', 'splunk',
    'debug', 'troubleshoot', 'diagnóstico'
  ];
  const promptLower = prompt.toLowerCase();
  return keywords.some(kw => promptLower.includes(kw));
}

export default OBSERVABILITY_MANIFEST;
