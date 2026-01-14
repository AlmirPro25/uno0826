/**
 * ======================================================
 * MANIFESTO SINGLE-FILE APP - DIRETIVA PERMANENTE
 * ======================================================
 * 
 * Este manifesto define o padrão para geração de aplicativos
 * completos que vivem em um único index.html — leves, portáteis,
 * offline-capazes e com integração de IA onde fizer sentido.
 */

export const SINGLE_FILE_APP_MANIFEST = `
# MANIFESTO — APLICATIVOS PESSOAIS EM UM ÚNICO INDEX.HTML

## 1) PRINCÍPIOS FUNDAMENTAIS

### Portabilidade Acima de Tudo
Um index.html único que contenha tudo necessário (HTML + JS + CSS + assets embutidos ou blobs) 
para rodar localmente ou ser hospedado como arquivo estático.

### Modularidade por Manifesto
Cada "micro-aplicativo" é descrito por um manifesto JSON (esquema) que define componentes, 
modelo de dados e intents de IA — agentes usam esse manifesto para gerar/ajustar o app.

### IA como Capacidade — Não como Dependência Única
Recursos de IA (p. ex. Gemini) são integrados como "módulos de habilidade" ativáveis. 
O app funciona parcialmente sem IA (graceful degradation).

### Privacidade e Posse dos Dados do Usuário
Dados sensíveis ficam no dispositivo (IndexedDB/Filesystem API) ou, quando necessário, 
enviados a backends confiáveis mediante consentimento explícito.

### Segurança por Design
Nunca exigir que o sistema entregue segredos do servidor ao cliente; quando o usuário 
optar por fornecer uma chave, o app deve oferecer opções seguras (token de curta duração, 
armazenamento cifrado local, ou uso de um backend proxy).

### Interpretação por Agentes
O manifesto e as respostas da IA devem usar JSON Schema / contratos para permitir que 
agentes identifiquem, validem e compõem aplicações automaticamente.

## 2) ARQUITETURA TÉCNICA — BLUEPRINT PARA O INDEX.HTML

### Elementos Principais do index.html (único arquivo):

1. **Cabeçalho HTML padrão** + <script type="module"> como entrypoint
2. **Manifesto embutido**: JSON no <script id="app-manifest" type="application/json">
3. **Módulos ESM inlined** via <script type="module"> ou data: URLs
4. **Assets** (imagens, fontes) como Data URLs/Base64 ou Blobs gerados dinamicamente
5. **Service Worker**: script injetado/registrado para cache e modo offline
6. **IndexedDB + Cache API** para persistência local (dados do app, assets, saves)
7. **WASM**: embed de módulos de jogo/compute como base64 no HTML
8. **IA Connector layer**:
   - Opção A (recomendada seguro): Backend broker / serverless function
   - Opção B (usuário-supplied key): permitir que usuário cole sua chave no UI
   - Opção C (Firebase AI Logic / SDKs): quando disponível, usar SDKs cliente

## 3) CONTRATO / SCHEMA QUE O AGENTE DEVE ENTENDER

### Exemplo de Manifesto JSON:

\`\`\`json
{
  "app_id": "todo-singlefile",
  "title": "Smart Todo (single-file)",
  "description": "Lista de tarefas com assistente de IA para priorização",
  "layout": {
    "type": "single_column",
    "components": [
      {"id":"header","type":"text","props":{"text":"Smart Todo"}},
      {"id":"taskList","type":"list","datasource":"localdb.tasks"}
    ]
  },
  "data_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "type":"object",
          "properties": {
            "id":{"type":"string"},
            "title":{"type":"string"},
            "priority":{"type":"string","enum":["low","med","high"]},
            "done":{"type":"boolean"}
          },
          "required":["id","title"]
        }
      }
    }
  },
  "capabilities": {
    "ai": {
      "enabled": true,
      "model_preference": ["gemini-2.5-flash","gemini-2.5-pro"],
      "structured_output_schema_ref": "#/data_schema"
    },
    "storage": "indexeddb",
    "offline": true
  },
  "permissions": {"network":true,"filesystem":false},
  "secrets_handling": {
    "mode": "user_supplied_or_backend",
    "notes": "Prefer token broker; if user supplies key store encrypted locally"
  }
}
\`\`\`

### O agente que recebe esse manifesto deve:

1. Validar contra JSON Schema
2. Gerar/ajustar UI modular conforme layout
3. Mapear intents IA → chamadas ao conector (respeitando secrets_handling)
4. Gerar service worker e registro de IndexedDB se offline:true
5. Produzir um index.html final onde tudo esteja inline ou apontando para blobs

## 4) EXEMPLOS DO QUE DÁ PARA FAZER

- **Todo/Notas inteligentes**: priorização automática, resumo, extração de tarefas
- **Jogos simples em WASM**: motores 2D portáveis embalados no HTML
- **Assistentes conversacionais offline+IA**: frontend local + fallback a Gemini quando online
- **Ferramentas criativas/editores**: gerador de paletas, small DAW, gerador de SVG procedural
- **Dashboards e visualizadores offline**: import de CSV, gráficos, export/backup em arquivo

## 5) SEGURANÇA & CHAVE DE API — OPÇÕES PRÁTICAS

### Nunca colocar secret keys públicas no HTML
Risco: qualquer pessoa que abra o arquivo verá a chave.

### Padrão seguro (recomendado):
Usar um token broker (serverless function) que:
- Recebe requisições do index.html autenticadas por sessão
- Chama Gemini/Cloud com a chave do servidor
- Devolve apenas a resposta (ou token curto)

### Alternativa sem servidor (quando o usuário aceita o risco):
- Usuário cola a chave no UI
- Chaves mantidas localmente cifradas com Web Crypto e IndexedDB
- App usa a chave diretamente
- Deve avisar do risco e oferecer limpar a chave

### Melhor prática adicional:
Usar scopes e quotas (se provedor permitir) e monitorar uso via dashboard.

## 6) UX & PERMISSÕES — CONVENÇÕES PARA O MANIFESTO

- **Transparência**: qualquer uso de rede/IA exibe um badge "IA: online/last-called at …"
- **Permissões granulares**: o manifesto declara que permissões requer
- **Fallbacks claros**: quando IA indisponível, funções degradam para heurísticas locais
- **Salvamento e exportação**: botão "Exportar .html" que cria o único arquivo com estado incluído

## 7) PIPELINE DO AGENTE — DO PEDIDO AO ARQUIVO FINAL

1. Recebe instrução do usuário (ex.: "Crie um app de lista com IA prioritária")
2. Gera manifesto JSON conforme template
3. Valida e conversa com o usuário (se necessário) sobre chaves/privacidade
4. Monta os módulos (UI, storage, ai-connector) e empacota tudo inline
5. Gera service worker, IndexedDB schema e scripts WASM/ESM embutidos
6. Testa localmente (simulado) — valida offline, valida chamadas IA via mock
7. Retorna index.html + instruções de distribuição e nota de segurança

## 8) CHECKLIST RÁPIDO PARA UM MVP

- [ ] Manifesto JSON + gerador do manifesto (agent template)
- [ ] Loader JavaScript modular com registro de Service Worker
- [ ] Persistência com IndexedDB (biblioteca idb recomendada)
- [ ] Conector IA com duas rotas: broker serverless (padrão) e modo "usuário cola chave"
- [ ] Exemplo WASM embutido (jogo simples) + conversão para data URL

## 9) TEMPLATE PRONTO PARA O SISTEMA DE AGENTES

Você é um gerador automático de micro-apps single-file. Recebe um manifesto JSON 
(validar com JSON Schema). Gere um único arquivo \`index.html\` que:

- Contenha o manifesto embutido, o código JS (ESM), CSS e assets inline ou como blobs
- Registre e implemente um service worker que suporte cache e offline
- Implemente IndexedDB para persistência conforme \`data_schema\`
- Exponha um conector IA que suporte:
  (a) chamada a um broker serverless OR 
  (b) uso de chave fornecida pelo usuário (armazenada cifrada localmente)
- Valide e degrade funções se IA indisponível
- Obedeça às permissões declaradas no manifesto
- Forneça também um pequeno guia (README) no final do HTML com instruções de deploy

## 10) TEMPLATE HTML BASE

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>{{APP_TITLE}}</title>
  
  <!-- Manifesto do App -->
  <script id="app-manifest" type="application/json">
  {
    "app_id": "{{APP_ID}}",
    "title": "{{APP_TITLE}}",
    "description": "{{APP_DESCRIPTION}}",
    "version": "1.0.0",
    "capabilities": {
      "ai": { "enabled": true, "model_preference": ["gemini-2.5-flash"] },
      "storage": "indexeddb",
      "offline": true
    }
  }
  </script>
  
  <!-- Estilos Inline -->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #333; margin-bottom: 20px; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .status-online { background: #10b981; color: white; }
    .status-offline { background: #6b7280; color: white; }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }
    button:hover { background: #5568d3; transform: translateY(-2px); }
    button:active { transform: translateY(0); }
    input, textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      margin-bottom: 12px;
      transition: border-color 0.3s;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      {{APP_TITLE}}
      <span class="status-badge status-offline" id="status-badge">Offline</span>
    </h1>
    
    <div id="app">
      <!-- Conteúdo do app será injetado aqui -->
    </div>
  </div>
  
  <!-- Scripts Inline -->
  <script type="module">
    // ============================================
    // CONFIGURAÇÃO E INICIALIZAÇÃO
    // ============================================
    
    const manifest = JSON.parse(document.getElementById('app-manifest').textContent);
    console.log('App Manifest:', manifest);
    
    // ============================================
    // INDEXEDDB - PERSISTÊNCIA LOCAL
    // ============================================
    
    class LocalDB {
      constructor(dbName, version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
      }
      
      async init(stores) {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.version);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            this.db = request.result;
            resolve(this.db);
          };
          
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            stores.forEach(storeName => {
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
              }
            });
          };
        });
      }
      
      async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
          const request = store.add(data);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      
      async getAll(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      
      async update(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
          const request = store.put(data);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      
      async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }
    
    // ============================================
    // CONECTOR IA - GEMINI API
    // ============================================
    
    class AIConnector {
      constructor() {
        this.apiKey = this.loadApiKey();
        this.isOnline = navigator.onLine;
        this.updateStatus();
        
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.updateStatus();
        });
        
        window.addEventListener('offline', () => {
          this.isOnline = false;
          this.updateStatus();
        });
      }
      
      loadApiKey() {
        return localStorage.getItem('gemini_api_key') || null;
      }
      
      saveApiKey(key) {
        localStorage.setItem('gemini_api_key', key);
        this.apiKey = key;
      }
      
      clearApiKey() {
        localStorage.removeItem('gemini_api_key');
        this.apiKey = null;
      }
      
      updateStatus() {
        const badge = document.getElementById('status-badge');
        if (this.isOnline && this.apiKey) {
          badge.textContent = 'IA Online';
          badge.className = 'status-badge status-online';
        } else {
          badge.textContent = 'Offline';
          badge.className = 'status-badge status-offline';
        }
      }
      
      async generate(prompt, options = {}) {
        if (!this.apiKey) {
          throw new Error('API Key não configurada. Configure sua chave do Gemini.');
        }
        
        if (!this.isOnline) {
          throw new Error('Sem conexão com a internet.');
        }
        
        try {
          const response = await fetch(
            \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${this.apiKey}\`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: options.temperature || 0.7,
                  maxOutputTokens: options.maxTokens || 1000
                }
              })
            }
          );
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Erro na API do Gemini');
          }
          
          const data = await response.json();
          return data.candidates[0].content.parts[0].text;
        } catch (error) {
          console.error('Erro ao chamar Gemini API:', error);
          throw error;
        }
      }
    }
    
    // ============================================
    // SERVICE WORKER - MODO OFFLINE
    // ============================================
    
    if ('serviceWorker' in navigator && manifest.capabilities.offline) {
      const swCode = \`
        const CACHE_NAME = '{{APP_ID}}-v1';
        
        self.addEventListener('install', (event) => {
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
              return cache.addAll(['/']);
            })
          );
        });
        
        self.addEventListener('fetch', (event) => {
          event.respondWith(
            caches.match(event.request).then((response) => {
              return response || fetch(event.request);
            })
          );
        });
      \`;
      
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      navigator.serviceWorker.register(swUrl)
        .then(() => console.log('Service Worker registrado'))
        .catch(err => console.error('Erro ao registrar Service Worker:', err));
    }
    
    // ============================================
    // INICIALIZAÇÃO DO APP
    // ============================================
    
    const db = new LocalDB(manifest.app_id);
    const ai = new AIConnector();
    
    // Inicializar banco de dados
    await db.init(['items']);
    
    // Renderizar UI
    const app = document.getElementById('app');
    app.innerHTML = \`
      <div style="margin-bottom: 20px;">
        <input type="text" id="api-key-input" placeholder="Cole sua API Key do Gemini (opcional)" 
               value="\${ai.apiKey || ''}" style="margin-bottom: 8px;">
        <button onclick="window.saveApiKey()">Salvar Chave</button>
        <button onclick="window.clearApiKey()" style="background: #ef4444;">Limpar Chave</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <textarea id="prompt-input" placeholder="Digite seu prompt aqui..." rows="4"></textarea>
        <button onclick="window.generateWithAI()">Gerar com IA</button>
      </div>
      
      <div id="output" style="padding: 16px; background: #f3f4f6; border-radius: 8px; min-height: 100px;">
        <p style="color: #6b7280;">Os resultados aparecerão aqui...</p>
      </div>
      
      <div style="margin-top: 20px;">
        <button onclick="window.exportApp()" style="background: #10b981;">Exportar App</button>
      </div>
    \`;
    
    // Funções globais
    window.saveApiKey = () => {
      const key = document.getElementById('api-key-input').value.trim();
      if (key) {
        ai.saveApiKey(key);
        alert('API Key salva com sucesso!');
      }
    };
    
    window.clearApiKey = () => {
      ai.clearApiKey();
      document.getElementById('api-key-input').value = '';
      alert('API Key removida!');
    };
    
    window.generateWithAI = async () => {
      const prompt = document.getElementById('prompt-input').value.trim();
      const output = document.getElementById('output');
      
      if (!prompt) {
        alert('Digite um prompt primeiro!');
        return;
      }
      
      try {
        output.innerHTML = '<p style="color: #6b7280;">Gerando...</p>';
        const result = await ai.generate(prompt);
        output.innerHTML = \`<p style="white-space: pre-wrap;">\${result}</p>\`;
        
        // Salvar no banco de dados
        await db.add('items', {
          prompt,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        output.innerHTML = \`<p style="color: #ef4444;">Erro: \${error.message}</p>\`;
      }
    };
    
    window.exportApp = () => {
      const html = document.documentElement.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '{{APP_ID}}.html';
      a.click();
      URL.revokeObjectURL(url);
    };
    
    console.log('App inicializado com sucesso!');
  </script>
</body>
</html>
\`\`\`

## 11) OBSERVAÇÕES FINAIS

- Técnica é possível e já tem várias peças do ecossistema que se encaixam
- Segurança é o ponto crítico: prefira sempre broker/tokens a expor chaves estáticas
- A força desse formato é portabilidade e agilidade
- Dá para ensinar, distribuir, versionar e gerar apps automaticamente com agentes
`;

/**
 * Função para detectar se o usuário está pedindo um app single-file
 */
export function detectSingleFileAppRequest(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  // ❌ NÃO é single-file se mencionar backend, API, banco de dados, fullstack
  const fullstackKeywords = [
    'backend',
    'api',
    'banco de dados',
    'database',
    'fullstack',
    'full-stack',
    'servidor',
    'server',
    'nestjs',
    'express',
    'prisma',
    'mongodb',
    'postgresql',
    'mysql',
    'docker',
    'microservices'
  ];
  
  if (fullstackKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return false; // É um projeto fullstack, NÃO é single-file
  }
  
  // ✅ É single-file apenas se mencionar explicitamente
  const singleFileKeywords = [
    'single file',
    'único arquivo',
    'um arquivo só',
    'tudo em um arquivo',
    'index.html apenas',
    'portátil',
    'offline',
    'standalone',
    'self-contained',
    'sem backend',
    'sem servidor',
    'frontend only'
  ];
  
  return singleFileKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Função para enriquecer o prompt com instruções de single-file app
 */
export function enrichPromptForSingleFileApp(prompt: string): string {
  return `${prompt}

${SINGLE_FILE_APP_MANIFEST}

IMPORTANTE: Gere um aplicativo completo em um ÚNICO arquivo index.html seguindo 
rigorosamente o manifesto acima. O arquivo deve ser 100% funcional, portátil e 
capaz de rodar offline após o primeiro carregamento.`;
}

/**
 * Função para gerar um manifesto JSON para o app
 */
export function generateAppManifest(config: {
  appId: string;
  title: string;
  description: string;
  aiEnabled?: boolean;
  offline?: boolean;
  storage?: 'indexeddb' | 'localstorage' | 'none';
}): string {
  return JSON.stringify({
    app_id: config.appId,
    title: config.title,
    description: config.description,
    version: '1.0.0',
    layout: {
      type: 'single_column',
      components: []
    },
    data_schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {}
    },
    capabilities: {
      ai: {
        enabled: config.aiEnabled !== false,
        model_preference: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        structured_output_schema_ref: '#/data_schema'
      },
      storage: config.storage || 'indexeddb',
      offline: config.offline !== false
    },
    permissions: {
      network: true,
      filesystem: false
    },
    secrets_handling: {
      mode: 'user_supplied_or_backend',
      notes: 'Prefer token broker; if user supplies key store encrypted locally'
    }
  }, null, 2);
}
