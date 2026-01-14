# 🎯 Exemplos Práticos - Navegador Integrado

## Exemplos Prontos para Usar

### 1. 🔍 Pesquisar e Resumir

```typescript
import { searchGoogle, browseAndExtract } from './services/browserService';

async function pesquisarEResumir(query: string) {
  // 1. Buscar no Google
  const results = await searchGoogle(query);
  
  if (results.length === 0) {
    return 'Nenhum resultado encontrado';
  }
  
  // 2. Navegar no primeiro resultado
  const firstResult = results[0];
  const pageData = await browseAndExtract(firstResult.url);
  
  // 3. Enviar para o LLM resumir
  const summary = await llm.summarize(pageData.content.text);
  
  // 4. Retornar resultado completo
  return {
    query,
    source: {
      title: firstResult.title,
      url: firstResult.url
    },
    summary,
    screenshot: pageData.screenshot,
    relatedLinks: pageData.content.links.slice(0, 5)
  };
}

// Uso
const result = await pesquisarEResumir('Como usar Playwright');
console.log(result.summary);
```

---

### 2. 📊 Comparar Preços

```typescript
import { browseAndExtract, executeScript } from './services/browserService';

async function compararPrecos(urls: string[]) {
  const precos = [];
  
  for (const url of urls) {
    try {
      const result = await browseAndExtract(url);
      
      // Extrair preço (adaptar seletor para cada site)
      const preco = result.content.text.match(/R\$\s*[\d.,]+/)?.[0];
      
      if (preco) {
        precos.push({
          url,
          title: result.content.title,
          preco,
          screenshot: result.screenshot
        });
      }
    } catch (error) {
      console.error(`Erro em ${url}:`, error);
    }
  }
  
  // Ordenar por preço
  precos.sort((a, b) => {
    const precoA = parseFloat(a.preco.replace(/[^\d,]/g, '').replace(',', '.'));
    const precoB = parseFloat(b.preco.replace(/[^\d,]/g, '').replace(',', '.'));
    return precoA - precoB;
  });
  
  return precos;
}

// Uso
const urls = [
  'https://site1.com/produto',
  'https://site2.com/produto',
  'https://site3.com/produto'
];

const precos = await compararPrecos(urls);
console.log('Menor preço:', precos[0]);
```

---

### 3. 📧 Extrair Emails

```typescript
import { createBrowserSession, navigateToUrl, executeScript, closeBrowserSession } from './services/browserService';

async function extrairEmails(url: string) {
  const session = await createBrowserSession();
  
  try {
    // Navegar
    await navigateToUrl(session.sessionId, url);
    
    // Extrair emails
    const emails = await executeScript(session.sessionId, `
      const text = document.body.innerText;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
      const emails = text.match(emailRegex) || [];
      return [...new Set(emails)]; // Remover duplicados
    `);
    
    return emails;
  } finally {
    await closeBrowserSession(session.sessionId);
  }
}

// Uso
const emails = await extrairEmails('https://example.com/contato');
console.log('Emails encontrados:', emails);
```

---

### 4. 📸 Monitorar Mudanças

```typescript
import { browseAndExtract } from './services/browserService';

class SiteMonitor {
  private previousContent: Map<string, string> = new Map();
  
  async checkForChanges(url: string): Promise<boolean> {
    const result = await browseAndExtract(url);
    const currentContent = result.content.text;
    
    const previous = this.previousContent.get(url);
    
    if (!previous) {
      // Primeira vez
      this.previousContent.set(url, currentContent);
      return false;
    }
    
    const changed = previous !== currentContent;
    
    if (changed) {
      this.previousContent.set(url, currentContent);
      console.log(`🔔 Site ${url} foi atualizado!`);
    }
    
    return changed;
  }
  
  async monitorar(urls: string[], intervalMinutes: number = 5) {
    setInterval(async () => {
      for (const url of urls) {
        try {
          const changed = await this.checkForChanges(url);
          if (changed) {
            // Notificar usuário
            notify(`Site ${url} foi atualizado!`);
          }
        } catch (error) {
          console.error(`Erro ao monitorar ${url}:`, error);
        }
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Uso
const monitor = new SiteMonitor();
monitor.monitorar([
  'https://site1.com',
  'https://site2.com'
], 5); // Verificar a cada 5 minutos
```

---

### 5. 🤖 Assistente de Navegação

```typescript
import { searchGoogle, browseAndExtract } from './services/browserService';

async function assistenteNavegacao(pergunta: string) {
  // 1. Buscar no Google
  console.log('🔍 Buscando...');
  const results = await searchGoogle(pergunta);
  
  if (results.length === 0) {
    return 'Não encontrei resultados';
  }
  
  // 2. Navegar nos top 3 resultados
  console.log('📄 Analisando páginas...');
  const pages = await Promise.all(
    results.slice(0, 3).map(async (result) => {
      try {
        const data = await browseAndExtract(result.url);
        return {
          title: result.title,
          url: result.url,
          text: data.content.text.slice(0, 2000), // Primeiros 2000 caracteres
          screenshot: data.screenshot
        };
      } catch (error) {
        return null;
      }
    })
  );
  
  const validPages = pages.filter(p => p !== null);
  
  // 3. Enviar para o LLM
  console.log('🤖 Gerando resposta...');
  const context = validPages.map(p => 
    `Fonte: ${p.title}\nURL: ${p.url}\n\n${p.text}`
  ).join('\n\n---\n\n');
  
  const resposta = await llm.ask(`
    Pergunta: ${pergunta}
    
    Contexto das páginas encontradas:
    ${context}
    
    Por favor, responda a pergunta baseado no contexto acima.
  `);
  
  return {
    pergunta,
    resposta,
    fontes: validPages.map(p => ({
      title: p.title,
      url: p.url,
      screenshot: p.screenshot
    }))
  };
}

// Uso
const resultado = await assistenteNavegacao('Como instalar Playwright?');
console.log(resultado.resposta);
console.log('Fontes:', resultado.fontes);
```

---

### 6. 📋 Preencher Formulário

```typescript
import { createBrowserSession, navigateToUrl, executeScript, takeScreenshot, closeBrowserSession } from './services/browserService';

async function preencherFormulario(url: string, dados: any) {
  const session = await createBrowserSession();
  
  try {
    // Navegar
    await navigateToUrl(session.sessionId, url);
    
    // Preencher campos
    await executeScript(session.sessionId, `
      document.querySelector('#nome').value = '${dados.nome}';
      document.querySelector('#email').value = '${dados.email}';
      document.querySelector('#telefone').value = '${dados.telefone}';
      document.querySelector('#mensagem').value = '${dados.mensagem}';
    `);
    
    // Tirar screenshot antes de enviar
    const screenshotAntes = await takeScreenshot(session.sessionId);
    
    // Submeter formulário
    await executeScript(session.sessionId, `
      document.querySelector('form').submit();
    `);
    
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tirar screenshot depois
    const screenshotDepois = await takeScreenshot(session.sessionId);
    
    return {
      success: true,
      screenshotAntes,
      screenshotDepois
    };
  } finally {
    await closeBrowserSession(session.sessionId);
  }
}

// Uso
const resultado = await preencherFormulario('https://site.com/contato', {
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '11999999999',
  mensagem: 'Olá, gostaria de mais informações'
});

console.log('Formulário enviado!');
```

---

### 7. 🎨 Capturar Design

```typescript
import { browseAndExtract } from './services/browserService';

async function capturarDesign(url: string) {
  const result = await browseAndExtract(url);
  
  return {
    url,
    title: result.content.title,
    screenshot: result.screenshot,
    colors: result.content.metadata['theme-color'] || null,
    images: result.content.images.slice(0, 10),
    fonts: result.content.metadata['font-family'] || null,
    description: result.content.metadata['description'] || null
  };
}

// Uso
const design = await capturarDesign('https://site.com');
console.log('Screenshot:', design.screenshot);
console.log('Cores:', design.colors);
console.log('Imagens:', design.images);
```

---

### 8. 📱 Testar Responsividade

```typescript
import { chromium } from 'playwright';

async function testarResponsividade(url: string) {
  const browser = await chromium.launch();
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  const screenshots = [];
  
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    await page.goto(url);
    
    const screenshot = await page.screenshot({ fullPage: true });
    
    screenshots.push({
      device: viewport.name,
      width: viewport.width,
      height: viewport.height,
      screenshot: screenshot.toString('base64')
    });
    
    await context.close();
  }
  
  await browser.close();
  
  return screenshots;
}

// Uso
const screenshots = await testarResponsividade('https://site.com');
screenshots.forEach(s => {
  console.log(`${s.device}: ${s.width}x${s.height}`);
});
```

---

## 🎯 Integração com Chat

### Detectar Comandos

```typescript
function detectarComandoNavegacao(mensagem: string) {
  const comandos = {
    pesquisar: /pesquis(e|ar) (sobre |por )?(.+)/i,
    navegar: /naveg(ue|ar) (para |em )?(.+)/i,
    extrair: /extrai(a|r) (.+) (de|do) (.+)/i,
    screenshot: /tir(e|ar) (um )?screenshot (de|do) (.+)/i,
    comparar: /compar(e|ar) (.+) (e|com) (.+)/i
  };
  
  for (const [comando, regex] of Object.entries(comandos)) {
    const match = mensagem.match(regex);
    if (match) {
      return { comando, params: match.slice(1) };
    }
  }
  
  return null;
}

// Uso no chat
async function handleMessage(mensagem: string) {
  const comando = detectarComandoNavegacao(mensagem);
  
  if (!comando) {
    // Processar com LLM normalmente
    return;
  }
  
  switch (comando.comando) {
    case 'pesquisar':
      const query = comando.params[2];
      const resultado = await assistenteNavegacao(query);
      // Exibir no chat
      break;
      
    case 'navegar':
      const url = comando.params[2];
      const pageData = await browseAndExtract(url);
      // Exibir no Canvas
      break;
      
    // ... outros comandos
  }
}
```

---

## 🎉 Conclusão

Esses exemplos mostram o poder do navegador integrado!

✅ Pesquisa inteligente  
✅ Comparação de preços  
✅ Extração de dados  
✅ Monitoramento  
✅ Automação de formulários  
✅ Captura de design  
✅ Testes de responsividade  

**Adapte para seu caso de uso!** 🚀
