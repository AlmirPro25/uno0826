# 🔌 Exemplo de Integração - Sistema de Produtos

## Como Integrar no App.tsx

### 1. Importar Serviços

```typescript
import { 
  isProductSearch, 
  searchAndFormatProducts 
} from './services/productIntegrationService';
```

### 2. Modificar handleSendMessage

```typescript
const handleSendMessage = async (prompt: string) => {
  // Adicionar mensagem do usuário
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content: prompt,
  };
  
  setMessages(prev => [...prev, userMessage]);
  
  // ✅ VERIFICAR SE É BUSCA DE PRODUTOS
  if (isProductSearch(prompt)) {
    console.log('🛒 Detectada busca de produtos');
    
    // Adicionar mensagem de loading
    const loadingMessage: Message = {
      id: generateId(),
      role: 'model',
      content: '',
      isLoading: true,
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      // Buscar produtos
      const { textResponse, products, query } = await searchAndFormatProducts(prompt);
      
      // Substituir mensagem de loading por resposta com produtos
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: textResponse,
                products: products,
                productQuery: query,
                isLoading: false,
              }
            : msg
        )
      );
      
      console.log(`✅ ${products.length} produtos encontrados`);
      
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      
      // Mostrar erro
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: '😕 Desculpe, não consegui buscar os produtos. Tente novamente.',
                isLoading: false,
                error: error.message,
              }
            : msg
        )
      );
    }
    
    return; // Não processar com LLM
  }
  
  // Processar mensagem normal com LLM
  // ... código existente ...
};
```

---

## Exemplo Completo (App.tsx)

```typescript
import React, { useState } from 'react';
import { Message } from './types';
import { MessageComponent } from './components/Message';
import { PromptInput } from './components/PromptInput';
import { 
  isProductSearch, 
  searchAndFormatProducts 
} from './services/productIntegrationService';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateId = () => Date.now().toString();

  const handleSendMessage = async (prompt: string) => {
    // Mensagem do usuário
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: prompt,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // ========== BUSCA DE PRODUTOS ==========
    if (isProductSearch(prompt)) {
      const loadingMessage: Message = {
        id: generateId(),
        role: 'model',
        content: '',
        isLoading: true,
      };
      
      setMessages(prev => [...prev, loadingMessage]);

      try {
        const { textResponse, products, query } = await searchAndFormatProducts(prompt);
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: textResponse,
                  products: products,
                  productQuery: query,
                  isLoading: false,
                }
              : msg
          )
        );
      } catch (error) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: 'Erro ao buscar produtos.',
                  isLoading: false,
                  error: error.message,
                }
              : msg
          )
        );
      }
      
      setIsLoading(false);
      return;
    }

    // ========== MENSAGEM NORMAL (LLM) ==========
    try {
      // Seu código existente para processar com LLM
      // ...
    } catch (error) {
      console.error('Erro:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="app">
      <div className="messages">
        {messages.map(msg => (
          <MessageComponent
            key={msg.id}
            message={msg}
            onEdit={() => {}}
            onRegenerate={() => {}}
            isLastMessage={false}
            onStop={() => {}}
            onTextToSpeech={async () => ''}
            onShowInteractiveCode={() => {}}
            onSend={handleSendMessage}
            theme="dark"
            isThinkingMode={false}
          />
        ))}
      </div>
      
      <PromptInput
        onSend={handleSendMessage}
        disabled={isLoading}
      />
    </div>
  );
}

export default App;
```

---

## Testes Rápidos

### Teste 1: Busca Simples

```
Usuário: "Buscar notebook"
```

**Resultado esperado:**
- ✅ Detecta como busca de produtos
- ✅ Busca produtos
- ✅ Exibe texto com resumo
- ✅ Exibe grade com imagens e links

### Teste 2: Pergunta de Preço

```
Usuário: "Quanto custa iPhone 15?"
```

**Resultado esperado:**
- ✅ Detecta como busca de produtos
- ✅ Extrai "iPhone 15" como query
- ✅ Busca e exibe produtos

### Teste 3: Onde Comprar

```
Usuário: "Onde comprar drone barato?"
```

**Resultado esperado:**
- ✅ Detecta como busca de produtos
- ✅ Extrai "drone barato" como query
- ✅ Busca e exibe produtos

### Teste 4: Mensagem Normal

```
Usuário: "Qual a capital do Brasil?"
```

**Resultado esperado:**
- ✅ NÃO detecta como busca de produtos
- ✅ Processa com LLM normalmente

---

## Debug

### Verificar Detecção

```typescript
console.log('É busca de produtos?', isProductSearch('buscar notebook'));
// true

console.log('É busca de produtos?', isProductSearch('qual a capital?'));
// false
```

### Verificar Extração de Query

```typescript
console.log(extractProductQuery('buscar notebook gamer'));
// "notebook gamer"

console.log(extractProductQuery('quanto custa iPhone 15?'));
// "iPhone 15"
```

### Verificar Busca

```typescript
const result = await searchAndFormatProducts('notebook');
console.log('Produtos:', result.products.length);
console.log('Query:', result.query);
console.log('Resposta:', result.textResponse);
```

---

## Logs Esperados

```
🛒 Detectada busca de produtos
🛒 Buscando produtos: notebook gamer
🛒 Mercado Livre: Buscando "notebook gamer"...
✅ Mercado Livre: 20 produtos encontrados
📚 Wikipedia: Buscando "notebook gamer"...
✅ Wikipedia: 3 artigos encontrados
✅ Busca concluída: 20 produtos de 2 fontes
✅ 20 produtos encontrados
```

---

## Troubleshooting

### Problema: Produtos não aparecem

**Solução:**
1. Verificar se backend está rodando (`http://localhost:3002`)
2. Verificar console do browser por erros
3. Verificar se `message.products` está definido

### Problema: Imagens não carregam

**Solução:**
1. Verificar CORS no backend
2. Verificar URLs das imagens
3. Usar placeholder se imagem falhar (já implementado)

### Problema: Detecção não funciona

**Solução:**
1. Adicionar mais palavras-chave em `PRODUCT_KEYWORDS`
2. Verificar se mensagem está em lowercase
3. Testar com `isProductSearch()` diretamente

---

## Customização

### Adicionar Mais Palavras-chave

```typescript
// Em productIntegrationService.ts
const PRODUCT_KEYWORDS = [
  // ... existentes ...
  'quero comprar',
  'preciso de',
  'me mostre',
  'lista de produtos',
];
```

### Alterar Limite de Produtos

```typescript
const results = await searchProducts(query, {
  limit: 50 // Aumentar para 50
});
```

### Adicionar Filtros

```typescript
// Filtrar apenas frete grátis
const freeShippingProducts = products.filter(p => p.shipping.free);

// Filtrar por preço máximo
const affordableProducts = products.filter(p => p.price <= 1000);
```

---

## Performance

### Cache

O sistema já usa cache de 1 hora. Para limpar:

```bash
POST http://localhost:3002/api/products/cache/clear
```

### Otimização de Imagens

As imagens são lazy-loaded automaticamente:

```typescript
<img loading="lazy" ... />
```

### Busca Paralela

As APIs são chamadas em paralelo automaticamente para melhor performance.

---

## ✅ Pronto!

Agora você tem um sistema completo de busca de produtos com:

- ✅ Detecção automática
- ✅ Busca em múltiplas APIs
- ✅ Exibição visual com imagens
- ✅ Links para compra
- ✅ Sem necessidade de cadastro

**Basta integrar no seu App.tsx e testar!** 🚀
