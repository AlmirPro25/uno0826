# 🌐 BROWSER AUTOMATION ORCHESTRATOR

## Documentação Completa do Orquestrador Supremo de Automação Web com IA

---

## 1. Visão Geral

O **Browser Automation Orchestrator** é um sistema especializado em:

- **Tool Orchestration** com Gemini/Vertex AI
- **Controle de navegadores** via Playwright/Puppeteer/Selenium
- **Extração estruturada** de dados web
- **Navegação inteligente** guiada por IA
- **Anti-detecção** e comportamento humano simulado

### Arquitetura de 7 Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORQUESTRADOR SUPREMO                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Raciocínio (LLM)     → Planeja e decide                    │
│  2. Tool Registry        → Catálogo de ferramentas             │
│  3. Executor de Browser  → Playwright/Puppeteer/Selenium       │
│  4. Observabilidade      → Logs, métricas, eventos             │
│  5. Anti-Detecção        → Stealth, fingerprinting             │
│  6. Extração             → HTML → JSON estruturado             │
│  7. Memória              → Estado e histórico                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tool Registry

### Tools Disponíveis

| Tool | Descrição | Permissões |
|------|-----------|------------|
| `navigate_and_extract` | Navega e extrai conteúdo | browser.open, network.request |
| `click_element` | Clica em elementos | browser.interact |
| `fill_form` | Preenche formulários | browser.interact, form.fill |
| `screenshot` | Captura screenshots | browser.screenshot |
| `solve_captcha` | Resolve CAPTCHAs | captcha.solve |
| `persist_result` | Salva dados | db.write |
| `search_api` | Busca externa | api.search |
| `manage_session` | Gerencia sessões | session.manage |
| `intercept_requests` | Intercepta network | network.intercept |
| `wait_for_condition` | Aguarda condições | browser.wait |
| `download_file` | Download de arquivos | file.download |
| `escalate_to_human` | Escala para HITL | hitl.escalate |

### Schema de Tool

```typescript
interface ToolDeclaration {
  name: string;           // Identificador único
  description: string;    // Descrição para o LLM
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  auth: string;
  permissions: string[];
  timeout: number;
  retries: number;
  requiresApproval?: boolean;
}
```

---

## 3. Fluxo de Tool Calling com Gemini

### Ciclo Completo

```
1. Host App → Gemini
   ├── prompt (objetivo)
   └── tool_declarations (schemas)

2. Gemini → Host App
   └── {"name": "tool_name", "args": {...}}

3. Host App → Runtime
   ├── Valida args contra schema
   ├── Verifica permissões
   └── Executa via adapter

4. Runtime → Host App
   └── tool_result (estruturado)

5. Host App → Gemini
   └── Envia resultado

6. Gemini → Host App
   ├── Chama outra tool
   └── OU retorna resposta final
```

### Exemplo de Integração

```typescript
import { BrowserAutomationOrchestrator } from './services/manifestos/BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST';

const orchestrator = new BrowserAutomationOrchestrator();

// 1. Obter tools para enviar ao Gemini
const tools = orchestrator.getToolsForGemini();

// 2. Enviar prompt + tools para Gemini
const geminiResponse = await gemini.generateContent({
  contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  tools: [{ functionDeclarations: tools }]
});

// 3. Verificar se Gemini quer chamar uma tool
const toolCall = orchestrator.parseToolCallFromResponse(geminiResponse.text);

if (toolCall) {
  // 4. Executar tool
  const result = await orchestrator.executeToolCall(toolCall, myAdapter);
  
  // 5. Enviar resultado de volta ao Gemini
  const formattedResult = orchestrator.formatToolResultForGemini(result);
  // ... continuar conversa
}
```

---

## 4. Protocolos Suportados

### Chrome DevTools Protocol (CDP)

```
Domínios essenciais:
├── Page.*          → Navegação, lifecycle
├── Network.*       → Interceptação de requests
├── Runtime.*       → Execução de JavaScript
├── DOM.*           → Manipulação do DOM
├── Performance.*   → Métricas
├── Target.*        → Gerenciamento de tabs
├── Accessibility.* → Árvore de acessibilidade
└── Input.*         → Mouse/teclado
```

### WebDriver BiDi

- Eventos bidirecionais em tempo real
- Logs unificados cross-browser
- Sessões estáveis multi-browser

---

## 5. Anti-Detecção

### Configuração Stealth

```typescript
const stealthConfig = {
  userAgents: ['Chrome/120', 'Firefox/121', 'Safari/17'],
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 }
  ],
  webglVendor: 'Google Inc.',
  timezone: 'America/Sao_Paulo',
  languages: ['pt-BR', 'pt', 'en-US'],
  minDelay: 100,
  maxDelay: 500,
  mouseMovement: 'bezier-curve'
};
```

### Comportamento Humano

```typescript
async function humanLikeClick(page, selector) {
  // 1. Scroll suave
  await page.evaluate(sel => {
    document.querySelector(sel)?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, selector);

  // 2. Delay aleatório
  await sleep(randomBetween(200, 800));

  // 3. Movimento do mouse em curva
  await page.mouse.move(x, y, { steps: randomBetween(10, 25) });

  // 4. Hover + click
  await page.hover(selector);
  await sleep(randomBetween(50, 150));
  await page.click(selector, { delay: randomBetween(50, 100) });
}
```

---

## 6. Segurança e Guardrails

### Políticas

```yaml
permissions:
  browser.open: true
  browser.interact: true
  db.write: false  # Requer aprovação

rateLimits:
  toolCallsPerMinute: 50
  tokensPerRun: 100000

requireApproval:
  - db.write
  - db.delete
  - payment.execute

audit:
  enabled: true
  immutable: true
  retention: 90d
```

### Validação de Schema

```typescript
const validation = orchestrator.validateToolCall({
  name: 'navigate_and_extract',
  args: { url: 'https://example.com' }
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

---

## 7. Observabilidade

### Eventos Capturados

```typescript
interface AutomationEvent {
  timestamp: string;
  runId: string;
  phase: 'tool.call.request' | 'tool.call.executed' | 'tool.call.failed';
  tool: string;
  status: 'ok' | 'error';
  latencyMs: number;
  metadata: Record<string, unknown>;
}
```

### Métricas Prometheus

```
orchestrator_runs_total
tool_calls_total{tool_name, status}
tool_call_latency_seconds{tool_name}
selector_not_found_total{host}
captcha_escalations_total
```

---

## 8. Casos de Uso

### Scraping Multi-Site

```typescript
const sites = ['loja1.com', 'loja2.com', 'loja3.com'];

const results = await Promise.all(
  sites.map(site => orchestrator.executeToolCall({
    name: 'navigate_and_extract',
    args: { 
      url: `https://${site}/produto`,
      extractMode: 'json',
      waitForSelector: '.price'
    }
  }, playwrightAdapter))
);
```

### Navegação com Login

```typescript
const loginFlow = [
  { name: 'navigate_and_extract', args: { url: 'https://app.com/login' }},
  { name: 'fill_form', args: { 
    fields: { '#email': 'user@email.com', '#password': '***' }
  }},
  { name: 'click_element', args: { selector: 'button[type="submit"]' }},
  { name: 'wait_for_condition', args: { condition: 'navigation', url: '/dashboard' }},
  { name: 'navigate_and_extract', args: { url: '/reports', extractMode: 'table' }}
];

for (const step of loginFlow) {
  await orchestrator.executeToolCall(step, adapter);
}
```

### Monitoramento de Mudanças

```typescript
async function monitorPage(url: string, selector: string) {
  const baseline = await extractContent(url, selector);
  
  setInterval(async () => {
    const current = await extractContent(url, selector);
    if (current !== baseline) {
      await notify('Page changed!', { url, diff: computeDiff(baseline, current) });
    }
  }, 60000);
}
```

---

## 9. System Prompt para Gemini

```
You are OrchestratorGPT — an agentic planner specialized in web automation.

RULES:
1. Tools are declared with strict JSON Schemas
2. When requiring external actions, produce exactly:
   {"name": "<tool_name>", "args": {...}}
3. Do NOT invent tool outputs — wait for runtime execution
4. Validate arguments satisfy the tool schema
5. For destructive actions, request human approval first
6. Summarize long pages before making decisions
7. Always explain "why" after receiving tool results

CAPABILITIES:
- navigate_and_extract: Open URLs, wait for elements, extract content
- click_element: Click on page elements by selector
- fill_form: Fill form fields with data
- screenshot: Capture page screenshots
- solve_captcha: Handle CAPTCHAs (auto or HITL)
- persist_result: Save extracted data to storage
- search_api: Query external search APIs

BEHAVIOR:
- Plan before executing
- Adapt when pages change
- Retry with alternative selectors on failure
- Escalate to human when stuck
```

---

## 10. Checklist de Implementação

### Antes de Executar
- [ ] Objetivo claramente definido
- [ ] Tools declaradas com schemas
- [ ] Permissões configuradas
- [ ] Rate limits definidos
- [ ] Fallbacks planejados

### Durante Execução
- [ ] Validação de args
- [ ] Logs estruturados
- [ ] Timeouts respeitados
- [ ] Erros tratados

### Após Execução
- [ ] Resultados validados
- [ ] Métricas emitidas
- [ ] Audit trail completo
- [ ] Memória atualizada

---

## 11. Referências

- [Playwright Docs](https://playwright.dev)
- [Puppeteer Docs](https://pptr.dev)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/)
- [Gemini Function Calling](https://ai.google.dev/docs/function_calling)
- [Browserless](https://browserless.io)

---

*"A diferença entre um script que quebra e um agente que persiste está na inteligência com que você orquestra as ferramentas."*
