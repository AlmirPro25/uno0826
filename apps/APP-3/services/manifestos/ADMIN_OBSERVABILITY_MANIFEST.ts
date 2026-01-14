/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      👁️ ADMIN OBSERVABILITY MANIFEST - VER, MEDIR, ENTENDER 👁️              ║
 * ║                                                                              ║
 * ║    "Se você só mede CPU, você não entende seu negócio."                     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ESPECIALISTA GERADO: Observability & System Intelligence Engineer
 * 
 * DIFERENCIAL: Não é Prometheus tutorial. É como interpretar o sistema como organismo.
 */

export const ADMIN_OBSERVABILITY_MANIFEST = {
  id: 'admin-observability',
  name: 'Admin Observability Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'observabilidade', 'observability', 'métricas de negócio',
      'business metrics', 'kpi', 'dashboard operacional',
      'logs estruturados', 'structured logs', 'traces',
      'anomalia', 'anomaly detection', 'alertas inteligentes',
      'heatmap', 'comportamento', 'behavior analytics',
      'saúde do sistema', 'system health', 'sla', 'slo', 'sli'
    ],
    contextTriggers: [
      'como está o sistema', 'métricas de negócio', 'detectar anomalias',
      'entender comportamento', 'dashboard admin', 'alertas'
    ]
  },

  philosophy: {
    core: `
      Observabilidade não é sobre ferramentas. É sobre ENTENDIMENTO.
      
      Três níveis de maturidade:
      1. Monitoramento: "O servidor está UP?"
      2. Observabilidade: "Por que o servidor está lento?"
      3. Inteligência: "O que vai quebrar amanhã?"
      
      Admin precisa do nível 3.
    `,
    
    principles: [
      'Métricas técnicas são meio, não fim',
      'Negócio define o que é "saudável"',
      'Anomalia é desvio do padrão, não threshold fixo',
      'Correlação entre métricas revela causa raiz',
      'Observabilidade é para humanos, não para dashboards'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS METRICS (O que realmente importa)
  // ═══════════════════════════════════════════════════════════════════════════
  
  businessMetrics: {
    principle: 'Métricas de negócio > Métricas técnicas',
    
    categories: {
      revenue: {
        metrics: [
          'revenue_per_minute',
          'average_order_value',
          'conversion_rate',
          'cart_abandonment_rate',
          'refund_rate',
          'chargeback_rate'
        ],
        alerts: [
          { metric: 'revenue_per_minute', condition: 'drop > 30%', severity: 'critical' },
          { metric: 'refund_rate', condition: '> 5%', severity: 'high' }
        ]
      },
      
      users: {
        metrics: [
          'active_users_now',
          'signups_per_hour',
          'churn_rate_daily',
          'session_duration_avg',
          'actions_per_session',
          'error_rate_per_user'
        ],
        alerts: [
          { metric: 'active_users_now', condition: 'drop > 50%', severity: 'critical' },
          { metric: 'error_rate_per_user', condition: '> 10%', severity: 'high' }
        ]
      },
      
      operations: {
        metrics: [
          'orders_per_minute',
          'fulfillment_time_avg',
          'support_tickets_open',
          'fraud_attempts_blocked',
          'api_calls_per_second',
          'third_party_failures'
        ]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURED LOGGING
  // ═══════════════════════════════════════════════════════════════════════════
  
  structuredLogging: {
    principle: 'Logs são dados, não texto',
    
    schema: `
      interface StructuredLog {
        timestamp: string;      // ISO 8601
        level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
        service: string;
        traceId: string;
        spanId: string;
        userId?: string;
        sessionId?: string;
        
        event: {
          type: string;         // 'user.login', 'order.created', etc
          action: string;
          result: 'success' | 'failure';
        };
        
        context: {
          ip?: string;
          userAgent?: string;
          country?: string;
          [key: string]: any;
        };
        
        metrics?: {
          duration_ms?: number;
          size_bytes?: number;
          count?: number;
        };
        
        error?: {
          code: string;
          message: string;
          stack?: string;
        };
      }
    `,
    
    bestPractices: [
      'Use JSON, nunca texto livre',
      'Inclua traceId em TODOS os logs',
      'Nunca logue PII sem mascarar',
      'Níveis de log têm significado - respeite',
      'Contexto suficiente para reproduzir'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  anomalyDetection: {
    principle: 'Anomalia é desvio estatístico, não threshold fixo',
    
    techniques: {
      statistical: {
        description: 'Desvio padrão, Z-score, IQR',
        useCase: 'Métricas com distribuição conhecida',
        example: 'Latência média ± 3 desvios padrão'
      },
      
      timeSeries: {
        description: 'Sazonalidade, tendência, decomposição',
        useCase: 'Métricas com padrões temporais',
        example: 'Tráfego às 3h vs média histórica das 3h'
      },
      
      behavioral: {
        description: 'Clustering, isolation forest',
        useCase: 'Comportamento de usuário',
        example: 'Usuário fazendo 100x mais requests que normal'
      }
    },
    
    implementation: `
      class AnomalyDetector {
        async detectAnomaly(
          metric: string,
          currentValue: number,
          context: MetricContext
        ): Promise<AnomalyResult> {
          // Buscar baseline histórico
          const baseline = await this.getBaseline(metric, context);
          
          // Calcular Z-score
          const zScore = (currentValue - baseline.mean) / baseline.stdDev;
          
          // Considerar sazonalidade
          const seasonalBaseline = await this.getSeasonalBaseline(
            metric, 
            context.hour, 
            context.dayOfWeek
          );
          const seasonalZScore = (currentValue - seasonalBaseline.mean) / seasonalBaseline.stdDev;
          
          // Usar o mais relevante
          const effectiveZScore = Math.min(Math.abs(zScore), Math.abs(seasonalZScore));
          
          return {
            isAnomaly: effectiveZScore > 3,
            severity: this.getSeverity(effectiveZScore),
            zScore: effectiveZScore,
            baseline: baseline.mean,
            current: currentValue,
            deviation: ((currentValue - baseline.mean) / baseline.mean) * 100
          };
        }
      }
    `
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARDS OPERACIONAIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  dashboards: {
    executive: {
      description: 'Visão de alto nível para liderança',
      metrics: ['revenue_today', 'active_users', 'conversion_rate', 'system_health'],
      refresh: '5 minutes'
    },
    
    operations: {
      description: 'Visão operacional para time de ops',
      metrics: ['orders_queue', 'support_tickets', 'fraud_alerts', 'inventory_low'],
      refresh: '1 minute'
    },
    
    technical: {
      description: 'Visão técnica para engenharia',
      metrics: ['error_rate', 'latency_p99', 'cpu_usage', 'memory_usage', 'db_connections'],
      refresh: '30 seconds'
    },
    
    warRoom: {
      description: 'Visão de crise durante incidentes',
      metrics: ['affected_users', 'error_spike', 'rollback_status', 'communication_status'],
      refresh: '10 seconds'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTING INTELIGENTE
  // ═══════════════════════════════════════════════════════════════════════════
  
  alerting: {
    principle: 'Alertas devem ser acionáveis, não ruído',
    
    rules: [
      'Alerta sem ação = ruído',
      'Agrupe alertas relacionados',
      'Escalone baseado em severidade E tempo',
      'Silêncio durante manutenção programada',
      'Feedback loop: alerta ignorado = revisar'
    ],
    
    severityLevels: {
      critical: { response: '5 min', escalation: '15 min', channels: ['pager', 'phone', 'slack'] },
      high: { response: '30 min', escalation: '2 hours', channels: ['slack', 'email'] },
      medium: { response: '4 hours', escalation: '24 hours', channels: ['slack'] },
      low: { response: '24 hours', escalation: 'none', channels: ['email'] }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  
  templates: {
    metricsCollector: `
export class BusinessMetricsCollector {
  private prometheus: PrometheusClient;
  
  // Métricas de negócio
  private revenueGauge = new Gauge({ name: 'business_revenue_total', help: 'Total revenue' });
  private ordersCounter = new Counter({ name: 'business_orders_total', help: 'Total orders' });
  private activeUsersGauge = new Gauge({ name: 'business_active_users', help: 'Active users now' });
  
  async collectBusinessMetrics(): Promise<void> {
    const [revenue, orders, activeUsers] = await Promise.all([
      this.db.query('SELECT SUM(amount) FROM orders WHERE date = TODAY'),
      this.db.query('SELECT COUNT(*) FROM orders WHERE date = TODAY'),
      this.redis.get('active_users_count')
    ]);
    
    this.revenueGauge.set(revenue);
    this.ordersCounter.inc(orders);
    this.activeUsersGauge.set(activeUsers);
  }
}
`,

    alertManager: `
export class IntelligentAlertManager {
  async processAlert(alert: Alert): Promise<void> {
    // 1. Verificar se é anomalia real
    const isAnomaly = await this.anomalyDetector.verify(alert);
    if (!isAnomaly) {
      await this.suppressAlert(alert, 'NOT_ANOMALY');
      return;
    }
    
    // 2. Correlacionar com outros alertas
    const relatedAlerts = await this.findRelatedAlerts(alert);
    if (relatedAlerts.length > 0) {
      await this.groupAlerts(alert, relatedAlerts);
    }
    
    // 3. Determinar severidade real
    const severity = await this.calculateSeverity(alert, relatedAlerts);
    
    // 4. Rotear para canais apropriados
    await this.routeAlert(alert, severity);
  }
}
`
  },

  checklist: {
    businessMetrics: [
      'Métricas de receita em tempo real?',
      'Métricas de usuários ativas?',
      'Alertas de negócio configurados?',
      'Dashboard executivo disponível?'
    ],
    technicalObservability: [
      'Logs estruturados em JSON?',
      'Trace ID em todos os logs?',
      'Métricas de latência por endpoint?',
      'Distributed tracing funcionando?'
    ],
    alerting: [
      'Alertas são acionáveis?',
      'Escalação automática configurada?',
      'Silenciamento durante manutenção?',
      'Feedback loop de alertas?'
    ]
  },

  antiPatterns: [
    'NUNCA alerte sem ação clara',
    'NUNCA ignore métricas de negócio',
    'NUNCA use thresholds fixos para tudo',
    'NUNCA logue PII sem mascarar',
    'NUNCA crie dashboard que ninguém olha'
  ],

  goldenRule: `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   Observabilidade não é ver números.                             ║
    ║   É entender o organismo vivo que é seu sistema.                 ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
  `
};

export default ADMIN_OBSERVABILITY_MANIFEST;
