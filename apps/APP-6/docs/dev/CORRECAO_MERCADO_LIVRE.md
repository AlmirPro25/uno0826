# ⚠️ Correção - Mercado Livre API

## Problema Identificado

O Mercado Livre está bloqueando requisições diretas do servidor (HTTP 403 Forbidden).

```
🛒 Mercado Livre: Buscando "notebook gamer"...
⚠️ Mercado Livre: HTTP 403
```

## Causa

A API pública do Mercado Livre detecta requisições de servidores e bloqueia para prevenir scraping em massa.

## Soluções Possíveis

### 1. ✅ Usar Open Food Facts (Funcionando)

O Open Food Facts funciona perfeitamente e não tem bloqueios:

```bash
POST http://localhost:3002/api/products/search
{
  "query": "coca cola",
  "limit": 20
}
```

**Resultado**: ✅ 20 produtos encontrados

### 2. 🔄 Usar Proxy Rotativo

Adicionar serviço de proxy para rotacionar IPs:

```javascript
const response = await fetch(url, {
  agent: new HttpsProxyAgent('http://proxy-server:port'),
  headers: { ... }
});
```

**Serviços de Proxy**:
- ScraperAPI
- Bright Data
- Oxylabs

### 3. 🌐 Fazer Requisição do Frontend

Em vez de chamar do backend, fazer a requisição diretamente do browser:

```typescript
// No frontend (React)
const response = await fetch(
  `https://api.mercadolibre.com/sites/MLB/search?q=${query}`,
  {
    mode: 'cors',
    headers: {
      'Accept': 'application/json'
    }
  }
);
```

**Vantagem**: Browser não é bloqueado  
**Desvantagem**: Expõe requisições ao usuário

### 4. 📦 Usar API Oficial (Requer Cadastro)

Cadastrar aplicação no Mercado Livre Developers:
- https://developers.mercadolivre.com.br/

**Vantagem**: Sem bloqueios, mais estável  
**Desvantagem**: Requer cadastro e API key

### 5. 🔍 Usar SearchApi ou SerpApi

Usar serviços de terceiros que já lidam com bloqueios:

```javascript
// SearchApi
const response = await fetch(
  `https://www.searchapi.io/api/v1/search?engine=google_shopping&q=${query}&api_key=YOUR_KEY`
);
```

**Vantagem**: Funciona bem, múltiplas fontes  
**Desvantagem**: Requer API key (mas tem plano grátis)

---

## ✅ Solução Implementada (Temporária)

Por enquanto, o sistema funciona com:

1. **Open Food Facts** - Produtos alimentícios (✅ Funcionando)
2. **Wikipedia** - Informações enciclopédicas (✅ Funcionando)
3. **DuckDuckGo** - Informações gerais (✅ Funcionando)

### Teste Funcionando

```bash
# Buscar produtos alimentícios
POST http://localhost:3002/api/products/search
{
  "query": "coca cola",
  "limit": 10
}

# Resultado
{
  "query": "coca cola",
  "products": [
    {
      "id": "5449000054227",
      "title": "Coca-Cola Original Taste",
      "brand": "Coca-Cola",
      "image": "https://images.openfoodfacts.org/...",
      "url": "https://world.openfoodfacts.org/product/5449000054227"
    },
    // ... mais 9 produtos
  ],
  "stats": {
    "total": 10,
    "bySource": {
      "openfoodfacts": 10
    }
  }
}
```

---

## 🚀 Próximos Passos

### Opção A: Implementar Requisição do Frontend

```typescript
// src/services/mercadoLibreService.ts
export async function searchMercadoLibre(query: string) {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=20`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Erro Mercado Livre:', error);
    return [];
  }
}
```

### Opção B: Adicionar SearchApi

```javascript
// backend/services/searchApiService.js
export class SearchApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.searchapi.io/api/v1';
  }
  
  async searchGoogleShopping(query) {
    const url = `${this.baseURL}/search?engine=google_shopping&q=${query}&api_key=${this.apiKey}`;
    const response = await fetch(url);
    return await response.json();
  }
}
```

### Opção C: Usar Apenas Open Food Facts

Focar em produtos alimentícios e expandir para outras categorias:

- ✅ Alimentos e bebidas
- ✅ Produtos de higiene
- ✅ Cosméticos
- ✅ Produtos de limpeza

---

## 📊 Status Atual

| API | Status | Produtos | Observação |
|-----|--------|----------|------------|
| Mercado Livre | ❌ Bloqueado | 0 | HTTP 403 |
| Open Food Facts | ✅ Funcionando | 20+ | Alimentos |
| Wikipedia | ✅ Funcionando | N/A | Informações |
| DuckDuckGo | ✅ Funcionando | N/A | Informações |

---

## 💡 Recomendação

**Para demonstração imediata**: Usar Open Food Facts (já funciona)

**Para produção**: Implementar requisição do frontend ou usar SearchApi

---

## 🔧 Como Testar Agora

```bash
# 1. Backend rodando
cd backend
node server.js

# 2. Testar com produtos alimentícios
curl -X POST http://localhost:3002/api/products/search \
  -H "Content-Type: application/json" \
  -d '{"query":"chocolate","limit":10}'

# 3. Ver no frontend
# Buscar: "chocolate" ou "coca cola" ou "leite"
```

---

## ✅ Conclusão

O sistema de produtos visuais está **100% funcional** com Open Food Facts. 

Para adicionar Mercado Livre, basta implementar uma das soluções acima.

**Tudo pronto para demonstração!** 🎉
