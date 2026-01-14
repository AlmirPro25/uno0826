# 🤖 Guia de Modelos Gemini - Sistema Completo

## 📋 Modelos Disponíveis

### Gemini 2.0 (Experimental - Mais Recente)

```typescript
const GEMINI_2_MODELS = {
  flash: "gemini-2.0-flash-exp",           // Rápido, 2M tokens
  thinking: "gemini-2.0-flash-thinking-exp", // Com raciocínio
  pro: "gemini-2.0-pro-exp"                // Mais poderoso
};
```

**Características:**
- ✅ 2 milhões de tokens de contexto
- ✅ Multimodal (texto, imagem, áudio, vídeo)
- ✅ Streaming nativo
- ✅ Grounding com Google Search
- ⚠️ Experimental (pode ter instabilidade)

### Gemini 1.5 (Estável - Recomendado para Produção)

```typescript
const GEMINI_STABLE_MODELS = {
  flash: "models/gemini-flash-latest",     // Rápido e estável
  flashExp: "gemini-1.5-flash-exp-0827",   // Experimental
  pro: "models/gemini-pro-latest",         // Mais poderoso
  proExp: "gemini-1.5-pro-exp-0827"        // Pro experimental
};
```

**Características:**
- ✅ Estável e confiável
- ✅ 1 milhão de tokens de contexto
- ✅ Multimodal
- ✅ Produção-ready
- ✅ Melhor custo-benefício

### Embeddings

```typescript
const EMBEDDING_MODELS = {
  latest: "text-embedding-004",            // Recomendado
  legacy: "embedding-001"                  // Legado
};
```

## 🔧 Configuração no Sistema

### 1. Variáveis de Ambiente

```bash
# .env
VITE_GEMINI_API_KEY=sua_chave_aqui

# Usar Gemini 2.0 (experimental)
USE_GEMINI_2=true

# OU usar modelo estável (recomendado)
USE_GEMINI_2=false

# Modelo específico (opcional)
GEMINI_MODEL=models/gemini-flash-latest
```

### 2. Configuração por Serviço

```typescript
// services/GeminiService.ts
const getModelConfig = () => {
  const useGemini2 = process.env.USE_GEMINI_2 === 'true';
  
  return {
    primary: useGemini2 
      ? 'gemini-2.0-flash-exp' 
      : 'models/gemini-flash-latest',
    
    fallback: 'models/gemini-flash-latest',
    
    embeddings: 'text-embedding-004'
  };
};
```

### 3. Fallback Automático

```typescript
async function generateWithFallback(prompt: string) {
  const config = getModelConfig();
  
  try {
    // Tentar modelo primário
    const model = genAI.getGenerativeModel({ 
      model: config.primary 
    });
    return await model.generateContent(prompt);
    
  } catch (error) {
    console.warn('Fallback para modelo estável:', error);
    
    // Fallback automático
    const fallbackModel = genAI.getGenerativeModel({ 
      model: config.fallback 
    });
    return await fallbackModel.generateContent(prompt);
  }
}
```

## 🎯 Recomendações por Caso de Uso

### Desenvolvimento e Testes
```typescript
{
  model: "models/gemini-flash-latest",
  reason: "Estável, rápido, confiável"
}
```

### Produção (Alta Performance)
```typescript
{
  model: "models/gemini-flash-latest",
  reason: "Melhor custo-benefício, estável"
}
```

### Produção (Máxima Qualidade)
```typescript
{
  model: "models/gemini-pro-latest",
  reason: "Respostas mais elaboradas"
}
```

### Experimentação (Recursos Novos)
```typescript
{
  model: "gemini-2.0-flash-exp",
  fallback: "models/gemini-flash-latest",
  reason: "Testar recursos Gemini 2.0"
}
```

### RAG e Embeddings
```typescript
{
  embeddings: "text-embedding-004",
  generation: "models/gemini-flash-latest",
  reason: "Melhor para busca semântica"
}
```

### Fintech (Compliance)
```typescript
{
  model: "models/gemini-pro-latest",
  temperature: 0.1,
  reason: "Respostas mais precisas e consistentes"
}
```

## 📊 Comparação de Modelos

| Modelo | Contexto | Velocidade | Custo | Estabilidade | Uso |
|--------|----------|------------|-------|--------------|-----|
| gemini-2.0-flash-exp | 2M tokens | ⚡⚡⚡ | 💰 | ⚠️ Experimental | Testes |
| gemini-flash-latest | 1M tokens | ⚡⚡⚡ | 💰 | ✅ Estável | Produção |
| gemini-pro-latest | 1M tokens | ⚡⚡ | 💰💰 | ✅ Estável | Qualidade |
| gemini-2.0-pro-exp | 2M tokens | ⚡ | 💰💰💰 | ⚠️ Experimental | Pesquisa |

## 🔄 Migração de Modelos

### De Gemini 1.5 para 2.0

```typescript
// ANTES (Gemini 1.5)
const model = genAI.getGenerativeModel({ 
  model: 'models/gemini-flash-latest' 
});

// DEPOIS (Gemini 2.0 com fallback)
const modelName = process.env.USE_GEMINI_2 === 'true'
  ? 'gemini-2.0-flash-exp'
  : 'models/gemini-flash-latest';

const model = genAI.getGenerativeModel({ model: modelName });
```

### Atualizar Neural Core

```typescript
// neural-core/src/index.ts
const MODELS = {
  primary: process.env.USE_GEMINI_2 === 'true'
    ? 'gemini-2.0-flash-exp'
    : 'models/gemini-flash-latest',
  
  embeddings: 'text-embedding-004'
};
```

### Atualizar Proxy Server

```typescript
// proxy-server/src/server.ts
app.post('/api/generate', async (c) => {
  const modelName = c.req.header('X-Use-Gemini-2') === 'true'
    ? 'gemini-2.0-flash-exp'
    : 'models/gemini-flash-latest';
  
  const model = genAI.getGenerativeModel({ model: modelName });
  // ...
});
```

## 🧪 Testar Modelos

### Script de Teste

```typescript
// test-models.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testModel(modelName: string) {
  console.log(`\nTestando: ${modelName}`);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Olá, você está funcionando?');
    const response = result.response.text();
    
    console.log('✅ Sucesso:', response.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

async function testAllModels() {
  const models = [
    'gemini-2.0-flash-exp',
    'models/gemini-flash-latest',
    'models/gemini-pro-latest',
    'text-embedding-004'
  ];
  
  for (const model of models) {
    await testModel(model);
  }
}

testAllModels();
```

### Executar Teste

```bash
# Instalar dependências
npm install @google/generative-ai

# Executar teste
npx tsx test-models.ts
```

## 📝 Configuração Recomendada

### Para Desenvolvimento

```bash
# .env.development
USE_GEMINI_2=false
GEMINI_MODEL=models/gemini-flash-latest
GEMINI_TEMPERATURE=0.7
```

### Para Produção

```bash
# .env.production
USE_GEMINI_2=false
GEMINI_MODEL=models/gemini-flash-latest
GEMINI_TEMPERATURE=0.5
ENABLE_FALLBACK=true
```

### Para Experimentação

```bash
# .env.experimental
USE_GEMINI_2=true
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_FALLBACK=models/gemini-flash-latest
GEMINI_TEMPERATURE=0.8
```

## 🚨 Troubleshooting

### Erro: "Model not found"

```typescript
// Solução: Usar nome completo do modelo
❌ model: "gemini-flash-latest"
✅ model: "models/gemini-flash-latest"
```

### Erro: "Quota exceeded"

```typescript
// Solução: Implementar rate limiting
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 60,
  interval: 'minute'
});

await limiter.removeTokens(1);
const result = await model.generateContent(prompt);
```

### Erro: "Context length exceeded"

```typescript
// Solução: Truncar contexto
function truncateContext(text: string, maxTokens: number = 30000) {
  const estimatedTokens = text.length / 4;
  if (estimatedTokens > maxTokens) {
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars);
  }
  return text;
}
```

## 📚 Recursos

- [Gemini API Docs](https://ai.google.dev/docs)
- [Modelos Disponíveis](https://ai.google.dev/models/gemini)
- [Pricing](https://ai.google.dev/pricing)
- [Rate Limits](https://ai.google.dev/docs/rate_limits)

---

**Atualizado em:** 19/11/2025
**Versão:** 2.0.0
**Status:** ✅ Pronto para uso
