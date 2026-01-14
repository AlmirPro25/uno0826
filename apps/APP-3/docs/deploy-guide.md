# 🚀 GUIA DE DEPLOY EM PRODUÇÃO - AI WEB WEAVER

## ⏱️ TEMPO ESTIMADO: 1 HORA

### **PASSO 1: Configurar Supabase (15 min)**

1. **Criar projeto no Supabase:**
   - Acesse: https://supabase.com/dashboard
   - Clique em "New Project"
   - Nome: `ai-web-weaver-prod`
   - Região: `South America (São Paulo)`
   - Senha do banco: `[gere uma senha forte]`

2. **Executar schema do banco:**
   - Vá para SQL Editor no dashboard
   - Cole o conteúdo de `supabase/schema.sql`
   - Execute o script

3. **Configurar autenticação:**
   - Vá para Authentication > Settings
   - Habilite "Enable email confirmations"
   - Configure "Site URL": `https://seu-app.vercel.app`

4. **Obter credenciais:**
   - Vá para Settings > API
   - Copie `Project URL` e `anon public key`

### **PASSO 2: Configurar Vercel (10 min)**

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login na Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy inicial:**
   ```bash
   vercel --prod
   ```

4. **Configurar variáveis de ambiente:**
   ```bash
   vercel env add VITE_GEMINI_API_KEY
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

### **PASSO 3: Configurar Domínio (5 min)**

1. **No dashboard da Vercel:**
   - Vá para Settings > Domains
   - Adicione seu domínio personalizado
   - Configure DNS conforme instruções

### **PASSO 4: Configurar CI/CD (5 min)**

1. **Conectar repositório GitHub:**
   - No dashboard Vercel, conecte seu repo
   - Configure auto-deploy no push para main

### **PASSO 5: Testes finais (10 min)**

1. **Verificar funcionalidades:**
   - [ ] Login/Cadastro funcionando
   - [ ] Geração de código com IA
   - [ ] Salvamento de projetos
   - [ ] Chat com IA
   - [ ] Snapshots

### **PASSO 6: Monitoramento (15 min)**

1. **Configurar Sentry (opcional):**
   ```bash
   npm install @sentry/react @sentry/vite-plugin
   ```

2. **Configurar Analytics:**
   - Google Analytics ou Posthog
   - Métricas de uso da IA

## 🔧 **COMANDOS ÚTEIS**

```bash
# Build local para testar
npm run build
npm run preview

# Deploy para produção
vercel --prod

# Ver logs em produção
vercel logs

# Configurar variável de ambiente
vercel env add NOME_DA_VARIAVEL
```

## 🚨 **CHECKLIST PRÉ-DEPLOY**

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Schema do Supabase executado
- [ ] Build local funcionando
- [ ] Testes básicos passando
- [ ] Domínio configurado (se aplicável)

## 📊 **MONITORAMENTO PÓS-DEPLOY**

1. **Métricas importantes:**
   - Tempo de resposta da IA
   - Taxa de erro nas gerações
   - Uso de tokens do Gemini
   - Número de usuários ativos

2. **Alertas configurar:**
   - Erro 500 > 5% das requests
   - Tempo de resposta > 10s
   - Uso de API > 80% do limite

## 🔒 **SEGURANÇA**

1. **RLS habilitado** no Supabase
2. **CORS configurado** corretamente
3. **Rate limiting** implementado
4. **Validação de entrada** em todas as APIs

## 💰 **CUSTOS ESTIMADOS**

- **Vercel Pro**: $20/mês
- **Supabase Pro**: $25/mês
- **Gemini API**: ~$50-200/mês (dependendo do uso)
- **Total**: ~$95-245/mês

## 🎯 **PRÓXIMOS PASSOS**

1. Configurar backup automático
2. Implementar cache Redis
3. Adicionar CDN para assets
4. Configurar load balancing
5. Implementar A/B testing