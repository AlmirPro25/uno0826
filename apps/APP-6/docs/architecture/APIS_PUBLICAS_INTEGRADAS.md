# 🌐 APIs Públicas Integradas - SEM Cadastro!

## ✅ APIs Ativas (Sem necessidade de cadastro)

### 1. 🛒 Mercado Livre API
**Status**: ✅ Ativo  
**Cadastro**: ❌ Não necessário  
**Limite**: Sem limite oficial  

**Funcionalidades**:
- Busca de produtos por palavra-chave
- Preços, imagens, vendedores
- Frete grátis, parcelamento
- Múltiplos países (Brasil, Argentina, México, etc.)

**Endpoint**: `https://api.mercadolibre.com/sites/MLB/search`

**Exemplo**:
```javascript
// Buscar "notebook"
GET https://api.mercadolibre.com/sites/MLB/search?q=notebook&limit=20
```

---

### 2. 📚 Wikipedia API
**Status**: ✅ Ativo  
**Cadastro**: ❌ Não necessário  
**Limite**: Sem limite  

**Funcionalidades**:
- Busca de artigos
- Resumos e snippets
- Links para artigos completos

**Endpoint**: `https://pt.wikipedia.org/w/api.php`

**Exemplo**:
```javascript
// Buscar informações sobre "iPhone"
GET https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=iPhone&format=json
```

---

### 3. 🦆 DuckDuckGo Instant Answer API
**Status**: ✅ Ativo  
**Cadastro**: ❌ Não necessário  
**Limite**: Sem limite  

**Funcionalidades**:
- Respostas instantâneas
- Resumos de tópicos
- Tópicos relacionados
- Imagens

**Endpoint**: `https://api.duckduckgo.com`

**Exemplo**:
```javascript
// Buscar informações sobre "Samsung Galaxy"
GET https://api.duckduckgo.com/?q=Samsung+Galaxy&format=json&no_html=1
```

---

### 4. 📦 Open Food Facts API
**Status**: ✅ Ativo  
**Cadastro**: ❌ Não necessário  
**Limite**: Sem limite  

**Funcionalidades**:
- Busca de produtos alimentícios
- Código de barras
- Ingredientes, nutrição
- Imagens de produtos

**Endpoint**: `https://world.openfoodfacts.org/api/v0`

**Exemplos**:
```javascript
// Buscar por código de barras
GET https://world.openfoodfacts.org/api/v0/product/7891000100103.json

// Buscar por nome
GET https://world.openfoodfacts.org/api/v0/search?search_terms=coca+cola&page_size=20&json=1
```

---

## 🔄 Como Usar no Sistema

### Backend (Node.js)

```javascript
const { productSearch } = require('./services/productSearchService');

// Buscar produtos
const results = await productSearch.search('notebook gamer', {
  country: 'brasil',
  limit: 20,
  sources: ['mercadolibre', 'openfoodfacts']
});

// Buscar informações
const info = await productSearch.searchInfo('iPhone 15');

// Buscar por código de barras
const product = await productSearch.searchByBarcode('7891000100103');
```

### Frontend (React/TypeScript)

```typescript
import { searchProducts } from './services/productSearchService';

// Buscar produtos
const results = await searchProducts('notebook', {
  country: 'brasil',
  limit: 20
});

console.log(results.products); // Array de produtos
console.log(results.info); // Informações da Wikipedia/DuckDuckGo
```

---

## 📡 Endpoints da API

### POST `/api/products/search`
Buscar produtos em múltiplas fontes

**Body**:
```json
{
  "query": "notebook gamer",
  "country": "brasil",
  "limit": 20,
  "forceRefresh": false,
  "sources": ["mercadolibre", "openfoodfacts"]
}
```

**Response**:
```json
{
  "query": "notebook gamer",
  "products": [...],
  "info": {
    "title": "Notebook",
    "snippet": "Um notebook é...",
    "url": "https://..."
  },
  "sources": ["mercadolibre", "duckduckgo"],
  "stats": {
    "total": 20,
    "bySource": {
      "mercadolibre": 20
    }
  },
  "timestamp": 1234567890
}
```

---

### POST `/api/products/barcode`
Buscar produto por código de barras

**Body**:
```json
{
  "barcode": "7891000100103"
}
```

**Response**:
```json
{
  "barcode": "7891000100103",
  "product": {
    "id": "7891000100103",
    "title": "Coca-Cola 2L",
    "brand": "Coca-Cola",
    "image": "https://...",
    "url": "https://..."
  }
}
```

---

### GET `/api/products/sources`
Listar fontes disponíveis

**Response**:
```json
{
  "products": [
    {
      "id": "mercadolibre",
      "name": "Mercado Livre",
      "active": true,
      "requiresAuth": false
    },
    {
      "id": "openfoodfacts",
      "name": "Open Food Facts",
      "active": true,
      "requiresAuth": false
    }
  ],
  "info": [
    {
      "id": "wikipedia",
      "name": "Wikipedia",
      "active": true,
      "requiresAuth": false
    },
    {
      "id": "duckduckgo",
      "name": "DuckDuckGo",
      "active": true,
      "requiresAuth": false
    }
  ]
}
```

---

## 🚀 Vantagens

✅ **Sem cadastro** - Funciona imediatamente  
✅ **Sem API keys** - Não precisa de autenticação  
✅ **Sem limites** - Uso ilimitado (dentro do razoável)  
✅ **Múltiplas fontes** - Fallback automático  
✅ **Cache inteligente** - Reduz requisições  
✅ **Busca paralela** - Resultados mais rápidos  

---

## 📊 Comparação com APIs Pagas

| Recurso | APIs Públicas | APIs Pagas |
|---------|---------------|------------|
| Cadastro | ❌ Não | ✅ Sim |
| API Key | ❌ Não | ✅ Sim |
| Custo | 💰 Grátis | 💰💰💰 Pago |
| Limite | ♾️ Ilimitado | 📊 Limitado |
| Qualidade | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔮 Próximas Integrações

### APIs que podem ser adicionadas (também sem cadastro):

1. **SearchApi** - Google, YouTube, Amazon SERP
   - Requer proxy ou API key gratuita
   
2. **Public APIs** - Agregador de APIs públicas
   - Pode ajudar a encontrar mais fontes

3. **Amazon Product API** (não oficial)
   - Scraping de resultados de busca

4. **AliExpress API** (não oficial)
   - Produtos importados

---

## 🛠️ Manutenção

### Cache
- **TTL padrão**: 1 hora
- **Máximo**: 100 itens
- **Limpeza**: Automática (FIFO)

### Monitoramento
```bash
# Ver estatísticas do cache
GET /api/products/cache/stats

# Limpar cache
POST /api/products/cache/clear
```

---

## 📝 Notas Importantes

1. **Rate Limiting**: Embora não haja limites oficiais, evite fazer milhares de requisições por segundo
2. **User-Agent**: Algumas APIs podem bloquear se não houver User-Agent
3. **CORS**: Todas as APIs suportam CORS ou são chamadas pelo backend
4. **Disponibilidade**: APIs públicas podem ficar offline ocasionalmente

---

## 🎯 Conclusão

O sistema agora integra **4 APIs públicas** que funcionam **sem necessidade de cadastro**, fornecendo:

- ✅ Busca de produtos em marketplaces
- ✅ Informações enciclopédicas
- ✅ Busca por código de barras
- ✅ Fallback automático entre fontes

**Tudo isso de forma gratuita e sem limites!** 🎉
