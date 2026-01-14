/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  🏭 SOFTWARE HOUSE SUPREME MANIFEST                                          ║
 * ║  A Mente Completa de uma Fábrica de Software de Classe Mundial               ║
 * ║                                                                              ║
 * ║  Baseado em: ThoughtWorks, Google SRE, Spotify, Atlassian, Netflix           ║
 * ║  Level: 99 (MÁXIMO)                                                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const SOFTWARE_HOUSE_SUPREME_MANIFEST = {
  id: 'software-house-supreme',
  name: 'SOFTWARE HOUSE SUPREME MANIFEST',
  version: '1.0.0',
  level: 99,
  category: 'ENTERPRISE',
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 1: IDENTIDADE E PROPÓSITO
  // ═══════════════════════════════════════════════════════════════════════════
  
  identity: {
    definition: `
      Uma Software House é uma empresa especializada em conceber, construir, 
      testar, operar e manter software. Não é apenas uma "fábrica de código" - 
      é uma organização que transforma problemas de negócio em soluções digitais 
      de valor mensurável.
    `,
    
    mission: `
      Transformar problemas complexos de clientes em produtos digitais que:
      - Resolvem problemas REAIS (não imaginários)
      - Geram valor MENSURÁVEL (métricas de negócio)
      - São CONFIÁVEIS (disponibilidade, segurança)
      - ESCALAM (crescem com o negócio)
      - Proporcionam EXPERIÊNCIA excepcional (UX)
    `,
    
    coreBeliefs: [
      'Software é um meio, não um fim - o objetivo é resolver problemas',
      'Qualidade não é negociável - bugs em produção custam 100x mais',
      'Velocidade sustentável > velocidade a qualquer custo',
      'Pessoas > Processos > Ferramentas',
      'Feedback rápido reduz risco e custo',
      'Automação libera humanos para trabalho criativo',
      'Transparência constrói confiança',
      'Melhoria contínua é obrigação, não opção'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 2: OS 8 PILARES FUNDAMENTAIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  pillars: {
    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 1: PRODUTO & DESCOBERTA
    // ─────────────────────────────────────────────────────────────────────────
    productDiscovery: {
      name: 'Produto & Descoberta',
      description: 'Entender o problema antes de construir a solução',
      
      frameworks: {
        jobsToBeDone: {
          description: 'Entender o "trabalho" que o cliente quer realizar',
          template: 'Quando [situação], eu quero [motivação], para que [resultado esperado]',
          example: 'Quando preciso pagar um fornecedor, quero fazer PIX pelo app, para não perder tempo no banco'
        },
        
        leanCanvas: {
          sections: [
            'Problema (top 3)',
            'Segmentos de Cliente',
            'Proposta de Valor Única',
            'Solução',
            'Canais',
            'Fontes de Receita',
            'Estrutura de Custos',
            'Métricas-Chave',
            'Vantagem Injusta'
          ]
        },
        
        designSprint: {
          days: [
            'Segunda: Mapear o problema e escolher foco',
            'Terça: Esboçar soluções individualmente',
            'Quarta: Decidir a melhor solução',
            'Quinta: Prototipar',
            'Sexta: Testar com usuários reais'
          ]
        }
      },
      
      validationMethods: [
        'Entrevistas com usuários (mínimo 5)',
        'Análise de concorrentes',
        'Protótipo de baixa fidelidade',
        'Teste de usabilidade',
        'Smoke test (landing page + ads)',
        'Concierge MVP (fazer manualmente antes de automatizar)'
      ],
      
      metrics: {
        problemFit: 'Usuários confirmam que o problema existe e é relevante',
        solutionFit: 'Usuários usam e pagam pela solução',
        productMarketFit: 'Crescimento orgânico, retenção alta, NPS > 40'
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 2: ARQUITETURA & ENGENHARIA
    // ─────────────────────────────────────────────────────────────────────────
    architectureEngineering: {
      name: 'Arquitetura & Engenharia',
      description: 'Decisões técnicas que suportam o negócio',
      
      principles: [
        'Simplicidade primeiro - complexidade só quando necessário',
        'Modularidade - componentes independentes e substituíveis',
        'Observabilidade - se não pode medir, não pode melhorar',
        'Segurança por design - não como afterthought',
        'Escalabilidade horizontal quando possível',
        'Fail fast, recover faster',
        'Infraestrutura como código',
        'Twelve-Factor App'
      ],
      
      architectureDecisionRecord: {
        template: `
          # ADR-XXX: [Título da Decisão]
          
          ## Status
          [Proposta | Aceita | Deprecada | Substituída]
          
          ## Contexto
          [Qual problema estamos resolvendo?]
          
          ## Decisão
          [O que decidimos fazer?]
          
          ## Alternativas Consideradas
          [Quais outras opções avaliamos?]
          
          ## Consequências
          [Positivas e negativas da decisão]
          
          ## Referências
          [Links, documentos, discussões]
        `
      },
      
      patterns: {
        monolithFirst: {
          when: 'MVP, time pequeno, domínio não claro',
          benefits: 'Velocidade, simplicidade, refatoração fácil',
          evolution: 'Extrair serviços conforme domínio fica claro'
        },
        
        microservices: {
          when: 'Escala, times independentes, domínios claros',
          requirements: [
            'CI/CD maduro',
            'Observabilidade robusta',
            'Service mesh ou API gateway',
            'Contratos bem definidos'
          ]
        },
        
        eventDriven: {
          when: 'Desacoplamento, processamento assíncrono, auditoria',
          patterns: ['Event Sourcing', 'CQRS', 'Saga', 'Outbox']
        }
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 3: PROCESSO DE ENTREGA (SDLC)
    // ─────────────────────────────────────────────────────────────────────────
    deliveryProcess: {
      name: 'Processo de Entrega',
      description: 'Do código ao usuário com qualidade e velocidade',
      
      sdlcPhases: {
        planning: {
          activities: [
            'Refinamento de backlog',
            'Estimativa (story points ou t-shirt sizing)',
            'Priorização por valor/esforço',
            'Sprint planning ou Kanban replenishment'
          ],
          artifacts: ['User Stories', 'Acceptance Criteria', 'Definition of Ready']
        },
        
        development: {
          practices: [
            'Trunk-based development ou GitFlow simplificado',
            'Feature flags para releases graduais',
            'Pair programming para conhecimento crítico',
            'Code review obrigatório (PRs < 400 linhas)',
            'Commits pequenos e frequentes'
          ],
          standards: {
            branchNaming: 'feature/TICKET-123-descricao-curta',
            commitMessage: 'feat(scope): descrição imperativa [TICKET-123]',
            prTemplate: 'O que, Por que, Como testar, Screenshots'
          }
        },
        
        testing: {
          pyramid: {
            unit: { percentage: '70%', speed: 'ms', isolation: 'total' },
            integration: { percentage: '20%', speed: 's', isolation: 'parcial' },
            e2e: { percentage: '10%', speed: 'min', isolation: 'nenhuma' }
          },
          types: [
            'Unit tests (lógica de negócio)',
            'Integration tests (APIs, banco)',
            'Contract tests (entre serviços)',
            'E2E tests (fluxos críticos)',
            'Performance tests (carga, stress)',
            'Security tests (SAST, DAST, pentest)'
          ],
          coverage: {
            minimum: '80%',
            critical: '95% para código financeiro/segurança'
          }
        },
        
        deployment: {
          strategies: {
            blueGreen: 'Dois ambientes idênticos, switch instantâneo',
            canary: 'Release gradual (1% → 10% → 50% → 100%)',
            rolling: 'Atualização gradual de instâncias',
            featureFlags: 'Código em prod, funcionalidade controlada'
          },
          checklist: [
            'Testes passando',
            'Code review aprovado',
            'Security scan limpo',
            'Documentação atualizada',
            'Runbook pronto',
            'Rollback testado',
            'Métricas/alertas configurados'
          ]
        },
        
        monitoring: {
          pillars: {
            metrics: 'Números agregados (latência, erros, throughput)',
            logs: 'Eventos discretos com contexto',
            traces: 'Jornada de uma requisição entre serviços'
          },
          alerts: {
            severity: ['P1 Critical', 'P2 High', 'P3 Medium', 'P4 Low'],
            rules: 'Alertar em sintomas, não causas'
          }
        }
      },
      
      doraMetrics: {
        deploymentFrequency: {
          elite: 'Múltiplos deploys por dia',
          high: 'Entre 1/dia e 1/semana',
          medium: 'Entre 1/semana e 1/mês',
          low: 'Menos de 1/mês'
        },
        leadTimeForChanges: {
          elite: 'Menos de 1 hora',
          high: 'Entre 1 dia e 1 semana',
          medium: 'Entre 1 semana e 1 mês',
          low: 'Mais de 1 mês'
        },
        changeFailureRate: {
          elite: '0-15%',
          high: '16-30%',
          medium: '31-45%',
          low: '46-60%'
        },
        mttr: {
          elite: 'Menos de 1 hora',
          high: 'Menos de 1 dia',
          medium: 'Entre 1 dia e 1 semana',
          low: 'Mais de 1 semana'
        }
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 4: OPERAÇÕES & CONFIABILIDADE (SRE)
    // ─────────────────────────────────────────────────────────────────────────
    operationsReliability: {
      name: 'Operações & Confiabilidade',
      description: 'Mentalidade SRE - Engenharia de Confiabilidade',
      source: 'Google SRE Book',
      
      philosophy: `
        SRE é o que acontece quando você pede para um engenheiro de software 
        projetar uma equipe de operações. O objetivo é criar sistemas escaláveis 
        e altamente confiáveis através de engenharia.
      `,
      
      sloSliSla: {
        sli: {
          definition: 'Service Level Indicator - métrica que mede o serviço',
          examples: [
            'Latência p99 das requisições',
            'Taxa de erros (5xx / total)',
            'Disponibilidade (uptime)',
            'Throughput (req/s)'
          ]
        },
        slo: {
          definition: 'Service Level Objective - meta interna para o SLI',
          examples: [
            'Latência p99 < 200ms',
            'Taxa de erros < 0.1%',
            'Disponibilidade > 99.9%'
          ]
        },
        sla: {
          definition: 'Service Level Agreement - contrato com cliente',
          note: 'SLA deve ser menos rigoroso que SLO (margem de segurança)'
        },
        errorBudget: {
          definition: '100% - SLO = quanto pode falhar',
          example: 'SLO 99.9% = 0.1% error budget = 43min/mês de downtime permitido',
          usage: 'Se error budget acabou, foco em confiabilidade, não features'
        }
      },
      
      incidentManagement: {
        severityLevels: {
          p1: { name: 'Critical', response: '15min', example: 'Sistema fora do ar' },
          p2: { name: 'High', response: '1h', example: 'Funcionalidade crítica degradada' },
          p3: { name: 'Medium', response: '4h', example: 'Funcionalidade secundária afetada' },
          p4: { name: 'Low', response: '24h', example: 'Bug menor, workaround existe' }
        },
        
        roles: {
          incidentCommander: 'Coordena resposta, comunica stakeholders',
          techLead: 'Lidera investigação técnica',
          scribe: 'Documenta timeline e ações',
          communicator: 'Atualiza status page e clientes'
        },
        
        process: [
          '1. Detectar (alertas, usuários, monitoramento)',
          '2. Triagem (severidade, impacto)',
          '3. Mobilizar (chamar pessoas certas)',
          '4. Investigar (logs, métricas, traces)',
          '5. Mitigar (restaurar serviço ASAP)',
          '6. Resolver (fix permanente)',
          '7. Postmortem (aprender)'
        ]
      },
      
      postmortemTemplate: `
        # Postmortem: [Título do Incidente]
        
        ## Resumo
        - Data/Hora: [quando]
        - Duração: [quanto tempo]
        - Impacto: [usuários afetados, receita perdida]
        - Severidade: [P1/P2/P3/P4]
        
        ## Timeline
        - HH:MM - [evento]
        - HH:MM - [ação tomada]
        
        ## Root Cause
        [Análise dos 5 Porquês]
        
        ## O que funcionou bem
        - [item]
        
        ## O que pode melhorar
        - [item]
        
        ## Action Items
        | Ação | Owner | Prazo | Status |
        |------|-------|-------|--------|
        | [ação] | [pessoa] | [data] | [status] |
        
        ## Lições Aprendidas
        [O que aprendemos para evitar no futuro]
      `,
      
      toil: {
        definition: 'Trabalho manual, repetitivo, automatizável, sem valor duradouro',
        target: 'Máximo 50% do tempo em toil, resto em engenharia',
        examples: [
          'Deploys manuais → Automatizar CI/CD',
          'Restart de serviços → Auto-healing',
          'Análise de logs manual → Alertas automáticos',
          'Provisionamento manual → IaC'
        ]
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 5: PESSOAS & CULTURA
    // ─────────────────────────────────────────────────────────────────────────
    peopleCulture: {
      name: 'Pessoas & Cultura',
      description: 'O ativo mais valioso de uma Software House',
      sources: ['Netflix Culture Deck', 'Spotify Model', 'Atlassian Playbook'],
      
      cultureCode: {
        values: [
          'Autonomia com responsabilidade',
          'Feedback contínuo e honesto',
          'Aprendizado constante',
          'Colaboração sobre competição',
          'Diversidade como força',
          'Excelência técnica',
          'Foco no cliente',
          'Transparência radical'
        ],
        
        netflixPrinciples: [
          'Pessoas > Processos',
          'Contexto > Controle',
          'Altamente alinhados, fracamente acoplados',
          'Pague top of market',
          'Keeper test: lutaria para manter essa pessoa?'
        ]
      },
      
      organizationalStructure: {
        spotifyModel: {
          squad: {
            definition: 'Time cross-functional com missão clara',
            size: '6-10 pessoas',
            composition: ['PO', 'Tech Lead', 'Devs', 'QA', 'Designer'],
            autonomy: 'Decide O QUE e COMO entregar'
          },
          tribe: {
            definition: 'Conjunto de squads com área relacionada',
            size: 'Até 100 pessoas',
            purpose: 'Alinhamento e compartilhamento'
          },
          chapter: {
            definition: 'Pessoas com mesma competência em squads diferentes',
            examples: ['Chapter de Backend', 'Chapter de QA'],
            purpose: 'Desenvolvimento de carreira, padrões técnicos'
          },
          guild: {
            definition: 'Comunidade de interesse cross-tribe',
            examples: ['Guild de Segurança', 'Guild de UX'],
            purpose: 'Compartilhar conhecimento, boas práticas'
          }
        }
      },
      
      hiring: {
        process: [
          '1. Triagem de CV (fit cultural + técnico básico)',
          '2. Entrevista inicial (RH + hiring manager)',
          '3. Desafio técnico (take-home ou live coding)',
          '4. Entrevista técnica (deep dive com peers)',
          '5. Entrevista cultural (valores, soft skills)',
          '6. Referências',
          '7. Oferta'
        ],
        
        criteria: {
          technical: ['Fundamentos sólidos', 'Capacidade de aprender', 'Qualidade de código'],
          cultural: ['Colaboração', 'Comunicação', 'Ownership', 'Curiosidade'],
          redFlags: ['Ego inflado', 'Blame culture', 'Resistência a feedback']
        },
        
        onboarding: {
          week1: ['Setup ambiente', 'Conhecer time', 'Documentação', 'Primeiro PR pequeno'],
          week2to4: ['Buddy system', 'Tarefas progressivas', 'Feedback frequente'],
          day30: ['1:1 formal', 'Ajuste de expectativas', 'Plano de desenvolvimento']
        }
      },
      
      careerLadder: {
        ic: {
          junior: { years: '0-2', focus: 'Aprender, executar com supervisão' },
          mid: { years: '2-5', focus: 'Executar independente, mentorar juniors' },
          senior: { years: '5-8', focus: 'Liderar tecnicamente, decisões de arquitetura' },
          staff: { years: '8+', focus: 'Impacto cross-team, estratégia técnica' },
          principal: { years: '10+', focus: 'Impacto organizacional, visão de longo prazo' }
        },
        management: {
          techLead: 'Liderança técnica de squad',
          engineeringManager: 'Gestão de pessoas (1 squad)',
          seniorEM: 'Gestão de múltiplos squads',
          director: 'Gestão de tribe/área',
          vp: 'Estratégia de engenharia'
        }
      },
      
      feedback: {
        oneOnOne: {
          frequency: 'Semanal ou quinzenal',
          duration: '30-60 min',
          agenda: ['Como você está?', 'Bloqueios', 'Carreira', 'Feedback bidirecional']
        },
        performanceReview: {
          frequency: 'Semestral ou anual',
          components: ['Auto-avaliação', 'Peer feedback', 'Manager assessment', 'Calibração']
        }
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 6: COMERCIAL & CONTRATOS
    // ─────────────────────────────────────────────────────────────────────────
    commercialContracts: {
      name: 'Comercial & Contratos',
      description: 'Modelos de negócio e governança de projetos',
      
      businessModels: {
        fixedPrice: {
          description: 'Preço fechado por escopo definido',
          when: 'Escopo claro, requisitos estáveis',
          risk: 'Cliente (se escopo mudar, paga mais)',
          margin: 'Alta se estimativa boa, negativa se errar'
        },
        timeAndMaterials: {
          description: 'Cobra por hora/dia trabalhado',
          when: 'Escopo incerto, projeto exploratório',
          risk: 'Fornecedor (cliente pode cancelar)',
          margin: 'Previsível, menor variação'
        },
        retainer: {
          description: 'Capacidade reservada por mês',
          when: 'Relacionamento longo, demanda variável',
          benefit: 'Receita previsível, cliente prioritário'
        },
        outcomeBased: {
          description: 'Pagamento por resultado (ex: % de economia gerada)',
          when: 'Confiança alta, métricas claras',
          risk: 'Alto para fornecedor, alto retorno potencial'
        },
        productized: {
          description: 'Serviço empacotado como produto (preço fixo, escopo fixo)',
          examples: ['MVP em 4 semanas por R$ X', 'Auditoria de código por R$ Y'],
          benefit: 'Escalável, processo otimizado'
        }
      },
      
      pricing: {
        costPlus: 'Custo + margem (ex: custo R$ 100/h, vende R$ 150/h)',
        valueBased: 'Preço baseado no valor entregue ao cliente',
        marketRate: 'Preço alinhado com concorrência',
        
        factors: [
          'Senioridade do time',
          'Complexidade técnica',
          'Urgência',
          'Tamanho do cliente',
          'Relacionamento existente',
          'Potencial de upsell'
        ]
      },
      
      contractEssentials: {
        scope: 'O que será entregue (e o que NÃO será)',
        deliverables: 'Artefatos específicos com critérios de aceite',
        timeline: 'Marcos, datas, dependências',
        payment: 'Valores, condições, cronograma',
        changeManagement: 'Como lidar com mudanças de escopo',
        ip: 'Quem é dono do código (geralmente cliente)',
        warranty: 'Período de garantia para bugs',
        maintenance: 'Termos de suporte pós-entrega',
        termination: 'Condições de cancelamento',
        liability: 'Limites de responsabilidade',
        confidentiality: 'NDA, proteção de dados'
      },
      
      salesProcess: {
        stages: [
          'Lead (contato inicial)',
          'Qualificação (fit, budget, timing)',
          'Discovery (entender problema)',
          'Proposta (solução + preço)',
          'Negociação',
          'Fechamento',
          'Onboarding'
        ],
        
        qualification: {
          bant: ['Budget', 'Authority', 'Need', 'Timeline'],
          redFlags: [
            'Sem budget definido',
            'Decisor não envolvido',
            'Problema não claro',
            'Urgência irreal'
          ]
        }
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 7: SEGURANÇA & COMPLIANCE
    // ─────────────────────────────────────────────────────────────────────────
    securityCompliance: {
      name: 'Segurança & Compliance',
      description: 'Proteção de dados e conformidade regulatória',
      
      securityByDesign: {
        principles: [
          'Shift-left: segurança desde o design',
          'Defense in depth: múltiplas camadas',
          'Least privilege: mínimo acesso necessário',
          'Zero trust: nunca confie, sempre verifique',
          'Fail secure: na dúvida, bloqueie'
        ],
        
        sdlc: {
          design: 'Threat modeling, security requirements',
          development: 'Secure coding, code review, SAST',
          testing: 'DAST, penetration testing',
          deployment: 'Hardening, secrets management',
          operations: 'Monitoring, incident response'
        }
      },
      
      owaspTop10: [
        'A01: Broken Access Control',
        'A02: Cryptographic Failures',
        'A03: Injection',
        'A04: Insecure Design',
        'A05: Security Misconfiguration',
        'A06: Vulnerable Components',
        'A07: Authentication Failures',
        'A08: Software Integrity Failures',
        'A09: Logging Failures',
        'A10: SSRF'
      ],
      
      compliance: {
        lgpd: {
          name: 'Lei Geral de Proteção de Dados (Brasil)',
          requirements: [
            'Consentimento para coleta',
            'Finalidade específica',
            'Minimização de dados',
            'Direito de acesso/exclusão',
            'Notificação de vazamentos',
            'DPO (Data Protection Officer)'
          ]
        },
        gdpr: {
          name: 'General Data Protection Regulation (EU)',
          similar: 'LGPD, mas mais rigoroso'
        },
        pciDss: {
          name: 'Payment Card Industry Data Security Standard',
          when: 'Processa dados de cartão de crédito',
          levels: ['Level 1 (>6M tx)', 'Level 2', 'Level 3', 'Level 4']
        },
        soc2: {
          name: 'Service Organization Control 2',
          when: 'SaaS B2B, clientes enterprise',
          principles: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy']
        }
      },
      
      securityPolicies: {
        accessControl: 'Quem pode acessar o quê, como, quando',
        passwordPolicy: 'Complexidade, rotação, MFA',
        incidentResponse: 'Como reagir a incidentes de segurança',
        dataClassification: 'Público, interno, confidencial, restrito',
        vendorSecurity: 'Requisitos para fornecedores',
        acceptableUse: 'Uso aceitável de recursos da empresa'
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // PILAR 8: FINANÇAS & MÉTRICAS
    // ─────────────────────────────────────────────────────────────────────────
    financesMetrics: {
      name: 'Finanças & Métricas',
      description: 'Saúde financeira e indicadores de performance',
      
      keyMetrics: {
        revenue: {
          mrr: 'Monthly Recurring Revenue (SaaS)',
          arr: 'Annual Recurring Revenue',
          revenuePerProject: 'Receita média por projeto',
          revenuePerEmployee: 'Receita / número de funcionários'
        },
        
        profitability: {
          grossMargin: '(Receita - Custo Direto) / Receita',
          netMargin: 'Lucro Líquido / Receita',
          ebitda: 'Lucro antes de juros, impostos, depreciação'
        },
        
        efficiency: {
          utilizationRate: 'Horas faturáveis / Horas disponíveis (meta: 70-80%)',
          billableRatio: 'Pessoas em projeto / Total de pessoas',
          projectMargin: 'Receita do projeto - Custo do projeto'
        },
        
        growth: {
          cac: 'Customer Acquisition Cost',
          ltv: 'Lifetime Value do cliente',
          ltvCacRatio: 'LTV/CAC (meta: > 3)',
          churnRate: 'Taxa de cancelamento de clientes',
          nrr: 'Net Revenue Retention (expansão - churn)'
        }
      },
      
      benchmarks: {
        utilizationRate: { good: '70%', great: '80%', warning: '<60%' },
        grossMargin: { good: '40%', great: '60%', warning: '<30%' },
        ltvCacRatio: { good: '3x', great: '5x', warning: '<2x' },
        revenuePerEmployee: { good: 'R$ 200k/ano', great: 'R$ 400k/ano' }
      },
      
      financialPlanning: {
        runway: 'Meses de operação com caixa atual',
        burnRate: 'Quanto gasta por mês',
        breakeven: 'Ponto de equilíbrio (receita = custo)',
        cashFlow: 'Entrada - Saída de caixa'
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 3: TECHNOLOGY RADAR (Como ThoughtWorks)
  // ═══════════════════════════════════════════════════════════════════════════
  
  technologyRadar: {
    description: 'Governança de adoção tecnológica',
    source: 'Inspirado no ThoughtWorks Technology Radar',
    
    rings: {
      adopt: {
        description: 'Tecnologias maduras, recomendadas para uso em produção',
        criteria: 'Testada em múltiplos projetos, time tem expertise'
      },
      trial: {
        description: 'Vale experimentar em projetos de baixo risco',
        criteria: 'Promissora, precisa de mais experiência'
      },
      assess: {
        description: 'Explorar para entender como pode nos ajudar',
        criteria: 'Interessante, mas ainda não testamos'
      },
      hold: {
        description: 'Evitar em novos projetos',
        criteria: 'Problemas conhecidos, alternativas melhores existem'
      }
    },
    
    quadrants: {
      techniques: {
        adopt: ['TDD', 'CI/CD', 'Infrastructure as Code', 'Feature Flags', 'Trunk-based Development'],
        trial: ['Chaos Engineering', 'Contract Testing', 'Design Tokens'],
        assess: ['AI-assisted Development', 'Platform Engineering'],
        hold: ['Long-lived branches', 'Manual deployments']
      },
      
      platforms: {
        adopt: ['AWS', 'GCP', 'Kubernetes', 'PostgreSQL', 'Redis'],
        trial: ['Cloudflare Workers', 'PlanetScale', 'Supabase'],
        assess: ['Deno Deploy', 'Fly.io'],
        hold: ['Heroku (pricing)', 'On-premise sem necessidade']
      },
      
      tools: {
        adopt: ['GitHub Actions', 'Docker', 'Terraform', 'Datadog', 'Sentry'],
        trial: ['Turborepo', 'pnpm', 'Playwright'],
        assess: ['Cursor AI', 'GitHub Copilot Workspace'],
        hold: ['Jenkins (complexidade)', 'Vagrant']
      },
      
      languagesFrameworks: {
        adopt: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Go', 'Python'],
        trial: ['Rust', 'SvelteKit', 'tRPC', 'Prisma'],
        assess: ['Bun', 'Zig', 'HTMX'],
        hold: ['jQuery', 'AngularJS', 'PHP legado']
      }
    },
    
    decisionCriteria: [
      'Adequação ao problema',
      'Maturidade e estabilidade',
      'Comunidade e ecossistema',
      'Curva de aprendizado',
      'Custo operacional',
      'Compatibilidade com stack existente',
      'Disponibilidade de talentos'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 4: LIÇÕES DAS GRANDES SOFTWARE HOUSES
  // ═══════════════════════════════════════════════════════════════════════════
  
  lessonsFromGiants: {
    thoughtWorks: {
      founded: 1993,
      employees: '10,000+',
      revenue: '$1B+',
      
      whatMadeThemGreat: [
        'Thought leadership (Tech Radar, livros, conferências)',
        'Cultura de excelência técnica',
        'Investimento em open source (Selenium, GoCD)',
        'Consultoria de alto valor, não body shop',
        'Diversidade e inclusão como prioridade'
      ],
      
      keyPractices: [
        'Technology Radar público - molda indústria',
        'Livros técnicos (Refactoring, CI/CD)',
        'Conferências próprias (XConf)',
        'Rotação de projetos para crescimento',
        'Pair programming como padrão'
      ],
      
      lessonsToApply: [
        'Criar seu próprio Tech Radar interno',
        'Publicar conhecimento (blog, talks)',
        'Investir em R&D mesmo sem cliente pagando',
        'Contratar por potencial, não só experiência'
      ]
    },
    
    google: {
      sre: {
        innovation: 'Transformou operações em engenharia',
        
        keyPrinciples: [
          'Error budgets para balancear velocidade e confiabilidade',
          'Toil máximo de 50%',
          'Postmortems blameless',
          'SLOs como contrato interno',
          'Automação como prioridade'
        ],
        
        lessonsToApply: [
          'Definir SLOs para cada serviço',
          'Medir e reduzir toil',
          'Postmortems sem culpa',
          'On-call com rotação justa'
        ]
      }
    },
    
    spotify: {
      innovation: 'Modelo organizacional escalável',
      
      spotifyModel: {
        squads: 'Times autônomos com missão clara',
        tribes: 'Agrupamento de squads relacionados',
        chapters: 'Competência técnica cross-squad',
        guilds: 'Comunidades de interesse'
      },
      
      lessonsToApply: [
        'Autonomia com alinhamento',
        'Estrutura que escala',
        'Comunidades de prática',
        'Experimentação contínua'
      ]
    },
    
    netflix: {
      innovation: 'Cultura de alta performance',
      
      cultureDeck: [
        'Freedom & Responsibility',
        'Context, not Control',
        'Highly Aligned, Loosely Coupled',
        'Pay Top of Market',
        'Keeper Test'
      ],
      
      technicalPractices: [
        'Chaos Engineering (Chaos Monkey)',
        'Microservices em escala',
        'Observabilidade avançada',
        'A/B testing em tudo'
      ],
      
      lessonsToApply: [
        'Contratar A-players, pagar bem',
        'Dar contexto, não ordens',
        'Testar resiliência proativamente',
        'Cultura como vantagem competitiva'
      ]
    },
    
    atlassian: {
      innovation: 'Playbooks e rituais de time',
      
      teamPlaybook: {
        description: 'Conjunto de "plays" para resolver problemas de time',
        examples: [
          'Health Monitor (saúde do time)',
          'Project Poster (alinhamento)',
          'Retrospectives',
          'Pre-mortem',
          'DACI (Decision making)'
        ]
      },
      
      lessonsToApply: [
        'Padronizar rituais de time',
        'Documentar e compartilhar plays',
        'Health checks regulares',
        'Decisões documentadas'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 5: PLAYBOOK DE NÍVEIS (Do Básico ao Avançado)
  // ═══════════════════════════════════════════════════════════════════════════
  
  learningPath: {
    level0_foundations: {
      name: 'Fundamentos',
      duration: '1-3 meses',
      
      topics: [
        'O que é desenvolvimento de software',
        'Ciclo de vida do software (SDLC)',
        'Controle de versão (Git)',
        'Testes unitários básicos',
        'Deploy simples',
        'Debugging básico'
      ],
      
      skills: [
        'Escrever código limpo',
        'Usar Git (commit, branch, merge)',
        'Escrever testes simples',
        'Fazer deploy manual',
        'Ler e entender código de outros'
      ],
      
      deliverables: [
        'Primeiro projeto pessoal',
        'Contribuição em open source',
        'Portfolio básico'
      ]
    },
    
    level1_teamPractices: {
      name: 'Práticas de Time',
      duration: '3-6 meses',
      
      topics: [
        'Metodologias ágeis (Scrum, Kanban)',
        'Code review efetivo',
        'CI/CD básico',
        'Monitoramento básico',
        'Documentação técnica',
        'Comunicação em time'
      ],
      
      skills: [
        'Participar de sprints/kanban',
        'Fazer code reviews construtivos',
        'Configurar pipeline CI básico',
        'Escrever documentação clara',
        'Estimar tarefas'
      ],
      
      deliverables: [
        'Pipeline CI funcionando',
        'Documentação de projeto',
        'Participação em retrospectivas'
      ]
    },
    
    level2_scaleQuality: {
      name: 'Escala & Qualidade',
      duration: '6-12 meses',
      
      topics: [
        'Arquitetura de microservices',
        'Testes de integração e E2E',
        'Observabilidade (logs, métricas, traces)',
        'Performance e otimização',
        'Segurança básica',
        'Design patterns'
      ],
      
      skills: [
        'Projetar sistemas distribuídos',
        'Implementar observabilidade',
        'Otimizar performance',
        'Identificar vulnerabilidades',
        'Aplicar design patterns'
      ],
      
      deliverables: [
        'Sistema com múltiplos serviços',
        'Dashboard de métricas',
        'Documentação de arquitetura'
      ]
    },
    
    level3_operationsResilience: {
      name: 'Operações & Resiliência',
      duration: '12-18 meses',
      
      topics: [
        'SRE (Site Reliability Engineering)',
        'SLO/SLI/SLA design',
        'Incident response',
        'Chaos engineering',
        'Disaster recovery',
        'Capacity planning'
      ],
      
      skills: [
        'Definir e monitorar SLOs',
        'Liderar incident response',
        'Conduzir postmortems',
        'Implementar chaos testing',
        'Planejar capacidade'
      ],
      
      deliverables: [
        'SLOs documentados',
        'Runbooks de operação',
        'Plano de disaster recovery'
      ]
    },
    
    level4_strategyMarket: {
      name: 'Estratégia & Mercado',
      duration: '18-24 meses',
      
      topics: [
        'Modelos de precificação',
        'Product-market fit',
        'Vendas técnicas',
        'Gestão de portfólio',
        'M&A basics',
        'Thought leadership'
      ],
      
      skills: [
        'Precificar projetos',
        'Identificar oportunidades',
        'Vender soluções técnicas',
        'Gerenciar múltiplos projetos',
        'Publicar conteúdo técnico'
      ],
      
      deliverables: [
        'Tech Radar interno',
        'Blog/talks técnicos',
        'Proposta comercial template'
      ]
    },
    
    level5_innovation: {
      name: 'Inovação',
      duration: 'Contínuo',
      
      topics: [
        'R&D e experimentação',
        'Open source strategy',
        'Parcerias estratégicas',
        'AI/ML strategy',
        'Emerging technologies',
        'Industry influence'
      ],
      
      skills: [
        'Avaliar tecnologias emergentes',
        'Liderar iniciativas de inovação',
        'Construir parcerias',
        'Influenciar indústria'
      ],
      
      deliverables: [
        'Projeto open source',
        'Parceria estratégica',
        'Produto próprio (SaaS)'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 6: CHECKLISTS & TEMPLATES PRONTOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  checklists: {
    projectKickoff: [
      '☐ Contrato assinado',
      '☐ Escopo documentado',
      '☐ Critérios de aceite definidos',
      '☐ Time alocado',
      '☐ Ambiente de desenvolvimento pronto',
      '☐ Repositório criado',
      '☐ CI/CD configurado',
      '☐ Canais de comunicação definidos',
      '☐ Reunião de kickoff realizada',
      '☐ Cronograma acordado'
    ],
    
    mvpToProduction: [
      '☐ Funcionalidades core implementadas',
      '☐ Testes automatizados (>80% coverage)',
      '☐ Security scan limpo',
      '☐ Performance testada',
      '☐ Documentação de API',
      '☐ Runbook de operação',
      '☐ Monitoramento configurado',
      '☐ Alertas definidos',
      '☐ Backup configurado',
      '☐ Rollback testado',
      '☐ SLOs definidos',
      '☐ Treinamento do cliente'
    ],
    
    codeReview: [
      '☐ PR tem descrição clara',
      '☐ Código segue padrões do projeto',
      '☐ Testes incluídos',
      '☐ Sem secrets hardcoded',
      '☐ Sem console.log/print de debug',
      '☐ Tratamento de erros adequado',
      '☐ Performance considerada',
      '☐ Acessibilidade considerada',
      '☐ Documentação atualizada se necessário'
    ],
    
    securityReview: [
      '☐ Input validation em todas as entradas',
      '☐ Output encoding para prevenir XSS',
      '☐ Queries parametrizadas (sem SQL injection)',
      '☐ Autenticação e autorização corretas',
      '☐ Secrets em variáveis de ambiente',
      '☐ HTTPS em todas as comunicações',
      '☐ Headers de segurança configurados',
      '☐ Rate limiting implementado',
      '☐ Logs sem dados sensíveis',
      '☐ Dependências atualizadas'
    ],
    
    incidentResponse: [
      '☐ Incidente detectado e classificado',
      '☐ Incident commander designado',
      '☐ Comunicação iniciada (status page)',
      '☐ Time mobilizado',
      '☐ Investigação em andamento',
      '☐ Mitigação aplicada',
      '☐ Serviço restaurado',
      '☐ Comunicação de resolução',
      '☐ Postmortem agendado',
      '☐ Action items criados'
    ],
    
    clientOnboarding: [
      '☐ Contrato e NDA assinados',
      '☐ Ponto de contato definido',
      '☐ Canais de comunicação configurados',
      '☐ Acesso a sistemas necessários',
      '☐ Documentação de contexto recebida',
      '☐ Reunião de discovery realizada',
      '☐ Expectativas alinhadas',
      '☐ Cronograma de entregas acordado',
      '☐ Processo de feedback definido'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 7: POLÍTICAS INTERNAS ESSENCIAIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  policies: {
    codeReviewPolicy: {
      name: 'Política de Code Review',
      rules: [
        'Todo código deve ser revisado antes de merge',
        'PRs devem ter no máximo 400 linhas',
        'Mínimo 1 aprovação para merge',
        '2 aprovações para código crítico (auth, pagamentos)',
        'Autor não pode aprovar próprio PR',
        'Reviews devem ser feitos em até 24h úteis',
        'Comentários devem ser construtivos e específicos'
      ]
    },
    
    releasePolicy: {
      name: 'Política de Releases',
      rules: [
        'Releases apenas em dias úteis (seg-qui)',
        'Freeze de releases em feriados e sextas',
        'Hotfixes podem ser feitos a qualquer momento',
        'Toda release deve ter rollback plan',
        'Releases devem ser comunicadas com antecedência',
        'Feature flags para releases graduais'
      ]
    },
    
    onCallPolicy: {
      name: 'Política de On-Call',
      rules: [
        'Rotação semanal entre membros do time',
        'Máximo 1 semana consecutiva de on-call',
        'Compensação por chamados fora do horário',
        'Runbooks atualizados para todos os serviços',
        'Escalation path documentado',
        'Handoff formal entre rotações'
      ]
    },
    
    securityPolicy: {
      name: 'Política de Segurança',
      rules: [
        'SAST obrigatório em todo PR',
        'Dependências escaneadas semanalmente',
        'Secrets apenas em vault/env vars',
        'MFA obrigatório para todos os sistemas',
        'Acesso por princípio do menor privilégio',
        'Logs de auditoria para ações sensíveis',
        'Pentest anual para sistemas críticos'
      ]
    },
    
    dataPolicy: {
      name: 'Política de Dados',
      rules: [
        'Dados classificados (público, interno, confidencial, restrito)',
        'Criptografia em trânsito e em repouso',
        'Retenção mínima necessária',
        'Backup diário com teste mensal de restore',
        'Acesso a dados de produção restrito e auditado',
        'Anonimização para ambientes de teste'
      ]
    },
    
    vendorPolicy: {
      name: 'Política de Fornecedores',
      rules: [
        'Due diligence de segurança antes de contratar',
        'Contrato com cláusulas de proteção de dados',
        'SLA documentado',
        'Plano de saída (exit strategy)',
        'Revisão anual de fornecedores críticos'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 8: RISCOS E MITIGAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════
  
  risksAndMitigations: {
    technical: {
      techDebt: {
        risk: 'Dívida técnica acumulada paralisa evolução',
        indicators: ['Velocidade caindo', 'Bugs aumentando', 'Medo de mudar código'],
        mitigation: [
          'Reservar 20% do sprint para refactoring',
          'Política de "boy scout rule" (deixe melhor do que encontrou)',
          'Tech debt backlog visível e priorizado',
          'Métricas de qualidade de código'
        ]
      },
      
      singlePointOfFailure: {
        risk: 'Dependência de uma pessoa/sistema',
        indicators: ['Só uma pessoa sabe fazer X', 'Sistema sem redundância'],
        mitigation: [
          'Documentação obrigatória',
          'Pair programming',
          'Rotação de responsabilidades',
          'Arquitetura com redundância'
        ]
      },
      
      securityBreach: {
        risk: 'Vazamento de dados ou invasão',
        indicators: ['Vulnerabilidades não corrigidas', 'Sem monitoramento'],
        mitigation: [
          'Security by design',
          'Scans automatizados',
          'Pentest regular',
          'Incident response plan',
          'Seguro cyber'
        ]
      }
    },
    
    people: {
      burnout: {
        risk: 'Esgotamento da equipe',
        indicators: ['Horas extras constantes', 'Turnover alto', 'Qualidade caindo'],
        mitigation: [
          'Carga de trabalho sustentável',
          'On-call com rotação justa',
          'Férias obrigatórias',
          '1:1s regulares',
          'Ambiente psicologicamente seguro'
        ]
      },
      
      keyPersonDependency: {
        risk: 'Perda de pessoa crítica',
        indicators: ['Conhecimento concentrado', 'Sem backup'],
        mitigation: [
          'Documentação',
          'Cross-training',
          'Succession planning',
          'Retenção proativa'
        ]
      },
      
      hiringDifficulty: {
        risk: 'Não conseguir contratar',
        indicators: ['Vagas abertas há meses', 'Candidatos recusando ofertas'],
        mitigation: [
          'Employer branding',
          'Salários competitivos',
          'Processo seletivo eficiente',
          'Referral program',
          'Trabalho remoto'
        ]
      }
    },
    
    business: {
      clientConcentration: {
        risk: 'Dependência de poucos clientes',
        indicators: ['Um cliente > 30% da receita'],
        mitigation: [
          'Diversificar base de clientes',
          'Desenvolver produtos próprios',
          'Contratos de longo prazo'
        ]
      },
      
      scopeCreep: {
        risk: 'Escopo crescendo sem controle',
        indicators: ['Projeto atrasado', 'Margem negativa'],
        mitigation: [
          'Escopo bem definido em contrato',
          'Change request formal',
          'Comunicação proativa',
          'Revisões de escopo regulares'
        ]
      },
      
      cashFlow: {
        risk: 'Problemas de fluxo de caixa',
        indicators: ['Atrasos em pagamentos', 'Runway curto'],
        mitigation: [
          'Faturamento antecipado',
          'Reserva de emergência (6 meses)',
          'Diversificação de receita',
          'Controle rigoroso de custos'
        ]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 9: MÉTRICAS DE SUCESSO POR ÁREA
  // ═══════════════════════════════════════════════════════════════════════════
  
  successMetrics: {
    engineering: {
      velocity: {
        metric: 'Story points entregues por sprint',
        target: 'Estável ou crescente',
        warning: 'Queda > 20% por 2 sprints'
      },
      quality: {
        metric: 'Bugs em produção por release',
        target: '< 2 bugs críticos por release',
        warning: '> 5 bugs por release'
      },
      coverage: {
        metric: 'Cobertura de testes',
        target: '> 80%',
        warning: '< 60%'
      },
      leadTime: {
        metric: 'Tempo do commit ao deploy',
        target: '< 1 dia',
        warning: '> 1 semana'
      },
      mttr: {
        metric: 'Tempo médio de recuperação',
        target: '< 1 hora',
        warning: '> 4 horas'
      }
    },
    
    product: {
      nps: {
        metric: 'Net Promoter Score',
        target: '> 50',
        warning: '< 20'
      },
      retention: {
        metric: 'Retenção de usuários (D30)',
        target: '> 40%',
        warning: '< 20%'
      },
      activation: {
        metric: 'Usuários que completam onboarding',
        target: '> 60%',
        warning: '< 30%'
      },
      featureAdoption: {
        metric: 'Uso de features lançadas',
        target: '> 30% dos usuários',
        warning: '< 10%'
      }
    },
    
    operations: {
      availability: {
        metric: 'Uptime do sistema',
        target: '> 99.9%',
        warning: '< 99.5%'
      },
      latency: {
        metric: 'Latência p99',
        target: '< 500ms',
        warning: '> 2s'
      },
      errorRate: {
        metric: 'Taxa de erros 5xx',
        target: '< 0.1%',
        warning: '> 1%'
      },
      incidentFrequency: {
        metric: 'Incidentes P1/P2 por mês',
        target: '< 2',
        warning: '> 5'
      }
    },
    
    business: {
      revenue: {
        metric: 'Receita mensal',
        target: 'Crescimento > 10% MoM',
        warning: 'Queda por 2 meses'
      },
      margin: {
        metric: 'Margem bruta',
        target: '> 50%',
        warning: '< 30%'
      },
      utilization: {
        metric: 'Taxa de utilização',
        target: '> 75%',
        warning: '< 60%'
      },
      clientSatisfaction: {
        metric: 'CSAT de clientes',
        target: '> 4.5/5',
        warning: '< 3.5/5'
      }
    },
    
    people: {
      turnover: {
        metric: 'Turnover anual',
        target: '< 15%',
        warning: '> 25%'
      },
      eNPS: {
        metric: 'Employee NPS',
        target: '> 30',
        warning: '< 0'
      },
      timeToHire: {
        metric: 'Tempo para contratar',
        target: '< 30 dias',
        warning: '> 60 dias'
      },
      trainingHours: {
        metric: 'Horas de treinamento por pessoa/ano',
        target: '> 40h',
        warning: '< 10h'
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 10: ESTRATÉGIAS DE CRESCIMENTO
  // ═══════════════════════════════════════════════════════════════════════════
  
  growthStrategies: {
    revenueStreams: {
      services: {
        customDevelopment: 'Projetos sob medida para clientes',
        staffAugmentation: 'Alocação de profissionais',
        consulting: 'Consultoria técnica e estratégica',
        training: 'Treinamentos e workshops'
      },
      products: {
        saas: 'Software como serviço próprio',
        whiteLabel: 'Produtos para revenda',
        templates: 'Boilerplates e aceleradores',
        tools: 'Ferramentas internas produtizadas'
      },
      hybrid: {
        productizedServices: 'Serviços empacotados como produto',
        managedServices: 'Operação de sistemas de clientes'
      }
    },
    
    marketExpansion: {
      geographic: 'Expandir para novos mercados/países',
      vertical: 'Especializar em indústrias específicas',
      horizontal: 'Ampliar tipos de serviços oferecidos',
      upmarket: 'Atender clientes maiores (enterprise)',
      downmarket: 'Atender SMBs com soluções padronizadas'
    },
    
    competitiveAdvantages: {
      thoughtLeadership: {
        description: 'Ser referência técnica no mercado',
        tactics: [
          'Publicar Tech Radar',
          'Escrever livros/artigos',
          'Palestrar em conferências',
          'Contribuir para open source',
          'Criar conteúdo educacional'
        ]
      },
      
      specialization: {
        description: 'Ser o melhor em um nicho específico',
        examples: [
          'Especialista em fintech',
          'Especialista em healthcare',
          'Especialista em e-commerce',
          'Especialista em AI/ML'
        ]
      },
      
      methodology: {
        description: 'Processo proprietário que entrega mais valor',
        examples: [
          'Framework de discovery próprio',
          'Aceleradores de desenvolvimento',
          'Metodologia de qualidade',
          'Processo de inovação'
        ]
      },
      
      talent: {
        description: 'Ter os melhores profissionais',
        tactics: [
          'Employer branding forte',
          'Cultura excepcional',
          'Compensação competitiva',
          'Oportunidades de crescimento'
        ]
      }
    },
    
    partnerships: {
      technology: 'Parcerias com vendors (AWS, Google, Microsoft)',
      channel: 'Parcerias com revendedores/integradores',
      strategic: 'Parcerias com empresas complementares',
      academic: 'Parcerias com universidades'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 11: ANTI-PATTERNS (O QUE NUNCA FAZER)
  // ═══════════════════════════════════════════════════════════════════════════
  
  antiPatterns: {
    technical: [
      '❌ Deploy manual em produção',
      '❌ Código sem testes',
      '❌ Secrets hardcoded',
      '❌ Branches de longa duração',
      '❌ Monitoramento inexistente',
      '❌ Documentação desatualizada',
      '❌ Ignorar alertas de segurança',
      '❌ Otimização prematura',
      '❌ Arquitetura over-engineered para MVP',
      '❌ Ignorar tech debt indefinidamente'
    ],
    
    process: [
      '❌ Sprints sem retrospectiva',
      '❌ Code review como formalidade',
      '❌ Estimativas sem histórico',
      '❌ Reuniões sem agenda/outcome',
      '❌ Decisões sem documentação',
      '❌ Postmortems com blame',
      '❌ Processos sem métricas',
      '❌ Burocracia que não agrega valor'
    ],
    
    people: [
      '❌ Contratar rápido, demitir devagar',
      '❌ Feedback apenas em review anual',
      '❌ Promoção sem critérios claros',
      '❌ Ignorar sinais de burnout',
      '❌ Cultura de herói (depender de overtime)',
      '❌ Silos de conhecimento',
      '❌ Comunicação apenas top-down',
      '❌ Punir erros honestos'
    ],
    
    business: [
      '❌ Aceitar qualquer projeto por receita',
      '❌ Prometer prazos impossíveis',
      '❌ Escopo sem contrato claro',
      '❌ Ignorar red flags de cliente',
      '❌ Competir apenas por preço',
      '❌ Não investir em vendas/marketing',
      '❌ Depender de um único cliente',
      '❌ Crescer sem estrutura'
    ],
    
    culture: [
      '❌ Dizer uma coisa, fazer outra',
      '❌ Valores apenas no papel',
      '❌ Tolerar comportamento tóxico',
      '❌ Falta de transparência',
      '❌ Medo de experimentar',
      '❌ Resistência a mudança',
      '❌ Não celebrar conquistas',
      '❌ Ignorar diversidade e inclusão'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 12: PROMPT DO AGENTE (INSTRUÇÕES PARA IA)
  // ═══════════════════════════════════════════════════════════════════════════
  
  agentPrompt: `
# 🏭 AGENTE SOFTWARE HOUSE SUPREME

## IDENTIDADE
Você é um agente que representa uma Software House de classe mundial. Você possui 
o conhecimento completo de como operar uma fábrica de software de excelência, 
desde aspectos técnicos até comerciais, de pessoas a processos.

## SUAS CAPACIDADES

### Técnicas
- Arquitetar sistemas escaláveis e resilientes
- Definir stack tecnológico adequado para cada problema
- Implementar práticas de CI/CD, testes, observabilidade
- Aplicar padrões de segurança (OWASP, shift-left)
- Operar com mentalidade SRE (SLOs, incident response)

### Processos
- Conduzir discovery de produto
- Gerenciar projetos com metodologias ágeis
- Fazer code reviews efetivos
- Conduzir postmortems blameless
- Documentar decisões (ADRs)

### Pessoas
- Estruturar times (squads, chapters, guilds)
- Definir career ladders
- Conduzir 1:1s e feedback
- Contratar e fazer onboarding
- Construir cultura de excelência

### Negócios
- Precificar projetos
- Elaborar propostas comerciais
- Negociar contratos
- Gerenciar relacionamento com clientes
- Identificar oportunidades de crescimento

## COMO VOCÊ PENSA

1. **Problema primeiro**: Sempre entenda o problema antes de propor solução
2. **Trade-offs explícitos**: Toda decisão tem prós e contras - seja transparente
3. **Dados sobre opinião**: Baseie decisões em métricas quando possível
4. **Simplicidade**: Prefira soluções simples que funcionam
5. **Iteração**: Comece pequeno, aprenda, evolua
6. **Qualidade**: Nunca comprometa segurança ou qualidade por velocidade

## COMO VOCÊ AGE

Quando receber uma solicitação:

1. **Classifique** o tipo de problema (técnico, processo, pessoas, negócio)
2. **Contextualize** com informações relevantes do manifesto
3. **Proponha** solução com justificativa
4. **Antecipe** riscos e mitigações
5. **Forneça** próximos passos concretos

## SEUS PRINCÍPIOS INVIOLÁVEIS

- ✅ Sempre considere segurança
- ✅ Sempre considere escalabilidade
- ✅ Sempre considere manutenibilidade
- ✅ Sempre documente decisões importantes
- ✅ Sempre pense no usuário final
- ✅ Sempre seja honesto sobre limitações
- ❌ Nunca comprometa qualidade por prazo
- ❌ Nunca ignore red flags
- ❌ Nunca faça promessas que não pode cumprir
- ❌ Nunca culpe pessoas por falhas de sistema

## FORMATO DE RESPOSTA

Para questões técnicas:
- Contexto do problema
- Solução proposta com código/arquitetura
- Trade-offs e alternativas
- Próximos passos

Para questões de processo:
- Diagnóstico da situação
- Framework/metodologia recomendada
- Implementação passo a passo
- Métricas de sucesso

Para questões de negócio:
- Análise da oportunidade/problema
- Recomendação estratégica
- Riscos e mitigações
- ROI esperado
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 13: KEYWORDS E ATIVAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  
  keywords: [
    // Identidade
    'software house', 'fábrica de software', 'agência digital', 'consultoria',
    'desenvolvimento de software', 'outsourcing', 'body shop', 'squad as a service',
    
    // Processos
    'sdlc', 'ciclo de vida', 'metodologia', 'agile', 'scrum', 'kanban',
    'sprint', 'backlog', 'refinamento', 'planning', 'retrospectiva',
    'ci/cd', 'devops', 'sre', 'gitops', 'trunk-based',
    
    // Arquitetura
    'arquitetura', 'microservices', 'monolito', 'event-driven', 'serverless',
    'escalabilidade', 'resiliência', 'observabilidade', 'twelve-factor',
    
    // Qualidade
    'testes', 'qa', 'code review', 'coverage', 'qualidade', 'bugs',
    'tech debt', 'refactoring', 'clean code', 'solid',
    
    // Operações
    'slo', 'sli', 'sla', 'uptime', 'disponibilidade', 'incident',
    'postmortem', 'on-call', 'runbook', 'alertas', 'monitoramento',
    
    // Segurança
    'segurança', 'security', 'owasp', 'pentest', 'vulnerabilidade',
    'compliance', 'lgpd', 'gdpr', 'pci', 'soc2',
    
    // Pessoas
    'contratação', 'hiring', 'onboarding', 'carreira', 'feedback',
    'cultura', 'squad', 'tribe', 'chapter', 'guild', 'turnover',
    
    // Negócios
    'proposta', 'contrato', 'precificação', 'pricing', 'escopo',
    'cliente', 'projeto', 'entrega', 'margem', 'receita', 'mrr',
    
    // Estratégia
    'crescimento', 'diferenciação', 'tech radar', 'thought leadership',
    'parceria', 'produto próprio', 'saas'
  ],
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE 14: REFERÊNCIAS E FONTES
  // ═══════════════════════════════════════════════════════════════════════════
  
  references: {
    books: [
      'The Phoenix Project - Gene Kim',
      'Accelerate - Nicole Forsgren',
      'Site Reliability Engineering - Google',
      'Team Topologies - Matthew Skelton',
      'Continuous Delivery - Jez Humble',
      'Clean Code - Robert Martin',
      'The Lean Startup - Eric Ries',
      'Inspired - Marty Cagan',
      'No Rules Rules - Reed Hastings (Netflix)',
      'Measure What Matters - John Doerr'
    ],
    
    websites: [
      'https://sre.google - Google SRE',
      'https://www.thoughtworks.com/radar - Tech Radar',
      'https://www.atlassian.com/team-playbook - Atlassian Playbook',
      'https://engineering.atspotify.com - Spotify Engineering',
      'https://netflixtechblog.com - Netflix Tech Blog',
      'https://martinfowler.com - Martin Fowler',
      'https://dora.dev - DORA Metrics'
    ],
    
    frameworks: [
      'Spotify Model - Organização de times',
      'DORA Metrics - Performance de engenharia',
      'Westrum Culture - Cultura organizacional',
      'Jobs to be Done - Discovery de produto',
      'OKRs - Objetivos e resultados-chave'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default SOFTWARE_HOUSE_SUPREME_MANIFEST;
