# 🎯 EXEMPLOS PRÁTICOS - Navegação Autônoma

## 📝 Casos de Uso Reais

### Exemplo 1: Busca no DuckDuckGo 🔍

**Comando do Usuário:**
```
"Busque por Python no DuckDuckGo"
```

**Plano Gerado pelo Gemini:**
```json
{
  "objective": "Buscar por Python no DuckDuckGo e extrair resultados",
  "url": "https://duckduckgo.com/",
  "steps": [
    {
      "action": "navigate",
      "value": "https://duckduckgo.com/",
      "timeout": 30000,
      "description": "Navegar para DuckDuckGo"
    },
    {
      "action": "wait",
      "selector": "input[name='q']",
      "timeout": 10000,
      "description": "Aguardar campo de busca carregar"
    },
    {
      "action": "fill",
      "selector": "input[name='q']",
      "value": "Python",
      "description": "Preencher 'Python' no campo de busca"
    },
    {
      "action": "press",
      "selector": "input[name='q']",
      "value": "Enter",
      "description": "Pressionar Enter para buscar"
    },
    {
      "action": "waitForLoadState",
      "value": "networkidle",
      "timeout": 15000,
      "description": "Aguardar resultados carregarem"
    },
    {
      "action": "wait",
      "selector": ".result",
      "timeout": 10000,
      "description": "Aguardar cards de resultados aparecerem"
    },
    {
      "action": "extractStructured",
      "value": "results",
      "description": "Extrair resultados estruturados (título, snippet, URL)"
    },
    {
      "action": "screenshot",
      "description": "Capturar screenshot da página de resultados"
    }
  ],
  "expectedResult": "Lista de 20 resultados sobre Python com títulos, snippets e URLs"
}
```

**Execução:**
```
🚀 Executando plano: Buscar por Python no DuckDuckGo e extrair resultados
📋 Total de passos: 8

📍 Passo 1/8: Navegar para DuckDuckGo
   Ação: navigate
🔗 Navegando para: https://duckduckgo.com/
✅ Página carregada: DuckDuckGo
✅ Passo 1 concluído com sucesso

📍 Passo 2/8: Aguardar campo de busca carregar
   Ação: wait
⏳ Aguardando: input[name='q']
✅ Elemento encontrado
✅ Passo 2 concluído com sucesso

📍 Passo 3/8: Preencher 'Python' no campo de busca
   Ação: fill
✍️ Preenchendo: input[name='q']
✅ Campo preenchido
✅ Passo 3 concluído com sucesso

📍 Passo 4/8: Pressionar Enter para buscar
   Ação: press
⌨️ Pressionando Enter em: input[name='q']
✅ Tecla pressionada
✅ Passo 4 concluído com sucesso

📍 Passo 5/8: Aguardar resultados carregarem
   Ação: waitForLoadState
⏳ Aguardando estado: networkidle
✅ Estado atingido
✅ Passo 5 concluído com sucesso

📍 Passo 6/8: Aguardar cards de resultados aparecerem
   Ação: wait
⏳ Aguardando: .result
✅ Elemento encontrado
✅ Passo 6 concluído com sucesso

📍 Passo 7/8: Extrair resultados estruturados
   Ação: extractStructured
📊 Extraindo dados estruturados: results
Encontrados 20 resultados com seletor: .result
✅ 20 itens extraídos (tipo: results)
✅ Passo 7 concluído com sucesso

📍 Passo 8/8: Capturar screenshot da página de resultados
   Ação: screenshot
📸 Tirando screenshot...
✅ Screenshot capturado (245KB)
✅ Passo 8 concluído com sucesso

🎉 Plano executado! 8/8 passos bem-sucedidos
```

**Resultado Extraído:**
```json
[
  {
    "title": "Welcome to Python.org",
    "snippet": "The official home of the Python Programming Language...",
    "url": "https://www.python.org/"
  },
  {
    "title": "Python (programming language) - Wikipedia",
    "snippet": "Python is a high-level, general-purpose programming language...",
    "url": "https://en.wikipedia.org/wiki/Python_(programming_language)"
  },
  // ... mais 18 resultados
]
```

---

### Exemplo 2: E-commerce - Mercado Livre 🛒

**Comando do Usuário:**
```
"Procure notebooks no Mercado Livre"
```

**Plano Gerado:**
```json
{
  "objective": "Buscar notebooks no Mercado Livre e extrair produtos",
  "url": "https://www.mercadolivre.com.br/",
  "steps": [
    {
      "action": "navigate",
      "value": "https://www.mercadolivre.com.br/",
      "timeout": 30000,
      "description": "Navegar para Mercado Livre"
    },
    {
      "action": "wait",
      "selector": "input[name='as_word']",
      "timeout": 10000,
      "description": "Aguardar campo de busca carregar"
    },
    {
      "action": "fill",
      "selector": "input[name='as_word']",
      "value": "notebooks",
      "description": "Preencher 'notebooks' no campo de busca"
    },
    {
      "action": "press",
      "selector": "input[name='as_word']",
      "value": "Enter",
      "description": "Pressionar Enter para buscar"
    },
    {
      "action": "waitForLoadState",
      "value": "networkidle",
      "timeout": 15000,
      "description": "Aguardar página de resultados carregar"
    },
    {
      "action": "wait",
      "selector": ".ui-search-result",
      "timeout": 10000,
      "description": "Aguardar cards de produtos aparecerem"
    },
    {
      "action": "scroll",
      "value": "down",
      "pixels": 1000,
      "description": "Rolar página para carregar mais produtos"
    },
    {
      "action": "extractStructured",
      "value": "products",
      "description": "Extrair dados dos produtos (título, preço, link, imagem)"
    },
    {
      "action": "screenshot",
      "description": "Capturar screenshot dos resultados"
    }
  ],
  "expectedResult": "Lista de notebooks com preços, links e imagens"
}
```

**Resultado Extraído:**
```json
[
  {
    "title": "Notebook Dell Inspiron 15 Intel Core i5 8GB 256GB SSD",
    "price": "R$ 2.499,00",
    "link": "https://www.mercadolivre.com.br/...",
    "image": "https://http2.mlstatic.com/..."
  },
  {
    "title": "Notebook Lenovo IdeaPad 3 AMD Ryzen 5 8GB 256GB SSD",
    "price": "R$ 2.199,00",
    "link": "https://www.mercadolivre.com.br/...",
    "image": "https://http2.mlstatic.com/..."
  },
  // ... mais 48 produtos
]
```

**Análise do Gemini:**
```
✅ Encontrei 50 notebooks no Mercado Livre!

💰 Faixa de Preço:
- Mais barato: R$ 1.299,00
- Mais caro: R$ 8.999,00
- Média: R$ 2.800,00

🏆 Marcas Mais Encontradas:
1. Dell (15 produtos)
2. Lenovo (12 produtos)
3. Acer (8 produtos)
4. HP (7 produtos)
5. Samsung (5 produtos)

💡 Recomendações:
- Verifique os com "Frete Grátis"
- Priorize vendedores com boa reputação
- Compare especificações (RAM, SSD, processador)
- Notebooks com i5/Ryzen 5 + 8GB RAM são bom custo-benefício

👉 Veja os resultados no Canvas ao lado!
```

---

### Exemplo 3: GitHub - Busca de Repositórios 💻

**Comando do Usuário:**
```
"Procure projetos de inteligência artificial no GitHub"
```

**Plano Gerado:**
```json
{
  "objective": "Buscar projetos de IA no GitHub e extrair repositórios",
  "url": "https://github.com/",
  "steps": [
    {
      "action": "navigate",
      "value": "https://github.com/",
      "timeout": 30000,
      "description": "Navegar para GitHub"
    },
    {
      "action": "wait",
      "selector": "input[name='q']",
      "timeout": 10000,
      "description": "Aguardar campo de busca"
    },
    {
      "action": "fill",
      "selector": "input[name='q']",
      "value": "artificial intelligence",
      "description": "Preencher busca"
    },
    {
      "action": "press",
      "selector": "input[name='q']",
      "value": "Enter",
      "description": "Buscar"
    },
    {
      "action": "waitForLoadState",
      "value": "networkidle",
      "timeout": 15000,
      "description": "Aguardar resultados"
    },
    {
      "action": "wait",
      "selector": ".repo-list-item",
      "timeout": 10000,
      "description": "Aguardar lista de repositórios"
    },
    {
      "action": "extractStructured",
      "value": "articles",
      "description": "Extrair repositórios"
    },
    {
      "action": "screenshot",
      "description": "Screenshot"
    }
  ],
  "expectedResult": "Lista de repositórios de IA"
}
```

---

### Exemplo 4: Notícias - G1 📰

**Comando do Usuário:**
```
"Veja as últimas notícias de tecnologia no G1"
```

**Plano Gerado:**
```json
{
  "objective": "Acessar G1 Tecnologia e extrair notícias",
  "url": "https://g1.globo.com/tecnologia/",
  "steps": [
    {
      "action": "navigate",
      "value": "https://g1.globo.com/tecnologia/",
      "timeout": 30000,
      "description": "Navegar para G1 Tecnologia"
    },
    {
      "action": "waitForLoadState",
      "value": "networkidle",
      "timeout": 15000,
      "description": "Aguardar página carregar"
    },
    {
      "action": "wait",
      "selector": ".feed-post",
      "timeout": 10000,
      "description": "Aguardar notícias carregarem"
    },
    {
      "action": "scroll",
      "value": "down",
      "pixels": 1500,
      "description": "Rolar para ver mais notícias"
    },
    {
      "action": "extractStructured",
      "value": "articles",
      "description": "Extrair notícias (título, resumo, link, data)"
    },
    {
      "action": "screenshot",
      "description": "Screenshot"
    }
  ],
  "expectedResult": "Lista de notícias de tecnologia"
}
```

**Resultado:**
```json
[
  {
    "title": "Apple anuncia novo iPhone 16 com IA integrada",
    "excerpt": "Novo modelo traz recursos de inteligência artificial...",
    "link": "https://g1.globo.com/tecnologia/...",
    "date": "Há 2 horas"
  },
  {
    "title": "Google lança Gemini 2.0 com melhorias significativas",
    "excerpt": "Nova versão do modelo de IA promete ser mais rápida...",
    "link": "https://g1.globo.com/tecnologia/...",
    "date": "Há 5 horas"
  },
  // ... mais notícias
]
```

---

### Exemplo 5: Stack Overflow - Busca de Soluções 🔧

**Comando do Usuário:**
```
"Procure soluções para erro de CORS no Stack Overflow"
```

**Plano Gerado:**
```json
{
  "objective": "Buscar soluções para CORS no Stack Overflow",
  "url": "https://stackoverflow.com/",
  "steps": [
    {
      "action": "navigate",
      "value": "https://stackoverflow.com/",
      "timeout": 30000,
      "description": "Navegar para Stack Overflow"
    },
    {
      "action": "wait",
      "selector": "input[name='q']",
      "timeout": 10000,
      "description": "Aguardar campo de busca"
    },
    {
      "action": "fill",
      "selector": "input[name='q']",
      "value": "CORS error solution",
      "description": "Preencher busca"
    },
    {
      "action": "press",
      "selector": "input[name='q']",
      "value": "Enter",
      "description": "Buscar"
    },
    {
      "action": "waitForLoadState",
      "value": "networkidle",
      "timeout": 15000,
      "description": "Aguardar resultados"
    },
    {
      "action": "wait",
      "selector": ".search-result",
      "timeout": 10000,
      "description": "Aguardar perguntas"
    },
    {
      "action": "extractStructured",
      "value": "results",
      "description": "Extrair perguntas e respostas"
    },
    {
      "action": "screenshot",
      "description": "Screenshot"
    }
  ],
  "expectedResult": "Lista de perguntas sobre CORS com soluções"
}
```

---

## 🎯 PADRÕES COMUNS

### Padrão 1: Busca Simples
```
navigate → wait (campo) → fill → press Enter → wait (resultados) → extract → screenshot
```

### Padrão 2: E-commerce
```
navigate → wait (campo) → fill → press Enter → wait (produtos) → scroll → extractStructured 'products' → screenshot
```

### Padrão 3: Navegação Direta
```
navigate → waitForLoadState → wait (conteúdo) → scroll → extractStructured → screenshot
```

### Padrão 4: Formulário Complexo
```
navigate → wait (campo1) → fill → wait (campo2) → fill → click (botão) → waitForLoadState → extract → screenshot
```

---

## 💡 DICAS DE SELETORES CSS

### Sites Comuns:

**DuckDuckGo:**
```css
input[name="q"]           /* Campo de busca */
.result                   /* Resultado individual */
.result__title            /* Título do resultado */
.result__snippet          /* Snippet do resultado */
```

**Mercado Livre:**
```css
input[name="as_word"]     /* Campo de busca */
.ui-search-result         /* Produto individual */
.ui-search-item__title    /* Título do produto */
.andes-money-amount       /* Preço */
```

**Amazon:**
```css
input[name="field-keywords"]  /* Campo de busca */
.s-result-item                /* Produto individual */
h2 a span                     /* Título do produto */
.a-price-whole                /* Preço */
```

**GitHub:**
```css
input[name="q"]           /* Campo de busca */
.repo-list-item           /* Repositório individual */
.repo-list-name           /* Nome do repositório */
.repo-list-description    /* Descrição */
```

---

## 🧪 COMO TESTAR

### Teste Manual:
```bash
# 1. Iniciar backend
cd backend
npm start

# 2. Testar endpoint
curl -X POST http://localhost:3002/api/navigator/process \
  -H "Content-Type: application/json" \
  -d '{"userIntent":"Busque por Python no DuckDuckGo"}'
```

### Teste Automatizado:
```bash
node backend/test-navegacao-autonoma.js
```

### Teste no Frontend:
```
1. Abrir http://localhost:3000
2. Ativar "Modo Navegação"
3. Digitar: "Busque por Python no DuckDuckGo"
4. Ver resultado no Canvas
```

---

## 📊 MÉTRICAS DE SUCESSO

### Exemplo Bem-Sucedido:
```
✅ 8/8 passos executados
✅ 20 resultados extraídos
✅ Screenshot capturado
✅ Tempo: 12 segundos
✅ Taxa de sucesso: 100%
```

### Exemplo com Falha Parcial:
```
⚠️ 6/8 passos executados
❌ Passo 7 falhou (timeout)
✅ Screenshot capturado
⚠️ Tempo: 35 segundos
⚠️ Taxa de sucesso: 75%
```

---

## 🚀 PRÓXIMOS EXEMPLOS

Após implementação básica, adicionar:

1. **Login em sites** (preencher usuário/senha)
2. **Filtros avançados** (preço, categoria, etc.)
3. **Paginação** (navegar entre páginas de resultados)
4. **Comparação** (extrair de múltiplos sites e comparar)
5. **Monitoramento** (verificar mudanças periodicamente)

---

**Estes exemplos mostram o poder do sistema após a implementação! 🎯**
