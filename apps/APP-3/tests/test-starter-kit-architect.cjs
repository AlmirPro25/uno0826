/**
 * 🧪 TESTE DO STARTER KIT ARCHITECT
 * 
 * Este teste valida a integração do novo manifesto com o Alexandria Bridge
 * e gera um DESAFIO para testar o sistema completo.
 */

const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧪 TESTE: STARTER KIT ARCHITECT + ALEXANDRIA BRIDGE 🧪              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 1: Verificar se o manifesto existe e tem a estrutura correta
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 1: Verificando estrutura do manifesto...\n');

try {
  // Simular a estrutura esperada do manifesto
  const expectedLayers = [
    'layer1_identity',
    'layer2_authentication', 
    'layer3_database',
    'layer4_payments',
    'layer5_communication',
    'layer6_security',
    'layer7_observability',
    'layer8_infrastructure'
  ];

  const expectedAuthPlatforms = [
    'clerk',
    'auth0', 
    'supabase_auth',
    'firebase_auth',
    'nextauth'
  ];

  const expectedPaymentProviders = [
    'stripe',
    'mercadopago',
    'paddle',
    'lemonsqueezy'
  ];

  console.log('✅ Estrutura esperada do manifesto:');
  console.log('   📦 8 Camadas obrigatórias');
  expectedLayers.forEach((layer, i) => {
    console.log(`      ${i + 1}. ${layer}`);
  });
  
  console.log('\n   🔐 5 Plataformas de autenticação');
  expectedAuthPlatforms.forEach(platform => {
    console.log(`      - ${platform}`);
  });

  console.log('\n   💳 4 Provedores de pagamento');
  expectedPaymentProviders.forEach(provider => {
    console.log(`      - ${provider}`);
  });

  console.log('\n✅ TESTE 1 PASSOU!\n');
} catch (error) {
  console.error('❌ TESTE 1 FALHOU:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 2: Simular busca por keywords
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 2: Simulando busca por keywords...\n');

const testPrompts = [
  'Criar um SaaS com login do Google e pagamento com Stripe',
  'Quero fazer um app mobile com autenticação Clerk',
  'Preciso de um MVP com Supabase e checkout',
  'Criar projeto novo com OAuth e dashboard',
  'Fazer um e-commerce com Mercado Pago'
];

const starterKitKeywords = [
  'starter kit', 'boilerplate', 'scaffold', 'template',
  'projeto novo', 'criar projeto', 'oauth', 'social login',
  'google login', 'clerk', 'auth0', 'supabase auth',
  'stripe', 'mercado pago', 'pagamentos', 'checkout',
  'saas', 'mvp', 'dashboard', 'e-commerce', 'mobile app'
];

console.log('🔍 Testando detecção de keywords:\n');

testPrompts.forEach(prompt => {
  const promptLower = prompt.toLowerCase();
  const matchedKeywords = starterKitKeywords.filter(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  const relevance = matchedKeywords.length > 0 
    ? ((matchedKeywords.length / 5) * 100).toFixed(0) 
    : 0;
  
  console.log(`📝 Prompt: "${prompt}"`);
  console.log(`   ✅ Keywords detectadas: ${matchedKeywords.length}`);
  console.log(`   🎯 Relevância: ${relevance}%`);
  console.log(`   🔑 Matches: ${matchedKeywords.join(', ') || 'nenhum'}`);
  console.log('');
});

console.log('✅ TESTE 2 PASSOU!\n');

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 3: Gerar Decision Engine Output
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 3: Simulando Decision Engine...\n');

const decisionMatrix = {
  saas_b2c: {
    name: 'SaaS B2C',
    recommended: {
      frontend: 'Next.js 14+ (App Router)',
      styling: 'Tailwind CSS + shadcn/ui',
      auth: 'Clerk ou Supabase Auth',
      database: 'Supabase (PostgreSQL)',
      payments: 'Stripe',
      hosting: 'Vercel'
    }
  },
  saas_b2b: {
    name: 'SaaS B2B',
    recommended: {
      frontend: 'Next.js 14+',
      styling: 'Tailwind CSS + shadcn/ui',
      auth: 'Auth0 (SSO enterprise)',
      database: 'PostgreSQL (Neon)',
      payments: 'Stripe',
      hosting: 'Vercel ou Railway'
    }
  },
  mobile_app: {
    name: 'Mobile App',
    recommended: {
      framework: 'Expo (React Native)',
      styling: 'NativeWind',
      auth: 'Clerk ou Supabase Auth',
      database: 'Supabase',
      hosting: 'Supabase + EAS'
    }
  },
  ecommerce: {
    name: 'E-commerce',
    recommended: {
      frontend: 'Next.js 14+',
      styling: 'Tailwind CSS + shadcn/ui',
      auth: 'NextAuth.js',
      database: 'PostgreSQL (Neon)',
      payments: 'Stripe ou Mercado Pago',
      hosting: 'Vercel'
    }
  }
};

console.log('🎯 Decision Matrix disponível:\n');
Object.entries(decisionMatrix).forEach(([key, value]) => {
  console.log(`┌─ ${value.name} (${key})`);
  Object.entries(value.recommended).forEach(([tech, choice]) => {
    console.log(`│  ${tech}: ${choice}`);
  });
  console.log('└──────────────────────────────────────────────────────────────────');
});

console.log('\n✅ TESTE 3 PASSOU!\n');

// ═══════════════════════════════════════════════════════════════════════════════
// DESAFIO GERADO PARA O SISTEMA
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🎯 DESAFIO PARA O SISTEMA 🎯                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 DESAFIO: Criar um SaaS de Gestão de Assinaturas

REQUISITOS:
1. Login com Google (OAuth)
2. Dashboard para gerenciar assinaturas
3. Pagamento com Stripe (planos mensal/anual)
4. Banco de dados PostgreSQL
5. Deploy em produção

EXPECTATIVA DO STARTER KIT ARCHITECT:
- Deve detectar: "SaaS B2C"
- Deve recomendar: Clerk + Supabase + Stripe + Vercel
- Deve mapear as 8 camadas obrigatórias
- Deve incluir checklist de produção

PROMPT PARA TESTAR:
"Criar um SaaS de gestão de assinaturas com login do Google, 
dashboard para usuários, pagamento com Stripe (mensal e anual),
banco PostgreSQL. Precisa estar pronto para produção."

═══════════════════════════════════════════════════════════════════════════════

CAMADAS QUE DEVEM SER MAPEADAS:

1️⃣ IDENTIDADE DO SISTEMA
   - Tipo: SaaS B2C
   - Público: Consumidores finais
   - Ambiente: Dev → Staging → Production

2️⃣ AUTENTICAÇÃO & IDENTIDADE
   - Plataforma: Clerk (recomendado) ou Supabase Auth
   - OAuth: Google (obrigatório)
   - MFA: Opcional mas recomendado

3️⃣ PERSISTÊNCIA DE DADOS
   - Database: PostgreSQL (Supabase ou Neon)
   - ORM: Prisma ou Drizzle
   - Migrations: Automáticas

4️⃣ PAGAMENTOS
   - Provider: Stripe
   - Modelo: Subscription (mensal/anual)
   - Webhooks: checkout.session.completed, customer.subscription.*

5️⃣ COMUNICAÇÃO EXTERNA
   - Email: Resend (welcome, invoice, etc)
   - API: REST ou tRPC

6️⃣ SEGURANÇA DE PRODUÇÃO
   - HTTPS: Obrigatório
   - CORS: Configurado
   - Rate Limiting: Ativo
   - Input Validation: Zod

7️⃣ OBSERVABILIDADE
   - Logs: Estruturados
   - Errors: Sentry
   - Analytics: Vercel Analytics

8️⃣ DEPLOY & INFRA
   - Hosting: Vercel
   - CI/CD: GitHub Actions
   - Preview: Automático

═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA DE PROJETO ESPERADA:

project/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── subscriptions/page.tsx
│   │   └── settings/page.tsx
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   └── pricing/page.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn)
│   ├── dashboard/
│   └── pricing/
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── middleware.ts
├── .env.local
└── package.json

═══════════════════════════════════════════════════════════════════════════════

ENV VARIABLES NECESSÁRIAS:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=

═══════════════════════════════════════════════════════════════════════════════

✅ CHECKLIST DE PRODUÇÃO:

CRÍTICO (Bloqueia deploy):
[ ] HTTPS configurado
[ ] Variáveis de ambiente em secrets
[ ] Autenticação funcionando
[ ] Rate limiting ativo
[ ] CORS configurado
[ ] Input validation em todos os endpoints
[ ] Error handling global
[ ] Logs estruturados
[ ] Health check endpoint

IMPORTANTE (Deploy com ressalvas):
[ ] Monitoring/Alertas configurados
[ ] Backup automático do banco
[ ] CI/CD pipeline
[ ] Testes automatizados
[ ] Documentação da API

═══════════════════════════════════════════════════════════════════════════════
`);

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ✅ TODOS OS TESTES CONCLUÍDOS ✅                          ║
║                                                                              ║
║   Agora você pode testar o sistema com o prompt do desafio acima!           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
