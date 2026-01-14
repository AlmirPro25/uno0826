<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CurrículoIA - Gerador de Currículos com IA

Plataforma completa para criação de currículos profissionais usando Inteligência Artificial.

## 🚀 Funcionalidades

- **IA Conversacional**: Chat inteligente que entende sua carreira
- **Edição de Fotos**: Melhore suas fotos com IA
- **6 Templates Premium**: Designs profissionais exclusivos
- **Autenticação**: Login com Google via Supabase
- **Salvamento na Nuvem**: Seus currículos sempre seguros
- **Sistema de Créditos**: Modelo freemium integrado
- **Modo Escuro**: Interface moderna e adaptável
- **Export PDF**: Qualidade profissional

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **IA**: Google Gemini 2.5 Flash + 2.0 Flash (fallback)
- **Backend**: Supabase (Auth + Database)
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- API Key do Google Gemini
- Conta no Vercel (para deploy)

## 🔧 Configuração Local

> ⚠️ **IMPORTANTE**: Leia o [Guia de Configuração Completo](./CONFIGURACAO.md) para instruções detalhadas

### Configuração Rápida:

1. **Clone e instale dependências:**
   ```bash
   git clone <seu-repo>
   cd curriculo-ia
   npm install
   ```

2. **Configure as chaves de API:**
   ```bash
   cp .env.example .env
   ```
   
   **Edite `.env` com suas chaves reais:**
   ```env
   # OBRIGATÓRIO - Obtenha em: https://aistudio.google.com/app/apikey
   VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
   
   # OBRIGATÓRIO - Crie projeto em: https://supabase.com
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

3. **Verifique a configuração:**
   ```bash
   npm run check-prod
   ```

4. **Execute localmente:**
   ```bash
   npm run dev
   ```

### 🆘 Problemas de Configuração?

Se você ver o erro "API key not valid":
1. Verifique se configurou `VITE_GEMINI_API_KEY` corretamente
2. Consulte o [Guia de Configuração](./CONFIGURACAO.md)
3. Execute `npm run check-prod` para diagnóstico

## 🚀 Deploy na Vercel

1. **Instale a CLI da Vercel:**
   ```bash
   npm i -g vercel
   ```

2. **Configure as variáveis de ambiente na Vercel:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY  
   vercel env add VITE_GEMINI_API_KEY
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## 🗄️ Estrutura do Banco (Supabase)

### Tabelas:
- **profiles**: Dados dos usuários e créditos
- **resumes**: Currículos salvos
- **usage**: Histórico de uso de créditos

### Políticas RLS:
- Usuários só acessam seus próprios dados
- Segurança total garantida

## 💰 Modelo de Negócio

### Planos:
- **Gratuito**: 3 currículos, 1 template
- **Pro (R$ 29/mês)**: Ilimitado, todos templates, edição de fotos
- **Business (R$ 79/mês)**: White label, API, suporte dedicado

## 🔐 Autenticação Google

1. **Configure no Google Console:**
   - Crie projeto no [Google Cloud Console](https://console.cloud.google.com)
   - Ative Google+ API
   - Configure OAuth 2.0 credentials
   - Adicione domínios autorizados

2. **Configure no Supabase:**
   - Vá em Authentication > Providers
   - Ative Google
   - Adicione Client ID e Secret

## 📊 Analytics e Monitoramento

- Supabase Dashboard para métricas
- Vercel Analytics integrado
- Logs de uso de créditos

## 🎯 Próximos Passos

- [ ] Integração com LinkedIn
- [ ] Cartas de apresentação
- [ ] Análise de vagas com IA
- [ ] App mobile
- [ ] Integração com Stripe para pagamentos

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através do email configurado no app.

---

**CurrículoIA** - Transformando carreiras com Inteligência Artificial 🚀
