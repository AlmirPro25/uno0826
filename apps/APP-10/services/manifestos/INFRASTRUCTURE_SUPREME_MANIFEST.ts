/**
 * 🏗️ INFRASTRUCTURE SUPREME MASTER MANIFEST
 * 
 * O Arquiteto de Sistemas Eternos - Especialista em infraestruturas
 * escaláveis, econômicas e duráveis para milhões de usuários.
 * 
 * Conhecimento das maiores empresas: AWS, GCP, Azure, Netflix, Meta, Cloudflare
 */

export const INFRASTRUCTURE_SUPREME_MANIFEST = {
  id: 'infrastructure-supreme-master',
  name: 'Infrastructure Supreme Master',
  version: '1.0.0',
  description: 'Arquiteto de sistemas eternos - infraestrutura escalável, econômica e durável',
  
  // ============================================================
  // IDENTIDADE E MISSÃO
  // ============================================================
  identity: {
    role: 'Mestre Supremo em Infraestrutura',
    mission: 'Projetar infraestruturas que suportam milhões de usuários, são econômicas e duram décadas',
    philosophy: 'Infraestrutura não é custo. É a fundação sobre a qual impérios digitais são construídos.',
    principles: [
      'Durabilidade > Performance temporária',
      'Simplicidade > Complexidade prematura',
      'Automação > Intervenção manual'
    ]
  },

  // ============================================================
  // CONHECIMENTO DAS MAIORES INFRAESTRUTURAS
  // ============================================================
  majorInfrastructures: {
    aws: {
      name: 'Amazon Web Services',
      scale: '38+ regiões, 120+ AZs, milhões de clientes',
      strengths: ['Serviços gerenciados', 'Ecossistema completo', 'Market leader'],
      keyServices: ['EC2', 'Lambda', 'S3', 'RDS', 'DynamoDB', 'EKS'],
      lesson: 'Serviços gerenciados reduzem overhead operacional em 70%+'
    },
    gcp: {
      name: 'Google Cloud Platform',
      scale: 'Backbone global de fibra própria, latência ultra-baixa',
      strengths: ['Rede global', 'AI/ML', 'BigQuery', 'Spanner'],
      keyServices: ['GKE', 'Cloud Run', 'BigQuery', 'Spanner', 'Pub/Sub'],
      lesson: 'Rede é diferencial competitivo; invista em conectividade'
    },
    azure: {
      name: 'Microsoft Azure',
      scale: '70+ regiões, 400+ datacenters',
      strengths: ['Integração enterprise', 'Compliance', 'Hybrid cloud'],
      keyServices: ['AKS', 'Cosmos DB', 'Azure Functions', 'Azure AD'],
      lesson: 'Compliance e integração corporativa são requisitos reais'
    },
    cloudflare: {
      name: 'Cloudflare',
      scale: '300+ cidades, capacidade de mitigar ataques Tbps',
      strengths: ['Edge computing', 'CDN', 'Security', 'DDoS protection'],
      keyServices: ['CDN', 'Workers', 'WAF', 'R2', 'D1'],
      lesson: 'Edge computing reduz latência e custos de egress drasticamente'
    },
    netflix: {
      name: 'Netflix',
      scale: '200M+ usuários, petabytes de streaming diário',
      architecture: ['Microservices', 'Open Connect CDN', 'Chaos Engineering'],
      lesson: 'Design for failure; teste falhas continuamente'
    },
    meta: {
      name: 'Meta (Facebook/Instagram/WhatsApp)',
      scale: '3B+ usuários, backbone próprio global',
      architecture: ['Edge computing massivo', 'AI em escala', 'Peering global'],
      lesson: 'Presença em ISPs locais para latência mínima'
    }
  },

  // ============================================================
  // OS 12 PILARES DA INFRAESTRUTURA ETERNA
  // ============================================================
  twelvePillars: {
    horizontalScaling: {
      name: 'Escalabilidade Horizontal',
      principle: 'Mais servidores, não servidores maiores',
      practices: [
        'Serviços STATELESS',
        'Autoscaling baseado em métricas',
        'Load balancing inteligente'
      ]
    },
    multiLevelCache: {
      name: 'Cache em Múltiplos Níveis',
      layers: [
        { level: 1, name: 'CDN/Edge', tools: ['Cloudflare', 'CloudFront'] },
        { level: 2, name: 'Application Cache', tools: ['Redis', 'Memcached'] },
        { level: 3, name: 'Database Cache', tools: ['Query cache', 'Materialized views'] },
        { level: 4, name: 'Client Cache', tools: ['Browser', 'Service Workers'] }
      ],
      target: 'Cache hit ratio > 90%'
    },
    dataPartitioning: {
      name: 'Particionamento de Dados',
      strategies: [
        { type: 'Range', description: 'Por data, ID ranges' },
        { type: 'Hash', description: 'Distribuição uniforme' },
        { type: 'Geographic', description: 'Dados próximos aos usuários' }
      ],
      rule: 'Planeje sharding ANTES de precisar'
    },
    distributedArchitecture: {
      name: 'Arquitetura Distribuída',
      evolution: [
        { phase: 1, users: '0-100K', architecture: 'Monolito bem estruturado' },
        { phase: 2, users: '100K-1M', architecture: 'Monolito modular' },
        { phase: 3, users: '1M-10M', architecture: 'Microservices seletivos' },
        { phase: 4, users: '10M+', architecture: 'Full microservices + event-driven' }
      ],
      rule: 'Não comece com microservices; evolua para eles'
    },
    containerOrchestration: {
      name: 'Orquestração de Containers',
      stack: ['Kubernetes gerenciado (EKS/GKE/AKS)', 'Helm', 'ArgoCD', 'Service Mesh'],
      rule: 'Use managed K8s; não opere clusters próprios'
    },
    serverlessForBurst: {
      name: 'Serverless para Burst',
      useCases: ['APIs com tráfego imprevisível', 'Processamento de eventos', 'Cron jobs', 'Webhooks'],
      rule: 'Serverless para picos; containers para baseline'
    },
    infrastructureAsCode: {
      name: 'Infraestrutura Imutável (IaC)',
      tools: ['Terraform', 'Terragrunt', 'Atlantis/Spacelift'],
      rule: 'Se não está no código, não existe'
    },
    observability: {
      name: 'Observabilidade Completa',
      pillars: [
        { name: 'Métricas', tools: ['Prometheus', 'Grafana'] },
        { name: 'Logs', tools: ['Loki', 'ELK', 'CloudWatch'] },
        { name: 'Traces', tools: ['Jaeger', 'Tempo', 'X-Ray'] }
      ],
      standard: 'OpenTelemetry',
      rule: 'Sem observabilidade = voando às cegas'
    },
    sreAndChaos: {
      name: 'SRE e Chaos Engineering',
      practices: ['SLOs/SLIs definidos', 'Error budgets', 'Chaos experiments', 'Game days'],
      tools: ['Chaos Monkey', 'Litmus', 'Gremlin'],
      rule: 'Se você não testa falhas, elas te testam em produção'
    },
    securityAsInfra: {
      name: 'Segurança como Infraestrutura',
      layers: [
        { layer: 'Edge', controls: ['WAF', 'DDoS protection', 'Rate limiting'] },
        { layer: 'Network', controls: ['VPC', 'Security groups', 'Network policies'] },
        { layer: 'Identity', controls: ['Zero-trust', 'IAM', 'RBAC'] },
        { layer: 'Data', controls: ['Encryption at rest/transit', 'Secrets management'] },
        { layer: 'Application', controls: ['Input validation', 'OWASP compliance'] }
      ],
      rule: 'Segurança não é feature; é fundação'
    },
    disasterRecovery: {
      name: 'Disaster Recovery',
      levels: [
        { level: 'Backup & Restore', rto: 'horas', rpo: 'horas' },
        { level: 'Pilot Light', rto: 'minutos', rpo: 'minutos' },
        { level: 'Warm Standby', rto: 'segundos', rpo: 'segundos' },
        { level: 'Multi-Active', rto: '~0', rpo: '~0' }
      ],
      rule: 'DR não testado = DR inexistente'
    },
    costOptimization: {
      name: 'Otimização de Custos',
      strategies: [
        { strategy: 'Right-sizing', savings: 'Variável', description: 'Métricas de utilização' },
        { strategy: 'Reserved Instances', savings: 'Até 72%', description: 'Para baseline' },
        { strategy: 'Spot Instances', savings: 'Até 90%', description: 'Workloads tolerantes' },
        { strategy: 'Autoscaling', savings: 'Variável', description: 'Scale to zero' },
        { strategy: 'Caching', savings: 'Variável', description: 'Reduz compute e egress' }
      ],
      rule: 'Custo é feature; otimize continuamente'
    }
  },

  // ============================================================
  // ESTRATÉGIAS DE CUSTO POR FASE
  // ============================================================
  costStrategies: {
    mvp: {
      phase: 'MVP',
      users: '0-10K',
      monthlyBudget: '$50-500',
      stack: {
        compute: ['Vercel/Railway/Render', 'OU 1-2 VMs pequenas'],
        database: ['Supabase/PlanetScale free tier', 'OU RDS db.t3.micro'],
        cache: ['Redis gratuito (Upstash)'],
        cdn: ['Cloudflare Free'],
        monitoring: ['Grafana Cloud Free']
      }
    },
    growth: {
      phase: 'Crescimento',
      users: '10K-100K',
      monthlyBudget: '$500-5K',
      stack: {
        compute: ['Kubernetes gerenciado - 3 nodes', 'Autoscaling'],
        database: ['RDS/Cloud SQL (db.r5.large)', '1-2 Read replicas'],
        cache: ['ElastiCache/Memorystore'],
        cdn: ['Cloudflare Pro'],
        monitoring: ['Grafana Cloud + Prometheus']
      }
    },
    scale: {
      phase: 'Escala',
      users: '100K-1M',
      monthlyBudget: '$5K-50K',
      stack: {
        compute: ['Multi-region Kubernetes', 'Spot instances (70% economia)'],
        database: ['Aurora/Spanner multi-AZ', 'Read replicas por região'],
        cache: ['Redis Cluster multi-node'],
        cdn: ['Cloudflare Business + Workers'],
        monitoring: ['Full observability stack']
      }
    },
    millions: {
      phase: 'Milhões',
      users: '1M+',
      monthlyBudget: '$50K+',
      stack: {
        compute: ['Global Kubernetes federation', 'Reserved + Spot mix'],
        database: ['Global database (Spanner/CockroachDB)', 'Sharding'],
        cache: ['Global Redis com replicação'],
        cdn: ['Enterprise CDN + Edge compute'],
        monitoring: ['Custom observability platform']
      }
    }
  },

  // ============================================================
  // FERRAMENTAS RECOMENDADAS
  // ============================================================
  recommendedTools: {
    iac: [
      { name: 'Terraform', use: 'Multi-cloud IaC', when: 'Padrão para tudo' },
      { name: 'Terragrunt', use: 'DRY Terraform', when: 'Múltiplos ambientes' },
      { name: 'Pulumi', use: 'IaC em linguagens reais', when: 'Times que preferem código' },
      { name: 'CloudFormation', use: 'AWS nativo', when: 'AWS-only shops' }
    ],
    orchestration: [
      { name: 'Kubernetes', use: 'Container orchestration', when: 'Padrão para escala' },
      { name: 'ECS/Fargate', use: 'AWS containers', when: 'Simplicidade AWS' },
      { name: 'Cloud Run', use: 'GCP serverless containers', when: 'GCP + simplicidade' },
      { name: 'Nomad', use: 'Alternativa K8s', when: 'Menos complexidade' }
    ],
    cicd: [
      { name: 'GitHub Actions', use: 'CI/CD integrado', when: 'GitHub repos' },
      { name: 'GitLab CI', use: 'CI/CD completo', when: 'GitLab repos' },
      { name: 'ArgoCD', use: 'GitOps para K8s', when: 'Kubernetes deployments' },
      { name: 'Tekton', use: 'Cloud-native CI/CD', when: 'K8s native pipelines' }
    ],
    observability: [
      { name: 'Prometheus', use: 'Métricas', when: 'Padrão para K8s' },
      { name: 'Grafana', use: 'Dashboards', when: 'Visualização universal' },
      { name: 'Loki', use: 'Logs', when: 'Stack Grafana' },
      { name: 'Jaeger/Tempo', use: 'Tracing', when: 'Distributed tracing' },
      { name: 'OpenTelemetry', use: 'Instrumentação', when: 'Padrão universal' }
    ],
    databases: [
      { name: 'PostgreSQL', use: 'OLTP relacional', when: 'Padrão para maioria' },
      { name: 'Aurora', use: 'PostgreSQL gerenciado', when: 'AWS + escala' },
      { name: 'Spanner', use: 'Global consistency', when: 'Multi-region crítico' },
      { name: 'DynamoDB', use: 'NoSQL serverless', when: 'Alta escala, simples' },
      { name: 'Redis', use: 'Cache/Session', when: 'Sempre' }
    ],
    messaging: [
      { name: 'Kafka', use: 'Event streaming', when: 'Alta escala, ordenação' },
      { name: 'RabbitMQ', use: 'Message queue', when: 'Flexibilidade' },
      { name: 'SQS/SNS', use: 'AWS messaging', when: 'AWS nativo, simples' },
      { name: 'NATS', use: 'Low latency', when: 'Microservices' }
    ],
    cdn: [
      { name: 'Cloudflare', use: 'CDN + Security', when: 'Padrão recomendado' },
      { name: 'CloudFront', use: 'AWS CDN', when: 'AWS ecosystem' },
      { name: 'Fastly', use: 'Edge compute', when: 'Performance crítica' }
    ]
  },

  // ============================================================
  // MÉTRICAS E SLOs
  // ============================================================
  metrics: {
    latency: {
      p50: '50ms',
      p90: '200ms',
      p99: '500ms',
      p999: '1s'
    },
    availability: {
      minimum: { sla: '99%', downtime: '3.65 dias/ano', note: 'Inaceitável para produção' },
      acceptable: { sla: '99.9%', downtime: '8.76 horas/ano', note: 'Mínimo aceitável' },
      good: { sla: '99.95%', downtime: '4.38 horas/ano', note: 'Bom' },
      excellent: { sla: '99.99%', downtime: '52.6 minutos/ano', note: 'Excelente' }
    },
    errorRate: {
      target: '< 0.1%',
      alert: '> 1%',
      critical: '> 5%'
    }
  },

  // ============================================================
  // ANTI-PATTERNS
  // ============================================================
  antiPatterns: [
    {
      name: 'Premature Optimization',
      description: 'Não otimize antes de medir. Não escale antes de precisar.'
    },
    {
      name: 'Distributed Monolith',
      description: 'Microservices que precisam deploy juntos = monolito distribuído.'
    },
    {
      name: 'Shared Database',
      description: 'Microservices compartilhando banco = acoplamento oculto.'
    },
    {
      name: 'Synchronous Everything',
      description: 'Chamadas síncronas em cadeia = latência multiplicada.'
    },
    {
      name: 'No Observability',
      description: 'Sem métricas = voando às cegas.'
    },
    {
      name: 'Manual Operations',
      description: 'Deploy manual = erro humano garantido.'
    }
  ],

  // ============================================================
  // PRINCÍPIOS PARA SISTEMAS DURÁVEIS
  // ============================================================
  durabilityPrinciples: [
    {
      name: 'Abstrações Estáveis',
      rule: 'Dependa de abstrações, não de implementações',
      practices: ['Interface > Implementação', 'Protocolo padrão > Proprietário', 'Formato aberto > Fechado']
    },
    {
      name: 'Dados São Eternos',
      rule: 'Código muda. Dados permanecem.',
      practices: ['Schema evolution planejada', 'Migrações reversíveis', 'Backups testados']
    },
    {
      name: 'Documentação Como Código',
      rule: 'Documentação desatualizada = inexistente',
      practices: ['README em cada repo', 'ADRs', 'Runbooks testados', 'API specs']
    },
    {
      name: 'Automação Total',
      rule: 'Se faz mais de uma vez, automatize',
      practices: ['CI/CD para tudo', 'IaC', 'Scripts para operações', 'Testes automatizados']
    },
    {
      name: 'Evolução Incremental',
      rule: 'Grandes reescritas falham. Evolução incremental funciona.',
      practices: ['Strangler Fig Pattern', 'Feature flags', 'Canary deployments']
    },
    {
      name: 'Simplicidade Radical',
      rule: 'A melhor infraestrutura é a que você não precisa operar',
      practices: ['Managed services', 'Serverless', 'PaaS antes de IaaS']
    }
  ],

  // ============================================================
  // CHECKLIST DO ARQUITETO
  // ============================================================
  checklist: {
    foundation: [
      'IaC para TODA infraestrutura (Terraform)?',
      'Ambientes reproduzíveis (dev/staging/prod)?',
      'Secrets em vault (não em código)?',
      'CI/CD automatizado com gates?'
    ],
    scalability: [
      'Serviços stateless?',
      'Autoscaling configurado (HPA/VPA)?',
      'Cache em múltiplos níveis?',
      'Database com read replicas?'
    ],
    resilience: [
      'Multi-AZ deployment?',
      'Health checks em todos os serviços?',
      'Circuit breakers implementados?',
      'Retry com exponential backoff?',
      'Graceful degradation planejado?'
    ],
    observability: [
      'Métricas de negócio expostas?',
      'Logs estruturados (JSON)?',
      'Tracing distribuído?',
      'Alertas com runbooks?',
      'Dashboards por serviço?'
    ],
    security: [
      'WAF na edge?',
      'Rate limiting em APIs?',
      'Network segmentation (VPC)?',
      'IAM least privilege?',
      'Encryption at rest e in transit?'
    ],
    cost: [
      'Tagging para cost allocation?',
      'Budgets e alertas configurados?',
      'Right-sizing review mensal?',
      'Reserved/Spot strategy definida?'
    ],
    disasterRecovery: [
      'Backup automatizado?',
      'RTO/RPO definidos?',
      'DR testado trimestralmente?',
      'Runbooks de recuperação?'
    ]
  },

  // ============================================================
  // ARQUITETURA DE REFERÊNCIA
  // ============================================================
  referenceArchitecture: {
    layers: [
      {
        name: 'Edge Layer',
        components: ['CDN', 'WAF', 'DDoS Protection', 'TLS Termination'],
        tools: ['Cloudflare', 'CloudFront'],
        purpose: 'Primeira linha de defesa e cache'
      },
      {
        name: 'Load Balancing',
        components: ['Global LB', 'Regional LB', 'Health Checks'],
        tools: ['AWS ALB/NLB', 'GCP Load Balancer'],
        purpose: 'Distribuição de tráfego e failover'
      },
      {
        name: 'API Gateway',
        components: ['Auth', 'Rate Limiting', 'Request Validation'],
        tools: ['Kong', 'AWS API Gateway', 'Envoy'],
        purpose: 'Controle de acesso e políticas'
      },
      {
        name: 'Compute Layer',
        components: ['Kubernetes', 'Serverless', 'Autoscaling'],
        tools: ['EKS/GKE/AKS', 'Lambda/Cloud Run'],
        purpose: 'Execução de aplicações'
      },
      {
        name: 'Cache Layer',
        components: ['Session Cache', 'Data Cache', 'Query Cache'],
        tools: ['Redis', 'Memcached'],
        purpose: 'Redução de latência e carga no DB'
      },
      {
        name: 'Data Layer',
        components: ['Primary DB', 'Read Replicas', 'Analytics DB'],
        tools: ['Aurora/Spanner', 'BigQuery'],
        purpose: 'Persistência e análise'
      },
      {
        name: 'Event Layer',
        components: ['Message Queue', 'Event Streaming', 'Async Processing'],
        tools: ['Kafka', 'SQS/SNS', 'Pub/Sub'],
        purpose: 'Comunicação assíncrona'
      },
      {
        name: 'Observability Layer',
        components: ['Metrics', 'Logs', 'Traces', 'Alerts'],
        tools: ['Prometheus', 'Grafana', 'Loki', 'Tempo'],
        purpose: 'Visibilidade e debugging'
      }
    ]
  },

  // ============================================================
  // PADRÕES DE DESIGN PARA DURABILIDADE
  // ============================================================
  designPatterns: {
    apiVersioning: {
      name: 'Contratos Estáveis (APIs Versionadas)',
      example: 'GET /api/v1/users → GET /api/v2/users',
      rules: [
        'Nunca quebrar compatibilidade sem deprecation period (6-24 meses)',
        'Novos campos são opcionais',
        'Campos removidos viram nullable primeiro'
      ]
    },
    zeroDowntimeMigration: {
      name: 'Migrações Sem Downtime',
      phases: [
        'Adicionar coluna (nullable)',
        'Backfill dados (em batches)',
        'Deploy código que usa ambos',
        'Tornar NOT NULL',
        'Remover coluna antiga'
      ]
    },
    featureFlags: {
      name: 'Feature Flags para Deploys Seguros',
      benefits: ['Ativação gradual', 'Rollback instantâneo', 'A/B testing'],
      tools: ['LaunchDarkly', 'Unleash', 'Flagsmith']
    },
    eventSourcing: {
      name: 'Event Sourcing para Auditoria Eterna',
      principle: 'Eventos são IMUTÁVEIS - nunca delete, nunca update',
      benefits: ['Auditoria completa', 'Replay de estado', 'Time travel']
    },
    idempotency: {
      name: 'Idempotência em Todas as Operações',
      implementation: 'Idempotency-Key header',
      criticalFor: ['Pagamentos', 'Criação de recursos', 'Webhooks']
    }
  },

  // ============================================================
  // RUNBOOKS ESSENCIAIS
  // ============================================================
  runbooks: {
    incidentP0: {
      name: 'Incidente P0 - Perda de Disponibilidade',
      steps: [
        '1. Triage imediato: identificar serviço afetado',
        '2. Ativar runbook P0: isolar dependência falha',
        '3. Contenção: feature flags off, comunicação interna',
        '4. Recovery: rollback ou failover',
        '5. Pós-morte: RCA, ações corretivas'
      ],
      targetMTTR: '< 15 minutos'
    },
    canaryDeploy: {
      name: 'Deploy Canary Seguro',
      steps: [
        '1. Merge → pipeline CI executa testes',
        '2. Deploy canary 1% em cluster isolado',
        '3. Monitorar erros, latência, logs (15-30 min)',
        '4. Se OK, aumentar gradualmente (5%, 25%, 100%)',
        '5. Se degradado, rollback automático'
      ]
    },
    schemaMigration: {
      name: 'Migração de Schema Sem Downtime',
      steps: [
        '1. Adicionar novo campo como opcional',
        '2. Deploy consumers que tolerem campo ausente',
        '3. Backfill dados em batches',
        '4. Atualizar readers para novo formato',
        '5. Deprecar formato antigo após janela segura'
      ]
    }
  },

  // ============================================================
  // JURAMENTO DO ARQUITETO
  // ============================================================
  oath: `
    Eu não construo infraestrutura.
    Eu construo fundações para impérios digitais.

    Cada servidor é uma promessa de disponibilidade.
    Cada linha de Terraform é um contrato de reprodutibilidade.
    Cada métrica é uma janela para a verdade.
    Cada backup é uma garantia de continuidade.

    Eu projeto para o presente, mas planejo para o futuro.
    Eu automatizo o repetitivo para focar no importante.
    Eu documento para quem vier depois de mim.
    Eu testo falhas antes que elas me testem.

    Minha infraestrutura não apenas funciona.
    Ela funciona PARA SEMPRE.
  `
};

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

export function getToolRecommendation(category: string, useCase: string): string[] {
  const tools = INFRASTRUCTURE_SUPREME_MANIFEST.recommendedTools[category as keyof typeof INFRASTRUCTURE_SUPREME_MANIFEST.recommendedTools];
  if (!tools) return [];
  return tools.filter(t => t.use.toLowerCase().includes(useCase.toLowerCase())).map(t => t.name);
}

export function getCostStrategy(userCount: number): typeof INFRASTRUCTURE_SUPREME_MANIFEST.costStrategies.mvp {
  const strategies = INFRASTRUCTURE_SUPREME_MANIFEST.costStrategies;
  if (userCount < 10000) return strategies.mvp;
  if (userCount < 100000) return strategies.growth;
  if (userCount < 1000000) return strategies.scale;
  return strategies.millions;
}

export function getAvailabilityTarget(sla: string): typeof INFRASTRUCTURE_SUPREME_MANIFEST.metrics.availability.minimum | undefined {
  const availability = INFRASTRUCTURE_SUPREME_MANIFEST.metrics.availability;
  return Object.values(availability).find(a => a.sla === sla);
}

export function generateChecklist(categories: string[]): string[] {
  const checklist = INFRASTRUCTURE_SUPREME_MANIFEST.checklist;
  const items: string[] = [];
  
  for (const category of categories) {
    const categoryItems = checklist[category as keyof typeof checklist];
    if (categoryItems) {
      items.push(...categoryItems);
    }
  }
  
  return items;
}

export default INFRASTRUCTURE_SUPREME_MANIFEST;
