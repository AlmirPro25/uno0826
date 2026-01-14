/**
 * 🏗️ STARTER KIT ARCHITECT MANIFEST
 * O Arquiteto de Existência de Software
 * 
 * DIRETIVA SUPREMA:
 * "O que esse aplicativo PRECISA ter para existir em produção?"
 * 
 * Este agente não escreve código. Ele define o TERRENO, as FUNDAÇÕES
 * e as LEIS FÍSICAS do sistema antes de qualquer implementação.
 * 
 * FILOSOFIA:
 * - Não é um dev, é um ARQUITETO DE EXISTÊNCIA
 * - Pensa como CTO, não como programador
 * - Elimina retrabalho cognitivo da IA
 * - Mapeia TUDO que um app precisa para produção
 */

export const STARTER_KIT_ARCHITECT_MANIFEST = {
  // ============================================================================
  // METADATA E ATIVAÇÃO
  // ============================================================================
  
  metadata: {
    name: 'STARTER_KIT_ARCHITECT',
    displayName: 'Starter Kit Architect - O Arquiteto de Existência',
    version: '1.0.0',
    priority: 'CRITICAL',
    keywords: [
      'starter kit', 'boilerplate', 'scaffold', 'template',
      'arquitetura', 'architecture', 'fundação', 'foundation',
      'produção', 'production', 'deploy', 'infraestrutura',
      'autenticação', 'pagamentos', 'banco de dados',
      'oauth', 'social login', 'google login', 'github login',
      'clerk', 'auth0', 'supabase auth', 'firebase auth',
      'stripe', 'mercado pago', 'pagamentos',
      'web app', 'mobile app', 'android', 'ios', 'pwa',
      'saas', 'api', 'dashboard', 'landing page',
      'mvp', 'minimum viable product', 'projeto novo'
    ]
  },

  // ============================================================================
  // IDENTIDADE E FILOSOFIA
  // ============================================================================

  identity: {
    role: 'Arquiteto de Existência de Software',
    mindset: 'CTO pensando em produção, não dev pensando em código',
    fundamentalQuestion: 'O que esse aplicativo PRECISA ter para existir em produção?',
    expertise: [
      'Mapear todas as camadas obrigatórias de um sistema',
      'Escolher tecnologias baseado em contexto, não preferência',
      'Prever necessidades futuras sem over-engineering',
      'Simplificar decisões complexas em escolhas claras',
      'Garantir que nada crítico seja esquecido'
    ]
  },

  philosophy: {
    core: 'O Starter Kit não é código. É um MAPA MENTAL PRÉ-INJETADO.',
    truths: [
      'Quanto mais eu simplifico pra IA, mais ela entrega com qualidade',
      'Redescobrir padrões toda vez é desperdício cognitivo',
      'O terreno define o que pode ser construído',
      'Decisões de arquitetura são mais caras que código',
      'Produção é o único ambiente que importa'
    ]
  },

  // ============================================================================
  // CAMADA 1: IDENTIDADE DO SISTEMA (Base Cognitiva)
  // ============================================================================

  layer1_identity: {
    name: 'Identidade do Sistema',
    description: 'Todo app precisa saber O QUE ele é antes de existir',
    questions: [
      'O que ele é? (tipo de aplicação)',
      'Para quem ele existe? (público-alvo)',
      'Em qual ambiente ele vive? (infraestrutura)',
      'Qual a escala esperada? (usuários/transações)'
    ],
    
    applicationTypes: {
      web_app: {
        name: 'Web Application',
        subtypes: ['SPA', 'SSR', 'SSG', 'Hybrid'],
        defaultStack: ['React/Next.js', 'TypeScript', 'Tailwind'],
        considerations: ['SEO', 'Performance', 'Responsividade']
      },
      mobile_app: {
        name: 'Mobile Application',
        subtypes: ['Native iOS', 'Native Android', 'Cross-platform', 'PWA'],
        defaultStack: {
          native_ios: ['Swift', 'SwiftUI'],
          native_android: ['Kotlin', 'Jetpack Compose'],
          cross_platform: ['React Native', 'Flutter', 'Expo'],
          pwa: ['Next.js', 'Workbox', 'Service Workers']
        },
        considerations: ['Offline-first', 'Push Notifications', 'App Store']
      },
      api: {
        name: 'API / Backend',
        subtypes: ['REST', 'GraphQL', 'gRPC', 'WebSocket'],
        defaultStack: ['Node.js/Go/Python', 'PostgreSQL', 'Redis'],
        considerations: ['Rate Limiting', 'Versioning', 'Documentation']
      },
      saas: {
        name: 'SaaS Platform',
        subtypes: ['B2B', 'B2C', 'B2B2C', 'Marketplace'],
        defaultStack: ['Next.js', 'Supabase/PostgreSQL', 'Stripe'],
        considerations: ['Multi-tenancy', 'Billing', 'Onboarding']
      },
      realtime: {
        name: 'Real-time Application',
        subtypes: ['Chat', 'Collaboration', 'Gaming', 'Live Data'],
        defaultStack: ['WebSocket', 'Redis Pub/Sub', 'Supabase Realtime'],
        considerations: ['Latency', 'Scaling', 'State Sync']
      }
    },

    audiences: {
      b2c: {
        name: 'Business to Consumer',
        priorities: ['UX', 'Performance', 'Mobile-first', 'Social Login'],
        authPreference: 'Social + Email'
      },
      b2b: {
        name: 'Business to Business',
        priorities: ['Security', 'Compliance', 'SSO', 'Audit Logs'],
        authPreference: 'SSO + Enterprise'
      },
      internal: {
        name: 'Internal Tool',
        priorities: ['Speed', 'Integration', 'Admin Features'],
        authPreference: 'Corporate SSO'
      }
    },

    environments: {
      development: { purpose: 'Coding and testing', data: 'Fake/Seed' },
      staging: { purpose: 'Pre-production validation', data: 'Anonymized copy' },
      production: { purpose: 'Real users', data: 'Real data' }
    }
  },

  // ============================================================================
  // CAMADA 2: AUTENTICAÇÃO & IDENTIDADE (CRÍTICA)
  // ============================================================================

  layer2_authentication: {
    name: 'Autenticação & Identidade',
    description: 'A porta de entrada do sistema - NUNCA pode falhar',
    
    // Plataformas que SIMPLIFICAM TUDO (atalhos cognitivos)
    platforms: {
      clerk: {
        name: 'Clerk',
        website: 'https://clerk.com',
        pricing: 'Free até 10k MAU, depois $0.02/MAU',
        bestFor: ['Startups', 'MVPs', 'React/Next.js'],
        features: [
          'UI pronta (SignIn, SignUp, UserButton)',
          'Social Login (Google, GitHub, Apple, etc)',
          'MFA/2FA built-in',
          'Organizations/Teams',
          'Webhooks',
          'Session management'
        ],
        integration: `
// Clerk - Integração em 5 minutos
// 1. npm install @clerk/nextjs
// 2. Adicionar CLERK_SECRET_KEY e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();

// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html><body>{children}</body></html>
    </ClerkProvider>
  );
}

// Qualquer página protegida
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
export default function Page() {
  return (
    <>
      <SignedOut><SignInButton /></SignedOut>
      <SignedIn><UserButton /></SignedIn>
    </>
  );
}
        `
      },

      auth0: {
        name: 'Auth0',
        website: 'https://auth0.com',
        pricing: 'Free até 7k MAU, depois $23/mês',
        bestFor: ['Enterprise', 'Compliance', 'Multi-app'],
        features: [
          'Universal Login',
          'Social Connections (50+)',
          'Enterprise SSO (SAML, OIDC)',
          'MFA/Adaptive MFA',
          'Breached Password Detection',
          'Compliance (SOC2, HIPAA, GDPR)'
        ],
        integration: `
// Auth0 - Integração
// 1. npm install @auth0/nextjs-auth0
// 2. Configurar AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET

// app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';
export const GET = handleAuth();

// app/layout.tsx
import { UserProvider } from '@auth0/nextjs-auth0/client';
export default function RootLayout({ children }) {
  return (
    <html><body><UserProvider>{children}</UserProvider></body></html>
  );
}

// Qualquer componente
import { useUser } from '@auth0/nextjs-auth0/client';
export default function Profile() {
  const { user, isLoading } = useUser();
  if (isLoading) return <div>Loading...</div>;
  return user ? <div>Hello {user.name}</div> : <a href="/api/auth/login">Login</a>;
}
        `
      },

      supabase_auth: {
        name: 'Supabase Auth',
        website: 'https://supabase.com/auth',
        pricing: 'Free até 50k MAU',
        bestFor: ['Full-stack apps', 'PostgreSQL users', 'Real-time'],
        features: [
          'Email/Password',
          'Magic Links',
          'Social Login (Google, GitHub, etc)',
          'Phone Auth (SMS)',
          'Row Level Security (RLS)',
          'Integrado com Database'
        ],
        integration: `
// Supabase Auth - Integração
// 1. npm install @supabase/supabase-js @supabase/ssr
// 2. Configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Login com Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin + '/auth/callback' }
});

// Login com Email
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Verificar sessão
const { data: { session } } = await supabase.auth.getSession();
        `
      },

      firebase_auth: {
        name: 'Firebase Auth',
        website: 'https://firebase.google.com/products/auth',
        pricing: 'Free (Spark) ou Pay-as-you-go (Blaze)',
        bestFor: ['Mobile apps', 'Google ecosystem', 'Rapid prototyping'],
        features: [
          'Email/Password',
          'Phone Auth',
          'Social Login (Google, Facebook, Apple, etc)',
          'Anonymous Auth',
          'Custom Auth',
          'Multi-factor Auth'
        ],
        integration: `
// Firebase Auth - Integração
// 1. npm install firebase
// 2. Configurar no Firebase Console

// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

export const auth = getAuth(app);

// Login com Google
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const user = result.user;
        `
      },

      nextauth: {
        name: 'NextAuth.js (Auth.js)',
        website: 'https://authjs.dev',
        pricing: 'Open Source (Grátis)',
        bestFor: ['Next.js apps', 'Controle total', 'Self-hosted'],
        features: [
          'Providers (50+)',
          'Database Adapters',
          'JWT ou Database Sessions',
          'Callbacks customizáveis',
          'Middleware protection'
        ],
        integration: `
// NextAuth.js - Integração
// 1. npm install next-auth
// 2. Configurar providers

// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    })
  ]
});

export { handler as GET, handler as POST };

// Uso em componentes
import { useSession, signIn, signOut } from 'next-auth/react';
export default function Component() {
  const { data: session } = useSession();
  if (session) return <button onClick={() => signOut()}>Sign out</button>;
  return <button onClick={() => signIn('google')}>Sign in with Google</button>;
}
        `
      },

      keycloak: {
        name: 'Keycloak',
        website: 'https://www.keycloak.org',
        pricing: 'Open Source (Self-hosted)',
        bestFor: ['Enterprise', 'On-premise', 'Full control'],
        features: [
          'SSO (SAML, OIDC)',
          'Identity Brokering',
          'User Federation (LDAP, AD)',
          'Fine-grained Authorization',
          'Admin Console',
          'Themes customizáveis'
        ]
      }
    },

    // Tipos de autenticação que o Starter Kit DEVE mapear
    authTypes: {
      basic: {
        name: 'Autenticação Básica',
        features: ['Email + Senha', 'Reset de senha', 'Verificação de email'],
        implementation: 'Usar plataforma (Clerk/Auth0/Supabase) ou custom'
      },
      social: {
        name: 'OAuth / Social Login',
        providers: ['Google', 'GitHub', 'Apple', 'Microsoft', 'Facebook', 'Twitter/X'],
        recommendation: 'SEMPRE oferecer Google + pelo menos 1 outro'
      },
      enterprise: {
        name: 'Enterprise SSO',
        protocols: ['SAML 2.0', 'OIDC', 'LDAP'],
        recommendation: 'Usar Auth0 ou Keycloak para enterprise'
      },
      passwordless: {
        name: 'Passwordless',
        methods: ['Magic Links', 'Passkeys/WebAuthn', 'SMS OTP'],
        recommendation: 'Magic Links para simplicidade, Passkeys para segurança máxima'
      },
      mfa: {
        name: 'Multi-Factor Authentication',
        methods: ['TOTP (Authenticator)', 'SMS', 'Email', 'Passkeys'],
        recommendation: 'TOTP > SMS (SIM swap vulnerability)'
      }
    },

    // RBAC/ABAC
    authorization: {
      rbac: {
        name: 'Role-Based Access Control',
        roles: ['user', 'admin', 'owner', 'moderator'],
        implementation: 'Middleware + Database'
      },
      abac: {
        name: 'Attribute-Based Access Control',
        attributes: ['department', 'location', 'subscription_tier'],
        implementation: 'Policy engine (Casbin, OPA)'
      }
    }
  },

  // ============================================================================
  // CAMADA 3: PERSISTÊNCIA DE DADOS
  // ============================================================================

  layer3_database: {
    name: 'Persistência de Dados',
    description: 'Onde vivem os dados, como escalam, como são protegidos',
    
    databases: {
      postgresql: {
        name: 'PostgreSQL',
        type: 'SQL Relacional',
        bestFor: ['Dados estruturados', 'Transações ACID', 'Queries complexas'],
        hosting: ['Supabase', 'Neon', 'Railway', 'AWS RDS', 'Self-hosted'],
        orm: ['Prisma', 'Drizzle', 'TypeORM']
      },
      mongodb: {
        name: 'MongoDB',
        type: 'NoSQL Document',
        bestFor: ['Dados flexíveis', 'Prototipagem rápida', 'Escala horizontal'],
        hosting: ['MongoDB Atlas', 'Self-hosted'],
        orm: ['Mongoose', 'Prisma']
      },
      sqlite: {
        name: 'SQLite',
        type: 'SQL Embedded',
        bestFor: ['Apps locais', 'Edge', 'Desenvolvimento', 'Mobile'],
        hosting: ['Turso', 'Local file', 'Cloudflare D1'],
        orm: ['Drizzle', 'Better-sqlite3']
      },
      redis: {
        name: 'Redis',
        type: 'Key-Value / Cache',
        bestFor: ['Cache', 'Sessions', 'Rate limiting', 'Pub/Sub'],
        hosting: ['Upstash', 'Redis Cloud', 'AWS ElastiCache']
      }
    },

    essentials: {
      migrations: 'Versionamento de schema (Prisma Migrate, Drizzle Kit)',
      seeds: 'Dados iniciais para desenvolvimento',
      backups: 'Backup automático (diário mínimo)',
      encryption: 'Criptografia em repouso e em trânsito'
    }
  },

  // ============================================================================
  // CAMADA 4: PAGAMENTOS
  // ============================================================================

  layer4_payments: {
    name: 'Pagamentos',
    description: 'Mesmo que não use agora, o starter kit DEVE prever',
    
    providers: {
      stripe: {
        name: 'Stripe',
        website: 'https://stripe.com',
        bestFor: ['Global', 'SaaS', 'Marketplaces'],
        features: ['Checkout', 'Subscriptions', 'Connect', 'Invoicing'],
        integration: `
// Stripe - Integração básica
// 1. npm install stripe @stripe/stripe-js
// 2. Configurar STRIPE_SECRET_KEY e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Criar checkout session (server)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price: 'price_xxx', // ID do preço no Stripe
    quantity: 1
  }],
  mode: 'subscription', // ou 'payment'
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel'
});

// Webhook handler
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Ativar assinatura
      break;
    case 'customer.subscription.deleted':
      // Cancelar assinatura
      break;
  }
}
        `
      },
      mercadopago: {
        name: 'Mercado Pago',
        website: 'https://www.mercadopago.com.br/developers',
        bestFor: ['Brasil', 'LATAM', 'PIX'],
        features: ['Checkout Pro', 'PIX', 'Boleto', 'Assinaturas']
      },
      paddle: {
        name: 'Paddle',
        website: 'https://paddle.com',
        bestFor: ['SaaS global', 'Merchant of Record'],
        features: ['Impostos automáticos', 'Checkout', 'Subscriptions']
      },
      lemonsqueezy: {
        name: 'Lemon Squeezy',
        website: 'https://lemonsqueezy.com',
        bestFor: ['Digital products', 'Indie hackers'],
        features: ['Merchant of Record', 'Checkout', 'License keys']
      }
    },

    essentials: {
      webhooks: 'SEMPRE usar webhooks, nunca confiar só no redirect',
      idempotency: 'Chaves de idempotência para evitar cobranças duplicadas',
      trials: 'Período de teste para SaaS',
      invoices: 'Geração automática de faturas'
    }
  },

  // ============================================================================
  // CAMADA 5: COMUNICAÇÃO EXTERNA
  // ============================================================================

  layer5_communication: {
    name: 'Comunicação Externa',
    description: 'APIs, webhooks, integrações - como o app fala com o mundo',
    
    patterns: {
      rest: 'API REST para CRUD simples',
      graphql: 'GraphQL para queries complexas/flexíveis',
      grpc: 'gRPC para microservices de alta performance',
      websocket: 'WebSocket para real-time'
    },

    resilience: {
      rateLimiting: 'Limitar requests por IP/usuário',
      retry: 'Retry com exponential backoff',
      circuitBreaker: 'Circuit breaker para falhas em cascata',
      timeout: 'Timeouts em todas as chamadas externas'
    },

    email: {
      providers: ['Resend', 'SendGrid', 'Postmark', 'AWS SES'],
      recommendation: 'Resend para simplicidade, SES para volume'
    }
  },

  // ============================================================================
  // CAMADA 6: SEGURANÇA DE PRODUÇÃO
  // ============================================================================

  layer6_security: {
    name: 'Segurança de Produção',
    description: 'NÃO É OPCIONAL - checklist obrigatório',
    
    checklist: {
      envVars: 'Variáveis de ambiente (NUNCA hardcode secrets)',
      secrets: 'Secrets manager (Vercel, AWS Secrets Manager)',
      cors: 'CORS configurado corretamente',
      csrf: 'Proteção CSRF em forms',
      xss: 'Sanitização de inputs',
      headers: 'Security headers (Helmet.js)',
      encryption: {
        atRest: 'Dados criptografados no banco',
        inTransit: 'HTTPS obrigatório (TLS 1.3)'
      },
      inputValidation: 'Zod/Yup para validação de inputs'
    }
  },

  // ============================================================================
  // CAMADA 7: OBSERVABILIDADE
  // ============================================================================

  layer7_observability: {
    name: 'Observabilidade',
    description: 'Sem isso, o app morre em silêncio',
    
    pillars: {
      logs: {
        tools: ['Pino', 'Winston', 'Axiom', 'Logtail'],
        levels: ['error', 'warn', 'info', 'debug']
      },
      metrics: {
        tools: ['Prometheus', 'Grafana', 'Datadog'],
        essentials: ['Response time', 'Error rate', 'Throughput']
      },
      tracing: {
        tools: ['OpenTelemetry', 'Jaeger', 'Sentry'],
        purpose: 'Rastrear requests através de serviços'
      },
      errorTracking: {
        tools: ['Sentry', 'Bugsnag', 'Rollbar'],
        recommendation: 'Sentry é o padrão da indústria'
      },
      healthChecks: {
        endpoints: ['/health', '/ready', '/live'],
        purpose: 'Kubernetes/Load balancer health checks'
      }
    }
  },

  // ============================================================================
  // CAMADA 8: DEPLOY & INFRA
  // ============================================================================

  layer8_infrastructure: {
    name: 'Deploy & Infraestrutura',
    description: 'Como o app vai pro ar e escala',
    
    platforms: {
      vercel: {
        bestFor: ['Next.js', 'Frontend', 'Serverless'],
        features: ['Edge Functions', 'Preview Deployments', 'Analytics']
      },
      railway: {
        bestFor: ['Full-stack', 'Databases', 'Background jobs'],
        features: ['Docker', 'PostgreSQL', 'Redis', 'Cron']
      },
      fly: {
        bestFor: ['Global distribution', 'Docker', 'Edge'],
        features: ['Multi-region', 'Machines API', 'Volumes']
      },
      aws: {
        bestFor: ['Enterprise', 'Full control', 'Compliance'],
        services: ['ECS', 'Lambda', 'RDS', 'S3', 'CloudFront']
      }
    },

    essentials: {
      docker: 'Containerização para consistência',
      cicd: 'GitHub Actions / GitLab CI para automação',
      rollback: 'Capacidade de reverter deploys',
      iac: 'Terraform/Pulumi para infra como código'
    }
  }
};


// ============================================================================
// DECISION ENGINE - O Cérebro do Arquiteto
// ============================================================================

export const STARTER_KIT_DECISION_ENGINE = {
  /**
   * Dado um contexto, retorna as decisões arquiteturais recomendadas
   */
  
  // Matriz de decisão por tipo de projeto
  decisionMatrix: {
    // ═══════════════════════════════════════════════════════════════════════
    // SaaS B2C (ex: app de finanças pessoais, fitness, produtividade)
    // ═══════════════════════════════════════════════════════════════════════
    saas_b2c: {
      name: 'SaaS B2C',
      description: 'Software as a Service para consumidores finais',
      
      recommended: {
        frontend: 'Next.js 14+ (App Router)',
        styling: 'Tailwind CSS + shadcn/ui',
        auth: 'Clerk (simplicidade) ou Supabase Auth (custo)',
        database: 'Supabase (PostgreSQL + Realtime)',
        payments: 'Stripe (global) ou Mercado Pago (Brasil)',
        email: 'Resend',
        hosting: 'Vercel',
        monitoring: 'Sentry + Vercel Analytics'
      },
      
      starterKitStructure: `
project/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx (protected)
│   │   ├── page.tsx
│   │   └── settings/page.tsx
│   ├── (marketing)/
│   │   ├── page.tsx (landing)
│   │   ├── pricing/page.tsx
│   │   └── about/page.tsx
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts
│   │   └── [...]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn)
│   ├── forms/
│   └── dashboard/
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   └── utils.ts
├── hooks/
├── types/
├── middleware.ts (auth protection)
├── .env.local
├── .env.example
└── package.json
      `,
      
      envVariables: [
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'RESEND_API_KEY',
        'NEXT_PUBLIC_APP_URL'
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SaaS B2B (ex: CRM, ERP, ferramentas de equipe)
    // ═══════════════════════════════════════════════════════════════════════
    saas_b2b: {
      name: 'SaaS B2B',
      description: 'Software as a Service para empresas',
      
      recommended: {
        frontend: 'Next.js 14+ (App Router)',
        styling: 'Tailwind CSS + shadcn/ui',
        auth: 'Auth0 (SSO enterprise) ou Clerk (organizations)',
        database: 'PostgreSQL (Neon ou Supabase)',
        payments: 'Stripe (subscriptions + invoicing)',
        email: 'Resend ou SendGrid',
        hosting: 'Vercel ou Railway',
        monitoring: 'Sentry + Datadog',
        extras: ['Audit Logs', 'RBAC', 'Multi-tenancy']
      },
      
      starterKitStructure: `
project/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── [orgId]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── settings/
│   │   │   ├── team/
│   │   │   └── billing/
│   ├── (marketing)/
│   ├── api/
│   │   ├── webhooks/
│   │   ├── organizations/
│   │   └── admin/
│   └── admin/ (super admin)
├── components/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── stripe.ts
│   └── audit-log.ts
├── prisma/
│   └── schema.prisma (multi-tenant)
└── ...
      `,
      
      additionalFeatures: [
        'Organization/Team management',
        'Role-based permissions',
        'Audit logging',
        'SSO (SAML/OIDC)',
        'API keys for integrations',
        'Usage-based billing'
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Mobile App (React Native / Expo)
    // ═══════════════════════════════════════════════════════════════════════
    mobile_app: {
      name: 'Mobile App',
      description: 'Aplicativo móvel cross-platform',
      
      recommended: {
        framework: 'Expo (React Native)',
        styling: 'NativeWind (Tailwind for RN)',
        auth: 'Clerk ou Supabase Auth',
        database: 'Supabase',
        storage: 'Supabase Storage ou S3',
        notifications: 'Expo Notifications + OneSignal',
        analytics: 'Expo Analytics ou Mixpanel',
        hosting_backend: 'Supabase ou Railway'
      },
      
      starterKitStructure: `
mobile-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── components/
├── hooks/
├── lib/
│   ├── supabase.ts
│   └── storage.ts
├── constants/
├── assets/
├── app.json
├── eas.json (EAS Build)
└── package.json
      `,
      
      considerations: [
        'Offline-first com AsyncStorage/MMKV',
        'Deep linking',
        'Push notifications',
        'App Store / Play Store guidelines',
        'In-app purchases (se aplicável)'
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // API / Backend Only
    // ═══════════════════════════════════════════════════════════════════════
    api_backend: {
      name: 'API / Backend',
      description: 'Backend API sem frontend',
      
      recommended: {
        language: 'TypeScript (Node.js) ou Go',
        framework: 'Hono (edge) ou Fastify (Node) ou Fiber (Go)',
        database: 'PostgreSQL + Drizzle/Prisma',
        cache: 'Redis (Upstash)',
        auth: 'JWT + API Keys',
        docs: 'OpenAPI/Swagger',
        hosting: 'Railway ou Fly.io'
      },
      
      starterKitStructure: `
api/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── [resource].ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── validation.ts
│   ├── services/
│   ├── repositories/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   └── jwt.ts
│   ├── types/
│   └── index.ts
├── prisma/ ou drizzle/
├── tests/
├── Dockerfile
├── docker-compose.yml
└── package.json
      `
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Landing Page / Marketing Site
    // ═══════════════════════════════════════════════════════════════════════
    landing_page: {
      name: 'Landing Page',
      description: 'Site de marketing/conversão',
      
      recommended: {
        framework: 'Next.js (SSG) ou Astro',
        styling: 'Tailwind CSS',
        cms: 'Sanity ou Contentful (se precisar)',
        analytics: 'Vercel Analytics + Plausible',
        forms: 'React Hook Form + Resend',
        hosting: 'Vercel'
      },
      
      starterKitStructure: `
landing/
├── app/
│   ├── page.tsx (hero, features, pricing, cta)
│   ├── blog/
│   ├── about/
│   └── contact/
├── components/
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   ├── Testimonials.tsx
│   │   └── CTA.tsx
│   └── ui/
├── lib/
└── ...
      `
    },

    // ═══════════════════════════════════════════════════════════════════════
    // E-commerce
    // ═══════════════════════════════════════════════════════════════════════
    ecommerce: {
      name: 'E-commerce',
      description: 'Loja virtual',
      
      recommended: {
        framework: 'Next.js 14+',
        styling: 'Tailwind CSS + shadcn/ui',
        auth: 'NextAuth.js ou Clerk',
        database: 'PostgreSQL (Neon)',
        payments: 'Stripe ou Mercado Pago',
        search: 'Algolia ou Meilisearch',
        images: 'Cloudinary ou Uploadthing',
        hosting: 'Vercel'
      },
      
      additionalFeatures: [
        'Carrinho persistente',
        'Checkout otimizado',
        'Gestão de estoque',
        'Cupons/Descontos',
        'Reviews/Ratings',
        'Wishlist',
        'Order tracking'
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Real-time App (Chat, Collaboration)
    // ═══════════════════════════════════════════════════════════════════════
    realtime_app: {
      name: 'Real-time App',
      description: 'Aplicação com dados em tempo real',
      
      recommended: {
        framework: 'Next.js 14+',
        realtime: 'Supabase Realtime ou Pusher ou Socket.io',
        database: 'Supabase (PostgreSQL + Realtime)',
        cache: 'Redis (Upstash)',
        auth: 'Supabase Auth',
        hosting: 'Vercel + Railway (WebSocket server)'
      },
      
      considerations: [
        'Presence (quem está online)',
        'Typing indicators',
        'Optimistic updates',
        'Conflict resolution',
        'Offline queue'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÃO DE DECISÃO AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Analisa o prompt do usuário e retorna o tipo de projeto recomendado
   */
  analyzePrompt: (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Keywords para cada tipo
    const patterns = {
      saas_b2b: ['b2b', 'empresa', 'equipe', 'team', 'organization', 'crm', 'erp', 'dashboard admin'],
      saas_b2c: ['saas', 'assinatura', 'subscription', 'app', 'usuário', 'user', 'plataforma'],
      mobile_app: ['mobile', 'app', 'android', 'ios', 'react native', 'expo', 'celular'],
      api_backend: ['api', 'backend', 'servidor', 'microservice', 'rest', 'graphql'],
      landing_page: ['landing', 'marketing', 'site', 'página', 'conversão', 'lead'],
      ecommerce: ['loja', 'ecommerce', 'e-commerce', 'produto', 'carrinho', 'checkout', 'venda'],
      realtime_app: ['chat', 'realtime', 'tempo real', 'colaboração', 'live', 'websocket']
    };
    
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(kw => lowerPrompt.includes(kw))) {
        return type;
      }
    }
    
    return 'saas_b2c'; // Default
  },

  /**
   * Gera o starter kit completo baseado no tipo
   */
  generateStarterKit: (projectType: string, projectName: string) => {
    const matrix = STARTER_KIT_DECISION_ENGINE.decisionMatrix;
    const config = matrix[projectType as keyof typeof matrix];
    
    if (!config) {
      return matrix.saas_b2c; // Fallback
    }
    
    return {
      projectName,
      projectType,
      ...config,
      generatedAt: new Date().toISOString()
    };
  }
};

// ============================================================================
// CHECKLIST DE PRODUÇÃO - O que NUNCA pode faltar
// ============================================================================

export const PRODUCTION_CHECKLIST = {
  critical: {
    name: 'Crítico (Bloqueia deploy)',
    items: [
      '✅ HTTPS configurado',
      '✅ Variáveis de ambiente em secrets manager',
      '✅ Autenticação funcionando',
      '✅ Rate limiting ativo',
      '✅ CORS configurado',
      '✅ Input validation em todos os endpoints',
      '✅ Error handling global',
      '✅ Logs estruturados',
      '✅ Health check endpoint'
    ]
  },
  
  important: {
    name: 'Importante (Deploy com ressalvas)',
    items: [
      '⚠️ Monitoring/Alertas configurados',
      '⚠️ Backup automático do banco',
      '⚠️ CI/CD pipeline',
      '⚠️ Testes automatizados',
      '⚠️ Documentação da API',
      '⚠️ Rollback strategy'
    ]
  },
  
  recommended: {
    name: 'Recomendado (Melhorias)',
    items: [
      '💡 CDN para assets estáticos',
      '💡 Cache strategy',
      '💡 Performance monitoring',
      '💡 A/B testing infrastructure',
      '💡 Feature flags'
    ]
  }
};

// ============================================================================
// EXPORT FINAL
// ============================================================================

export default {
  STARTER_KIT_ARCHITECT_MANIFEST,
  STARTER_KIT_DECISION_ENGINE,
  PRODUCTION_CHECKLIST
};
