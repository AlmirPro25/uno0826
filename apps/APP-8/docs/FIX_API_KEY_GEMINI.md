# 🔑 Como Corrigir a API Key do Gemini

## ❌ Problema Atual

Erro: `[403 Forbidden] Method doesn't allow unregistered callers`

Isso significa que a API Key do Gemini está **inválida, expirada ou não tem permissões**.

## ✅ Solução: Gerar Nova API Key

### 1. Acesse o Google AI Studio

Abra no navegador:
```
https://aistudio.google.com/app/apikey
```

### 2. Faça Login

Use sua conta Google.

### 3. Crie uma Nova API Key

1. Clique em **"Create API Key"** ou **"Get API Key"**
2. Selecione um projeto do Google Cloud (ou crie um novo)
3. Copie a chave gerada (começa com `AIza...`)

### 4. Atualize o arquivo `.env`

Edite o arquivo `backend/.env`:

```env
# Substitua pela sua nova chave
GEMINI_API_KEY=AIza_SUA_NOVA_CHAVE_AQUI
```

### 5. Reinicie o Backend

O backend vai detectar a mudança automaticamente (hot reload).

Se não detectar, pare e inicie novamente:
```bash
# Pressione Ctrl+C no terminal do backend
# Depois execute novamente:
cd backend
npm run dev
```

## 🧪 Testar a Nova Chave

Após atualizar, teste fazendo uma requisição:

```bash
curl http://localhost:3001/health
```

Deve retornar: `{"status":"ok"}`

## ⚠️ Importante

- **Não compartilhe** sua API Key
- **Não commite** o arquivo `.env` no Git
- A chave é **gratuita** mas tem limites de uso
- Mantenha a chave **secreta**

## 📊 Limites da API Gratuita

- **60 requisições por minuto**
- **1500 requisições por dia**
- Suficiente para desenvolvimento e testes

## 🔗 Links Úteis

- **Obter API Key:** https://aistudio.google.com/app/apikey
- **Documentação:** https://ai.google.dev/
- **Limites de Uso:** https://ai.google.dev/pricing

---

**Após atualizar a chave, o sistema vai funcionar normalmente!** ✅
