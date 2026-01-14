# 🔧 Guia de Configuração - Currículo IA

## 📋 Pré-requisitos

Para usar o sistema, você precisa configurar as seguintes chaves de API:

### 1. 🤖 Google Gemini API (OBRIGATÓRIO)

**Para que serve:** Geração de conteúdo de currículos com IA

**Como obter:**
1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

**Configuração:**
```env
VITE_GEMINI_API_KEY=sua-chave-aqui
```

### 2. 🗄️ Supabase (OBRIGATÓRIO para salvar currículos)

**Para que serve:** Banco de dados e autenticação

**Como obter:**
1. Acesse [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > API
4. Copie a URL e a chave anônima

**Configuração:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. 💳 MercadoPago (OPCIONAL - para pagamentos)

**Para que serve:** Processar pagamentos dos planos premium

**Como obter:**
1. Acesse [MercadoPago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Copie as chaves de teste/produção

**Configuração:**
```env
VITE_MERCADO_PAGO_ACCESS_TOKEN=sua-chave-de-acesso
VITE_MERCADO_PAGO_PUBLIC_KEY=sua-chave-publica
```

## 🚀 Configuração Rápida

### Desenvolvimento Local

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo `.env` com suas chaves reais:**
   ```env
   # Mínimo necessário para funcionar
   VITE_GEMINI_API_KEY=AIzaSy...
   VITE_SUPABASE_URL=https://...
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

3. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

### Deploy em Produção (Vercel)

1. **Configure as variáveis no Vercel:**
   - Acesse seu projeto no Vercel
   - Vá em Settings > Environment Variables
   - Adicione cada variável:

   ```
   VITE_GEMINI_API_KEY = sua-chave-gemini
   VITE_SUPABASE_URL = sua-url-supabase  
   VITE_SUPABASE_ANON_KEY = sua-chave-supabase
   ```

2. **Faça o deploy:**
   ```bash
   npm run deploy
   ```

## 🔍 Verificação

Execute o comando de verificação para confirmar se tudo está configurado:

```bash
npm run check-prod
```

## ✅ Status Atual da Configuração

**Sistema configurado e funcionando!** 🎉

- ✅ **Gemini API**: Configurada e funcionando
- ✅ **Supabase**: Configurado com credenciais reais
- ✅ **Build**: Testado e funcionando (5.74s)
- ✅ **Servidor Dev**: Rodando em http://localhost:3000/
- ✅ **TypeScript**: Sem erros de tipo
- ✅ **Tailwind CSS**: Configurado localmente
- ⚠️ **MercadoPago**: Não configurado (opcional)

**Próximos passos:**
1. O sistema está pronto para uso em desenvolvimento
2. Para produção, configure as mesmas variáveis no Vercel
3. Execute `npm run deploy` quando estiver pronto

## ❗ Problemas Comuns

### "API key not valid"
- Verifique se a chave do Gemini está correta
- Certifique-se de que não há espaços extras
- Confirme que a chave não expirou

### "Failed to load resource"
- Verifique as configurações do Supabase
- Confirme se o projeto Supabase está ativo
- Verifique as políticas RLS (Row Level Security)

### Build falha
- Execute `npm run type-check` para ver erros de TypeScript
- Limpe o cache: `rm -rf node_modules/.vite`
- Reinstale dependências: `npm install`

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs do console do navegador
2. Execute `npm run check-prod` para diagnóstico
3. Consulte a documentação das APIs utilizadas

## 🔒 Segurança

- ✅ Nunca commite arquivos `.env` no Git
- ✅ Use chaves diferentes para desenvolvimento e produção  
- ✅ Monitore o uso das APIs para evitar custos inesperados
- ✅ Configure limites de rate limiting quando possível