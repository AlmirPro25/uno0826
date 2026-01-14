# Guia de Deploy no Vercel

## Passo 1: Preparação do Projeto

✅ Arquivo `.env` configurado
✅ Arquivo `vercel.json` configurado
✅ Build do projeto funcionando corretamente

## Passo 2: Configurar Variáveis de Ambiente no Vercel

Quando fizer o deploy no Vercel, você precisará configurar as seguintes variáveis de ambiente no dashboard do Vercel:

1. `VITE_GEMINI_API_KEY` - Sua chave de API do Gemini
2. `VITE_SUPABASE_URL` - URL do seu projeto no Supabase
3. `VITE_SUPABASE_ANON_KEY` - Chave anônima do seu projeto no Supabase
4. `VITE_API_URL` - URL da sua API (geralmente https://seu-app.vercel.app/api)
5. `VITE_DEV_MODE` - Definir como "false" para ambiente de produção

### Como configurar as variáveis no Vercel:

1. Faça login no [dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá para a aba "Settings"
4. Clique em "Environment Variables"
5. Adicione cada uma das variáveis acima com seus respectivos valores
6. Clique em "Save" para salvar as alterações

## Passo 3: Deploy no Vercel

### Opção 1: Deploy via GitHub

1. Conecte sua conta GitHub ao Vercel
2. Importe o repositório do projeto
3. Configure as opções de build (o Vercel geralmente detecta automaticamente)
4. Clique em "Deploy"

### Opção 2: Deploy via CLI

1. Instale a CLI do Vercel: `npm i -g vercel`
2. Faça login: `vercel login`
3. No diretório do projeto, execute: `vercel --prod`

## Passo 4: Verificar o Deploy

Após o deploy, verifique se:

1. O site está acessível pela URL fornecida pelo Vercel
2. A integração com o Supabase está funcionando
3. A API do Gemini está respondendo corretamente

## Solução de Problemas

Se encontrar problemas no deploy:

1. Verifique os logs de build no dashboard do Vercel
2. Confirme se todas as variáveis de ambiente estão configuradas corretamente
3. Verifique se o arquivo `vercel.json` está configurado corretamente
4. Tente fazer um novo deploy após corrigir os problemas

## Recursos Adicionais

- [Documentação do Vercel](https://vercel.com/docs)
- [Guia de Deploy do Vite](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Documentação do Supabase](https://supabase.com/docs)