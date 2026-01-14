# 🚀 Configuração Completa do CurrículoIA

## 1. Configurar Supabase

### 1.1 Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma conta ou faça login
4. Clique em "New Project"
5. Escolha sua organização
6. Dê um nome ao projeto (ex: "curriculo-ia")
7. Crie uma senha forte para o banco
8. Escolha uma região próxima (ex: South America)
9. Clique em "Create new project"

### 1.2 Configurar Database
1. Aguarde o projeto ser criado (2-3 minutos)
2. No painel lateral, clique em "SQL Editor"
3. Clique em "New query"
4. Cole todo o conteúdo do arquivo `supabase-schema.sql`
5. Clique em "Run" para executar

### 1.3 Configurar Autenticação
1. No painel lateral, clique em "Authentication"
2. Clique em "Settings"
3. Em "Site URL", adicione: `http://localhost:3000` (para desenvolvimento)
4. Em "Redirect URLs", adicione: `http://localhost:3000`
5. Clique em "Save"

### 1.4 Configurar Google OAuth (Opcional)
1. Ainda em Authentication > Settings
2. Clique em "Providers"
3. Encontre "Google" e clique no toggle para habilitar
4. Você precisará criar um projeto no Google Cloud Console:
   - Acesse [console.cloud.google.com](https://console.cloud.google.com)
   - Crie um novo projeto
   - Habilite a Google+ API
   - Crie credenciais OAuth 2.0
   - Adicione `https://seu-projeto.supabase.co/auth/v1/callback` como redirect URI
5. Cole o Client ID e Client Secret no Supabase
6. Clique em "Save"

### 1.5 Obter Chaves do Projeto
1. No painel lateral, clique em "Settings"
2. Clique em "API"
3. Copie a "Project URL" e "anon public" key

## 2. Configurar Variáveis de Ambiente

### 2.1 Criar arquivo .env.local
Crie um arquivo `.env.local` na raiz do projeto com:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Gemini API (já configurado)
VITE_GEMINI_API_KEY=AIzaSyDhJAdi9y_qEsq8QONdW1r9WivzXxc4-fM

# Google OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

## 3. Testar a Aplicação

### 3.1 Instalar e Executar
```bash
npm install
npm run dev
```

### 3.2 Testar Funcionalidades
1. Acesse http://localhost:3000
2. Clique em "Entrar"
3. Teste o cadastro com email/senha
4. Teste o login com Google (se configurado)
5. Verifique se o perfil é criado automaticamente
6. Teste a criação de currículos

## 4. Configurar para Produção

### 4.1 Atualizar URLs no Supabase
1. No Supabase, vá em Authentication > Settings
2. Atualize "Site URL" para sua URL de produção
3. Adicione sua URL de produção em "Redirect URLs"

### 4.2 Configurar Variáveis no Vercel
Se usando Vercel:
1. No painel do Vercel, vá em Settings > Environment Variables
2. Adicione todas as variáveis do .env.local
3. Faça o deploy

## 5. Funcionalidades Implementadas

✅ **Autenticação Completa**
- Cadastro com email/senha
- Login com email/senha  
- Login com Google OAuth
- Logout
- Sessão persistente

✅ **Perfil de Usuário**
- Criação automática no cadastro
- Sistema de créditos (3 grátis)
- Tiers de assinatura (free, pro, business)

✅ **Segurança**
- Row Level Security (RLS) habilitado
- Políticas de acesso por usuário
- Validação de dados

✅ **Banco de Dados**
- Tabelas: profiles, resumes, usage
- Índices para performance
- Triggers automáticos

## 6. Próximos Passos (Opcional)

### 6.1 Sistema de Pagamentos
- Integrar Stripe ou similar
- Criar webhooks para upgrade de planos
- Implementar renovação automática

### 6.2 Email Templates
- Configurar templates de email no Supabase
- Personalizar emails de confirmação
- Adicionar email de boas-vindas

### 6.3 Analytics
- Implementar tracking de uso
- Dashboard de métricas
- Relatórios de conversão

## 7. Troubleshooting

### Erro: "Invalid login credentials"
- Verifique se o usuário confirmou o email
- Teste com um email diferente

### Erro: "Row Level Security"
- Verifique se as políticas RLS foram criadas
- Execute novamente o schema SQL

### Erro: "CORS"
- Verifique as URLs configuradas no Supabase
- Certifique-se que localhost:3000 está nas redirect URLs

## 8. Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Verifique os logs no Supabase (Logs > Auth)
3. Teste cada funcionalidade individualmente