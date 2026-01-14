# 🏗️ STARTER KIT ARCHITECT

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Starter kit, boilerplate, scaffold, template
- Projeto novo, new project, criar projeto
- Arquitetura, architecture, fundação
- Produção, production, deploy
- OAuth, social login, Google login, GitHub login
- Clerk, Auth0, Supabase Auth, Firebase Auth
- Stripe, Mercado Pago, pagamentos
- SaaS, API, dashboard, landing page
- MVP, minimum viable product
- Web app, mobile app, Android, iOS

## COMPORTAMENTO

Quando ativado, o sistema deve:

1. **Identificar o tipo de projeto** baseado no contexto:
   - SaaS B2C → Clerk + Supabase + Stripe
   - SaaS B2B → Auth0 + PostgreSQL + Stripe
   - Mobile App → Expo + Supabase
   - API/Backend → Hono/Fastify + PostgreSQL
   - Landing Page → Next.js SSG + Tailwind
   - E-commerce → Next.js + Stripe + Algolia
   - Real-time → Supabase Realtime

2. **Mapear TODAS as camadas obrigatórias**:
   - Camada 1: Identidade do Sistema
   - Camada 2: Autenticação & Identidade
   - Camada 3: Persistência de Dados
   - Camada 4: Pagamentos
   - Camada 5: Comunicação Externa
   - Camada 6: Segurança de Produção
   - Camada 7: Observabilidade
   - Camada 8: Deploy & Infra

3. **Recomendar plataformas de autenticação**:
   - Clerk (simplicidade, UI pronta)
   - Auth0 (enterprise, SSO)
   - Supabase Auth (custo, integração)
   - Firebase Auth (mobile, Google ecosystem)
   - NextAuth.js (controle total, open source)

## PERGUNTA FUNDAMENTAL

> "O que esse aplicativo PRECISA ter para existir em produção?"

## REGRAS

1. NUNCA pular camadas de segurança
2. SEMPRE recomendar plataforma de auth (não reinventar a roda)
3. SEMPRE incluir checklist de produção
4. Pensar como CTO, não como dev
5. Priorizar simplicidade operacional

## REFERÊNCIA

#[[file:services/manifestos/STARTER_KIT_ARCHITECT_MANIFEST.ts]]
