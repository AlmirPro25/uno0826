# 🚀 Deploy na Vercel - Guia Completo

## 📋 Pré-requisitos

1. ✅ Conta no GitHub
2. ✅ Conta na Vercel (gratuita)
3. ✅ Código no repositório GitHub
4. ✅ Todas as APIs configuradas localmente

## 🔧 Passo a Passo

### 1. Preparar o Repositório

Se ainda não fez, suba o código para o GitHub:

```bash
# Inicializar git (se não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Sistema completo - Currículo IA"

# Conectar ao repositório GitHub
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Enviar para GitHub
git push -u origin main
```

### 2. Deploy na Vercel

#### Opção A: Via Site da Vercel (Recomendado)

1. **Acesse:** https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Clique em "New Project"**
4. **Selecione seu repositório** do GitHub
5. **Configure as variáveis de ambiente** (ver seção abaixo)
6. **Clique em "Deploy"**

#### Opção B: Via CLI da Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### 3. 🔑 Configurar Variáveis de Ambiente na Vercel

Na página do projeto na Vercel, vá em **Settings > Environment Variables** e adicione:

#### Variáveis Obrigatórias:

```
Nome: VITE_GEMINI_API_KEY
Valor: AIzaSyAjgKsqqyXh4_m7oejzIEkBpJmkGj-CnA4
Environment: Production, Preview, Development
```

```
Nome: VITE_SUPABASE_URL
Valor: https://qmalyenyrdsrmagwuhqm.supabase.co
Environment: Production, Preview, Development
```

```
Nome: VITE_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYWx5ZW55cmRzcm1hZ3d1aHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk3MjAsImV4cCI6MjA3NTM0NTcyMH0.AFwh5tffrJn4FxDeeuE9G8A92L_4RpdYdvmb5t8UVJc
Environment: Production, Preview, Development
```

```
Nome: VITE_MERCADO_PAGO_ACCESS_TOKEN
Valor: TEST-2750340988674130-100614-9792a18c3299f159187535d8d0078ceb-307936631
Environment: Production, Preview, Development
```

```
Nome: VITE_MERCADO_PAGO_PUBLIC_KEY
Valor: TEST-436ba3a5-27da-4a08-9909-da61b41b8ce7
Environment: Production, Preview, Development
```

### 4. ✅ Verificar Deploy

Após o deploy:

1. **Acesse a URL** fornecida pela Vercel
2. **Teste as funcionalidades:**
   - Geração de currículo
   - Login/cadastro
   - Salvamento de currículos
   - Sistema de pagamentos (modo teste)

### 5. 🔧 Comandos Úteis

```bash
# Verificar status do deploy
vercel ls

# Ver logs do deploy
vercel logs

# Fazer redeploy
vercel --prod

# Configurar domínio personalizado
vercel domains add meudominio.com
```

### 6. 🎯 Configurações Avançadas

#### Domínio Personalizado
1. Na Vercel, vá em **Settings > Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções

#### Analytics
1. Ative **Vercel Analytics** no dashboard
2. Monitore performance e visitantes

#### Monitoramento
1. Configure **Vercel Speed Insights**
2. Monitore Core Web Vitals

## 🚨 Problemas Comuns

### Build Falha
- Verifique se todas as dependências estão no `package.json`
- Execute `npm run build` localmente primeiro

### Variáveis de Ambiente
- Certifique-se de que todas começam com `VITE_`
- Verifique se não há espaços extras

### Erro 404
- Confirme se o `vercel.json` está configurado corretamente
- Verifique se o `outputDirectory` está como `dist`

## 🎉 Sucesso!

Após o deploy bem-sucedido, você terá:

- ✅ **URL pública** do seu sistema
- ✅ **HTTPS automático**
- ✅ **CDN global**
- ✅ **Deploy automático** a cada push no GitHub
- ✅ **Preview** de branches

**Seu Currículo IA estará online e funcionando!** 🚀