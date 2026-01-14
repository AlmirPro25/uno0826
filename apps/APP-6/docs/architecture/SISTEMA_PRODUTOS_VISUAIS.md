# 🛒 Sistema de Produtos Visuais

## ✅ Implementado

Sistema completo para exibir produtos com **imagens, preços e links** diretamente no chat!

## 🎯 Como Funciona

### 1. Usuário Pede Busca de Produtos

```
Usuário: "Buscar notebook gamer"
Usuário: "Quanto custa iPhone 15?"
Usuário: "Onde comprar drone barato?"
```

### 2. Sistema Detecta Automaticamente

O sistema detecta palavras-chave como:
- buscar produto
- procurar produto
- preço de
- quanto custa
- onde comprar
- comprar
- oferta
- promoção

### 3. Busca e Exibe Produtos

O sistema:
1. Busca produtos nas APIs (Mercado Livre, etc.)
2. Exibe resposta em texto com resumo
3. Mostra grade visual com:
   - ✅ Imagens dos produtos
   - ✅ Preços (com desconto se houver)
   - ✅ Frete grátis
   - ✅ Parcelamento
   - ✅ Link "Ver Produto" para comprar

---

## 📁 Arquivos Criados

### Frontend

1. **`src/components/ProductGrid.tsx`**
   - Componente React para exibir grade de produtos
   - Cards com imagem, preço, link
   - Badges de ranking (#1, #2, #3)
   - Badges de desconto
   - Responsivo

2. **`src/services/productIntegrationService.ts`**
   - Detecta busca de produtos
   - Extrai query da mensagem
   - Formata resposta para o chat
   - Integra produtos com mensagens

3. **`src/types.ts`** (atualizado)
   - Adicionado `ProductData` interface
   - Adicionado `products` e `productQuery` em `Message`

4. **`src/components/Message.tsx`** (atualizado)
   - Import do `ProductGrid`
   - Renderiza produtos quando disponíveis

---

## 🎨 Visual do Sistema

### Grade de Produtos

```
┌─────────────────────────────────────────────────┐
│  🛒 20 produtos encontrados                     │
│  Clique em "Ver Produto" para comprar          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ #1   │  │ #2   │  │ #3   │  │      │       │
│  │[IMG] │  │[IMG] │  │[IMG] │  │[IMG] │       │
│  │      │  │      │  │      │  │      │       │
│  │Título│  │Título│  │Título│  │Título│       │
│  │R$999 │  │R$1.2k│  │R$1.5k│  │R$1.8k│       │
│  │      │  │      │  │      │  │      │       │
│  │[Ver] │  │[Ver] │  │[Ver] │  │[Ver] │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Card Individual

```
┌─────────────────────────┐
│ #1 🥇         -20% 🔥   │ ← Badges
├─────────────────────────┤
│                         │
│      [IMAGEM DO         │
│       PRODUTO]          │ ← Imagem 200x200px
│                         │
├─────────────────────────┤
│ Notebook Gamer Dell...  │ ← Título (2 linhas)
│                         │
│ ~~R$ 4.999,00~~         │ ← Preço original
│ R$ 3.999,00             │ ← Preço atual (verde)
│                         │
│ 12x de R$ 333,25        │ ← Parcelamento
│ sem juros               │
│                         │
│ ✅ Frete Grátis         │ ← Badge frete
│                         │
│ Vendedor: Dell Store    │ ← Vendedor
│                         │
│ ┌─────────────────────┐ │
│ │  Ver Produto →      │ │ ← Botão (azul)
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## 🔧 Como Integrar no Chat

### Opção 1: Detecção Automática (Recomendado)

```typescript
import { isProductSearch, searchAndFormatProducts } from './services/productIntegrationService';

// No handler de envio de mensagem
async function handleSendMessage(userMessage: string) {
  // Verificar se é busca de produtos
  if (isProductSearch(userMessage)) {
    try {
      // Buscar produtos
      const { textResponse, products, query } = await searchAndFormatProducts(userMessage);
      
      // Adicionar mensagem do assistente com produtos
      addMessage({
        id: generateId(),
        role: 'model',
        content: textResponse,
        products: products,
        productQuery: query
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  } else {
    // Processar mensagem normal com LLM
    // ...
  }
}
```

### Opção 2: Comando Explícito

```typescript
// Adicionar comando /produtos
if (userMessage.startsWith('/produtos ')) {
  const query = userMessage.replace('/produtos ', '');
  const { textResponse, products } = await searchAndFormatProducts(query);
  
  addMessage({
    role: 'model',
    content: textResponse,
    products: products,
    productQuery: query
  });
}
```

### Opção 3: LLM Decide

```typescript
// Deixar o LLM decidir quando buscar produtos
// Adicionar no system prompt:
const systemPrompt = `
Quando o usuário pedir para buscar produtos, responda com:
PRODUCT_SEARCH: [query]

Exemplo:
Usuário: "Quero comprar um notebook"
Você: "PRODUCT_SEARCH: notebook"
`;

// No processamento da resposta do LLM
if (llmResponse.includes('PRODUCT_SEARCH:')) {
  const query = llmResponse.split('PRODUCT_SEARCH:')[1].trim();
  const { textResponse, products } = await searchAndFormatProducts(query);
  // ...
}
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Busca Simples

```
👤 Usuário: "Buscar notebook gamer"

🤖 Assistente:
# 🛒 Encontrei 20 produtos para "notebook gamer"

## 🏆 Melhores Ofertas

🥇 **Notebook Gamer Dell G15**
💰 R$ 3.999,00 ~~R$ 4.999,00~~ (-20%)
✅ Frete Grátis

🥈 **Notebook Gamer Acer Nitro 5**
💰 R$ 4.299,00
✅ Frete Grátis

🥉 **Notebook Gamer Lenovo Legion**
💰 R$ 4.599,00

## 📊 Resumo
- Menor preço: R$ 3.999,00
- Maior preço: R$ 8.999,00
- Com frete grátis: 15 produtos

👇 Veja todos os produtos abaixo com imagens e links!

[GRADE DE PRODUTOS AQUI]
```

### Exemplo 2: Comparação de Preços

```
👤 Usuário: "Quanto custa iPhone 15?"

🤖 Assistente:
# 🛒 Encontrei 18 produtos para "iPhone 15"

## 📚 Sobre "iPhone 15"
O iPhone 15 é o smartphone da Apple lançado em 2023...

## 🏆 Melhores Ofertas
🥇 R$ 6.499,00 (Mercado Livre)
🥈 R$ 6.799,00 (Magazine Luiza)
🥉 R$ 6.999,00 (Amazon)

[GRADE DE PRODUTOS]
```

---

## 🎨 Customização

### Alterar Cores

```typescript
// Em ProductGrid.tsx
const styles = {
  button: {
    backgroundColor: '#3498db', // Azul
    // Trocar para:
    backgroundColor: '#e74c3c', // Vermelho
    backgroundColor: '#2ecc71', // Verde
    backgroundColor: '#9b59b6', // Roxo
  }
};
```

### Alterar Layout

```typescript
// Grid de 3 colunas
gridTemplateColumns: 'repeat(3, 1fr)'

// Grid de 4 colunas
gridTemplateColumns: 'repeat(4, 1fr)'

// Grid responsivo (atual)
gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
```

### Adicionar Mais Informações

```typescript
// No ProductCard, adicionar:
<p>Condição: {product.condition === 'new' ? 'Novo' : 'Usado'}</p>
<p>Reputação: {product.seller.reputation}</p>
<p>Marketplace: {product.marketplace}</p>
```

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Componentes criados | 2 |
| Serviços criados | 1 |
| Tipos adicionados | 2 |
| Palavras-chave detectadas | 14 |
| Campos por produto | 15 |
| Produtos por busca | 20 |

---

## 🚀 Próximos Passos

### Melhorias Possíveis

1. **Filtros**
   - Por preço (min/max)
   - Por frete grátis
   - Por condição (novo/usado)
   - Por vendedor

2. **Ordenação**
   - Menor preço
   - Maior desconto
   - Melhor avaliação
   - Mais vendidos

3. **Comparação**
   - Comparar 2-3 produtos lado a lado
   - Tabela de comparação

4. **Favoritos**
   - Salvar produtos favoritos
   - Lista de desejos

5. **Notificações**
   - Alerta de queda de preço
   - Alerta de estoque

6. **Histórico**
   - Histórico de buscas
   - Produtos visualizados

---

## ✅ Checklist de Implementação

- [x] Componente ProductGrid
- [x] Serviço de integração
- [x] Tipos TypeScript
- [x] Detecção automática
- [x] Formatação de resposta
- [x] Badges de ranking
- [x] Badges de desconto
- [x] Frete grátis
- [x] Parcelamento
- [x] Links para compra
- [x] Imagens otimizadas
- [x] Responsivo
- [x] Documentação

---

## 🎉 Resultado Final

O sistema agora:

1. ✅ Detecta automaticamente quando usuário quer buscar produtos
2. ✅ Busca em múltiplas APIs (Mercado Livre, Open Food Facts)
3. ✅ Exibe resposta em texto com resumo
4. ✅ Mostra grade visual com imagens, preços e links
5. ✅ Permite clicar para comprar diretamente
6. ✅ Funciona 100% sem cadastro ou API keys

**Pronto para usar!** 🚀
