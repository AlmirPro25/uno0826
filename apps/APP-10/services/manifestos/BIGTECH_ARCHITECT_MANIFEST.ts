/**
 * 🏢 BIGTECH ARCHITECT MANIFEST
 * 
 * O Arquiteto de Sistemas no Nível das Gigantes
 * Google • Meta • Amazon • Microsoft • Apple • Netflix
 * 
 * "Escala não é um problema. É uma oportunidade de arquitetura."
 * 
 * Este manifesto contém os segredos de engenharia das maiores
 * empresas de tecnologia do mundo - sistemas que servem BILHÕES.
 */

export const BIGTECH_ARCHITECT_MANIFEST = {
  // ============================================================
  // METADADOS
  // ============================================================
  metadata: {
    id: 'bigtech-architect',
    name: 'BigTech Architect Manifest',
    version: '1.0.0',
    description: 'Arquitetura de sistemas no nível Google/Meta/Amazon/Microsoft',
    category: 'enterprise-scale',
    level: 100, // MÁXIMO - Nível BigTech
    tags: [
      'bigtech', 'google', 'meta', 'amazon', 'microsoft', 'apple', 'netflix',
      'escala', 'bilhões', 'distributed-systems', 'microservices', 'kubernetes',
      'machine-learning', 'data-pipeline', 'real-time', 'global-scale'
    ]
  },

  // ============================================================
  // FILOSOFIA BIGTECH
  // ============================================================
  philosophy: {
    core: 'Sistemas que servem bilhões não são versões maiores de sistemas pequenos. São arquiteturas fundamentalmente diferentes.',
    principles: [
      'Design for failure - Tudo vai falhar, planeje para isso',
      'Scale horizontally - Vertical tem limite, horizontal não',
      'Data is the new oil - Dados são o ativo mais valioso',
      'Automate everything - Humanos não escalam',
      'Measure everything - Se não mede, não melhora',
      'Ship fast, fix fast - Velocidade > Perfeição',
      'A/B test everything - Dados > Opiniões'
    ]
  },


  // ============================================================
  // AS 5 GIGANTES E SUAS ESPECIALIDADES
  // ============================================================
  giants: {
    google: {
      name: 'Google',
      founded: 1998,
      users: '4.3 bilhões',
      specialty: 'Search, AI/ML, Cloud, Ads',
      engineeringSecrets: {
        mapReduce: {
          description: 'Processamento distribuído de dados massivos',
          paper: 'MapReduce: Simplified Data Processing on Large Clusters (2004)',
          impact: 'Fundou o Big Data moderno',
          openSource: 'Hadoop'
        },
        bigtable: {
          description: 'Banco de dados distribuído para petabytes',
          paper: 'Bigtable: A Distributed Storage System for Structured Data (2006)',
          impact: 'Inspirou NoSQL (HBase, Cassandra)',
          characteristics: ['Sparse', 'Distributed', 'Persistent', 'Multi-dimensional sorted map']
        },
        spanner: {
          description: 'Banco de dados globalmente distribuído com ACID',
          paper: 'Spanner: Google\'s Globally-Distributed Database (2012)',
          innovation: 'TrueTime API - relógios atômicos para consistência global',
          openSource: 'CockroachDB, YugabyteDB'
        },
        borg: {
          description: 'Orquestrador de containers (predecessor do Kubernetes)',
          paper: 'Large-scale cluster management at Google with Borg (2015)',
          impact: 'Inspirou Kubernetes',
          scale: 'Gerencia milhões de jobs em milhares de máquinas'
        },
        tensorflow: {
          description: 'Framework de Machine Learning',
          innovation: 'Computação em grafo distribuída',
          scale: 'Treina modelos com trilhões de parâmetros'
        },
        sre: {
          description: 'Site Reliability Engineering',
          book: 'Site Reliability Engineering (2016)',
          principles: [
            'Error budgets',
            'Eliminating toil',
            'Monitoring distributed systems',
            'Release engineering',
            'Simplicity'
          ]
        }
      },
      techStack: {
        languages: ['C++', 'Java', 'Go', 'Python'],
        infra: ['Borg/Kubernetes', 'Spanner', 'Bigtable', 'Colossus'],
        ml: ['TensorFlow', 'JAX', 'TPUs'],
        frontend: ['Angular', 'Lit', 'Web Components']
      }
    },

    meta: {
      name: 'Meta (Facebook)',
      founded: 2004,
      users: '3.9 bilhões',
      specialty: 'Social, VR/AR, Messaging, Ads',
      engineeringSecrets: {
        tao: {
          description: 'Graph database para social graph',
          scale: 'Trilhões de edges, bilhões de queries/segundo',
          innovation: 'Cache distribuído com consistência eventual'
        },
        react: {
          description: 'Biblioteca UI declarativa',
          innovation: 'Virtual DOM, Component model',
          impact: 'Revolucionou desenvolvimento frontend'
        },
        graphql: {
          description: 'Query language para APIs',
          innovation: 'Cliente define o que quer, servidor entrega',
          impact: 'Alternativa ao REST para dados complexos'
        },
        cassandra: {
          description: 'Banco NoSQL distribuído',
          origin: 'Criado no Facebook, doado para Apache',
          characteristics: ['Eventual consistency', 'No single point of failure', 'Linear scalability']
        },
        presto: {
          description: 'SQL engine para big data',
          scale: 'Queries em petabytes em segundos',
          innovation: 'Federated queries across data sources'
        },
        pytorch: {
          description: 'Framework de Deep Learning',
          innovation: 'Dynamic computation graphs',
          adoption: 'Preferido pela comunidade de pesquisa'
        }
      },
      techStack: {
        languages: ['Hack (PHP)', 'C++', 'Python', 'Rust'],
        infra: ['TAO', 'Cassandra', 'RocksDB', 'Twine'],
        ml: ['PyTorch', 'FAISS'],
        frontend: ['React', 'React Native', 'Relay']
      }
    },

    amazon: {
      name: 'Amazon',
      founded: 1994,
      users: '310 milhões (Prime)',
      specialty: 'E-commerce, Cloud (AWS), Logistics',
      engineeringSecrets: {
        dynamo: {
          description: 'Key-value store altamente disponível',
          paper: 'Dynamo: Amazon\'s Highly Available Key-value Store (2007)',
          innovation: 'Consistent hashing, vector clocks, sloppy quorum',
          impact: 'Inspirou Cassandra, Riak, Voldemort'
        },
        twoTeamPizza: {
          description: 'Times pequenos e autônomos',
          rule: 'Se não dá pra alimentar com 2 pizzas, é grande demais',
          impact: 'Microservices architecture'
        },
        serviceOriented: {
          description: 'Tudo é um serviço',
          mandate: 'Bezos Mandate (2002): Toda comunicação via APIs',
          impact: 'Nascimento da AWS'
        },
        aws: {
          description: 'Amazon Web Services',
          services: '200+ serviços',
          marketShare: '32% do mercado de cloud',
          keyServices: ['EC2', 'S3', 'Lambda', 'DynamoDB', 'RDS', 'EKS']
        },
        anticipatoryShipping: {
          description: 'Enviar antes do pedido',
          innovation: 'ML prevê o que você vai comprar',
          impact: 'Entrega em horas, não dias'
        }
      },
      techStack: {
        languages: ['Java', 'Python', 'Go', 'Rust'],
        infra: ['AWS (tudo)', 'DynamoDB', 'Aurora', 'Kinesis'],
        ml: ['SageMaker', 'Alexa ML'],
        frontend: ['React', 'AWS Amplify']
      }
    },

    microsoft: {
      name: 'Microsoft',
      founded: 1975,
      users: '1.4 bilhões (Windows/Office)',
      specialty: 'Enterprise, Cloud (Azure), Productivity, Gaming',
      engineeringSecrets: {
        azure: {
          description: 'Cloud platform',
          marketShare: '23% do mercado',
          innovation: 'Hybrid cloud, Enterprise integration',
          keyServices: ['Azure Functions', 'Cosmos DB', 'AKS', 'Azure AI']
        },
        cosmosDb: {
          description: 'Banco multi-model globalmente distribuído',
          innovation: '5 consistency levels (Strong → Eventual)',
          sla: '99.999% availability',
          latency: '<10ms reads, <15ms writes globally'
        },
        typescript: {
          description: 'JavaScript com tipos',
          impact: 'Revolucionou desenvolvimento JS',
          adoption: 'Padrão da indústria'
        },
        vscode: {
          description: 'Editor de código',
          innovation: 'Electron + Language Server Protocol',
          marketShare: '~70% dos desenvolvedores'
        },
        github: {
          description: 'Plataforma de código',
          users: '100+ milhões de desenvolvedores',
          innovation: 'Copilot (AI pair programming)'
        },
        dotnet: {
          description: 'Framework enterprise',
          evolution: '.NET Framework → .NET Core → .NET 8',
          performance: 'Compete com Go/Rust em benchmarks'
        }
      },
      techStack: {
        languages: ['C#', 'TypeScript', 'C++', 'Python', 'Rust'],
        infra: ['Azure', 'Cosmos DB', 'SQL Server', 'Service Fabric'],
        ml: ['Azure ML', 'ONNX', 'Cognitive Services'],
        frontend: ['React', 'Blazor', 'MAUI']
      }
    },

    apple: {
      name: 'Apple',
      founded: 1976,
      users: '2 bilhões de dispositivos ativos',
      specialty: 'Hardware, Software Integration, Privacy',
      engineeringSecrets: {
        verticalIntegration: {
          description: 'Controle total do stack',
          components: ['Chips (M1/M2/M3)', 'OS', 'Hardware', 'Services'],
          advantage: 'Otimização impossível para concorrentes'
        },
        swift: {
          description: 'Linguagem moderna para Apple ecosystem',
          innovation: 'Safety, Performance, Expressiveness',
          features: ['Optionals', 'Protocol-oriented', 'Value types']
        },
        coreML: {
          description: 'ML on-device',
          innovation: 'Neural Engine no chip',
          privacy: 'Processamento local, dados não saem do device'
        },
        metalApi: {
          description: 'Graphics API de baixo nível',
          performance: 'Próximo ao hardware',
          use: 'Games, ML, Video processing'
        },
        privacyFirst: {
          description: 'Privacidade como feature',
          innovations: [
            'App Tracking Transparency',
            'Sign in with Apple',
            'Private Relay',
            'On-device processing'
          ]
        }
      },
      techStack: {
        languages: ['Swift', 'Objective-C', 'C++', 'Metal'],
        infra: ['iCloud', 'CloudKit', 'Custom data centers'],
        ml: ['Core ML', 'Create ML', 'Neural Engine'],
        frontend: ['SwiftUI', 'UIKit', 'AppKit']
      }
    },

    netflix: {
      name: 'Netflix',
      founded: 1997,
      users: '260 milhões de assinantes',
      specialty: 'Streaming, Content Delivery, Recommendations',
      engineeringSecrets: {
        chaosEngineering: {
          description: 'Quebrar sistemas de propósito',
          tools: ['Chaos Monkey', 'Chaos Kong', 'Chaos Gorilla'],
          philosophy: 'Se não testou a falha, não sabe se sobrevive'
        },
        microservices: {
          description: 'Arquitetura de centenas de serviços',
          scale: '700+ microservices',
          tools: ['Zuul', 'Eureka', 'Ribbon', 'Hystrix']
        },
        openConnect: {
          description: 'CDN própria',
          scale: 'Appliances em ISPs ao redor do mundo',
          traffic: '~15% do tráfego global de internet'
        },
        recommendations: {
          description: 'Sistema de recomendação',
          impact: '80% do conteúdo assistido vem de recomendações',
          techniques: ['Collaborative filtering', 'Content-based', 'Deep learning']
        },
        abTesting: {
          description: 'Tudo é testado',
          scale: '250+ A/B tests simultâneos',
          philosophy: 'Dados > Opiniões'
        }
      },
      techStack: {
        languages: ['Java', 'Python', 'Node.js', 'Go'],
        infra: ['AWS', 'Cassandra', 'Elasticsearch', 'Kafka'],
        ml: ['Metaflow', 'Custom ML platform'],
        frontend: ['React', 'Node.js']
      }
    }
  },


  // ============================================================
  // ARQUITETURA PARA BILHÕES
  // ============================================================
  architecturePatterns: {
    // PADRÃO 1: MICROSERVICES
    microservices: {
      description: 'Decomposição em serviços independentes',
      when: 'Times grandes, domínios complexos, escala independente',
      principles: [
        'Single responsibility per service',
        'Own your data (database per service)',
        'API contracts (versioned)',
        'Independent deployment',
        'Failure isolation'
      ],
      antiPatterns: [
        'Distributed monolith',
        'Shared database',
        'Synchronous chains',
        'Too fine-grained services'
      ],
      tools: {
        orchestration: ['Kubernetes', 'Nomad', 'ECS'],
        serviceMesh: ['Istio', 'Linkerd', 'Consul Connect'],
        apiGateway: ['Kong', 'Envoy', 'AWS API Gateway'],
        discovery: ['Consul', 'Eureka', 'Kubernetes DNS']
      }
    },

    // PADRÃO 2: EVENT-DRIVEN
    eventDriven: {
      description: 'Comunicação assíncrona via eventos',
      when: 'Desacoplamento, auditoria, replay, escala',
      patterns: [
        'Event Sourcing - Estado como sequência de eventos',
        'CQRS - Separar leitura de escrita',
        'Saga - Transações distribuídas',
        'Outbox - Garantir entrega de eventos'
      ],
      tools: {
        streaming: ['Kafka', 'Pulsar', 'Kinesis', 'EventBridge'],
        processing: ['Flink', 'Spark Streaming', 'Kafka Streams'],
        storage: ['Kafka (log)', 'EventStore', 'DynamoDB Streams']
      },
      scale: {
        kafka: 'LinkedIn processa 7 trilhões de mensagens/dia',
        kinesis: 'AWS processa milhões de eventos/segundo'
      }
    },

    // PADRÃO 3: DATA MESH
    dataMesh: {
      description: 'Dados como produto, ownership distribuído',
      principles: [
        'Domain-oriented decentralized data ownership',
        'Data as a product',
        'Self-serve data infrastructure',
        'Federated computational governance'
      ],
      vs: {
        dataLake: 'Centralizado, time de dados único',
        dataMesh: 'Distribuído, times de domínio são donos'
      },
      implementation: {
        catalog: ['DataHub', 'Amundsen', 'Apache Atlas'],
        quality: ['Great Expectations', 'dbt tests', 'Monte Carlo'],
        lineage: ['OpenLineage', 'Marquez', 'DataHub']
      }
    },

    // PADRÃO 4: CELL-BASED ARCHITECTURE
    cellBased: {
      description: 'Isolamento em células independentes',
      usedBy: ['AWS', 'Azure', 'Slack'],
      benefits: [
        'Blast radius limitado',
        'Escala horizontal infinita',
        'Deployment independente',
        'Failure isolation'
      ],
      implementation: {
        routing: 'Consistent hashing para direcionar usuários',
        replication: 'Cada célula é uma cópia completa',
        sizing: 'Célula serve X usuários (ex: 100K)'
      }
    },

    // PADRÃO 5: EDGE COMPUTING
    edgeComputing: {
      description: 'Processamento próximo ao usuário',
      usedBy: ['Cloudflare', 'Netflix', 'Akamai'],
      benefits: [
        'Latência <50ms globalmente',
        'Redução de bandwidth',
        'Compliance com dados locais',
        'Resiliência a falhas de rede'
      ],
      tools: {
        platforms: ['Cloudflare Workers', 'AWS Lambda@Edge', 'Vercel Edge'],
        databases: ['Cloudflare D1', 'PlanetScale', 'Turso'],
        cache: ['Cloudflare KV', 'Fastly', 'Akamai']
      }
    }
  },

  // ============================================================
  // ESCALA: NÚMEROS REAIS
  // ============================================================
  scaleNumbers: {
    google: {
      searchQueries: '8.5 bilhões/dia',
      youtubeHours: '1 bilhão horas assistidas/dia',
      gmailUsers: '1.8 bilhões',
      storageManaged: 'Exabytes'
    },
    meta: {
      dailyActiveUsers: '3.19 bilhões',
      photosUploaded: '350 milhões/dia',
      messagesWhatsApp: '100 bilhões/dia',
      dataProcessed: '600 TB/dia'
    },
    amazon: {
      ordersPerSecond: '66.000 (Prime Day peak)',
      s3Objects: '280 trilhões',
      lambdaInvocations: '1 trilhão/mês',
      ec2Instances: 'Milhões'
    },
    netflix: {
      hoursStreamed: '1 bilhão/semana',
      internetTraffic: '15% global',
      encodingHours: '140.000 horas de vídeo/dia',
      recommendations: '80% do conteúdo assistido'
    }
  },


  // ============================================================
  // STACK TÉCNICO BIGTECH
  // ============================================================
  techStack: {
    // LINGUAGENS POR CASO DE USO
    languages: {
      performance: {
        languages: ['C++', 'Rust', 'Go'],
        useCases: ['Databases', 'Networking', 'Systems'],
        examples: {
          cpp: 'Google (Chrome, TensorFlow), Meta (HHVM)',
          rust: 'AWS (Firecracker), Cloudflare (Workers)',
          go: 'Google (Kubernetes), Uber (services)'
        }
      },
      backend: {
        languages: ['Java', 'Go', 'Python', 'Node.js'],
        useCases: ['APIs', 'Services', 'Data processing'],
        examples: {
          java: 'Amazon, Netflix, LinkedIn',
          go: 'Google, Uber, Twitch',
          python: 'Instagram, Dropbox, Spotify'
        }
      },
      ml: {
        languages: ['Python', 'C++', 'Julia'],
        frameworks: ['PyTorch', 'TensorFlow', 'JAX'],
        examples: {
          pytorch: 'Meta, Tesla, OpenAI',
          tensorflow: 'Google, Airbnb, Twitter',
          jax: 'Google DeepMind'
        }
      },
      frontend: {
        languages: ['TypeScript', 'JavaScript'],
        frameworks: ['React', 'Angular', 'Vue'],
        examples: {
          react: 'Meta, Netflix, Airbnb',
          angular: 'Google, Microsoft',
          vue: 'Alibaba, GitLab'
        }
      }
    },

    // DATABASES POR CASO DE USO
    databases: {
      relational: {
        options: ['PostgreSQL', 'MySQL', 'Spanner', 'CockroachDB'],
        when: 'ACID, relações complexas, transações',
        scale: 'Spanner: ilimitado com consistência global'
      },
      document: {
        options: ['MongoDB', 'Couchbase', 'Firestore'],
        when: 'Schema flexível, hierarquias, prototipagem',
        scale: 'MongoDB Atlas: petabytes'
      },
      keyValue: {
        options: ['Redis', 'DynamoDB', 'Cassandra'],
        when: 'Cache, sessões, alta velocidade',
        scale: 'DynamoDB: milhões de requests/segundo'
      },
      timeSeries: {
        options: ['InfluxDB', 'TimescaleDB', 'Prometheus'],
        when: 'Métricas, IoT, logs',
        scale: 'InfluxDB: bilhões de pontos/dia'
      },
      graph: {
        options: ['Neo4j', 'Neptune', 'TAO (Meta)'],
        when: 'Relacionamentos, social graphs, fraud detection',
        scale: 'TAO: trilhões de edges'
      },
      vector: {
        options: ['Pinecone', 'Weaviate', 'Milvus', 'pgvector'],
        when: 'Embeddings, semantic search, RAG',
        scale: 'Pinecone: bilhões de vetores'
      }
    },

    // INFRAESTRUTURA
    infrastructure: {
      compute: {
        containers: ['Kubernetes', 'ECS', 'Cloud Run'],
        serverless: ['Lambda', 'Cloud Functions', 'Vercel'],
        vms: ['EC2', 'Compute Engine', 'Azure VMs']
      },
      networking: {
        loadBalancing: ['ALB/NLB', 'Cloud Load Balancing', 'Cloudflare'],
        cdn: ['CloudFront', 'Cloudflare', 'Fastly'],
        dns: ['Route 53', 'Cloud DNS', 'Cloudflare DNS']
      },
      observability: {
        metrics: ['Prometheus', 'Datadog', 'CloudWatch'],
        logs: ['ELK', 'Loki', 'CloudWatch Logs'],
        traces: ['Jaeger', 'Zipkin', 'X-Ray'],
        apm: ['Datadog', 'New Relic', 'Dynatrace']
      }
    }
  },

  // ============================================================
  // PRÁTICAS DE ENGENHARIA
  // ============================================================
  engineeringPractices: {
    // DESENVOLVIMENTO
    development: {
      codeReview: {
        practice: 'Todo código é revisado',
        tools: ['GitHub PRs', 'Gerrit', 'Phabricator'],
        metrics: ['Time to review', 'Comments per PR', 'Approval rate']
      },
      testing: {
        pyramid: ['Unit (70%)', 'Integration (20%)', 'E2E (10%)'],
        practices: ['TDD', 'Property-based testing', 'Mutation testing'],
        coverage: 'Mínimo 80%, crítico 95%'
      },
      cicd: {
        frequency: 'Múltiplos deploys por dia',
        practices: ['Trunk-based development', 'Feature flags', 'Canary releases'],
        tools: ['GitHub Actions', 'Jenkins', 'Spinnaker', 'ArgoCD']
      }
    },

    // OPERAÇÕES
    operations: {
      sre: {
        description: 'Site Reliability Engineering',
        metrics: ['SLIs', 'SLOs', 'Error budgets'],
        practices: ['Blameless postmortems', 'Toil reduction', 'Capacity planning']
      },
      oncall: {
        rotation: '1 semana on, 3-4 semanas off',
        tools: ['PagerDuty', 'OpsGenie', 'VictorOps'],
        practices: ['Runbooks', 'Escalation policies', 'Incident commanders']
      },
      chaos: {
        description: 'Chaos Engineering',
        tools: ['Chaos Monkey', 'Gremlin', 'Litmus'],
        practices: ['Game days', 'Failure injection', 'Disaster recovery drills']
      }
    },

    // SEGURANÇA
    security: {
      practices: [
        'Security by design',
        'Shift left security',
        'Zero trust architecture',
        'Defense in depth'
      ],
      tools: {
        sast: ['SonarQube', 'Semgrep', 'CodeQL'],
        dast: ['OWASP ZAP', 'Burp Suite'],
        secrets: ['Vault', 'AWS Secrets Manager', 'SOPS'],
        iam: ['Okta', 'Auth0', 'AWS IAM']
      },
      compliance: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI-DSS']
    }
  },


  // ============================================================
  // PAPERS FUNDAMENTAIS (LEITURA OBRIGATÓRIA)
  // ============================================================
  fundamentalPapers: [
    {
      title: 'The Google File System',
      year: 2003,
      authors: 'Ghemawat, Gobioff, Leung',
      impact: 'Fundou sistemas de arquivos distribuídos',
      url: 'https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf'
    },
    {
      title: 'MapReduce: Simplified Data Processing on Large Clusters',
      year: 2004,
      authors: 'Dean, Ghemawat',
      impact: 'Fundou Big Data processing',
      url: 'https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf'
    },
    {
      title: 'Bigtable: A Distributed Storage System for Structured Data',
      year: 2006,
      authors: 'Chang et al.',
      impact: 'Inspirou NoSQL movement',
      url: 'https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf'
    },
    {
      title: 'Dynamo: Amazon\'s Highly Available Key-value Store',
      year: 2007,
      authors: 'DeCandia et al.',
      impact: 'Fundou eventual consistency databases',
      url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf'
    },
    {
      title: 'Kafka: a Distributed Messaging System for Log Processing',
      year: 2011,
      authors: 'Kreps, Narkhede, Rao',
      impact: 'Fundou event streaming',
      url: 'http://notes.stephenholiday.com/Kafka.pdf'
    },
    {
      title: 'Spanner: Google\'s Globally-Distributed Database',
      year: 2012,
      authors: 'Corbett et al.',
      impact: 'Provou que global ACID é possível',
      url: 'https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf'
    },
    {
      title: 'Large-scale cluster management at Google with Borg',
      year: 2015,
      authors: 'Verma et al.',
      impact: 'Inspirou Kubernetes',
      url: 'https://research.google/pubs/pub43438/'
    },
    {
      title: 'Attention Is All You Need',
      year: 2017,
      authors: 'Vaswani et al.',
      impact: 'Fundou era dos Transformers (GPT, BERT, etc)',
      url: 'https://arxiv.org/abs/1706.03762'
    }
  ],

  // ============================================================
  // TEMPLATE: SISTEMA BIGTECH
  // ============================================================
  systemTemplate: {
    name: 'BigTech System Template',
    description: 'Arquitetura de referência para sistemas de escala global',
    
    layers: {
      edge: {
        description: 'Camada mais próxima do usuário',
        components: ['CDN', 'Edge Functions', 'WAF', 'DDoS Protection'],
        latency: '<50ms'
      },
      gateway: {
        description: 'Entrada do sistema',
        components: ['API Gateway', 'Load Balancer', 'Rate Limiter', 'Auth'],
        latency: '<100ms'
      },
      services: {
        description: 'Lógica de negócio',
        components: ['Microservices', 'Service Mesh', 'gRPC/REST'],
        latency: '<200ms'
      },
      data: {
        description: 'Persistência',
        components: ['Primary DB', 'Cache', 'Search', 'Analytics'],
        latency: '<50ms (cache), <200ms (DB)'
      },
      async: {
        description: 'Processamento assíncrono',
        components: ['Message Queue', 'Stream Processing', 'Batch Jobs'],
        latency: 'Eventual (seconds to hours)'
      }
    },

    crossCutting: {
      observability: ['Metrics', 'Logs', 'Traces', 'Alerts'],
      security: ['AuthN', 'AuthZ', 'Encryption', 'Audit'],
      resilience: ['Circuit Breakers', 'Retries', 'Timeouts', 'Fallbacks']
    },

    sampleArchitecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BIGTECH ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           EDGE LAYER                                    │   │
│  │  [Cloudflare/Fastly CDN] → [Edge Functions] → [WAF] → [DDoS Shield]    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         GATEWAY LAYER                                   │   │
│  │  [API Gateway] → [Auth Service] → [Rate Limiter] → [Load Balancer]     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVICE LAYER                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │ User Svc │  │ Order Svc│  │Payment Svc│ │ Notif Svc│               │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │   │
│  │       │             │             │             │                      │   │
│  │       └─────────────┴─────────────┴─────────────┘                      │   │
│  │                         │                                              │   │
│  │                    [Service Mesh - Istio/Linkerd]                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │PostgreSQL│  │  Redis   │  │Elasticsearch│ │ S3/GCS  │               │   │
│  │  │ (Primary)│  │ (Cache)  │  │ (Search)  │  │ (Files) │               │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ASYNC LAYER                                     │   │
│  │  [Kafka] → [Flink/Spark] → [Data Lake] → [ML Pipeline] → [Analytics]   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                            CROSS-CUTTING                                        │
│  [Prometheus/Grafana] [ELK Stack] [Jaeger] [Vault] [Terraform] [ArgoCD]        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`
  },


  // ============================================================
  // MÉTRICAS E SLOs BIGTECH
  // ============================================================
  metricsAndSLOs: {
    goldenSignals: {
      latency: {
        description: 'Tempo de resposta',
        p50: '<100ms',
        p95: '<500ms',
        p99: '<1s'
      },
      traffic: {
        description: 'Requests por segundo',
        measure: 'RPS, QPS, concurrent users'
      },
      errors: {
        description: 'Taxa de erros',
        target: '<0.1% (99.9% success rate)'
      },
      saturation: {
        description: 'Utilização de recursos',
        target: '<70% CPU, <80% memory'
      }
    },
    
    sloExamples: {
      availability: {
        '99.9%': '8.76 hours downtime/year',
        '99.95%': '4.38 hours downtime/year',
        '99.99%': '52.6 minutes downtime/year',
        '99.999%': '5.26 minutes downtime/year'
      },
      latency: {
        api: 'p99 < 200ms',
        web: 'LCP < 2.5s, FID < 100ms, CLS < 0.1',
        database: 'p99 < 50ms'
      }
    },

    errorBudget: {
      description: 'Quanto erro é permitido antes de parar features',
      calculation: '100% - SLO = Error Budget',
      example: 'SLO 99.9% = 0.1% error budget = 43.8 min/month',
      policy: 'Se budget acabar, foco em reliability, não features'
    }
  },

  // ============================================================
  // CULTURA E ORGANIZAÇÃO
  // ============================================================
  cultureAndOrg: {
    teamStructure: {
      twoTeamPizza: {
        description: 'Times pequenos e autônomos',
        size: '6-10 pessoas',
        ownership: 'End-to-end de um domínio',
        autonomy: 'Decide tecnologia, processo, prioridades'
      },
      platformTeams: {
        description: 'Times que servem outros times',
        examples: ['Infra', 'Developer Experience', 'Data Platform'],
        model: 'Internal product teams'
      },
      guilds: {
        description: 'Comunidades de prática',
        examples: ['Frontend Guild', 'ML Guild', 'Security Guild'],
        purpose: 'Compartilhar conhecimento entre times'
      }
    },

    engineeringLevels: {
      ic: {
        junior: 'L3/E3 - Executa tarefas definidas',
        mid: 'L4/E4 - Resolve problemas independentemente',
        senior: 'L5/E5 - Lidera projetos, mentora',
        staff: 'L6/E6 - Impacto em múltiplos times',
        principal: 'L7/E7 - Impacto em toda a empresa',
        distinguished: 'L8+/E8+ - Impacto na indústria'
      },
      management: {
        techLead: 'Líder técnico de um time',
        manager: 'Gerencia pessoas (5-10)',
        seniorManager: 'Gerencia managers',
        director: 'Gerencia área/departamento',
        vp: 'Gerencia múltiplas áreas',
        cto: 'Visão técnica da empresa'
      }
    },

    interviewProcess: {
      stages: [
        'Phone screen (45min)',
        'Technical phone (1h)',
        'Onsite (4-6 rounds)',
        'Hiring committee',
        'Offer'
      ],
      rounds: {
        coding: 'Algoritmos e estruturas de dados',
        systemDesign: 'Arquitetura de sistemas',
        behavioral: 'Situações passadas, cultura',
        domainSpecific: 'Conhecimento da área'
      },
      tips: [
        'Pense em voz alta',
        'Faça perguntas clarificadoras',
        'Comece simples, depois otimize',
        'Considere trade-offs',
        'Discuta escalabilidade'
      ]
    }
  },

  // ============================================================
  // CHECKLIST BIGTECH
  // ============================================================
  checklist: {
    architecture: [
      '[ ] Horizontally scalable?',
      '[ ] No single point of failure?',
      '[ ] Graceful degradation?',
      '[ ] Circuit breakers implemented?',
      '[ ] Retry with exponential backoff?',
      '[ ] Idempotent operations?',
      '[ ] Event-driven where appropriate?'
    ],
    data: [
      '[ ] Database per service?',
      '[ ] Caching strategy defined?',
      '[ ] Data partitioning/sharding?',
      '[ ] Backup and recovery tested?',
      '[ ] GDPR/privacy compliant?'
    ],
    observability: [
      '[ ] Structured logging?',
      '[ ] Distributed tracing?',
      '[ ] Metrics and dashboards?',
      '[ ] Alerting with runbooks?',
      '[ ] SLIs/SLOs defined?'
    ],
    security: [
      '[ ] Authentication/Authorization?',
      '[ ] Encryption at rest and in transit?',
      '[ ] Secrets management?',
      '[ ] Security scanning in CI?',
      '[ ] Penetration testing?'
    ],
    operations: [
      '[ ] CI/CD pipeline?',
      '[ ] Feature flags?',
      '[ ] Canary deployments?',
      '[ ] Rollback strategy?',
      '[ ] Disaster recovery plan?',
      '[ ] On-call rotation?'
    ]
  },

  // ============================================================
  // ANTI-PATTERNS
  // ============================================================
  antiPatterns: [
    {
      name: 'Distributed Monolith',
      description: 'Microservices que precisam ser deployados juntos',
      fix: 'Verdadeira independência de serviços'
    },
    {
      name: 'Shared Database',
      description: 'Múltiplos serviços acessando mesmo banco',
      fix: 'Database per service + APIs'
    },
    {
      name: 'Synchronous Chains',
      description: 'A chama B que chama C que chama D...',
      fix: 'Event-driven, async, saga pattern'
    },
    {
      name: 'Big Bang Releases',
      description: 'Deploy de muitas mudanças de uma vez',
      fix: 'Continuous deployment, feature flags'
    },
    {
      name: 'Premature Optimization',
      description: 'Otimizar antes de ter dados',
      fix: 'Measure first, optimize second'
    },
    {
      name: 'Resume-Driven Development',
      description: 'Escolher tech por hype, não necessidade',
      fix: 'Boring technology, proven solutions'
    }
  ]
};

// ============================================================
// EXPORT DO MANIFESTO COMO STRING
// ============================================================
export const BIGTECH_ARCHITECT_MANIFEST_STRING = JSON.stringify(
  BIGTECH_ARCHITECT_MANIFEST,
  null,
  2
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getBigTechByName(name: string) {
  const giants = BIGTECH_ARCHITECT_MANIFEST.giants as Record<string, any>;
  return giants[name.toLowerCase()] || null;
}

export function getArchitecturePattern(pattern: string) {
  const patterns = BIGTECH_ARCHITECT_MANIFEST.architecturePatterns as Record<string, any>;
  return patterns[pattern] || null;
}

export function getFundamentalPapers() {
  return BIGTECH_ARCHITECT_MANIFEST.fundamentalPapers;
}

export function getScaleNumbers() {
  return BIGTECH_ARCHITECT_MANIFEST.scaleNumbers;
}

export function getChecklist() {
  return BIGTECH_ARCHITECT_MANIFEST.checklist;
}

export default BIGTECH_ARCHITECT_MANIFEST;
