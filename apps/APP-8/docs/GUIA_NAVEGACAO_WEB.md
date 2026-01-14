# 🌐 Guia Completo: Navegação Web Automatizada

## 📋 O QUE FOI IMPLEMENTADO

Seu sistema agora tem **controle total de navegadores web** usando Playwright + Chromium, integrado perfeitamente com o sistema existente de automação desktop.

### ✨ Novos Recursos:

1. **Controle de Navegador**
   - Abrir/fechar Chromium
   - Navegar para URLs
   - Voltar/avançar/atualizar páginas
   - Múltiplas abas

2. **Interação com Páginas**
   - Clicar em elementos (por seletor CSS)
   - Digitar em campos de formulário
   - Preencher formulários completos
   - Selecionar opções em dropdowns
   - Marcar checkboxes

3. **Extração de Dados**
   - Extrair texto de elementos
   - Capturar screenshots de páginas
   - Exportar páginas em PDF
   - Extrair todos os links
   - Executar JavaScript customizado

4. **Comandos em Linguagem Natural**
   - "Pesquisar Python tutorial"
   - "Abrir youtube.com"
   - "Ir para github.com"

---

## 🚀 INSTALAÇÃO

### Passo 1: Instalar Playwright no Executor Python

```bash
cd executor
pip install playwright
playwright install chromium
```

Isso vai:
- Instalar a biblioteca Playwright Python
- Baixar o navegador Chromium (~300MB)

### Passo 2: Verificar Instalação

```bash
# Teste se Playwright foi instalado
python -c "from playwright.sync_api import sync_playwright; print('✅ Playwright OK')"
```

### Passo 3: Reiniciar o Executor

```bash
# Pare o executor se estiver rodando (Ctrl+C)
# Inicie novamente
python executor.py
```

Você deve ver no log:
```
🎮 Gemini Executor inicializado
🌐 Módulo de navegação web carregado
```

---

## 🎮 COMO USAR

### Opção 1: Interface React (Recomendado)

1. Adicione o componente `BrowserControl` ao seu App:

```tsx
import { BrowserControl } from './components/BrowserControl';

function App() {
  return (
    <div>
      {/* Seus componentes existentes */}
      <BrowserControl />
    </div>
  );
}
```

2. Abra o navegador clicando em "Abrir Navegador"

3. Use a barra de navegação ou comandos em linguagem natural

### Opção 2: API Direta

```javascript
// Abrir navegador
await fetch('http://localhost:3001/api/browser/open', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ headless: false })
});

// Navegar para URL
await fetch('http://localhost:3001/api/browser/navigate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://google.com' })
});

// Digitar em campo
await fetch('http://localhost:3001/api/browser/type', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    selector: 'input[name="q"]',
    text: 'Python tutorial'
  })
});

// Pressionar Enter
await fetch('http://localhost:3001/api/browser/press', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'Enter' })
});
```

### Opção 3: Integração com Smart Task Executor

O `SmartTaskExecutor` já existente agora pode usar comandos de navegador:

```javascript
// No chat, digite:
"Abra o Chrome, vá para google.com e pesquise por 'Playwright Python'"

// O Gemini Maestro vai:
// 1. Analisar o comando
// 2. Criar plano com ações de navegador
// 3. Executar automaticamente
```

---

## 📚 EXEMPLOS PRÁTICOS

### Exemplo 1: Pesquisa no Google

```python
# Via Executor Python (comandos WebSocket)
{
  "action": "browser_open"
}
{
  "action": "browser_goto",
  "params": {"url": "https://google.com"}
}
{
  "action": "browser_type",
  "params": {
    "selector": "input[name='q']",
    "text": "Python Playwright"
  }
}
{
  "action": "browser_press",
  "params": {"key": "Enter"}
}
```

### Exemplo 2: Preencher Formulário

```javascript
// Via API Backend
await fetch('http://localhost:3001/api/browser/fill-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      '#name': 'João Silva',
      '#email': 'joao@email.com',
      '#message': 'Olá, gostaria de mais informações'
    }
  })
});
```

### Exemplo 3: Extrair Dados

```javascript
// Extrair todos os links da página
const response = await fetch('http://localhost:3001/api/browser/extract-links', {
  method: 'POST'
});
const data = await response.json();
console.log(data.links); // Array de {text, href}
```

### Exemplo 4: Screenshot e PDF

```javascript
// Screenshot da página
await fetch('http://localhost:3001/api/browser/screenshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    filename: 'pagina.png',
    fullPage: true 
  })
});

// Exportar como PDF
await fetch('http://localhost:3001/api/browser/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename: 'pagina.pdf' })
});
```

---

## 🎯 INTEGRAÇÃO COM GEMINI VISION

O sistema de navegação web está **totalmente integrado** com o Gemini Vision Service:

### Fluxo Inteligente:

1. **Usuário fala no chat:**
   > "Preencha o formulário de contato com meus dados"

2. **Gemini Vision analisa a página:**
   - Identifica campos do formulário
   - Detecta botões e elementos
   - Retorna posições e seletores

3. **Task Planner cria plano:**
   ```json
   {
     "steps": [
       {"action": "browser_type", "params": {"selector": "#name", "text": "João"}},
       {"action": "browser_type", "params": {"selector": "#email", "text": "joao@email.com"}},
       {"action": "browser_click", "params": {"selector": "button[type='submit']"}}
     ]
   }
   ```

4. **Executor executa automaticamente**

### Comandos Inteligentes Suportados:

- "Clique no botão azul de login"
- "Preencha o campo que está destacado"
- "Encontre o preço do produto"
- "Extraia o texto do artigo"

---

## 🔧 COMANDOS DISPONÍVEIS

### Navegação Básica

| Comando | Descrição | Parâmetros |
|---------|-----------|------------|
| `browser_open` | Abre Chromium | `headless: bool` |
| `browser_close` | Fecha navegador | - |
| `browser_goto` | Navega para URL | `url: string` |
| `browser_back` | Volta página | - |
| `browser_forward` | Avança página | - |
| `browser_refresh` | Atualiza página | - |

### Interação

| Comando | Descrição | Parâmetros |
|---------|-----------|------------|
| `browser_click` | Clica em elemento | `selector: string` |
| `browser_type` | Digita em campo | `selector: string, text: string` |
| `browser_press` | Pressiona tecla | `key: string` |
| `browser_select` | Seleciona opção | `selector: string, value: string` |
| `browser_check` | Marca checkbox | `selector: string` |
| `browser_hover` | Hover em elemento | `selector: string` |

### Extração

| Comando | Descrição | Parâmetros |
|---------|-----------|------------|
| `browser_get_text` | Extrai texto | `selector: string` |
| `browser_get_attribute` | Extrai atributo | `selector: string, attribute: string` |
| `browser_screenshot` | Captura tela | `filename?: string, full_page?: bool` |
| `browser_pdf` | Exporta PDF | `filename?: string` |
| `browser_extract_links` | Extrai links | - |

### Abas

| Comando | Descrição | Parâmetros |
|---------|-----------|------------|
| `browser_new_tab` | Abre nova aba | `url?: string` |
| `browser_switch_tab` | Troca aba | `index: number` |
| `browser_close_tab` | Fecha aba atual | - |
| `browser_info` | Info da página | - |

### Avançado

| Comando | Descrição | Parâmetros |
|---------|-----------|------------|
| `browser_wait_for` | Aguarda elemento | `selector: string, timeout?: number` |
| `browser_scroll_to` | Rola até elemento | `selector: string` |
| `browser_fill_form` | Preenche formulário | `data: {selector: value}` |
| `browser_evaluate` | Executa JavaScript | `script: string` |

---

## 🎨 SELETORES CSS

Para interagir com elementos, use seletores CSS:

```css
/* Por ID */
#username

/* Por classe */
.btn-primary

/* Por atributo */
input[name="email"]
button[type="submit"]

/* Por texto */
button:has-text("Login")

/* Combinações */
form#login input[type="password"]
```

**Dica:** Use DevTools do Chrome (F12) para inspecionar elementos e copiar seletores.

---

## ⚠️ TROUBLESHOOTING

### Problema: "Navegador não está aberto"

**Solução:**
1. Certifique-se de que o Executor Python está rodando
2. Chame `browser_open` antes de outros comandos
3. Verifique logs do executor

### Problema: "Elemento não encontrado"

**Solução:**
1. Use `browser_wait_for` antes de interagir
2. Verifique se o seletor CSS está correto
3. Aguarde a página carregar completamente

### Problema: "Timeout aguardando elemento"

**Solução:**
1. Aumente o timeout: `{"timeout": 30000}` (30s)
2. Verifique se a página carregou
3. Use seletor mais específico

### Problema: Playwright não instalado

**Solução:**
```bash
cd executor
pip install playwright
playwright install chromium
```

---

## 🚀 PRÓXIMOS PASSOS

### 1. Teste Básico

```bash
# 1. Inicie o backend
cd backend
npm run dev

# 2. Inicie o executor (outro terminal)
cd executor
python executor.py

# 3. Inicie o frontend (outro terminal)
npm run dev

# 4. Abra http://localhost:5173
# 5. Use o componente BrowserControl
```

### 2. Teste com Smart Task Executor

No chat do sistema, digite:
> "Abra o Chrome e pesquise por 'Playwright Python tutorial'"

O sistema vai executar automaticamente!

### 3. Crie Automações Customizadas

Combine navegação web com automação desktop:

```javascript
// Exemplo: Baixar relatório e abrir no Excel
const plan = {
  steps: [
    // Navega e baixa
    {action: "browser_goto", params: {url: "https://sistema.com/relatorios"}},
    {action: "browser_click", params: {selector: "#download-btn"}},
    {action: "browser_wait_for", params: {selector: ".download-complete"}},
    
    // Abre no desktop
    {action: "hotkey", params: {keys: ["win", "r"]}},
    {action: "type", params: {text: "excel Downloads\\relatorio.xlsx"}},
    {action: "press", params: {key: "enter"}}
  ]
};
```

---

## 📊 ARQUITETURA FINAL

```
┌─────────────────────────────────────────────┐
│         FRONTEND (React)                    │
│  • BrowserControl (novo)                    │
│  • SmartTaskExecutor                        │
│  • ExecutorControl                          │
└──────────────┬──────────────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────────────┐
│         BACKEND (Node.js)                   │
│  • /api/browser (novo)                      │
│  • /api/tasks                               │
│  • /api/executor                            │
│  • Gemini Maestro                           │
│  • Vision Service                           │
│  • Task Planner                             │
└──────────────┬──────────────────────────────┘
               │ WebSocket
┌──────────────▼──────────────────────────────┐
│      EXECUTOR PYTHON                        │
│  ┌──────────────────────────────────────┐  │
│  │  PYAUTOGUI (desktop)                 │  │
│  │  • Mouse/teclado                     │  │
│  │  • Screenshots                       │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  PLAYWRIGHT (web) ✨ NOVO            │  │
│  │  • Chromium                          │  │
│  │  • Navegação automatizada            │  │
│  │  • Formulários                       │  │
│  │  • Extração de dados                 │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🎉 CONCLUSÃO

Seu sistema agora tem:

✅ **Controle Total**: Desktop (pyautogui) + Web (Playwright)
✅ **Visão Computacional**: Gemini Vision integrado
✅ **Linguagem Natural**: Comandos por chat
✅ **Planejamento Inteligente**: Task Planner automático
✅ **Execução Fluida**: Feedback em tempo real

**Você pode:**
- Navegar em sites automaticamente
- Preencher formulários
- Extrair dados
- Fazer pesquisas
- Baixar arquivos
- Capturar evidências
- Tudo isso falando no chat! 🎤

---

**Pronto para testar?** 🚀

Execute os comandos de instalação e comece a usar!
