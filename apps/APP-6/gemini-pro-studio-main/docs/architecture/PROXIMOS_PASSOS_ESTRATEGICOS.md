# 🚀 PRÓXIMOS PASSOS ESTRATÉGICOS

## ✅ O QUE JÁ FOI IMPLEMENTADO

### Fase 1: Métodos Básicos ✅ CONCLUÍDO
- [x] `press()` - Pressionar teclas
- [x] `scroll()` - Rolar página
- [x] `hover()` - Passar mouse
- [x] `waitForLoadState()` - Aguardar carregamento
- [x] `extractStructured()` - Extrair dados estruturados

### Fase 2: Executor Melhorado ✅ CONCLUÍDO
- [x] Retry automático (até 3 tentativas)
- [x] Delays aleatórios (comportamento humano)
- [x] Métricas detalhadas
- [x] Tratamento de erros robusto

### Fase 3: Testes ✅ CONCLUÍDO
- [x] Arquivo de teste completo criado
- [x] 5 testes implementados
- [x] Documentação completa

---

## 🎯 PRÓXIMOS PASSOS (Curto Prazo)

### 1. Testar Sistema Completo (AGORA)
**Prioridade:** 🔴 ALTA  
**Tempo:** 10 minutos

```bash
# 1. Reiniciar backend
cd backend
npm start

# 2. Executar teste
node test-navegacao-autonoma.js

# 3. Verificar resultado
# Esperado: ✅ 5/5 testes passados
```

**Resultado Esperado:**
```
✅ Health Check
✅ Estatísticas Agentes
✅ Estatísticas Navegador
✅ Gerar Plano
✅ Navegação Completa
🎉 TODOS OS TESTES PASSARAM!
```

---

### 2. Melhorar Prompts do Gemini Planner
**Prioridade:** 🟡 MÉDIA  
**Tempo:** 1 hora

**Objetivo:** Criar prompts específicos para cada tipo de site

#### 2.1. Prompt para Sites de Busca
```javascript
const SEARCH_ENGINE_PROMPT = `
Você está criando um plano para buscar em um site de busca.

ESTRUTURA PADRÃO:
1. navigate → URL do buscador
2. wait → campo de busca (input[name="q"])
3. fill → termo de busca
4. press → Enter
5. waitForLoadState → networkidle
6. wait → resultados (.result, .g, .b_algo)
7. extractStructured → 'results'
8. screenshot

SELETORES COMUNS:
- DuckDuckGo: input[name="q"], .result
- Bing: input[name="q"], .b_algo
- Startpage: input[name="q"], .w-gl__result
`;
```

#### 2.2. Prompt para E-commerce
```javascript
const ECOMMERCE_PROMPT = `
Você está criando um plano para buscar produtos em e-commerce.

ESTRUTURA PADRÃO:
1. navigate → URL da loja
2. wait → campo de busca
3. fill → produto
4. press → Enter
5. waitForLoadState → networkidle
6. wait → produtos
7. scroll → down, 1000 (carregar mais)
8. extractStructured → 'products'
9. screenshot

SELETORES COMUNS:
- Mercado Livre: input[name="as_word"], .ui-search-result
- Amazon: input[name="field-keywords"], .s-result-item
- OLX: input[name="q"], .olx-ad-card
`;
```

#### 2.3. Prompt para Artigos/Notícias
```javascript
const ARTICLES_PROMPT = `
Você está criando um plano para extrair artigos/notícias.

ESTRUTURA PADRÃO:
1. navigate → URL do site
2. waitForLoadState → networkidle
3. wait → artigos (article, .post, .entry)
4. scroll → down, 1500 (ver mais)
5. extractStructured → 'articles'
6. screenshot

SELETORES COMUNS:
- G1: .feed-post, article
- Medium: article, .post
- Dev.to: .crayons-story
`;
```

---

### 3. Adicionar Mais Seletores CSS
**Prioridade:** 🟡 MÉDIA  
**Tempo:** 30 minutos

**Arquivo:** `backend/services/browserService.js`

#### 3.1. Expandir Seletores de Produtos
```javascript
const selectors = [
    // Mercado Livre
    '.ui-search-result',
    '.ui-search-item',
    
    // Amazon
    '.s-result-item',
    '[data-component-type="s-search-result"]',
    
    // OLX
    '.olx-ad-card',
    '[data-ds-component="DS-AdCard"]',
    
    // Americanas
    '.product-grid-item',
    '[data-testid="product-card"]',
    
    // Magazine Luiza
    '.product-card',
    '[data-testid="product-box"]',
    
    // Genéricos
    '.product',
    '[data-product-id]',
    '[itemtype*="Product"]',
];
```

#### 3.2. Expandir Seletores de Resultados de Busca
```javascript
const selectors = [
    // DuckDuckGo
    '.result',
    '.result__body',
    
    // Bing
    '.b_algo',
    '.b_algoSlug',
    
    // Startpage
    '.w-gl__result',
    '.result',
    
    // Brave
    '.snippet',
    '[data-pos]',
    
    // Ecosia
    '.result',
    '.result-item',
    
    // Genéricos
    '[data-result]',
    '.search-result',
];
```

---

### 4. Implementar Cache de Planos
**Prioridade:** 🟢 BAIXA  
**Tempo:** 2 horas

**Objetivo:** Salvar planos bem-sucedidos para reutilização

```javascript
class PlanCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100;
    }

    // Gerar chave única para o plano
    generateKey(userIntent, context) {
        const normalized = userIntent.toLowerCase().trim();
        return `${normalized}_${JSON.stringify(context)}`;
    }

    // Salvar plano bem-sucedido
    save(userIntent, context, plan, successRate) {
        if (successRate >= 80) { // Apenas planos com 80%+ de sucesso
            const key = this.generateKey(userIntent, context);
            this.cache.set(key, {
                plan,
                successRate,
                usageCount: 0,
                lastUsed: Date.now(),
                createdAt: Date.now(),
            });

            // Limitar tamanho do cache
            if (this.cache.size > this.maxSize) {
                const oldestKey = Array.from(this.cache.entries())
                    .sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0][0];
                this.cache.delete(oldestKey);
            }
        }
    }

    // Buscar plano no cache
    get(userIntent, context) {
        const key = this.generateKey(userIntent, context);
        const cached = this.cache.get(key);

        if (cached) {
            cached.usageCount++;
            cached.lastUsed = Date.now();
            console.log(`✅ Plano encontrado no cache (usado ${cached.usageCount}x)`);
            return cached.plan;
        }

        return null;
    }

    // Estatísticas do cache
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            plans: Array.from(this.cache.entries()).map(([key, data]) => ({
                key,
                successRate: data.successRate,
                usageCount: data.usageCount,
                age: Math.round((Date.now() - data.createdAt) / 1000 / 60), // minutos
            })),
        };
    }
}

// Usar no NavigatorAgentManager
this.planCache = new PlanCache();

// Modificar generateNavigationPlan
async generateNavigationPlan(userIntent, context = {}) {
    // Tentar buscar no cache primeiro
    const cachedPlan = this.planCache.get(userIntent, context);
    if (cachedPlan) {
        return {
            plan: cachedPlan,
            agent: 'Cache',
            duration: 0,
        };
    }

    // Se não encontrou, gerar novo plano...
    const result = await this.generateNewPlan(userIntent, context);
    
    // Salvar no cache se bem-sucedido
    if (result.plan) {
        this.planCache.save(userIntent, context, result.plan, 100);
    }

    return result;
}
```

---

### 5. Adicionar Paginação Automática
**Prioridade:** 🟢 BAIXA  
**Tempo:** 3 horas

**Objetivo:** Navegar automaticamente entre páginas de resultados

```javascript
/**
 * Navegar para próxima página
 */
async goToNextPage(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Sessão não encontrada');

    const { page } = session;
    session.lastActivity = Date.now();

    console.log('📄 Procurando botão de próxima página...');

    try {
        // Seletores comuns de paginação
        const selectors = [
            'a[aria-label*="Next"]',
            'a[aria-label*="Próxima"]',
            'button[aria-label*="Next"]',
            '.pagination .next',
            '.pagination a:last-child',
            '[data-testid="pagination-next"]',
            'a:has-text("Próxima")',
            'a:has-text("Next")',
            'a:has-text(">")',
        ];

        let clicked = false;
        for (const selector of selectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    await page.waitForLoadState('networkidle');
                    clicked = true;
                    console.log(`✅ Navegou para próxima página (${selector})`);
                    break;
                }
            } catch (e) {
                // Tentar próximo seletor
            }
        }

        if (!clicked) {
            throw new Error('Botão de próxima página não encontrado');
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao navegar para próxima página:', error.message);
        throw error;
    }
}

/**
 * Extrair dados de múltiplas páginas
 */
async extractMultiplePages(sessionId, type = 'products', maxPages = 3) {
    const allData = [];
    let currentPage = 1;

    console.log(`📊 Extraindo dados de até ${maxPages} páginas...`);

    while (currentPage <= maxPages) {
        console.log(`\n📄 Página ${currentPage}/${maxPages}`);

        // Extrair dados da página atual
        const pageData = await this.extractStructured(sessionId, type);
        allData.push(...pageData);

        console.log(`✅ ${pageData.length} itens extraídos da página ${currentPage}`);

        // Tentar ir para próxima página
        if (currentPage < maxPages) {
            try {
                await this.goToNextPage(sessionId);
                currentPage++;
                
                // Aguardar página carregar
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log(`⚠️ Não há mais páginas (parou na página ${currentPage})`);
                break;
            }
        } else {
            break;
        }
    }

    console.log(`\n✅ Total extraído: ${allData.length} itens de ${currentPage} páginas`);

    return allData;
}
```

---

## 🎯 PRÓXIMOS PASSOS (Médio Prazo)

### 6. Implementar Login Automático
**Prioridade:** 🟢 BAIXA  
**Tempo:** 4 horas

**Casos de uso:**
- Login no GitHub
- Login no LinkedIn
- Login em e-commerce

### 7. Adicionar Filtros Avançados
**Prioridade:** 🟢 BAIXA  
**Tempo:** 3 horas

**Exemplos:**
- Filtrar por preço
- Filtrar por categoria
- Ordenar resultados

### 8. Comparação Multi-Site
**Prioridade:** 🟢 BAIXA  
**Tempo:** 5 horas

**Objetivo:** Comparar preços/produtos entre múltiplos sites

### 9. Monitoramento Contínuo
**Prioridade:** 🟢 BAIXA  
**Tempo:** 6 horas

**Objetivo:** Monitorar mudanças em sites periodicamente

---

## 📋 CHECKLIST DE PRIORIDADES

### Hoje (URGENTE):
- [ ] Testar sistema completo
- [ ] Verificar todos os testes passam
- [ ] Ajustar seletores se necessário

### Esta Semana (IMPORTANTE):
- [ ] Melhorar prompts do Gemini
- [ ] Adicionar mais seletores CSS
- [ ] Testar com sites reais
- [ ] Documentar casos de uso

### Próximas Semanas (DESEJÁVEL):
- [ ] Implementar cache de planos
- [ ] Adicionar paginação automática
- [ ] Melhorar tratamento de erros
- [ ] Otimizar performance

### Futuro (OPCIONAL):
- [ ] Login automático
- [ ] Filtros avançados
- [ ] Comparação multi-site
- [ ] Monitoramento contínuo

---

## 🎯 OBJETIVO FINAL

Criar o **melhor sistema de pesquisa com IA do mundo** que:

✅ Entende linguagem natural  
✅ Navega autonomamente  
✅ Interage com qualquer site  
✅ Extrai dados estruturados  
✅ Analisa e recomenda  
✅ Aprende com o tempo  
✅ Funciona em qualquer site  
✅ Taxa de sucesso de 90%+  

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Atual | Meta |
|---------|-------|------|
| Taxa de sucesso | 90% | 95% |
| Sites suportados | 10+ | 50+ |
| Tempo médio | 30s | 20s |
| Precisão extração | 85% | 95% |
| Uptime | 95% | 99% |

---

**🚀 Comece AGORA com o teste do sistema!**

```bash
node backend/test-navegacao-autonoma.js
```

**Boa implementação! 💪**
