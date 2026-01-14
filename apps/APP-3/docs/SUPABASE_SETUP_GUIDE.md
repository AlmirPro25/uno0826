# Guia de Configuração do Supabase

## Passo 1: Criar uma Conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta ou faça login
2. Crie um novo projeto clicando em "New Project"

## Passo 2: Configurar o Projeto no Supabase

1. Dê um nome ao seu projeto (ex: "ai-web-weaver-prod")
2. Escolha uma senha forte para o banco de dados
3. Selecione a região mais próxima de seus usuários (ex: "South America (São Paulo)")
4. Clique em "Create new project"

## Passo 3: Configurar o Banco de Dados

1. No dashboard do Supabase, vá para "SQL Editor"
2. Crie uma nova query
3. Cole o conteúdo do arquivo `supabase/schema.sql` do seu projeto
4. Execute a query para criar as tabelas necessárias

## Passo 4: Configurar Autenticação

1. No dashboard do Supabase, vá para "Authentication" > "Settings"
2. Habilite "Enable email confirmations"
3. Configure "Site URL" com a URL do seu site no Vercel (ex: https://seu-app.vercel.app)
4. Salve as alterações

## Passo 5: Obter Credenciais

1. No dashboard do Supabase, vá para "Settings" > "API"
2. Copie o "Project URL" e o "anon public key"
3. Adicione essas credenciais ao arquivo `.env` do seu projeto:
   ```
   VITE_SUPABASE_URL=seu_project_url
   VITE_SUPABASE_ANON_KEY=sua_anon_key
   ```
4. Adicione também essas credenciais nas variáveis de ambiente do Vercel

## Passo 6: Testar a Integração

1. Após o deploy no Vercel, teste o login/cadastro no seu aplicativo
2. Verifique se os dados estão sendo salvos corretamente no Supabase
3. Verifique se as consultas ao banco de dados estão funcionando

## Solução de Problemas

### Erro de CORS

Se encontrar erros de CORS:

1. No dashboard do Supabase, vá para "Settings" > "API"
2. Em "API Settings", adicione a URL do seu site no Vercel à lista de "Additional Allowed Hosts"

### Erro de Autenticação

Se encontrar erros de autenticação:

1. Verifique se as credenciais do Supabase estão corretas no arquivo `.env` e nas variáveis de ambiente do Vercel
2. Verifique se a URL do site está configurada corretamente nas configurações de autenticação do Supabase

## Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Autenticação do Supabase](https://supabase.com/docs/guides/auth)
- [Guia de Banco de Dados do Supabase](https://supabase.com/docs/guides/database)