# 🤖 IMPLEMENTAÇÃO: Navegação Autônoma Completa

## 🎯 OBJETIVO

Transformar o sistema de navegação atual (que apenas carrega páginas) em um sistema AUTÔNOMO que:
- ✅ Interage com elementos (clica, preenche, rola)
- ✅ Navega entre páginas
- ✅ Extrai dados estruturados
- ✅ Executa ações complexas

---

## 📦 ARQUIVOS QUE SERÃO MODIFICADOS

```
backend/services/
├── browserService.js          ← EXPANDIR (adicionar 5 novos métodos)
└── navigatorAgentService.js   ← MELHORAR (prompt + executor)

src/services/
├── browserService.ts          ← ATUALIZAR (tipos TypeScript)
└── navigatorAgentService.ts   ← ATUALIZAR (tipos TypeScript)
```

---

## 🔧 IMPLEMENTAÇÃO PASSO A PASSO

### PASSO 1: Expandir BrowserService Backend

#### Arquivo: `backend/services/browserService.js`

**Adicionar ANTES do método `close()`:**

```javascript
    /**
     * Pressionar tecla
     */
    async press(sessionId, selector, key) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`⌨️ Pressionando ${key} em: ${selector}`);

        try {
            await page.press(selector, key);
            console.log('✅ Tecla pressionada');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao pressionar tecla:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Rolar página
     */
    async scroll(sessionId, direction = 'down', pixels = 500) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`📜 Rolando página: ${direction} ${pixels}px`);

        try {
            await page.evaluate((dir, px) => {
                window.scrollBy(0, dir === 'down' ? px : -px);
            }, direction, pixels);
            
            // Aguardar conteúdo carregar
            await page.waitForTimeout(1000);
            
            console.log('✅ Página rolada');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao rolar página:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Passar mouse sobre elemento
     */
    async hover(sessionId, selector) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`🖱️ Passando mouse sobre: ${selector}`);

        try {
            await page.hover(selector);
            console.log('✅ Mouse posicionado');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao passar mouse:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Aguardar estado de carregamento
     */
    async waitForLoadState(sessionId, state = 'networkidle', timeout = 30000) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`⏳ Aguardando estado: ${state}`);

        try {
            await page.waitForLoadState(state, { timeout });
            console.log('✅ Estado atingido');
            return { success: true };
        } catch (error) {
            console.error('❌ Timeout ao aguardar estado:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Extrair dados estruturados (produtos, artigos, resultados de busca)
     */
    async extractStructured(sessionId, type = 'products') {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Sessão não encontrada');

        const { page } = session;
        session.lastActivity = Date.now();

        console.log(`📊 Extraindo dados estruturados: ${type}`);

        try {
            let data;

            switch (type) {
                case 'products':
                    data = await page.evaluate(() => {
                        const products = [];
                        
                        // Tentar múltiplos seletores comuns de e-commerce
                        const selectors = [
                            '.ui-search-result',           // Mercado Livre
                            '.s-result-item',              // Amazon
                            '.product-card',               // Genérico
                            '[data-product-id]',           // Genérico
                            '.item',                       // Genérico
                            '[data-testid="product"]',     // Genérico
                        ];

                        let productElements = [];
                        for (const selector of selectors) {
                            productElements = document.querySelectorAll(selector);
                            if (productElements.length > 0) {
                                console.log(`Encontrados ${productElements.length} produtos com seletor: ${selector}`);
                                break;
                            }
                        }

                        productElements.forEach((el, index) => {
                            if (index >= 50) return; // Limitar a 50 produtos

                            // Extrair informações com múltiplos seletores
                            const titleEl = el.querySelector('h2, h3, .product-title, [class*="title"], .ui-search-item__title');
                            const priceEl = el.querySelector('.price, [class*="price"], .andes-money-amount, [class*="Price"]');
                            const linkEl = el.querySelector('a');
                            const imageEl = el.querySelector('img');

                            if (titleEl || priceEl) {
                                products.push({
                                    title: titleEl?.innerText?.trim() || '',
                                    price: priceEl?.innerText?.trim() || '',
                                    link: linkEl?.href || '',
                                    image: imageEl?.src || '',
                                });
                            }
                        });

                        return products;
                    });
                    break;

                case 'articles':
                    data = await page.evaluate(() => {
                        const articles = [];
                        const articleElements = document.querySelectorAll('article, .article, .post, [class*="article"], .entry');

                        articleElements.forEach((el, index) => {
                            if (index >= 20) return;

                            const titleEl = el.querySelector('h1, h2, h3, .title, .entry-title');
                            const excerptEl = el.querySelector('.excerpt, .summary, p');
                            const linkEl = el.querySelector('a');
                            const dateEl = el.querySelector('time, .date, [class*="date"]');

                            if (titleEl) {
                                articles.push({
                                    title: titleEl.innerText.trim(),
                                    excerpt: excerptEl?.innerText?.trim() || '',
                                    link: linkEl?.href || '',
                                    date: dateEl?.innerText?.trim() || '',
                                });
                            }
                        });

                        return articles;
                    });
                    break;

                case 'results':
                    data = await page.evaluate(() => {
                        const results = [];
                        
                        // Seletores para resultados de busca
                        const selectors = [
                            '.result',                    // DuckDuckGo
                            '.g',                         // Google (se funcionar)
                            '.b_algo',                    // Bing
                            '[data-result]',              // Genérico
                            '.search-result',             // Genérico
                        ];

                        let resultElements = [];
                        for (const selector of selectors) {
                            resultElements = document.querySelectorAll(selector);
                            if (resultElements.length > 0) {
                                console.log(`Encontrados ${resultElements.length} resultados com seletor: ${selector}`);
                                break;
                            }
                        }

                        resultElements.forEach((el, index) => {
                            if (index >= 20) return;

                            const titleEl = el.querySelector('h2, h3, .result__title, .result__a');
                            const snippetEl = el.querySelector('.result__snippet, .b_caption, .VwiC3b, p');
                            const linkEl = el.querySelector('a');

                            if (titleEl) {
                                results.push({
                                    title: titleEl.innerText.trim(),
                                    snippet: snippetEl?.innerText?.trim() || '',
                                    url: linkEl?.href || '',
                                });
                            }
                        });

                        return results;
                    });
                    break;

                default:
                    throw new Error(`Tipo não suportado: ${type}`);
            }

            console.log(`✅ ${data.length} itens extraídos (tipo: ${type})`);
            
            // Atualizar métricas
            this.metrics.totalExtractions++;
            
            return data;
        } catch (error) {
            console.error('❌ Erro ao extrair dados estruturados:', error.message);
            this.metrics.errors++;
            throw error;
        }
    }
```

---

### PASSO 2: Melhorar NavigatorAgentService Backend

#### Arquivo: `backend/services/navigatorAgentService.js`

**SUBSTITUIR o método `generateNavigationPlan()` por:**

```javascript
    /**
     * Gerar plano de navegação MELHORADO
     */
    async generateNavigationPlan(userIntent, context = {}) {
        const { key, agent } = this.selectAgent();
        const startTime = Date.now();

        try {
            const model = this.genAI.getGenerativeModel({ model: agent.model });

            const prompt = `Você é um agente de navegação web AVANÇADO especializado em criar planos de ação DETALHADOS e ESPECÍFICOS para automação com Playwright.

INTENÇÃO DO USUÁRIO:
"${userIntent}"

CONTEXTO:
${JSON.stringify(context, null, 2)}

AÇÕES DISPONÍVEIS:
1. navigate - Navegar para URL
2. wait - Aguardar elemento (selector) ou tempo (timeout em ms)
3. click - Clicar em elemento (selector)
4. fill - Preencher campo (selector, value)
5. press - Pressionar tecla (selector, key: 'Enter', 'Tab', etc.)
6. scroll - Rolar página (value: 'down'|'up', pixels: número)
7. hover - Passar mouse sobre elemento (selector)
8. waitForLoadState - Aguardar carregamento (value: 'load'|'networkidle'|'domcontentloaded')
9. extract - Extrair conteúdo geral da página
10. extractStructured - Extrair dados estruturados (value: 'products'|'articles'|'results')
11. screenshot - Tirar screenshot da página

REGRAS CRÍTICAS:
1. SEMPRE aguarde elementos antes de interagir (use wait com selector)
2. Use waitForLoadState após ações que causam navegação
3. Para sites de busca: navigate → wait (campo) → fill → press Enter → waitForLoadState → wait (resultados) → extractStructured
4. Para e-commerce: navigate → wait (campo) → fill → press Enter → waitForLoadState → wait (produtos) → extractStructured 'products'
5. Seja ESPECÍFICO nos seletores CSS (use classes, IDs, atributos)
6. Adicione timeouts adequados: 5-10s para elementos, 30s para navegação
7. Use extractStructured quando possível (melhor que extract genérico)

SITES DE BUSCA QUE FUNCIONAM:
- DuckDuckGo: https://duckduckgo.com/ (campo: input[name="q"])
- Bing: https://www.bing.com/ (campo: input[name="q"])
- Startpage: https://www.startpage.com/ (campo: input[name="q"])

E-COMMERCE BRASILEIRO:
- Mercado Livre: https://www.mercadolivre.com.br/ (campo: input[name="as_word"])
- Amazon BR: https://www.amazon.com.br/ (campo: input[name="field-keywords"])

EXEMPLO DE PLANO PERFEITO:
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
      "description": "Aguardar página de resultados carregar completamente"
    },
    {
      "action": "wait",
      "selector": ".ui-search-result",
      "timeout": 10000,
      "description": "Aguardar cards de produtos aparecerem"
    },
    {
      "action": "extractStructured",
      "value": "products",
      "description": "Extrair dados estruturados dos produtos (título, preço, link, imagem)"
    },
    {
      "action": "screenshot",
      "description": "Capturar screenshot da página de resultados"
    }
  ],
  "expectedResult": "Lista de notebooks com preços, links e imagens do Mercado Livre"
}

AGORA CRIE UM PLANO DETALHADO PARA A INTENÇÃO DO USUÁRIO.

FORMATO DE RESPOSTA (JSON):
{
  "objective": "Descrição clara do objetivo",
  "url": "URL inicial para navegar",
  "steps": [
    {
      "action": "nome_da_acao",
      "selector": "seletor CSS (se aplicável)",
      "value": "valor (se aplicável)",
      "timeout": número_em_ms,
      "pixels": número (apenas para scroll),
      "description": "Descrição clara do que este passo faz"
    }
  ],
  "expectedResult": "O que esperar ao final da execução"
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Extrair JSON da resposta
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta não contém JSON válido');
            }

            const plan = JSON.parse(jsonMatch[0]);

            // Validar plano
            if (!plan.objective || !plan.steps || !Array.isArray(plan.steps)) {
                throw new Error('Plano inválido: faltam campos obrigatórios');
            }

            // Registrar sucesso
            this.registerCall(key, true);
            this.metrics.plansGenerated++;

            const duration = Date.now() - startTime;
            this.updateAvgResponseTime(duration);

            console.log(`✅ Plano gerado por ${agent.name} em ${duration}ms`);
            console.log(`📋 Plano: ${plan.steps.length} passos para "${plan.objective}"`);

            return {
                plan,
                agent: agent.name,
                duration,
            };
        } catch (error) {
            this.registerCall(key, false);
            console.error(`❌ Erro ao gerar plano com ${agent.name}:`, error.message);
            throw error;
        }
    }
```

**SUBSTITUIR o método `executePlan()` por:**

```javascript
    /**
     * Executar plano de navegação MELHORADO
     */
    async executePlan(plan, sessionId, onProgress) {
        console.log(`🚀 Executando plano: ${plan.objective}`);
        console.log(`📋 Total de passos: ${plan.steps.length}`);

        const results = [];

        try {
            for (let i = 0; i < plan.steps.length; i++) {
                const step = plan.steps[i];
                const stepNumber = i + 1;

                console.log(`\n📍 Passo ${stepNumber}/${plan.steps.length}: ${step.description}`);
                console.log(`   Ação: ${step.action}`);

                // Callback de progresso
                if (onProgress) {
                    onProgress({
                        step: stepNumber,
                        total: plan.steps.length,
                        action: step.action,
                        description: step.description,
                    });
                }

                let result;

                try {
                    switch (step.action) {
                        case 'navigate':
                            result = await browserService.navigate(sessionId, step.value || plan.url, {
                                timeout: step.timeout || 30000,
                                waitUntil: 'networkidle',
                            });
                            break;

                        case 'wait':
                            if (step.selector) {
                                result = await browserService.waitForSelector(
                                    sessionId,
                                    step.selector,
                                    step.timeout || 10000
                                );
                            } else {
                                await new Promise((resolve) => setTimeout(resolve, step.timeout || 1000));
                                result = { success: true };
                            }
                            break;

                        case 'click':
                            result = await browserService.click(sessionId, step.selector);
                            break;

                        case 'fill':
                            result = await browserService.fill(sessionId, step.selector, step.value);
                            break;

                        case 'press':
                            result = await browserService.press(sessionId, step.selector, step.value);
                            break;

                        case 'scroll':
                            result = await browserService.scroll(sessionId, step.value, step.pixels || 500);
                            break;

                        case 'hover':
                            result = await browserService.hover(sessionId, step.selector);
                            break;

                        case 'waitForLoadState':
                            result = await browserService.waitForLoadState(
                                sessionId,
                                step.value || 'networkidle',
                                step.timeout || 30000
                            );
                            break;

                        case 'extract':
                            result = await browserService.extractContent(sessionId, {
                                includeText: true,
                                includeLinks: true,
                                includeImages: true,
                            });
                            break;

                        case 'extractStructured':
                            result = await browserService.extractStructured(sessionId, step.value || 'products');
                            break;

                        case 'screenshot':
                            result = await browserService.screenshot(sessionId, {
                                type: 'jpeg',
                                quality: 70,
                            });
                            break;

                        default:
                            console.warn(`⚠️ Ação desconhecida: ${step.action}`);
                            result = { success: false, error: 'Ação desconhecida' };
                    }

                    results.push({
                        step: stepNumber,
                        action: step.action,
                        description: step.description,
                        result,
                        success: result.success !== false,
                    });

                    console.log(`✅ Passo ${stepNumber} concluído com sucesso`);

                } catch (stepError) {
                    console.error(`❌ Erro no passo ${stepNumber}:`, stepError.message);
                    
                    results.push({
                        step: stepNumber,
                        action: step.action,
                        description: step.description,
                        result: { success: false, error: stepError.message },
                        success: false,
                    });

                    // Decidir se continua ou para
                    // Por enquanto, continua mesmo com erro
                    console.log(`⚠️ Continuando apesar do erro...`);
                }

                // Delay entre passos para parecer mais humano
                if (i < plan.steps.length - 1) {
                    const delay = Math.random() * 1000 + 500; // 500-1500ms
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }

            this.metrics.plansExecuted++;

            const successfulSteps = results.filter(r => r.success).length;
            console.log(`\n🎉 Plano executado! ${successfulSteps}/${results.length} passos bem-sucedidos`);

            return {
                success: successfulSteps > 0,
                objective: plan.objective,
                results,
                expectedResult: plan.expectedResult,
                successRate: (successfulSteps / results.length) * 100,
            };
        } catch (error) {
            console.error('❌ Erro crítico ao executar plano:', error);
            return {
                success: false,
                objective: plan.objective,
                results,
                error: error.message,
            };
        }
    }
```

---

### PASSO 3: Adicionar Rotas no Server

#### Arquivo: `backend/server.js`

**Verificar se estas rotas existem (adicionar se não existirem):**

```javascript
// Rotas do Navigator Agent
app.post('/api/navigator/plan', async (req, res) => {
  try {
    const { userIntent, context } = req.body;
    
    if (!navigatorAgent) {
      return res.status(503).json({ error: 'Agentes não disponíveis' });
    }

    const result = await navigatorAgent.generateNavigationPlan(userIntent, context);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar plano:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/navigator/execute', async (req, res) => {
  try {
    const { plan, sessionId } = req.body;
    
    if (!navigatorAgent) {
      return res.status(503).json({ error: 'Agentes não disponíveis' });
    }

    // Criar sessão se não fornecida
    const sid = sessionId || `agent_${Date.now()}`;
    if (!sessionId) {
      await browserService.createSession(sid);
    }

    const result = await navigatorAgent.executePlan(plan, sid);
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar plano:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/navigator/process', async (req, res) => {
  try {
    const { userIntent, context } = req.body;
    
    if (!navigatorAgent) {
      return res.status(503).json({ error: 'Agentes não disponíveis' });
    }

    const result = await navigatorAgent.processUserIntent(userIntent, context);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar intenção:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### PASSO 4: Testar a Implementação

#### Criar arquivo: `backend/test-navegacao-autonoma.js`

```javascript
/**
 * 🧪 Teste de Navegação Autônoma
 */

const API_URL = 'http://localhost:3002';

async function testAutonomousNavigation() {
  console.log('🚀 Testando Navegação Autônoma\n');
  console.log('='.repeat(60));

  // Teste 1: Busca no DuckDuckGo
  console.log('\n🧪 Teste 1: Busca no DuckDuckGo');
  try {
    const response = await fetch(`${API_URL}/api/navigator/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIntent: 'Busque por Python no DuckDuckGo',
        context: {}
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sucesso!');
      console.log(`📋 Plano: ${result.plan.steps.length} passos`);
      console.log(`🎯 Objetivo: ${result.plan.objective}`);
      console.log(`✅ Passos bem-sucedidos: ${result.execution.results.filter(r => r.success).length}/${result.execution.results.length}`);
      
      if (result.finalContent) {
        console.log(`📊 Dados extraídos: ${result.finalContent.length || 0} itens`);
      }
    } else {
      console.log('❌ Falhou:', result.error);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Teste concluído!\n');
}

testAutonomousNavigation().catch(console.error);
```

**Executar:**
```bash
node backend/test-navegacao-autonoma.js
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend:
- [ ] Adicionar método `press()` em browserService.js
- [ ] Adicionar método `scroll()` em browserService.js
- [ ] Adicionar método `hover()` em browserService.js
- [ ] Adicionar método `waitForLoadState()` em browserService.js
- [ ] Adicionar método `extractStructured()` em browserService.js
- [ ] Atualizar `generateNavigationPlan()` em navigatorAgentService.js
- [ ] Atualizar `executePlan()` em navigatorAgentService.js
- [ ] Verificar rotas em server.js
- [ ] Reiniciar backend

### Testes:
- [ ] Executar `node backend/test-navegacao-autonoma.js`
- [ ] Testar busca no DuckDuckGo
- [ ] Testar busca no Mercado Livre
- [ ] Verificar logs do backend
- [ ] Verificar screenshots gerados

### Frontend (opcional):
- [ ] Atualizar tipos TypeScript
- [ ] Melhorar feedback visual
- [ ] Adicionar exibição de plano

---

## 🎯 RESULTADO ESPERADO

Após implementação, o sistema será capaz de:

```
Usuário: "Busque notebooks no Mercado Livre"

Backend:
🤖 Agente selecionado: Gemini 2.5 Flash
🧠 Gerando plano...
✅ Plano gerado: 8 passos
🚀 Executando plano...
📍 Passo 1/8: Navegar para Mercado Livre
✅ Passo 1 concluído
📍 Passo 2/8: Aguardar campo de busca
✅ Passo 2 concluído
📍 Passo 3/8: Preencher "notebooks"
✅ Passo 3 concluído
📍 Passo 4/8: Pressionar Enter
✅ Passo 4 concluído
📍 Passo 5/8: Aguardar resultados
✅ Passo 5 concluído
📍 Passo 6/8: Aguardar produtos
✅ Passo 6 concluído
📍 Passo 7/8: Extrair produtos
✅ 50 produtos extraídos
📍 Passo 8/8: Screenshot
✅ Screenshot capturado
🎉 Plano executado! 8/8 passos bem-sucedidos

Resultado: 50 notebooks encontrados com preços e links
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar código acima**
2. **Testar com casos reais**
3. **Ajustar seletores CSS conforme necessário**
4. **Adicionar mais tipos de extração estruturada**
5. **Implementar paginação automática**
6. **Adicionar retry automático em falhas**

---

**Pronto para começar! 🎯**

Comece pelo PASSO 1 e vá seguindo em ordem.
Teste cada passo antes de passar para o próximo.
