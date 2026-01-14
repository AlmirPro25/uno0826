# 🚀 Guia Rápido - APIs Públicas

## Como Usar as Novas APIs

### 1️⃣ Buscar Produtos

```typescript
import { searchProducts } from './services/productSearchService';

// Busca simples
const results = await searchProducts('notebook');

// Busca avançada
const results = await searchProducts('smartphone samsung', {
  country: 'brasil',
  limit: 30,
  forceRefresh: true // Ignorar cache
});

console.log(results.products); // Array de produtos
console.log(results.info); // Informações da Wikipedia/DuckDuckGo
console.log(results.stats); // Estatísticas
```

---

### 2️⃣ Buscar por Código de Barras

```typescript
import { searchByBarcode } from './services/productSearchService';

// Buscar produto alimentício
const result = await searchByBarcode('7891000100103');

if (result) {
  console.log(result.product.title); // Nome do produto
  console.log(result.product.brand); // Marca
  console.log(result.product.ingredients); // Ingredientes
}
```

---

### 3️⃣ Buscar Apenas Informações

```typescript
import { searchProductInfo } from './services/productSearchService';

// Buscar informações enciclopédicas
const info = await searchProductInfo('iPhone 15');

console.log(info.info.primary); // Informação principal (DuckDuckGo ou Wikipedia)
console.log(info.info.related); // Artigos relacionados
```

---

### 4️⃣ Listar Fontes Disponíveis

```typescript
import { getAvailableSources } from './services/productSearchService';

const sources = await getAvailableSources();

console.log(sources.products); // Fontes de produtos
console.log(sources.info); // Fontes de informação
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Comparar Preços

```typescript
const results = await searchProducts('notebook dell', {
  limit: 50
});

// Ordenar por preço
const sorted = results.products.sort((a, b) => a.price - b.price);

console.log('Mais barato:', sorted[0]);
console.log('Mais caro:', sorted[sorted.length - 1]);

// Filtrar frete grátis
const freeShipping = results.products.filter(p => p.shipping.free);
console.log(`${freeShipping.length} produtos com frete grátis`);
```

---

### Exemplo 2: Buscar Produto Alimentício

```typescript
// Por código de barras
const product = await searchByBarcode('7891000100103');

if (product) {
  console.log(`
    Produto: ${product.product.title}
    Marca: ${product.product.brand}
    Nota Nutricional: ${product.product.nutritionGrade}
    Ingredientes: ${product.product.ingredients}
  `);
}

// Por nome
const results = await searchProducts('coca cola', {
  sources: ['openfoodfacts']
});
```

---

### Exemplo 3: Integrar com Chat

```typescript
// No componente de chat
const handleProductSearch = async (query: string) => {
  try {
    const results = await searchProducts(query);
    
    // Formatar para o LLM
    const formatted = formatProductsForLLM(results);
    
    // Enviar para o chat
    addMessage({
      role: 'assistant',
      content: formatted
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  }
};
```

---

## 🔧 Configurações Avançadas

### Escolher Fontes Específicas

```typescript
// Apenas Mercado Livre
const results = await searchProducts('notebook', {
  sources: ['mercadolibre']
});

// Apenas Open Food Facts
const results = await searchProducts('chocolate', {
  sources: ['openfoodfacts']
});

// Múltiplas fontes
const results = await searchProducts('produto', {
  sources: ['mercadolibre', 'openfoodfacts']
});
```

---

### Forçar Atualização (Ignorar Cache)

```typescript
const results = await searchProducts('notebook', {
  forceRefresh: true // Buscar novamente, ignorando cache
});
```

---

### Limitar Resultados

```typescript
// Top 10 produtos
const results = await searchProducts('smartphone', {
  limit: 10
});

// Top 50 produtos
const results = await searchProducts('notebook', {
  limit: 50
});
```

---

## 📊 Estrutura dos Dados

### Product

```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  url: string;
  image: string;
  condition: string; // 'new' ou 'used'
  seller: {
    name: string;
    reputation: string | null;
  };
  shipping: {
    free: boolean;
    type: string | null;
  };
  installments: {
    quantity: number;
    amount: number;
    rate: number;
  } | null;
  source: string; // 'mercadolibre', 'openfoodfacts', etc.
  marketplace: string;
  rank?: number;
  isTopDeal?: boolean;
}
```

---

### ProductSearchResult

```typescript
interface ProductSearchResult {
  query: string;
  products: Product[];
  info: {
    title: string;
    snippet: string;
    url: string;
  } | null;
  sources: string[];
  stats: {
    total: number;
    bySource: Record<string, number>;
  };
  timestamp: number;
  fromCache?: boolean;
}
```

---

## 🎨 Formatação para Exibição

### Formatar Preço

```typescript
import { formatPrice } from './services/productSearchService';

const price = formatPrice(1299.90, 'BRL');
console.log(price); // "R$ 1.299,90"
```

---

### Formatar Parcelamento

```typescript
import { formatInstallments } from './services/productSearchService';

const installments = {
  quantity: 12,
  amount: 108.33,
  rate: 0
};

const formatted = formatInstallments(installments);
console.log(formatted); // "12x de R$ 108,33 sem juros"
```

---

### Formatar para LLM

```typescript
import { formatProductsForLLM } from './services/productSearchService';

const results = await searchProducts('notebook');
const formatted = formatProductsForLLM(results);

// Retorna markdown formatado pronto para exibir no chat
console.log(formatted);
```

---

## 🚨 Tratamento de Erros

```typescript
try {
  const results = await searchProducts('notebook');
  
  if (results.products.length === 0) {
    console.log('Nenhum produto encontrado');
  }
  
} catch (error) {
  if (error.message.includes('404')) {
    console.log('Produto não encontrado');
  } else if (error.message.includes('500')) {
    console.log('Erro no servidor');
  } else {
    console.log('Erro desconhecido:', error);
  }
}
```

---

## 💡 Dicas

1. **Use cache**: Por padrão, resultados são cacheados por 1 hora
2. **Busque em paralelo**: As APIs são chamadas em paralelo automaticamente
3. **Filtre resultados**: Use `filter()` e `sort()` para refinar
4. **Combine fontes**: Use múltiplas fontes para mais resultados
5. **Monitore cache**: Use `/api/products/cache/stats` para ver estatísticas

---

## 🔗 Links Úteis

- [Documentação Completa](./APIS_PUBLICAS_INTEGRADAS.md)
- [Arquitetura do Sistema](./ARQUITETURA_PESQUISA_PRODUTOS.md)
- [Guia de APIs](./GUIA_RAPIDO_APIS_PRODUTOS.md)

---

## ✅ Checklist de Implementação

- [x] Mercado Livre API integrada
- [x] Wikipedia API integrada
- [x] DuckDuckGo API integrada
- [x] Open Food Facts API integrada
- [x] Cache implementado
- [x] Busca paralela
- [x] Fallback automático
- [x] Endpoints REST
- [x] TypeScript types
- [x] Documentação completa

---

**Pronto para usar! 🎉**
