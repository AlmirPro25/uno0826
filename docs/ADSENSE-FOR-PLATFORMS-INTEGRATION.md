# AdSense for Platforms (AFP) — Integração PROST-QS

> "Monetização de Apps via Google AdSense"

## 🎯 O Que É AFP

O **AdSense for Platforms** permite que o PROST-QS funcione como um "host" do Google AdSense:

- Seus clientes (apps) podem monetizar com anúncios do Google
- Você recebe uma parte da receita (revenue share)
- Google paga diretamente cada parte
- Integração via API com o kernel

## 📋 Requisitos para Aplicar

### 1. Conta AdSense Aprovada
- Você precisa ter uma conta AdSense ativa
- URL: https://adsense.google.com
- Domínio: prostqs.com.br

### 2. Contato com Account Manager
- AFP **não é self-service** - precisa de convite/aprovação do Google
- Você precisa entrar em contato com o Google para solicitar acesso
- Formulário: https://support.google.com/adsense/contact/adsense_for_platforms

### 3. Requisitos Técnicos
- Plataforma funcional com usuários
- Capacidade de integrar via API
- Compliance com políticas do AdSense

## 🚀 Passos para Aplicar

### Passo 1: Criar Conta AdSense (se não tiver)
1. Acesse https://adsense.google.com/start
2. Use o domínio prostqs.com.br
3. Aguarde aprovação (pode levar dias/semanas)

### Passo 2: Solicitar Acesso ao AFP
1. Acesse https://support.google.com/adsense/contact/adsense_for_platforms
2. Descreva sua plataforma:
   - "PROST-QS é um Backend-as-a-Service com governança de IA"
   - "Oferecemos infraestrutura para desenvolvedores criarem apps"
   - "Queremos permitir que nossos clientes monetizem seus apps com AdSense"

### Passo 3: Aguardar Account Manager
- Google vai analisar sua solicitação
- Se aprovado, você receberá um Account Manager
- Ele vai enviar o contrato AFP

### Passo 4: Configuração Inicial
Informações que você vai precisar fornecer:

```yaml
Domain: https://prostqs.com.br
Domain Structure: Custom domains (cada app tem seu domínio)
Revenue Share: 
  - PROST-QS: 20%  # Você fica com 20%
  - Publisher: 80%  # Cliente fica com 80%
Ad Settings Control: Platform (parent account)
Onboarding Flow: Semi-assisted API flow
```

## 🔧 Integração Técnica

### Arquitetura AFP + PROST-QS

```
┌─────────────────────────────────────────────────────────────┐
│                    PROST-QS KERNEL                          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ AFP Integration │  │ Ads Decision    │                  │
│  │                 │  │ Engine          │                  │
│  │ • Account Mgmt  │  │ • Slot Mgmt     │                  │
│  │ • Revenue Track │  │ • Targeting     │                  │
│  │ • Payout Calc   │  │ • Fraud Detect  │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│           └────────┬───────────┘                            │
│                    │                                        │
│           ┌────────▼────────┐                              │
│           │ Google AdSense  │                              │
│           │ Platform API    │                              │
│           └─────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │  APP-1  │ │  APP-2  │ │  APP-N  │
   │ VoxGrid │ │  Nexus  │ │  ...    │
   │         │ │         │ │         │
   │ [Ads]   │ │ [Ads]   │ │ [Ads]   │
   └─────────┘ └─────────┘ └─────────┘
```

### API Endpoints Necessários

```go
// AFP Account Management
POST /api/v1/afp/accounts           // Criar conta AFP para publisher
GET  /api/v1/afp/accounts/:id       // Obter detalhes da conta
POST /api/v1/afp/accounts/:id/link  // Vincular AdSense do publisher

// AFP Sites
POST /api/v1/afp/sites              // Adicionar site do publisher
GET  /api/v1/afp/sites/:id/status   // Status de aprovação do site

// AFP Revenue
GET  /api/v1/afp/revenue/:accountId // Receita do publisher
GET  /api/v1/afp/revenue/platform   // Receita total da plataforma
```

### Fluxo de Onboarding do Publisher

```
1. Publisher se cadastra no PROST-QS
2. Publisher ativa monetização no dashboard
3. PROST-QS cria conta AFP via API
4. Publisher vincula sua conta AdSense (ou cria uma nova)
5. Publisher adiciona seu site/domínio
6. Google aprova o site
7. Anúncios começam a aparecer
8. Receita é dividida automaticamente
```

## 💰 Modelo de Revenue Share

### Fluxo de Receita

```
Anunciante paga $100
        │
        ▼
Google fica com ~32% ($32)
        │
        ▼
Receita líquida: $68
        │
        ├── PROST-QS (20%): $13.60
        │
        └── Publisher (80%): $54.40
```

### Configuração Sugerida

| Plano PROST-QS | Revenue Share PROST-QS | Revenue Share Publisher |
|----------------|------------------------|-------------------------|
| Free           | 30%                    | 70%                     |
| Starter        | 20%                    | 80%                     |
| Pro            | 15%                    | 85%                     |
| Enterprise     | 10%                    | 90%                     |

## 📊 Dashboard de Monetização

### Para o Publisher (no app)

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Monetização                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Receita Hoje:     R$ 45,30                             │
│ Receita Mês:      R$ 1.234,56                          │
│ Impressões:       45.678                               │
│ Cliques:          1.234                                │
│ CTR:              2.7%                                 │
│ RPM:              R$ 27,00                             │
│                                                         │
│ [Ver Relatório Completo]                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Status: ✅ Ativo                                        │
│ Próximo Pagamento: 21/01/2026                          │
└─────────────────────────────────────────────────────────┘
```

### Para Admin PROST-QS

```
┌─────────────────────────────────────────────────────────┐
│ 📊 AFP Platform Overview                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Publishers Ativos:    156                              │
│ Sites Aprovados:      234                              │
│ Receita Total Mês:    R$ 45.678,90                     │
│ Receita PROST-QS:     R$ 9.135,78 (20%)               │
│                                                         │
│ Top Publishers:                                         │
│ 1. app-xyz.com        R$ 5.432,10                      │
│ 2. meusite.com.br     R$ 3.210,45                      │
│ 3. exemplo.app        R$ 2.100,00                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## ⚠️ Importante: Créditos Google Cloud

**Os créditos do Google Cloud (R$ 1.904) NÃO podem ser usados para:**
- Google Ads (campanhas de publicidade)
- AdSense for Platforms

**Os créditos PODEM ser usados para:**
- Gemini API (já configurado no APP-3)
- Cloud Run, Compute Engine
- Cloud SQL, Cloud Storage
- Outros serviços Google Cloud

## 📅 Timeline Estimada

| Fase | Duração | Descrição |
|------|---------|-----------|
| 1. Conta AdSense | 1-2 semanas | Criar e aprovar conta |
| 2. Solicitar AFP | 1-2 semanas | Enviar formulário |
| 3. Análise Google | 2-4 semanas | Google analisa plataforma |
| 4. Contrato | 1 semana | Assinar contrato AFP |
| 5. Integração | 2-4 semanas | Implementar API |
| 6. Go-Live | - | Começar a monetizar |

**Total estimado: 2-3 meses**

## 🔗 Links Úteis

- AdSense: https://adsense.google.com
- AFP Docs: https://developers.google.com/adsense/platforms
- AFP API: https://developers.google.com/adsense/platforms/api
- Contato AFP: https://support.google.com/adsense/contact/adsense_for_platforms

## ✅ Próximos Passos

1. [ ] Criar conta AdSense para prostqs.com.br
2. [ ] Aguardar aprovação da conta
3. [ ] Solicitar acesso ao AFP
4. [ ] Aguardar Account Manager
5. [ ] Assinar contrato
6. [ ] Implementar integração no kernel
7. [ ] Testar com apps piloto
8. [ ] Go-live

---

*Documento criado em 15/01/2026*
