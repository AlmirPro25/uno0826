# MARCO: 15 de Janeiro de 2026

> Documentação do estado atual do PROST-QS e próximos passos para a empresa sair do papel.

**Fundador:** Almir Felix de Jesus Filho, 24 anos  
**Localização:** Salvador, Bahia, Brasil  
**Empresa:** PROST-QS (Backend-as-a-Service com Governança de IA)  
**Data:** 15 de Janeiro de 2026

---

## 📊 RESUMO EXECUTIVO

### O que é o PROST-QS?
Um Backend-as-a-Service (BaaS) com governança de IA que permite desenvolvedores criarem apps com:
- Identidade federada (login único entre apps)
- Telemetria e auditoria automática
- Sistema de regras e políticas
- Billing integrado
- Governança de agentes de IA

### Fase Atual: Bootstrap
- Sem investimento externo
- Infraestrutura em tier gratuito/baixo custo
- Foco em validar o produto e conseguir primeiros clientes

---

## ✅ O QUE FOI FEITO (14-15 Janeiro 2026)

### 1. Google OAuth - Login com Google ✅

**Objetivo:** Permitir usuários logarem no PROST-QS usando conta Google.

**Implementado:**
- Projeto Google Cloud: `prostqs-kernel`
- OAuth Consent Screen configurado
- Credenciais OAuth 2.0 criadas
- Backend: `federation/google_service.go` funcionando
- Frontend: Botão "Continuar com Google" na página de login
- Callback: Página `/callback` processando tokens
- Variáveis configuradas no Render

**Arquivos modificados:**
```
backend/internal/federation/google_service.go  # Serviço OAuth
frontend/src/app/(auth)/login/page.tsx         # Botão Google
frontend/src/app/(auth)/callback/page.tsx      # Callback OAuth
```

**Status:** ✅ Funcionando em produção

---

### 2. Domínio prostqs.com.br no Vercel ✅

**Objetivo:** Ter o frontend acessível via domínio próprio.

**Implementado:**
- Domínio adicionado no Vercel via CLI: `vercel domains add prostqs.com.br`
- DNS configurado no Cloudflare:
  - Tipo: A
  - Nome: @
  - Valor: 76.76.21.21
  - Proxy: Desligado (DNS only)

**URLs:**
- Frontend: https://prostqs.com.br
- Backend: https://uno0826.onrender.com

**Status:** ✅ Funcionando

---

### 3. Google AdSense - Monetização ✅

**Objetivo:** Preparar infraestrutura para monetizar apps dos clientes com anúncios.

**Implementado:**
- Conta AdSense criada: `pub-5385779634645102`
- Script AdSense adicionado ao `layout.tsx`
- Arquivo `ads.txt` criado e deployado
- Mensagem de consentimento GDPR configurada
- Site verificado pelo Google
- Revisão solicitada

**Arquivos modificados:**
```
frontend/src/app/layout.tsx      # Script AdSense
frontend/public/ads.txt          # Arquivo ads.txt
```

**Status:** ⏳ Aguardando aprovação do Google (pode levar até 2 semanas)

---

### 4. Gemini API - IA no APP-3 ✅

**Objetivo:** Usar créditos Google Cloud para IA nos apps.

**Descoberta importante:**
- Créditos Google Cloud: R$ 1.904 (~$380 USD) expirando 15/04/2026
- Vertex AI keys (`AQ...`) NÃO funcionam com `@google/genai` SDK
- Solução: Criar API key no Google AI Studio (formato `AIza...`)

**Configurado:**
- Projeto: `prostqs-kernel` no Nível 1 (pago)
- API key criada no AI Studio
- Configurado no APP-3 proxy-server

**Status:** ✅ Funcionando

---

## 🏗️ INFRAESTRUTURA ATUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROST-QS PRODUCTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐         ┌─────────────────┐              │
│   │    VERCEL       │         │     RENDER      │              │
│   │   (Frontend)    │ ──────► │    (Backend)    │              │
│   │                 │         │                 │              │
│   │ prostqs.com.br  │         │ uno0826.onrender│              │
│   └─────────────────┘         └────────┬────────┘              │
│                                        │                        │
│                               ┌────────▼────────┐              │
│                               │   SUPABASE      │              │
│                               │  (PostgreSQL)   │              │
│                               └─────────────────┘              │
│                                                                 │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │  GOOGLE CLOUD   │    │   CLOUDFLARE    │                   │
│   │  • OAuth 2.0    │    │   • DNS         │                   │
│   │  • Gemini API   │    │   • prostqs.com │                   │
│   └─────────────────┘    └─────────────────┘                   │
│                                                                 │
│   ┌─────────────────┐                                          │
│   │  GOOGLE ADSENSE │ ⏳ Aguardando aprovação                  │
│   │  pub-538577...  │                                          │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Custos Atuais
| Serviço | Custo | Notas |
|---------|-------|-------|
| Vercel | $0 | Tier gratuito |
| Render | $0 | Tier gratuito (spin down após inatividade) |
| Supabase | $0 | Tier gratuito |
| Cloudflare | $0 | Tier gratuito |
| Google Cloud | $0 | Usando créditos (R$ 1.904) |
| Domínio | ~R$ 40/ano | prostqs.com.br |

**Total mensal: ~R$ 3,33** (apenas domínio)

---

## ⏳ AGUARDANDO

### 1. Aprovação Google AdSense
- **Status:** Revisão solicitada
- **Prazo:** Algumas horas até 2 semanas
- **Próximo passo:** Após aprovação, solicitar AdSense for Platforms (AFP)

### 2. AdSense for Platforms (AFP)
- **O que é:** Permite que PROST-QS seja "host" do AdSense para apps dos clientes
- **Como solicitar:** https://support.google.com/adsense/contact/adsense_for_platforms
- **Prazo:** 2-4 semanas para Account Manager
- **Benefício:** Revenue share com clientes (PROST-QS fica com 15-30%)

---

## 🚀 PRÓXIMOS PASSOS PARA SAIR DO PAPEL

### Fase 1: Validação (Janeiro-Fevereiro 2026)

#### 1.1 Primeiro Cliente Real
- [ ] Identificar 1-3 desenvolvedores para testar
- [ ] Oferecer tier gratuito em troca de feedback
- [ ] Documentar casos de uso reais

#### 1.2 Landing Page
- [ ] Criar página de marketing em prostqs.com.br
- [ ] Explicar proposta de valor
- [ ] Formulário de interesse/waitlist

#### 1.3 Documentação Pública
- [ ] Guia de integração para desenvolvedores
- [ ] Exemplos de código (SDK)
- [ ] Pricing transparente

### Fase 2: Monetização (Março-Abril 2026)

#### 2.1 Stripe Integration
- [ ] Criar conta Stripe
- [ ] Implementar checkout para planos
- [ ] Configurar webhooks de pagamento

#### 2.2 Planos de Preço
```
Free:     R$ 0/mês   - 1 app, 1k requests/dia
Starter:  R$ 49/mês  - 3 apps, 10k requests/dia
Pro:      R$ 149/mês - 10 apps, 100k requests/dia
Scale:    R$ 499/mês - Ilimitado
```

#### 2.3 AdSense for Platforms
- [ ] Aguardar aprovação AdSense básico
- [ ] Solicitar acesso AFP
- [ ] Implementar integração no kernel
- [ ] Oferecer monetização para clientes

### Fase 3: Crescimento (Maio+ 2026)

#### 3.1 Marketing
- [ ] Conteúdo técnico (blog, YouTube)
- [ ] Presença em comunidades dev
- [ ] Parcerias com influenciadores tech

#### 3.2 Produto
- [ ] Dashboard mais completo
- [ ] Mais integrações (GitHub, Discord, etc.)
- [ ] Templates de apps prontos

#### 3.3 Infraestrutura
- [ ] Migrar para tier pago quando necessário
- [ ] Considerar multi-região
- [ ] Backup e disaster recovery

---

## 💰 RECURSOS DISPONÍVEIS

### Créditos Google Cloud
- **Valor:** R$ 1.904 (~$380 USD)
- **Expira:** 15 de Abril de 2026
- **Uso recomendado:**
  - Gemini API para apps com IA
  - Cloud Run se precisar escalar
  - Cloud SQL se Supabase não bastar

### O que NÃO pode usar com créditos:
- Google Ads (campanhas de publicidade)
- Google AdSense (monetização)
- Google Workspace

---

## 📁 ARQUIVOS IMPORTANTES

### Configuração
```
docs/PLANO-CONFIGURACAO-KERNEL-PRODUCAO.md  # Setup completo
docs/ADSENSE-FOR-PLATFORMS-INTEGRATION.md   # Plano AFP
frontend/.env.local                          # Variáveis frontend
backend/.env.example                         # Template backend
```

### Código OAuth
```
backend/internal/federation/google_service.go
frontend/src/app/(auth)/login/page.tsx
frontend/src/app/(auth)/callback/page.tsx
```

### AdSense
```
frontend/src/app/layout.tsx     # Script AdSense
frontend/public/ads.txt         # Arquivo ads.txt
```

---

## 📞 CONTATOS E ACESSOS

### Contas
- **Google Cloud:** almir@prostqs.com.br
- **Vercel:** (conta pessoal)
- **Render:** (conta pessoal)
- **Cloudflare:** (conta pessoal)
- **AdSense:** almir@prostqs.com.br

### IDs Importantes
- **AdSense Publisher:** pub-5385779634645102
- **Google Cloud Project:** prostqs-kernel

---

## 🎯 META: Primeiro Dólar

**Objetivo:** Receber o primeiro pagamento de um cliente real.

**Caminhos possíveis:**
1. **Assinatura:** Cliente paga plano mensal
2. **AdSense:** Receita de anúncios nos apps
3. **Consultoria:** Ajudar empresas a integrar

**Prazo realista:** Março-Abril 2026

---

## 📝 NOTAS PARA O FUTURO

### Lições Aprendidas
1. Vertex AI keys não funcionam com SDK genai - usar AI Studio
2. Cloudflare proxy pode interferir com Vercel - usar DNS only
3. Next.js 16+ exige Suspense para useSearchParams

### Decisões Tomadas
1. Usar Google OAuth como provider principal (não Apple/GitHub por enquanto)
2. Manter infraestrutura em tier gratuito até validar produto
3. Focar em AdSense for Platforms como diferencial de monetização

---

*Documento criado em 15/01/2026*
*Próxima revisão: 01/02/2026*
