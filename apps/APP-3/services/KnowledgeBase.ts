/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║                    🧠 KNOWLEDGE BASE - MEMÓRIA VETORIAL                      ║
 * ║                                                                              ║
 * ║              "A Biblioteca de Alexandria, Mas Organizada"                   ║
 * ║                                                                              ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  🔥 FILOSOFIA CENTRAL: DEUS E O DIABO MORAM NO DETALHE 🔥                   ║
 * ║                                                                              ║
 * ║  "Deus está nos detalhes" - Ludwig Mies van der Rohe                        ║
 * ║  "O diabo está nos detalhes" - Provérbio alemão                             ║
 * ║                                                                              ║
 * ║  Cada linha de código é uma escolha entre salvação e catástrofe.            ║
 * ║  Esta biblioteca guarda o conhecimento que separa amadores de arquitetos.   ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * PROPÓSITO:
 * Externalizar todo o conhecimento de domínio (manifestos, princípios, padrões)
 * para uma base consultável dinamicamente, em vez de hardcoded inline.
 * 
 * ARQUITETURA:
 * - Conhecimento estruturado em JSON
 * - Busca por domínio/contexto
 * - Extensível para busca vetorial futura (ChromaDB/pgvector)
 * 
 * OS 10 MANDAMENTOS DO DETALHE (INTEGRADOS EM TODOS OS DOMÍNIOS):
 * 1️⃣ NUNCA CONFIE NO FRONTEND - Backend calcula tudo
 * 2️⃣ TRANSAÇÕES ATÔMICAS OU MORTE - Tudo ou nada
 * 3️⃣ LOGS SÃO SAGRADOS - Contexto completo sempre
 * 4️⃣ IDEMPOTÊNCIA É LEI - Mesma request = mesmo resultado
 * 5️⃣ VALIDAÇÃO EM CAMADAS - Handler → Service → Domain → DB
 * 6️⃣ SOFT DELETE SEMPRE - Dados importantes são eternos
 * 7️⃣ AUDITORIA COMPLETA - Quem, quando, o quê
 * 8️⃣ RATE LIMITING INTELIGENTE - Por tipo de operação
 * 9️⃣ SECRETS NUNCA NO CÓDIGO - Variáveis de ambiente
 * 🔟 TESTES SÃO DOCUMENTAÇÃO VIVA - Especialmente concorrência
 */

export interface DomainKnowledge {
  domain: string;
  keywords: string[];
  principles: string[];
  architecture: {
    stack: string[];
    patterns: string[];
    security: string[];
  };
  templates: {
    structure: Record<string, any>;
    files: Array<{
      path: string;
      template: string;
    }>;
  };
  examples: string[];
}

export interface KnowledgeQueryResult {
  domain: string;
  relevance: number;
  context: string;
  principles: string[];
  architecture: DomainKnowledge['architecture'];
  templates: DomainKnowledge['templates'];
}

export class KnowledgeBase {
  private domains: Map<string, DomainKnowledge> = new Map();

  constructor() {
    this.initializeDomains();
  }

  /**
   * Inicializar domínios de conhecimento
   */
  private initializeDomains(): void {
    // Domínio: Fintech
    this.domains.set('fintech', {
      domain: 'fintech',
      keywords: [
        'fintech', 'banco', 'bank', 'banking',
        'pagamento', 'payment', 'pix',
        'transferência', 'transfer', 'withdrawal',
        'depósito', 'deposit',
        'empréstimo', 'loan', 'crédito', 'credit',
        'carteira digital', 'wallet',
        'conta virtual', 'virtual account',
        'saldo', 'balance',
        'transação', 'transaction',
        'mercado pago', 'stripe', 'paypal'
      ],
      principles: [
        '🔥 DEUS E O DIABO MORAM NO DETALHE - Em fintech, cada linha é R$ milhões',
        'Transações atômicas obrigatórias (BEGIN/COMMIT/ROLLBACK)',
        'PostgreSQL como fonte única da verdade',
        'Modelo de contas virtuais (Cofre Central)',
        'Verificação de saldo ANTES de débito (SELECT FOR UPDATE)',
        'Logs imutáveis de todas as operações',
        'Webhook com validação de assinatura',
        'Aviso regulatório BACEN obrigatório',
        'Criptografia de dados sensíveis (CPF, chaves PIX)',
        'Rate limiting em endpoints financeiros',
        'Auditoria completa (quem, quando, o quê, de onde)',
        '⚠️ RACE CONDITION = DINHEIRO SUMINDO - Sempre FOR UPDATE',
        '⚠️ NUNCA CONFIE NO FRONTEND - Backend calcula saldo, nunca substitui',
        '⚠️ IDEMPOTÊNCIA OBRIGATÓRIA - external_reference UNIQUE'
      ],
      architecture: {
        stack: [
          'Backend: Go (Gin) ou Node.js (Fastify)',
          'Frontend: React + TypeScript ou Vue.js 3',
          'Database: PostgreSQL (ACID compliance)',
          'Infraestrutura: Docker Compose',
          'Cache: Redis (opcional)',
          'Queue: BullMQ (para processamento assíncrono)'
        ],
        patterns: [
          'Contas Virtuais (saldo em tabela accounts)',
          'Transações Atômicas (BEGIN/COMMIT/ROLLBACK)',
          'Webhook Handler (validação de assinatura)',
          'External Reference (rastreamento de transações)',
          'Idempotência (evitar duplicação de transações)',
          'Event Sourcing (registro imutável de eventos)'
        ],
        security: [
          'JWT com refresh tokens',
          'Bcrypt para senhas',
          'AES-256 para dados sensíveis',
          'Rate limiting (5 req/min para transfers)',
          'CORS configurado',
          'Helmet.js para headers de segurança',
          'Validação de entrada (Zod/Joi)',
          'Prepared statements (SQL Injection protection)'
        ]
      },
      templates: {
        structure: {
          'backend/': {
            'src/': {
              'routes/': ['auth.ts', 'deposits.ts', 'withdrawals.ts', 'loans.ts', 'accounts.ts'],
              'services/': ['MercadoPagoService.ts', 'TransactionService.ts', 'LoanService.ts'],
              'repositories/': ['AccountRepository.ts', 'TransactionRepository.ts', 'LoanRepository.ts'],
              'middleware/': ['auth.ts', 'rateLimit.ts', 'validation.ts'],
              'server.ts': true
            },
            'prisma/': ['schema.prisma'],
            'Dockerfile': true,
            'package.json': true,
            '.env.example': true
          },
          'frontend/': {
            'src/': {
              'pages/': ['Dashboard.tsx', 'Deposit.tsx', 'Transfer.tsx', 'Loans.tsx'],
              'components/': ['QRCodeDisplay.tsx', 'TransactionList.tsx', 'BalanceCard.tsx', 'RegulatoryWarning.tsx'],
              'hooks/': ['useAccount.ts', 'useTransactions.ts'],
              'App.tsx': true
            },
            'Dockerfile': true,
            'package.json': true
          },
          'docker-compose.yml': true,
          'docs/': ['API.md', 'ARCHITECTURE.md', 'DEPLOYMENT.md'],
          'README.md': true
        },
        files: [
          {
            path: 'backend/prisma/schema.prisma',
            template: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Account {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal  @default(0.00) @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  transactions Transaction[]
  loans        Loan[]
  
  @@index([userId])
}

model Transaction {
  id                String   @id @default(uuid())
  accountId         String
  type              String   // DEPOSIT, WITHDRAWAL, LOAN_CREDIT, LOAN_DEBIT
  amount            Decimal  @db.Decimal(15, 2)
  status            String   // PENDING, COMPLETED, FAILED
  externalReference String?  @unique
  metadata          Json?
  createdAt         DateTime @default(now())
  
  account Account @relation(fields: [accountId], references: [id])
  
  @@index([accountId])
  @@index([externalReference])
  @@index([createdAt])
}

model Loan {
  id                String   @id @default(uuid())
  accountId         String
  amount            Decimal  @db.Decimal(15, 2)
  partner           String
  status            String   // ACTIVE, PAID, DEFAULTED
  installments      Int
  installmentAmount Decimal  @db.Decimal(15, 2)
  nextDueDate       DateTime
  createdAt         DateTime @default(now())
  
  account Account @relation(fields: [accountId], references: [id])
  
  @@index([accountId])
  @@index([status])
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  cpf          String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  
  @@index([email])
  @@index([cpf])
}`
          }
        ]
      },
      examples: [
        'Nexus Bank - Banco digital completo',
        'PicPay Clone - Carteira digital',
        'Nubank Clone - Conta digital e cartão',
        'Mercado Pago Integration - Gateway de pagamento'
      ]
    });

    // Domínio: Enterprise Security (Deus e o Diabo no Detalhe)
    this.domains.set('enterprise-security', {
      domain: 'enterprise-security',
      keywords: [
        'enterprise', 'segurança', 'security', 'auditoria', 'audit',
        'transação', 'transaction', 'atômico', 'atomic',
        'race condition', 'concorrência', 'concurrent',
        'sql injection', 'xss', 'csrf', 'vulnerabilidade',
        'bcrypt', 'jwt', 'token', 'autenticação', 'authentication',
        'rate limit', 'throttle', 'brute force',
        'log', 'logging', 'monitoramento', 'monitoring',
        'idempotência', 'idempotent', 'retry',
        'rollback', 'commit', 'begin', 'for update',
        'soft delete', 'audit trail', 'compliance'
      ],
      principles: [
        '🔥 DEUS E O DIABO MORAM NO DETALHE - Cada linha é uma escolha',
        '1️⃣ NUNCA CONFIE NO FRONTEND - Backend calcula tudo, nunca substitui valores',
        '2️⃣ TRANSAÇÕES ATÔMICAS OU MORTE - BEGIN/COMMIT/ROLLBACK, FOR UPDATE para locks',
        '3️⃣ LOGS SÃO SAGRADOS - Contexto completo: transaction_id, user_id, ip, amount, error',
        '4️⃣ IDEMPOTÊNCIA É LEI - Mesma request = mesmo resultado (idempotency_key UNIQUE)',
        '5️⃣ VALIDAÇÃO EM CAMADAS - Handler (formato) → Service (negócio) → Domain (invariantes) → DB (constraints)',
        '6️⃣ SOFT DELETE SEMPRE - Dados financeiros NUNCA são deletados, apenas marcados',
        '7️⃣ AUDITORIA COMPLETA - Quem, quando, o quê, de onde, valor anterior, valor novo',
        '8️⃣ RATE LIMITING INTELIGENTE - auth: 5/15min, api: 100/min, sensitive: 10/min',
        '9️⃣ SECRETS NUNCA NO CÓDIGO - Variáveis de ambiente obrigatórias',
        '🔟 TESTES SÃO DOCUMENTAÇÃO VIVA - Testes de concorrência são obrigatórios'
      ],
      architecture: {
        stack: [
          'Backend: Go (Gin) com transações SERIALIZABLE',
          'Database: PostgreSQL com constraints CHECK',
          'Auth: JWT (15min) + Refresh Token (7d)',
          'Password: bcrypt cost >= 12',
          'Logging: Structured JSON (zap/winston)',
          'Rate Limit: Redis sliding window'
        ],
        patterns: [
          'FOR UPDATE - Lock pessimista em operações financeiras',
          'Optimistic Locking - Version column para updates',
          'Idempotency Key - UNIQUE constraint no banco',
          'Timing Attack Prevention - bcrypt mesmo se usuário não existe',
          'Account Locking - Bloquear após 5 tentativas falhas',
          'Audit Trail - Tabela imutável de eventos',
          'Soft Delete - deleted_at + deleted_by',
          'Request ID - UUID em todas as requisições'
        ],
        security: [
          'Prepared Statements SEMPRE (nunca concatenar SQL)',
          'bcrypt cost >= 12 para senhas',
          'JWT expiração curta (15min máximo)',
          'Refresh tokens com rotação',
          'Rate limiting por IP e por usuário',
          'Headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection',
          'CORS restritivo (whitelist de origens)',
          'Validação de ownership antes de qualquer operação',
          'Logs sem dados sensíveis (senhas, tokens, CPF completo)'
        ]
      },
      templates: {
        structure: {
          'backend/': {
            'src/': {
              'core/': {
                'domain/': ['errors/DomainErrors.ts', 'entities/'],
                'services/': ['AuthService.ts', 'TransactionService.ts'],
                'infrastructure/': {
                  'audit/': ['AuditService.ts'],
                  'security/': ['RateLimiter.ts'],
                  'logging/': ['Logger.ts']
                }
              },
              'api/': {
                'controllers/': true,
                'middleware/': ['auth.ts', 'rateLimit.ts', 'requestId.ts'],
                'routes/': true
              }
            }
          }
        },
        files: [
          {
            path: 'backend/src/core/domain/errors/DomainErrors.ts',
            template: `// Erros tipados - NUNCA throw new Error genérico
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(\`User not found\${identifier ? \`: \${identifier}\` : ''}\`, 'USER_NOT_FOUND', 404, { identifier });
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(available: string, requested: string) {
    super('Insufficient funds', 'INSUFFICIENT_FUNDS', 402, { available, requested });
  }
}

export class AccountLockedError extends DomainError {
  constructor(lockedUntil: Date) {
    super('Account temporarily locked', 'ACCOUNT_LOCKED', 423, { lockedUntil });
  }
}

export class RateLimitExceededError extends DomainError {
  constructor(retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}`
          }
        ]
      },
      examples: [
        'Sistema bancário com transações atômicas',
        'API com rate limiting inteligente',
        'Autenticação enterprise com audit trail',
        'CRUD com soft delete e versionamento'
      ]
    });

    // Domínio: Excellence (Aplicações Web de Alta Qualidade)
    this.domains.set('excellence', {
      domain: 'excellence',
      keywords: [
        'app', 'aplicação', 'website', 'site',
        'dashboard', 'painel', 'admin',
        'landing page', 'portfolio', 'blog',
        'e-commerce', 'loja', 'marketplace'
      ],
      principles: [
        'Score mínimo 100/100 (Excelência Máxima)',
        'HTML5 semântico obrigatório',
        'Acessibilidade WCAG 2.1 AA',
        'Responsividade mobile-first',
        'Performance otimizada (Lighthouse 90+)',
        'Segurança por design',
        'UX excepcional com micro-interações',
        'Dark mode com prefers-color-scheme',
        'Estados de loading e erro',
        'Código limpo e documentado'
      ],
      architecture: {
        stack: [
          'Frontend: React 19 ou Vue.js 3 (via CDN)',
          'Styling: TailwindCSS + Shadcn/UI',
          'Icons: Lucide ou Heroicons',
          'Animations: Framer Motion',
          'State: Zustand ou Pinia',
          'Forms: React Hook Form ou VeeValidate'
        ],
        patterns: [
          'Component-driven development',
          'Atomic design principles',
          'Single responsibility',
          'Composition over inheritance',
          'Progressive enhancement',
          'Graceful degradation'
        ],
        security: [
          'Sem innerHTML com dados do usuário',
          'Links externos com rel="noopener noreferrer"',
          'Validação de entrada no frontend e backend',
          'CSP headers',
          'HTTPS only',
          'Sem API keys expostas'
        ]
      },
      templates: {
        structure: {
          'index.html': true,
          'styles/': ['main.css', 'components.css'],
          'js/': ['app.js', 'utils.js'],
          'assets/': ['images/', 'icons/'],
          'README.md': true
        },
        files: []
      },
      examples: [
        'Dashboard administrativo',
        'Landing page de produto',
        'Portfolio pessoal',
        'Blog com CMS',
        'E-commerce completo'
      ]
    });

    // Domínio: Fullstack (Aplicações Complexas)
    this.domains.set('fullstack', {
      domain: 'fullstack',
      keywords: [
        'fullstack', 'full-stack', 'full stack',
        'backend', 'api', 'rest', 'graphql',
        'database', 'banco de dados', 'sql',
        'autenticação', 'authentication', 'auth',
        'crud', 'sistema completo'
      ],
      principles: [
        '🔥 DEUS E O DIABO MORAM NO DETALHE - Qualidade enterprise desde o início',
        'Separação clara frontend/backend',
        'API RESTful bem documentada',
        'Autenticação e autorização robustas',
        'Validação em TODAS as camadas (Handler → Service → Domain → DB)',
        'Tratamento de erros com tipos específicos (nunca Error genérico)',
        'Logs estruturados com contexto completo',
        'Testes automatizados (incluindo concorrência)',
        'CI/CD pipeline',
        'Containerização com Docker',
        'Documentação completa',
        '⚠️ TRANSAÇÕES ATÔMICAS para operações de escrita',
        '⚠️ SOFT DELETE para dados importantes',
        '⚠️ AUDITORIA de operações sensíveis'
      ],
      architecture: {
        stack: [
          'Backend: Node.js (Fastify) ou Go (Gin)',
          'Frontend: React + TypeScript',
          'Database: PostgreSQL ou SQLite',
          'ORM: Prisma',
          'Auth: JWT + Refresh Tokens',
          'Validation: Zod',
          'Testing: Jest + Playwright',
          'Deploy: Docker Compose'
        ],
        patterns: [
          'Repository pattern',
          'Service layer',
          'Dependency injection',
          'Error handling middleware',
          'Request validation',
          'Response normalization',
          'Database transactions',
          'Caching strategy'
        ],
        security: [
          'JWT com refresh tokens',
          'Bcrypt para senhas',
          'Rate limiting',
          'CORS configurado',
          'Helmet.js',
          'Input validation',
          'SQL injection protection',
          'XSS protection'
        ]
      },
      templates: {
        structure: {
          'backend/': {
            'src/': {
              'routes/': true,
              'services/': true,
              'repositories/': true,
              'middleware/': true,
              'server.ts': true
            },
            'prisma/': ['schema.prisma'],
            'Dockerfile': true
          },
          'frontend/': {
            'src/': {
              'pages/': true,
              'components/': true,
              'hooks/': true,
              'App.tsx': true
            },
            'Dockerfile': true
          },
          'docker-compose.yml': true,
          'README.md': true
        },
        files: []
      },
      examples: [
        'Sistema de gerenciamento',
        'Plataforma SaaS',
        'Rede social',
        'Sistema de tickets',
        'CRM completo'
      ]
    });

    // Domínio: Robótica (Sistemas Robóticos com Embodied AI)
    this.domains.set('robotics', {
      domain: 'robotics',
      keywords: [
        'robótica', 'robotica', 'robô', 'robo', 'robot', 'robotics',
        'manipulação', 'manipulation', 'grasp', 'grasping', 'pick and place',
        'ros', 'ros2', 'gazebo', 'mujoco', 'isaac', 'isaac sim',
        'moveit', 'moveit2', 'ros2_control',
        'slam', 'lidar', 'rgb-d', 'rgbd', 'point cloud',
        'motion planning', 'trajectory', 'inverse kinematics',
        'embodied', 'embodied ai', 'embodied reasoning',
        'braço robótico', 'gripper', 'end-effector',
        'navegação autônoma', 'sensor fusion',
        'universal robots', 'ur5', 'franka', 'panda'
      ],
      principles: [
        '🔥 SEGURANÇA É FUNDAÇÃO - Robôs interagem com o mundo físico',
        'I. NUNCA CONFIE CEGAMENTE NO MODELO - Valide ações antes de executar',
        'II. SEMPRE SIMULE ANTES DE EXECUTAR - MuJoCo, Gazebo, Isaac',
        'III. TRANSAÇÕES ATÔMICAS PARA AÇÕES FÍSICAS - Rollback para estados seguros',
        'IV. LOGS ESTRUTURADOS PARA AUDITORIA - Todas as ações registradas',
        'V. RATE LIMITING E THROTTLING - Limite frequência de ações',
        'VI. VERIFICAÇÃO DE OWNERSHIP E PERMISSÕES - Controle de acesso ao robô',
        'VII. HUMAN-IN-THE-LOOP PARA AÇÕES CRÍTICAS - Aprovação humana obrigatória',
        'Percepção multimodal (visão + linguagem + propriocepção)',
        'Raciocínio espacial e temporal',
        'Biblioteca de skills reutilizáveis',
        'Safety monitor em tempo real'
      ],
      architecture: {
        stack: [
          'Percepção: OpenCV, Open3D, YOLOv8, SAM',
          'Raciocínio: Gemini Robotics-ER 1.5, LangChain',
          'Controle: ROS2 Humble/Iron, MoveIt2, ros2_control',
          'Simulação: MuJoCo, Gazebo Fortress, NVIDIA Isaac Sim',
          'Hardware: Universal Robots, Franka Panda, Boston Dynamics',
          'Memória: ChromaDB para embeddings de cenas'
        ],
        patterns: [
          'Skill-based architecture (grasp, place, navigate)',
          'World model com scene graph',
          'Safety monitor em tempo real',
          'Atomic action executor com rollback',
          'Human-in-the-loop para ações críticas',
          'Simulation-to-real transfer'
        ],
        security: [
          'Force limits em tempo real',
          'Velocity limits',
          'Workspace bounds checking',
          'Collision detection',
          'Emergency stop',
          'Rate limiting por tipo de ação',
          'Autenticação para comandos remotos',
          'Audit logging de todas as ações'
        ]
      },
      templates: {
        structure: {
          'perception/': {
            'vision/': ['camera_driver.py', 'object_detector.py', 'pose_estimator.py'],
            'proprioception/': ['joint_state.py', 'force_torque.py'],
            'fusion/': ['sensor_fusion.py']
          },
          'world_model/': ['scene_graph.py', 'spatial_reasoning.py', 'physics_model.py'],
          'reasoning/': ['gemini_client.py', 'task_decomposer.py', 'plan_generator.py'],
          'skills/': {
            'navigation/': ['go_to.py', 'avoid_obstacles.py'],
            'manipulation/': ['grasp.py', 'place.py', 'push.py'],
            'interaction/': ['open_door.py', 'press_button.py']
          },
          'control/': ['motion_planner.py', 'trajectory_executor.py'],
          'safety/': ['safety_monitor.py', 'collision_checker.py', 'emergency_stop.py'],
          'ros2_interface/': ['perception_node.py', 'reasoning_node.py', 'control_node.py'],
          'simulation/': ['gazebo/', 'mujoco/', 'isaac/'],
          'config/': ['robot_config.yaml', 'safety_config.yaml'],
          'docker-compose.yml': true,
          'README.md': true
        },
        files: []
      },
      examples: [
        'Braço robótico para pick-and-place',
        'Robô móvel com navegação autônoma',
        'Sistema de manipulação com visão',
        'Robô colaborativo (cobot)',
        'Drone autônomo com SLAM'
      ]
    });
  }

  /**
   * Buscar conhecimento por prompt do usuário
   */
  query(userPrompt: string): KnowledgeQueryResult[] {
    const promptLower = userPrompt.toLowerCase();
    const results: KnowledgeQueryResult[] = [];

    for (const [domainName, knowledge] of this.domains) {
      // Calcular relevância baseado em keywords
      const matchedKeywords = knowledge.keywords.filter(keyword =>
        promptLower.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        const relevance = matchedKeywords.length / knowledge.keywords.length;

        results.push({
          domain: domainName,
          relevance,
          context: this.buildContext(knowledge, matchedKeywords),
          principles: knowledge.principles,
          architecture: knowledge.architecture,
          templates: knowledge.templates
        });
      }
    }

    // Ordenar por relevância (maior primeiro)
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Construir contexto textual para o prompt
   * 
   * 🔥 FILOSOFIA: DEUS E O DIABO MORAM NO DETALHE
   * Sempre inclui os princípios fundamentais de qualidade enterprise
   */
  private buildContext(knowledge: DomainKnowledge, matchedKeywords: string[]): string {
    let context = `# Domínio: ${knowledge.domain.toUpperCase()}\n\n`;
    
    // Sempre incluir a filosofia central
    context += `## 🔥 FILOSOFIA CENTRAL: DEUS E O DIABO MORAM NO DETALHE\n`;
    context += `> "Deus está nos detalhes" - Ludwig Mies van der Rohe\n`;
    context += `> "O diabo está nos detalhes" - Provérbio alemão\n\n`;
    context += `Cada linha de código é uma escolha entre salvação e catástrofe.\n\n`;
    
    context += `**Palavras-chave detectadas:** ${matchedKeywords.join(', ')}\n\n`;
    
    context += `## Princípios Fundamentais\n`;
    knowledge.principles.forEach((principle, i) => {
      context += `${i + 1}. ${principle}\n`;
    });
    
    // Sempre incluir os 10 Mandamentos para domínios críticos
    if (['fintech', 'fullstack', 'enterprise-security'].includes(knowledge.domain)) {
      context += `\n## 📜 OS 10 MANDAMENTOS DO DETALHE (OBRIGATÓRIOS)\n`;
      context += `1️⃣ NUNCA CONFIE NO FRONTEND - Backend calcula tudo\n`;
      context += `2️⃣ TRANSAÇÕES ATÔMICAS OU MORTE - BEGIN/COMMIT/ROLLBACK + FOR UPDATE\n`;
      context += `3️⃣ LOGS SÃO SAGRADOS - Contexto completo sempre\n`;
      context += `4️⃣ IDEMPOTÊNCIA É LEI - Mesma request = mesmo resultado\n`;
      context += `5️⃣ VALIDAÇÃO EM CAMADAS - Handler → Service → Domain → DB\n`;
      context += `6️⃣ SOFT DELETE SEMPRE - Dados importantes são eternos\n`;
      context += `7️⃣ AUDITORIA COMPLETA - Quem, quando, o quê\n`;
      context += `8️⃣ RATE LIMITING INTELIGENTE - Por tipo de operação\n`;
      context += `9️⃣ SECRETS NUNCA NO CÓDIGO - Variáveis de ambiente\n`;
      context += `🔟 TESTES SÃO DOCUMENTAÇÃO VIVA - Especialmente concorrência\n`;
    }
    
    context += `\n## Arquitetura\n`;
    context += `**Stack:** ${knowledge.architecture.stack.join(', ')}\n\n`;
    context += `**Padrões:** ${knowledge.architecture.patterns.join(', ')}\n\n`;
    context += `**Segurança:** ${knowledge.architecture.security.join(', ')}\n`;
    
    return context;
  }

  /**
   * Obter conhecimento específico de um domínio
   */
  getDomain(domainName: string): DomainKnowledge | undefined {
    return this.domains.get(domainName);
  }

  /**
   * Listar todos os domínios disponíveis
   */
  listDomains(): string[] {
    return Array.from(this.domains.keys());
  }
}

// Singleton instance
export const knowledgeBase = new KnowledgeBase();
