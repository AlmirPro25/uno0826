# 🔍 Sistema de Pesquisa Inteligente

## 🎯 Visão Geral

Sistema profissional de pesquisa web com modo toggle, detecção automática de tipo de pesquisa e integração com múltiplas fontes especializadas.

## ✨ Funcionalidades

### 1. Modo Toggle (Liga/Desliga)
- ✅ Clique no ícone 🔍 para ativar/desativar
- ✅ Quando ativo, TODAS as mensagens são pesquisadas
- ✅ Não precisa clicar em "Pesquisar" para cada mensagem
- ✅ Indicador visual claro (ícone azul pulsando)

### 2. Detecção Automática de Tipo
O sistema detecta automaticamente o que você está procurando:

#### 🛒 Pesquisa de Produtos/Compras
**Detecta quando você usa:**
- "comprar", "preço", "barato", "promoção", "desconto"
- "quanto custa", "onde comprar", "melhor preço"

**Fontes especializadas:**
- Amazon, Mercado Livre, Magazine Luiza
- Americanas, Casas Bahia, Extra
- Submarino, Shopee, AliExpress

**Otimizações:**
- Compara preços entre lojas
- Destaca melhores ofertas
- Menciona frete grátis
- Sugere alternativas

#### 📰 Pesquisa de Notícias
**Detecta quando você usa:**
- "notícia", "hoje", "aconteceu", "últimas"
- "breaking", "news", "atualidade"

**Fontes especializadas:**
- G1, UOL, Folha, Estadão
- BBC Portuguese, CNN Brasil
- Reuters, TecMundo

**Otimizações:**
- Resumo dos principais pontos
- Menciona datas
- Compara diferentes fontes
- Indica consenso ou divergência

#### 💻 Pesquisa Técnica/Programação
**Detecta quando você usa:**
- "código", "programação", "desenvolver", "API"
- "framework", "biblioteca", "tutorial"
- Linguagens: Python, JavaScript, React, etc.

**Fontes especializadas:**
- GitHub, Stack Overflow, Dev.to
- Medium, TechCrunch, The Verge
- Ars Technica, Canal Tech

**Otimizações:**
- Exemplos de código
- Links para documentação
- Versões e compatibilidade
- Melhores práticas

#### 🌐 Pesquisa Geral
Para tudo que não se encaixa nas categorias acima.

### 3. Otimização Inteligente de Queries
O sistema usa IA para otimizar sua pesquisa:

**Exemplo 1: Compras**
```
Você: "notebook gamer"
Sistema gera:
1. "notebook gamer preço"
2. "melhor notebook gamer 2024"
3. "notebook gamer barato"
```

**Exemplo 2: Notícias**
```
Você: "eleições"
Sistema gera:
1. "últimas notícias eleições"
2. "eleições 2024 resultados"
3. "notícias eleições hoje"
```

**Exemplo 3: Tech**
```
Você: "react hooks"
Sistema gera:
1. "react hooks tutorial"
2. "react hooks documentation"
3. "how to use react hooks"
```

### 4. Filtros de Site Especializados
O sistema adiciona automaticamente filtros para buscar nos melhores sites:

```
Pesquisa de produtos:
"notebook gamer (site:amazon.com.br OR site:mercadolivre.com.br OR site:magazineluiza.com.br)"

Pesquisa de notícias:
"eleições (site:g1.globo.com OR site:uol.com.br OR site:folha.uol.com.br)"
```

## 🎨 Interface

### Botão de Pesquisa

**Inativo:**
```
🔍 (cinza) - Clique para ativar modo pesquisa
```

**Ativo:**
```
🔍 (azul pulsando) - Modo pesquisa ativo
```

### Placeholder do Input

**Normal:**
```
"Pergunte qualquer coisa..."
```

**Modo Pesquisa Ativo:**
```
"🔍 Modo Pesquisa Ativo - Digite sua pesquisa..."
```

### Mensagem de Status

**Normal:**
```
"Gemini pode cometer erros. Considere verificar informações importantes."
```

**Modo Pesquisa Ativo:**
```
"🔍 Modo Pesquisa Ativo - Todas as mensagens serão pesquisadas na web"
```

## 🔄 Fluxo de Uso

### Modo Tradicional (Antes)
```
1. Digite sua pergunta
2. Clique no botão de pesquisa 🔍
3. Aguarde resultado
4. Para nova pesquisa, repita o processo
```

### Modo Toggle (Agora)
```
1. Clique no botão 🔍 para ativar modo pesquisa
2. Digite sua primeira pergunta
3. Pressione Enter (ou clique em enviar)
4. Digite segunda pergunta
5. Pressione Enter novamente
6. Continue pesquisando sem clicar em 🔍 novamente
7. Clique em 🔍 para desativar quando terminar
```

## 📊 Tipos de Resposta

### Pesquisa de Produtos
```markdown
**Notebook Gamer - Melhores Opções 2024**

Com base na pesquisa, encontrei as seguintes opções:

**1. Notebook Acer Nitro 5** 💰 R$ 4.299,00
- Intel Core i5, 16GB RAM, RTX 3050
- 🔗 [Amazon](link) | ⭐ 4.5/5
- ✅ Frete grátis

**2. Notebook Dell G15** 💰 R$ 4.599,00
- Intel Core i7, 16GB RAM, RTX 3060
- 🔗 [Magazine Luiza](link) | ⭐ 4.7/5

**Melhor custo-benefício:** Acer Nitro 5
**Melhor performance:** Dell G15

---
📚 Fontes Consultadas:
[1] [Amazon](link)
[2] [Magazine Luiza](link)

*🛒 Pesquisa de Produtos | 8 fontes analisadas*
```

### Pesquisa de Notícias
```markdown
**Últimas Notícias sobre Eleições 2024**

**Principais Pontos:**
- Resultado parcial mostra...
- Segundo turno confirmado em...
- Especialistas analisam...

**Fontes Consultadas:**
- G1: "..." (hoje, 14h)
- UOL: "..." (hoje, 15h)
- Folha: "..." (hoje, 16h)

**Consenso:** Todas as fontes concordam que...

---
📚 Fontes Consultadas:
[1] [G1](link)
[2] [UOL](link)

*📰 Pesquisa de Notícias | 6 fontes analisadas*
```

### Pesquisa Técnica
```markdown
**Como Usar React Hooks**

**Conceito:**
React Hooks são funções que permitem...

**Exemplo de Código:**
```javascript
import { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return <button onClick={() => setCount(count + 1)}>
    Click me
  </button>;
}
```

**Melhores Práticas:**
- Sempre use hooks no topo do componente
- Não use hooks dentro de loops ou condições
- Use useEffect para side effects

**Documentação Oficial:**
🔗 [React Hooks Documentation](link)

---
📚 Fontes Consultadas:
[1] [React Docs](link)
[2] [Stack Overflow](link)

*💻 Pesquisa Técnica | 5 fontes analisadas*
```

## 🏗️ Arquitetura

### Serviços

#### enhancedSearchService.ts
```typescript
- detectSearchType(query): 'shopping' | 'news' | 'tech' | 'general'
- optimizeQueryByType(query, type): string[]
- addSiteFilters(query, type): string
- enhancedSearch(query): EnhancedSearchResult[]
- generateEnhancedResponse(query): string
```

### Fluxo de Dados

```
1. Usuário ativa modo pesquisa (toggle)
2. Usuário digita e envia mensagem
3. App.tsx detecta isSearchMode = true
4. Chama handleWebSearch(query)
5. handleWebSearch importa enhancedSearchService
6. enhancedSearchService:
   a. Detecta tipo de pesquisa
   b. Otimiza queries
   c. Adiciona filtros de site
   d. Busca em múltiplas fontes
   e. Remove duplicatas
   f. Gera resposta com IA
7. Resposta exibida no chat
8. Usuário pode enviar nova pesquisa sem clicar em 🔍
```

## 🎯 Casos de Uso

### Caso 1: Comparar Preços
```
1. Ative modo pesquisa 🔍
2. Digite: "iPhone 15 Pro"
3. Sistema detecta: shopping
4. Busca em: Amazon, ML, Magazine Luiza
5. Compara preços automaticamente
6. Mostra melhor oferta
```

### Caso 2: Acompanhar Notícias
```
1. Ative modo pesquisa 🔍
2. Digite: "notícias tecnologia hoje"
3. Sistema detecta: news
4. Busca em: G1, UOL, TecMundo
5. Resume principais pontos
6. Indica fontes e horários
```

### Caso 3: Aprender Programação
```
1. Ative modo pesquisa 🔍
2. Digite: "como usar async await javascript"
3. Sistema detecta: tech
4. Busca em: MDN, Stack Overflow, Dev.to
5. Fornece exemplos de código
6. Links para documentação
```

## 📁 Arquivos

### Criados
- `src/services/enhancedSearchService.ts` - Serviço de pesquisa inteligente

### Modificados
- `src/App.tsx` - Estado isSearchMode e lógica de toggle
- `src/components/PromptInput.tsx` - Botão toggle e indicadores
- `src/components/ChatView.tsx` - Props de modo pesquisa

## ✅ Vantagens

### Antes
- ❌ Precisava clicar em pesquisar para cada busca
- ❌ Pesquisa genérica sem otimização
- ❌ Sem detecção de tipo
- ❌ Fontes limitadas

### Agora
- ✅ Modo toggle - ativa uma vez, pesquisa várias
- ✅ Detecção automática de tipo
- ✅ Queries otimizadas por IA
- ✅ Fontes especializadas por categoria
- ✅ Filtros automáticos de site
- ✅ Respostas personalizadas por tipo

## 🚀 Próximas Melhorias

Possíveis adições futuras:
- [ ] Histórico de pesquisas
- [ ] Salvar pesquisas favoritas
- [ ] Exportar resultados
- [ ] Comparação lado a lado
- [ ] Alertas de preço (produtos)
- [ ] RSS feeds (notícias)
- [ ] Snippets de código (tech)

---

**Status**: ✅ Implementado  
**Versão**: 2.0.0  
**Data**: Outubro 2025
