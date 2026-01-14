# 🚀 Guia Rápido - APIs de Produtos

## 🎯 Objetivo

Integrar múltiplas APIs de produtos para criar um sistema de pesquisa robusto e profissional.

## 📋 APIs Gratuitas Recomendadas

### ✅ Nível 1: APIs Oficiais (Melhor Qualidade)

1. **Mercado Livre API** 🥇
   - ✅ Gratuito
   - ✅ Sem cadastro complexo
   - ✅ Funciona imediatamente
   - 📍 https://api.mercadolibre.com/sites/MLB/search?q=tv

2. **Magazine Luiza (Magalu)** 🥈
   - ✅ Gratuito
   - ⚠️ Requer cadastro
   - 📍 https://developers.magalu.com

3. **AliExpress Affiliate** 🥉
   - ✅ Gratuito
   - ⚠️ Requer aprovação
   - 📍 https://portals.aliexpress.com

### ✅ Nível 2: SERP APIs (Fallback Rápido)

1. **SerpApi**
   - ✅ 100 buscas/mês grátis
   - 📍 https://serpapi.com

2. **Brave Search API**
   - ✅ 2000 queries/mês grátis
   - 📍 https://brave.com/search/api/

### ✅ Nível 3: Scrapers (Fallback Robusto)

1. **Apify**
   - ✅ $5 créditos/mês grátis
   - 📍 https://apify.com

2. **ScraperAPI**
   - ✅ 5000 requests/mês grátis
   - 📍 https://www.scraperapi.com

## 🔥 Início Rápido (5 minutos)

### 1. Mercado Livre (SEM CADASTRO!)

```javascript
// Funciona AGORA, sem API key!
const fetch = require('node-fetch');

async function buscarProdutos(query) {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();
  
  return data.results.map(item => ({
    titulo: item.title,
    preco: item.price,
    link: item.permalink,
    imagem: item.thumbnail
  }));
}

// Usar
buscarProdutos('tv lg 27').then(console.log);
```

### 2. Adicionar ao seu Backend

```javascript
// backend/server.js

app.post('/api/products/search', async (req, res) => {
  const { query } = req.body;
  
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=20`;
    const response = await fetch(url);
    const data = await response.json();
    
    const products = data.results.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: 'BRL',
      url: item.permalink,
      image: item.thumbnail,
      seller: item.seller?.nickname || 'Mercado Livre',
      shipping: item.shipping?.free_shipping ? 'Grátis' : 'Pago'
    }));
    
    res.json({ products, total: data.paging.total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Integrar com Frontend

```typescript
// src/services/productSearchService.ts

export async function searchProducts(query: string) {
  const response = await fetch('http://localhost:3002/api/products/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  return await response.json();
}
```

## 📊 Comparação de APIs

| API | Gratuito | Limite | Cadastro | Qualidade |
|-----|----------|--------|----------|-----------|
| **Mercado Livre** | ✅ Sim | Ilimitado* | ❌ Não | ⭐⭐⭐⭐⭐ |
| **Magalu** | ✅ Sim | Alto | ✅ Sim | ⭐⭐⭐⭐⭐ |
| **AliExpress** | ✅ Sim | Médio | ✅ Sim | ⭐⭐⭐⭐ |
| **SerpApi** | ✅ 100/mês | 100 | ✅ Sim | ⭐⭐⭐⭐ |
| **Brave Search** | ✅ 2000/mês | 2000 | ✅ Sim | ⭐⭐⭐ |

*Limite razoável para uso normal

## 🎯 Estratégia Recomendada

### Fase 1: MVP (Hoje!)
```
✅ Implementar Mercado Livre API (5 min)
✅ Testar no backend (5 min)
✅ Integrar com frontend (10 min)
```

### Fase 2: Expansão (Esta Semana)
```
✅ Cadastrar em Magalu Developers
✅ Adicionar Magalu API
✅ Implementar fallback automático
```

### Fase 3: Robustez (Próxima Semana)
```
✅ Adicionar SerpApi (free tier)
✅ Implementar cache
✅ Deduplicação de produtos
```

## 💡 Dicas Profissionais

### 1. Cache é Essencial
```javascript
// Salvar resultados por 6 horas
const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() < item.expires) {
    return item.data;
  }
  return null;
}

function setCache(key, data, hours = 6) {
  cache.set(key, {
    data,
    expires: Date.now() + (hours * 3600000)
  });
}
```

### 2. Fallback Automático
```javascript
async function searchWithFallback(query) {
  // Tenta Mercado Livre
  try {
    const results = await mercadoLibreAPI(query);
    if (results.length > 0) return results;
  } catch (e) {}
  
  // Tenta Magalu
  try {
    const results = await magaluAPI(query);
    if (results.length > 0) return results;
  } catch (e) {}
  
  // Tenta SERP
  return await serpAPI(query);
}
```

### 3. Normalização de Dados
```javascript
function normalizeProduct(product, source) {
  return {
    id: product.id || product.sku,
    title: product.title || product.name,
    price: parseFloat(product.price || 0),
    url: product.url || product.link,
    image: product.image || product.thumbnail,
    source: source
  };
}
```

## 🔗 Links Úteis

### Documentação Oficial
- [Mercado Livre API Docs](https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br)
- [Magalu Developers](https://developers.magalu.com)
- [SerpApi Docs](https://serpapi.com/search-api)

### Tutoriais
- [Como usar Mercado Livre API](https://developers.mercadolivre.com.br/pt_br/primeiros-passos)
- [Brave Search API Guide](https://brave.com/search/api/)

## ❓ FAQ

**P: Preciso de API key para Mercado Livre?**
R: Não! A API de busca é pública e funciona sem autenticação.

**P: Qual API tem melhor cobertura no Brasil?**
R: Mercado Livre e Magalu são as melhores para Brasil.

**P: Como evitar bloqueios?**
R: Use cache, respeite rate limits e implemente retry com backoff.

**P: Posso usar para fins comerciais?**
R: Sim, mas leia os termos de cada API. Programas de afiliados são recomendados.

## 🎉 Próximos Passos

1. **Teste agora**: Copie o código do Mercado Livre e teste!
2. **Leia a arquitetura completa**: `ARQUITETURA_PESQUISA_PRODUTOS.md`
3. **Implemente o orquestrador**: Sistema com fallback automático

---

**Quer que eu implemente o código completo agora?** 🚀
