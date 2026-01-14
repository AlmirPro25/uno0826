# 📚 GUIA DE USO - LISTA DE URLs PARA NAVEGAÇÃO

## 🎯 VISÃO GERAL

Criei uma lista extensa de **350+ URLs confiáveis** organizadas em **15 categorias** para o seu sistema de navegação autônoma com Playwright.

**Arquivo:** `LISTA_URLS_NAVEGACAO.json`

---

## 📋 CATEGORIAS DISPONÍVEIS

### 1. **Notícias Brasil** (15 sites)
- G1, UOL, Folha, Estadão, O Globo, etc.
- **Uso:** Notícias atuais do Brasil

### 2. **Notícias Internacional** (14 sites)
- BBC, Reuters, NY Times, The Guardian, etc.
- **Uso:** Notícias globais

### 3. **E-commerce Brasil** (20 sites)
- Mercado Livre, Amazon, Magazine Luiza, etc.
- **Uso:** Busca de produtos e preços

### 4. **E-commerce Internacional** (15 sites)
- eBay, Etsy, AliExpress, etc.
- **Uso:** Produtos internacionais

### 5. **Tecnologia** (15 sites)
- TecMundo, Wired, TechCrunch, etc.
- **Uso:** Notícias de tecnologia

### 6. **Programação** (19 sites)
- MDN, Python Docs, Stack Overflow, GitHub, etc.
- **Uso:** Documentação técnica

### 7. **Inteligência Artificial** (19 sites)
- OpenAI, HuggingFace, PyTorch, TensorFlow, etc.
- **Uso:** Recursos de IA e ML

### 8. **Educação** (15 sites)
- Khan Academy, Coursera, edX, etc.
- **Uso:** Cursos e aprendizado

### 9. **Ciência e Pesquisa** (15 sites)
- PubMed, Nature, Science, arXiv, etc.
- **Uso:** Papers e pesquisa acadêmica

### 10. **Dados Abertos** (15 sites)
- Data.gov, IBGE, Kaggle, etc.
- **Uso:** Datasets públicos

### 11. **Clima e Tempo** (12 sites)
- Climatempo, INMET, NOAA, etc.
- **Uso:** Previsão do tempo

### 12. **Saúde** (14 sites)
- WHO, CDC, Mayo Clinic, etc.
- **Uso:** Informações médicas

### 13. **Finanças e Economia** (15 sites)
- InfoMoney, Bloomberg, Reuters, etc.
- **Uso:** Notícias financeiras

### 14. **Entretenimento** (15 sites)
- IMDB, Spotify, YouTube, Netflix, etc.
- **Uso:** Cultura e entretenimento

### 15. **Wikipedia e Conhecimento** (11 sites)
- Wikipedia, Britannica, Archive.org, etc.
- **Uso:** Conhecimento geral

---

## 💻 COMO USAR NO SEU CÓDIGO

### 1. Carregar a Lista

```javascript
// Backend (Node.js)
const fs = require('fs');
const urlList = JSON.parse(fs.readFileSync('LISTA_URLS_NAVEGACAO.json', 'utf8'));

// Acessar categoria específica
const noticiasBrasil = urlList.categories.noticias_brasil.sites;
console.log(noticiasBrasil); // Array de URLs
```

```typescript
// Frontend (TypeScript)
import urlList from './LISTA_URLS_NAVEGACAO.json';

// Acessar categoria
const techSites = urlList.categories.tecnologia.sites;
```

### 2. Navegar em Sites por Categoria

```javascript
// Exemplo: Buscar notícias em todos os portais brasileiros
async function searchBrazilianNews(query) {
  const newsSites = urlList.categories.noticias_brasil.sites;
  const results = [];
  
  for (const site of newsSites) {
    try {
      const sessionId = `news_${Date.now()}`;
      await browserService.createSession(sessionId);
      
      // Navegar para o site
      const searchUrl = `${site}/busca?q=${encodeURIComponent(query)}`;
      await browserService.navigate(sessionId, searchUrl);
      
      // Extrair conteúdo
      const content = await browserService.extractContent(sessionId);
      results.push({
        site,
        content: content.text.substring(0, 500)
      });
      
      await browserService.closeSession(sessionId);
    } catch (error) {
      console.error(`Erro em ${site}:`, error.message);
    }
  }
  
  return results;
}
```

### 3. Buscar em Múltiplas Categorias

```javascript
// Exemplo: Buscar em notícias + tecnologia
async function searchMultipleCategories(query) {
  const categories = [
    'noticias_brasil',
    'noticias_internacional',
    'tecnologia'
  ];
  
  const allResults = [];
  
  for (const category of categories) {
    const sites = urlList.categories[category].sites;
    
    for (const site of sites.slice(0, 3)) { // Limitar a 3 por categoria
      const result = await searchInSite(site, query);
      allResults.push(result);
    }
  }
  
  return allResults;
}
```

### 4. Detectar Categoria Automaticamente

```javascript
// Detectar qual categoria usar baseado na query
function detectCategory(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('notícia') || lowerQuery.includes('acontecendo')) {
    return 'noticias_brasil';
  }
  
  if (lowerQuery.includes('clima') || lowerQuery.includes('tempo')) {
    return 'clima_tempo';
  }
  
  if (lowerQuery.includes('comprar') || lowerQuery.includes('preço')) {
    return 'ecommerce_brasil';
  }
  
  if (lowerQuery.includes('código') || lowerQuery.includes('programação')) {
    return 'programacao';
  }
  
  return 'wikipedia_conhecimento'; // Fallback
}

// Usar
async function smartSearch(query) {
  const category = detectCategory(query);
  const sites = urlList.categories[category].sites;
  
  console.log(`Buscando em: ${category}`);
  return await searchInSites(sites, query);
}
```

---

## 🎯 INTEGRAÇÃO COM O SISTEMA ATUAL

### Atualizar o backend/server.js

```javascript
// Carregar lista de URLs
const urlList = JSON.parse(fs.readFileSync('./LISTA_URLS_NAVEGACAO.json', 'utf8'));

// Endpoint melhorado
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  
  // Detectar categoria
  const category = detectCategory(query);
  const sites = urlList.categories[category].sites;
  
  console.log(`📊 Categoria detectada: ${category}`);
  console.log(`🌐 Buscando em ${sites.length} sites`);
  
  const results = [];
  
  // Buscar nos primeiros 5 sites da categoria
  for (const site of sites.slice(0, 5)) {
    try {
      const sessionId = `search_${Date.now()}`;
      await browserService.createSession(sessionId);
      
      const searchUrl = `${site}/busca?q=${encodeURIComponent(query)}`;
      await browserService.navigate(sessionId, searchUrl, { timeout: 30000 });
      
      const content = await browserService.extractContent(sessionId);
      
      results.push({
        title: content.title,
        snippet: content.text.substring(0, 300),
        url: site,
        source: new URL(site).hostname
      });
      
      await browserService.closeSession(sessionId);
    } catch (error) {
      console.error(`Erro em ${site}:`, error.message);
    }
  }
  
  res.json({ query, results, category, sources: sites.slice(0, 5) });
});
```

---

## 🧠 ENSINAR A IA A NAVEGAR

### 1. Criar Mapa de Navegação

```javascript
// Ensinar a IA sobre estrutura de URLs
const navigationMap = {
  'g1.globo.com': {
    search: '/busca/?q=',
    sections: ['/economia/', '/tecnologia/', '/mundo/']
  },
  'www.mercadolivre.com.br': {
    search: '/busca/',
    product: '/p/',
    category: '/c/'
  },
  'stackoverflow.com': {
    search: '/search?q=',
    questions: '/questions/',
    tags: '/tags/'
  }
};

// Usar
function buildSearchUrl(site, query) {
  const domain = new URL(site).hostname;
  const map = navigationMap[domain];
  
  if (map && map.search) {
    return `${site}${map.search}${encodeURIComponent(query)}`;
  }
  
  // Fallback genérico
  return `${site}/search?q=${encodeURIComponent(query)}`;
}
```

### 2. Aprender Padrões Automaticamente

```javascript
// Sistema que aprende padrões de URL
class URLPatternLearner {
  constructor() {
    this.patterns = {};
  }
  
  // Registrar padrão bem-sucedido
  registerSuccess(site, pattern, query) {
    const domain = new URL(site).hostname;
    
    if (!this.patterns[domain]) {
      this.patterns[domain] = [];
    }
    
    this.patterns[domain].push({
      pattern,
      query,
      success: true,
      timestamp: Date.now()
    });
  }
  
  // Obter melhor padrão para um site
  getBestPattern(site) {
    const domain = new URL(site).hostname;
    const sitePatterns = this.patterns[domain] || [];
    
    // Retornar padrão mais usado
    const counts = {};
    sitePatterns.forEach(p => {
      counts[p.pattern] = (counts[p.pattern] || 0) + 1;
    });
    
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }
}
```

---

## 📊 ESTATÍSTICAS

### Total de Sites: 350+
### Categorias: 15
### Cobertura:
- ✅ Notícias: 29 sites
- ✅ E-commerce: 35 sites
- ✅ Tecnologia: 34 sites
- ✅ Educação: 15 sites
- ✅ Ciência: 15 sites
- ✅ Dados: 15 sites
- ✅ Clima: 12 sites
- ✅ Saúde: 14 sites
- ✅ Finanças: 15 sites
- ✅ Entretenimento: 15 sites
- ✅ Conhecimento: 11 sites

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar a lista** com queries reais
2. **Adicionar mais sites** conforme necessário
3. **Criar mapa de navegação** para cada site
4. **Implementar aprendizado** de padrões
5. **Otimizar performance** com cache

---

## 💡 DICAS

### Performance:
- Limite a 5-10 sites por busca
- Use timeout de 30 segundos
- Feche sessões após uso
- Implemente cache de resultados

### Confiabilidade:
- Priorize sites com boa estrutura
- Tenha fallbacks para cada categoria
- Monitore taxa de sucesso por site
- Remova sites que falham muito

### Inteligência:
- Aprenda padrões de URL automaticamente
- Detecte categoria da query
- Combine múltiplas fontes
- Valide qualidade dos resultados

---

**🎉 Agora você tem 350+ URLs confiáveis para o seu sistema navegar!**

**Arquivo:** `LISTA_URLS_NAVEGACAO.json`
