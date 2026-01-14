/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🌐 UNIVERSAL INTEGRATOR: MESTRE DAS APIs DO MUNDO - LEVEL 12 🌐        ║
 * ║                                                                              ║
 * ║         "SE EXISTE NA INTERNET, EU SEI CONECTAR."                           ║
 * ║                                                                              ║
 * ║                    O AGENTE QUE DOMINA TODAS AS APIs                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// CATÁLOGO UNIVERSAL DE APIs
// ============================================================================

export interface APIService {
  name: string;
  category: string;
  baseUrl: string;
  authType: 'apiKey' | 'oauth2' | 'bearer' | 'basic' | 'none';
  envVar: string;
  docs: string;
  freeTier: boolean;
  useCases: string[];
  codeSnippet: string;
}

export const API_CATALOG: Record<string, APIService[]> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧠 INTELIGÊNCIA ARTIFICIAL
  // ═══════════════════════════════════════════════════════════════════════════
  ai: [
    {
      name: 'Google Gemini',
      category: 'ai',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      authType: 'apiKey',
      envVar: 'GEMINI_API_KEY',
      docs: 'https://ai.google.dev/docs',
      freeTier: true,
      useCases: ['Geração de texto', 'Análise de imagens', 'Code generation', 'Multimodal'],
      codeSnippet: `
const response = await fetch(\`\${GEMINI_URL}/models/gemini-pro:generateContent?key=\${API_KEY}\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
});`
    },
    {
      name: 'OpenAI GPT',
      category: 'ai',
      baseUrl: 'https://api.openai.com/v1',
      authType: 'bearer',
      envVar: 'OPENAI_API_KEY',
      docs: 'https://platform.openai.com/docs',
      freeTier: false,
      useCases: ['Chat', 'Embeddings', 'DALL-E', 'Whisper'],
      codeSnippet: `
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gpt-4', messages: [{ role: 'user', content: prompt }] })
});`
    },
    {
      name: 'Anthropic Claude',
      category: 'ai',
      baseUrl: 'https://api.anthropic.com/v1',
      authType: 'apiKey',
      envVar: 'ANTHROPIC_API_KEY',
      docs: 'https://docs.anthropic.com',
      freeTier: false,
      useCases: ['Análise longa', 'Código', 'Raciocínio'],
      codeSnippet: `
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'claude-3-opus-20240229', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] })
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌤️ CLIMA E METEOROLOGIA
  // ═══════════════════════════════════════════════════════════════════════════
  weather: [
    {
      name: 'OpenWeatherMap',
      category: 'weather',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      authType: 'apiKey',
      envVar: 'OPENWEATHER_API_KEY',
      docs: 'https://openweathermap.org/api',
      freeTier: true,
      useCases: ['Clima atual', 'Previsão 5 dias', 'Alertas'],
      codeSnippet: `
const weather = await fetch(\`https://api.openweathermap.org/data/2.5/weather?q=\${city}&appid=\${API_KEY}&units=metric&lang=pt_br\`);`
    },
    {
      name: 'WeatherAPI',
      category: 'weather',
      baseUrl: 'https://api.weatherapi.com/v1',
      authType: 'apiKey',
      envVar: 'WEATHERAPI_KEY',
      docs: 'https://www.weatherapi.com/docs',
      freeTier: true,
      useCases: ['Clima', 'Astronomia', 'Histórico'],
      codeSnippet: `
const weather = await fetch(\`https://api.weatherapi.com/v1/current.json?key=\${API_KEY}&q=\${city}&lang=pt\`);`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 📰 NOTÍCIAS
  // ═══════════════════════════════════════════════════════════════════════════
  news: [
    {
      name: 'NewsAPI',
      category: 'news',
      baseUrl: 'https://newsapi.org/v2',
      authType: 'apiKey',
      envVar: 'NEWSAPI_KEY',
      docs: 'https://newsapi.org/docs',
      freeTier: true,
      useCases: ['Headlines', 'Busca de notícias', 'Fontes'],
      codeSnippet: `
const news = await fetch(\`https://newsapi.org/v2/top-headlines?country=br&apiKey=\${API_KEY}\`);`
    },
    {
      name: 'GNews',
      category: 'news',
      baseUrl: 'https://gnews.io/api/v4',
      authType: 'apiKey',
      envVar: 'GNEWS_API_KEY',
      docs: 'https://gnews.io/docs',
      freeTier: true,
      useCases: ['Notícias globais', 'Busca por tópico'],
      codeSnippet: `
const news = await fetch(\`https://gnews.io/api/v4/top-headlines?country=br&token=\${API_KEY}\`);`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 📚 CONHECIMENTO E PESQUISA
  // ═══════════════════════════════════════════════════════════════════════════
  knowledge: [
    {
      name: 'Wikipedia',
      category: 'knowledge',
      baseUrl: 'https://pt.wikipedia.org/api/rest_v1',
      authType: 'none',
      envVar: '',
      docs: 'https://www.mediawiki.org/wiki/REST_API',
      freeTier: true,
      useCases: ['Resumos', 'Artigos completos', 'Busca'],
      codeSnippet: `
const wiki = await fetch(\`https://pt.wikipedia.org/api/rest_v1/page/summary/\${encodeURIComponent(termo)}\`);`
    },
    {
      name: 'Google Custom Search',
      category: 'knowledge',
      baseUrl: 'https://www.googleapis.com/customsearch/v1',
      authType: 'apiKey',
      envVar: 'GOOGLE_SEARCH_API_KEY',
      docs: 'https://developers.google.com/custom-search',
      freeTier: true,
      useCases: ['Busca web', 'Busca de imagens'],
      codeSnippet: `
const results = await fetch(\`https://www.googleapis.com/customsearch/v1?key=\${API_KEY}&cx=\${SEARCH_ENGINE_ID}&q=\${query}\`);`
    },
    {
      name: 'DuckDuckGo Instant',
      category: 'knowledge',
      baseUrl: 'https://api.duckduckgo.com',
      authType: 'none',
      envVar: '',
      docs: 'https://duckduckgo.com/api',
      freeTier: true,
      useCases: ['Respostas instantâneas', 'Definições'],
      codeSnippet: `
const answer = await fetch(\`https://api.duckduckgo.com/?q=\${query}&format=json\`);`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🗺️ MAPAS E GEOLOCALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  maps: [
    {
      name: 'Google Maps',
      category: 'maps',
      baseUrl: 'https://maps.googleapis.com/maps/api',
      authType: 'apiKey',
      envVar: 'GOOGLE_MAPS_API_KEY',
      docs: 'https://developers.google.com/maps',
      freeTier: true,
      useCases: ['Geocoding', 'Rotas', 'Places', 'Street View'],
      codeSnippet: `
const geo = await fetch(\`https://maps.googleapis.com/maps/api/geocode/json?address=\${endereco}&key=\${API_KEY}\`);`
    },
    {
      name: 'OpenStreetMap Nominatim',
      category: 'maps',
      baseUrl: 'https://nominatim.openstreetmap.org',
      authType: 'none',
      envVar: '',
      docs: 'https://nominatim.org/release-docs/latest/api/Overview/',
      freeTier: true,
      useCases: ['Geocoding gratuito', 'Busca de endereços'],
      codeSnippet: `
const geo = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${endereco}&format=json\`);`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 💰 FINANÇAS E ECONOMIA
  // ═══════════════════════════════════════════════════════════════════════════
  finance: [
    {
      name: 'ExchangeRate API',
      category: 'finance',
      baseUrl: 'https://api.exchangerate-api.com/v4',
      authType: 'none',
      envVar: '',
      docs: 'https://www.exchangerate-api.com/docs',
      freeTier: true,
      useCases: ['Cotação de moedas', 'Conversão'],
      codeSnippet: `
const rates = await fetch('https://api.exchangerate-api.com/v4/latest/USD');`
    },
    {
      name: 'Banco Central Brasil',
      category: 'finance',
      baseUrl: 'https://olinda.bcb.gov.br/olinda/servico',
      authType: 'none',
      envVar: '',
      docs: 'https://dadosabertos.bcb.gov.br/',
      freeTier: true,
      useCases: ['PTAX', 'SELIC', 'Indicadores econômicos'],
      codeSnippet: `
const ptax = await fetch('https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27\${data}%27&$format=json');`
    },
    {
      name: 'Alpha Vantage',
      category: 'finance',
      baseUrl: 'https://www.alphavantage.co/query',
      authType: 'apiKey',
      envVar: 'ALPHAVANTAGE_API_KEY',
      docs: 'https://www.alphavantage.co/documentation/',
      freeTier: true,
      useCases: ['Ações', 'Crypto', 'Forex', 'Indicadores técnicos'],
      codeSnippet: `
const stock = await fetch(\`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=\${symbol}&apikey=\${API_KEY}\`);`
    },
    {
      name: 'CoinGecko',
      category: 'finance',
      baseUrl: 'https://api.coingecko.com/api/v3',
      authType: 'none',
      envVar: '',
      docs: 'https://www.coingecko.com/en/api/documentation',
      freeTier: true,
      useCases: ['Preços crypto', 'Market cap', 'Histórico'],
      codeSnippet: `
const crypto = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl');`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 💳 PAGAMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  payments: [
    {
      name: 'Mercado Pago',
      category: 'payments',
      baseUrl: 'https://api.mercadopago.com',
      authType: 'bearer',
      envVar: 'MERCADO_PAGO_ACCESS_TOKEN',
      docs: 'https://www.mercadopago.com.br/developers/pt/docs',
      freeTier: true,
      useCases: ['PIX', 'Cartão', 'Boleto', 'Checkout'],
      codeSnippet: `
const payment = await fetch('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${ACCESS_TOKEN}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ transaction_amount: 100, payment_method_id: 'pix', payer: { email } })
});`
    },
    {
      name: 'Stripe',
      category: 'payments',
      baseUrl: 'https://api.stripe.com/v1',
      authType: 'bearer',
      envVar: 'STRIPE_SECRET_KEY',
      docs: 'https://stripe.com/docs/api',
      freeTier: true,
      useCases: ['Cartão internacional', 'Subscriptions', 'Invoices'],
      codeSnippet: `
const intent = await fetch('https://api.stripe.com/v1/payment_intents', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${SECRET_KEY}\`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'amount=1000&currency=brl'
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 📱 COMUNICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  communication: [
    {
      name: 'Twilio',
      category: 'communication',
      baseUrl: 'https://api.twilio.com/2010-04-01',
      authType: 'basic',
      envVar: 'TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN',
      docs: 'https://www.twilio.com/docs',
      freeTier: true,
      useCases: ['SMS', 'WhatsApp', 'Voz', 'Verificação'],
      codeSnippet: `
const sms = await fetch(\`https://api.twilio.com/2010-04-01/Accounts/\${ACCOUNT_SID}/Messages.json\`, {
  method: 'POST',
  headers: { 'Authorization': 'Basic ' + btoa(\`\${ACCOUNT_SID}:\${AUTH_TOKEN}\`), 'Content-Type': 'application/x-www-form-urlencoded' },
  body: \`To=\${to}&From=\${from}&Body=\${message}\`
});`
    },
    {
      name: 'SendGrid',
      category: 'communication',
      baseUrl: 'https://api.sendgrid.com/v3',
      authType: 'bearer',
      envVar: 'SENDGRID_API_KEY',
      docs: 'https://docs.sendgrid.com/',
      freeTier: true,
      useCases: ['Email transacional', 'Templates', 'Marketing'],
      codeSnippet: `
const email = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: from }, subject, content: [{ type: 'text/plain', value: body }] })
});`
    },
    {
      name: 'Telegram Bot',
      category: 'communication',
      baseUrl: 'https://api.telegram.org/bot',
      authType: 'apiKey',
      envVar: 'TELEGRAM_BOT_TOKEN',
      docs: 'https://core.telegram.org/bots/api',
      freeTier: true,
      useCases: ['Bots', 'Notificações', 'Grupos'],
      codeSnippet: `
const msg = await fetch(\`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage?chat_id=\${chatId}&text=\${encodeURIComponent(text)}\`);`
    },
    {
      name: 'Discord Webhook',
      category: 'communication',
      baseUrl: 'https://discord.com/api/webhooks',
      authType: 'none',
      envVar: 'DISCORD_WEBHOOK_URL',
      docs: 'https://discord.com/developers/docs',
      freeTier: true,
      useCases: ['Notificações', 'Alertas', 'Logs'],
      codeSnippet: `
const msg = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: message, embeds: [{ title, description, color: 0x00ff00 }] })
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 MÍDIA (IMAGEM, ÁUDIO, VÍDEO)
  // ═══════════════════════════════════════════════════════════════════════════
  media: [
    {
      name: 'YouTube Data API',
      category: 'media',
      baseUrl: 'https://www.googleapis.com/youtube/v3',
      authType: 'apiKey',
      envVar: 'YOUTUBE_API_KEY',
      docs: 'https://developers.google.com/youtube/v3',
      freeTier: true,
      useCases: ['Busca de vídeos', 'Playlists', 'Canais', 'Comentários'],
      codeSnippet: `
const videos = await fetch(\`https://www.googleapis.com/youtube/v3/search?part=snippet&q=\${query}&key=\${API_KEY}\`);`
    },
    {
      name: 'Unsplash',
      category: 'media',
      baseUrl: 'https://api.unsplash.com',
      authType: 'bearer',
      envVar: 'UNSPLASH_ACCESS_KEY',
      docs: 'https://unsplash.com/documentation',
      freeTier: true,
      useCases: ['Imagens gratuitas', 'Busca por tema'],
      codeSnippet: `
const photos = await fetch(\`https://api.unsplash.com/search/photos?query=\${query}&client_id=\${ACCESS_KEY}\`);`
    },
    {
      name: 'ElevenLabs',
      category: 'media',
      baseUrl: 'https://api.elevenlabs.io/v1',
      authType: 'apiKey',
      envVar: 'ELEVENLABS_API_KEY',
      docs: 'https://docs.elevenlabs.io/',
      freeTier: true,
      useCases: ['Text-to-Speech', 'Clonagem de voz', 'Vozes realistas'],
      codeSnippet: `
const audio = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
  method: 'POST',
  headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 💾 BANCO DE DADOS E STORAGE
  // ═══════════════════════════════════════════════════════════════════════════
  database: [
    {
      name: 'Supabase',
      category: 'database',
      baseUrl: 'https://<project>.supabase.co/rest/v1',
      authType: 'apiKey',
      envVar: 'SUPABASE_URL,SUPABASE_ANON_KEY',
      docs: 'https://supabase.com/docs',
      freeTier: true,
      useCases: ['PostgreSQL', 'Auth', 'Storage', 'Realtime'],
      codeSnippet: `
const data = await fetch(\`\${SUPABASE_URL}/rest/v1/\${table}?select=*\`, {
  headers: { 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` }
});`
    },
    {
      name: 'Firebase',
      category: 'database',
      baseUrl: 'https://<project>.firebaseio.com',
      authType: 'apiKey',
      envVar: 'FIREBASE_API_KEY,FIREBASE_PROJECT_ID',
      docs: 'https://firebase.google.com/docs',
      freeTier: true,
      useCases: ['Firestore', 'Realtime DB', 'Auth', 'Hosting'],
      codeSnippet: `
const data = await fetch(\`https://\${PROJECT_ID}.firebaseio.com/\${path}.json?auth=\${TOKEN}\`);`
    },
    {
      name: 'Cloudflare R2',
      category: 'database',
      baseUrl: 'https://<account>.r2.cloudflarestorage.com',
      authType: 'bearer',
      envVar: 'R2_ACCESS_KEY,R2_SECRET_KEY',
      docs: 'https://developers.cloudflare.com/r2/',
      freeTier: true,
      useCases: ['Object storage', 'S3 compatível', 'CDN'],
      codeSnippet: `// Usa SDK S3 compatível
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({ region: 'auto', endpoint: R2_ENDPOINT, credentials: { accessKeyId, secretAccessKey } });`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚀 DEPLOY E INFRAESTRUTURA
  // ═══════════════════════════════════════════════════════════════════════════
  deploy: [
    {
      name: 'Vercel',
      category: 'deploy',
      baseUrl: 'https://api.vercel.com',
      authType: 'bearer',
      envVar: 'VERCEL_TOKEN',
      docs: 'https://vercel.com/docs/rest-api',
      freeTier: true,
      useCases: ['Deploy frontend', 'Serverless', 'Edge functions'],
      codeSnippet: `
const deploy = await fetch('https://api.vercel.com/v13/deployments', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${TOKEN}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: projectName, gitSource: { type: 'github', repo, ref: 'main' } })
});`
    },
    {
      name: 'Cloudflare Workers',
      category: 'deploy',
      baseUrl: 'https://api.cloudflare.com/client/v4',
      authType: 'bearer',
      envVar: 'CLOUDFLARE_API_TOKEN',
      docs: 'https://developers.cloudflare.com/workers/',
      freeTier: true,
      useCases: ['Edge computing', 'Serverless', 'KV storage'],
      codeSnippet: `
const worker = await fetch(\`https://api.cloudflare.com/client/v4/accounts/\${accountId}/workers/scripts/\${scriptName}\`, {
  method: 'PUT',
  headers: { 'Authorization': \`Bearer \${TOKEN}\`, 'Content-Type': 'application/javascript' },
  body: workerCode
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔐 AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  auth: [
    {
      name: 'Auth0',
      category: 'auth',
      baseUrl: 'https://<tenant>.auth0.com',
      authType: 'oauth2',
      envVar: 'AUTH0_DOMAIN,AUTH0_CLIENT_ID,AUTH0_CLIENT_SECRET',
      docs: 'https://auth0.com/docs',
      freeTier: true,
      useCases: ['SSO', 'Social login', 'MFA', 'JWT'],
      codeSnippet: `
const token = await fetch(\`https://\${AUTH0_DOMAIN}/oauth/token\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, audience: API_IDENTIFIER })
});`
    },
    {
      name: 'Clerk',
      category: 'auth',
      baseUrl: 'https://api.clerk.com/v1',
      authType: 'bearer',
      envVar: 'CLERK_SECRET_KEY',
      docs: 'https://clerk.com/docs',
      freeTier: true,
      useCases: ['Auth moderno', 'User management', 'Organizations'],
      codeSnippet: `
const users = await fetch('https://api.clerk.com/v1/users', {
  headers: { 'Authorization': \`Bearer \${SECRET_KEY}\` }
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🤖 AUTOMAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  automation: [
    {
      name: 'GitHub API',
      category: 'automation',
      baseUrl: 'https://api.github.com',
      authType: 'bearer',
      envVar: 'GITHUB_TOKEN',
      docs: 'https://docs.github.com/en/rest',
      freeTier: true,
      useCases: ['Repos', 'Issues', 'Actions', 'Webhooks'],
      codeSnippet: `
const repos = await fetch('https://api.github.com/user/repos', {
  headers: { 'Authorization': \`Bearer \${TOKEN}\`, 'Accept': 'application/vnd.github+json' }
});`
    },
    {
      name: 'Zapier Webhooks',
      category: 'automation',
      baseUrl: 'https://hooks.zapier.com/hooks/catch',
      authType: 'none',
      envVar: 'ZAPIER_WEBHOOK_URL',
      docs: 'https://zapier.com/apps/webhook',
      freeTier: true,
      useCases: ['Integração 5000+ apps', 'Automação no-code'],
      codeSnippet: `
const trigger = await fetch(ZAPIER_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'new_order', data: orderData })
});`
    },
    {
      name: 'n8n',
      category: 'automation',
      baseUrl: 'https://<instance>.n8n.cloud/api/v1',
      authType: 'apiKey',
      envVar: 'N8N_API_KEY',
      docs: 'https://docs.n8n.io/api/',
      freeTier: true,
      useCases: ['Workflows', 'Self-hosted', 'Open source'],
      codeSnippet: `
const workflow = await fetch(\`\${N8N_URL}/api/v1/workflows\`, {
  headers: { 'X-N8N-API-KEY': API_KEY }
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 ANALYTICS E MONITORAMENTO
  // ═══════════════════════════════════════════════════════════════════════════
  analytics: [
    {
      name: 'Google Analytics',
      category: 'analytics',
      baseUrl: 'https://analyticsdata.googleapis.com/v1beta',
      authType: 'oauth2',
      envVar: 'GOOGLE_ANALYTICS_PROPERTY_ID',
      docs: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
      freeTier: true,
      useCases: ['Métricas de site', 'Relatórios', 'Eventos'],
      codeSnippet: `
const report = await fetch(\`https://analyticsdata.googleapis.com/v1beta/properties/\${PROPERTY_ID}:runReport\`, {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${ACCESS_TOKEN}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }], metrics: [{ name: 'activeUsers' }] })
});`
    },
    {
      name: 'Sentry',
      category: 'analytics',
      baseUrl: 'https://sentry.io/api/0',
      authType: 'bearer',
      envVar: 'SENTRY_AUTH_TOKEN',
      docs: 'https://docs.sentry.io/api/',
      freeTier: true,
      useCases: ['Error tracking', 'Performance', 'Alertas'],
      codeSnippet: `
const issues = await fetch(\`https://sentry.io/api/0/projects/\${org}/\${project}/issues/\`, {
  headers: { 'Authorization': \`Bearer \${AUTH_TOKEN}\` }
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌐 REDES SOCIAIS
  // ═══════════════════════════════════════════════════════════════════════════
  social: [
    {
      name: 'Twitter/X API',
      category: 'social',
      baseUrl: 'https://api.twitter.com/2',
      authType: 'oauth2',
      envVar: 'TWITTER_BEARER_TOKEN',
      docs: 'https://developer.twitter.com/en/docs',
      freeTier: true,
      useCases: ['Tweets', 'Busca', 'Trends', 'Users'],
      codeSnippet: `
const tweets = await fetch(\`https://api.twitter.com/2/tweets/search/recent?query=\${query}\`, {
  headers: { 'Authorization': \`Bearer \${BEARER_TOKEN}\` }
});`
    },
    {
      name: 'LinkedIn API',
      category: 'social',
      baseUrl: 'https://api.linkedin.com/v2',
      authType: 'oauth2',
      envVar: 'LINKEDIN_ACCESS_TOKEN',
      docs: 'https://learn.microsoft.com/en-us/linkedin/',
      freeTier: true,
      useCases: ['Perfil', 'Posts', 'Companies'],
      codeSnippet: `
const profile = await fetch('https://api.linkedin.com/v2/me', {
  headers: { 'Authorization': \`Bearer \${ACCESS_TOKEN}\` }
});`
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════
  utilities: [
    {
      name: 'QR Code Generator',
      category: 'utilities',
      baseUrl: 'https://api.qrserver.com/v1',
      authType: 'none',
      envVar: '',
      docs: 'https://goqr.me/api/',
      freeTier: true,
      useCases: ['Gerar QR codes', 'Ler QR codes'],
      codeSnippet: `
const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(data)}\`;`
    },
    {
      name: 'IP Geolocation',
      category: 'utilities',
      baseUrl: 'https://ipapi.co',
      authType: 'none',
      envVar: '',
      docs: 'https://ipapi.co/api/',
      freeTier: true,
      useCases: ['Localização por IP', 'País', 'Cidade'],
      codeSnippet: `
const location = await fetch(\`https://ipapi.co/\${ip}/json/\`);`
    },
    {
      name: 'PDF Generation (PDFShift)',
      category: 'utilities',
      baseUrl: 'https://api.pdfshift.io/v3',
      authType: 'basic',
      envVar: 'PDFSHIFT_API_KEY',
      docs: 'https://docs.pdfshift.io/',
      freeTier: true,
      useCases: ['HTML para PDF', 'Relatórios', 'Invoices'],
      codeSnippet: `
const pdf = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
  method: 'POST',
  headers: { 'Authorization': 'Basic ' + btoa(\`api:\${API_KEY}\`), 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: htmlContent })
});`
    }
  ]
};


// ============================================================================
// MOTOR DE INTEGRAÇÃO UNIVERSAL
// ============================================================================

export class UniversalIntegrator {
  
  /**
   * Detecta quais APIs são necessárias baseado no prompt
   */
  static detectRequiredAPIs(prompt: string): APIService[] {
    const promptLower = prompt.toLowerCase();
    const required: APIService[] = [];
    
    const detectionRules: Record<string, string[]> = {
      ai: ['ia', 'inteligência artificial', 'gpt', 'gemini', 'claude', 'llm', 'chat', 'gerar texto'],
      weather: ['clima', 'tempo', 'previsão', 'temperatura', 'weather', 'meteorologia'],
      news: ['notícia', 'news', 'headline', 'jornal', 'manchete'],
      knowledge: ['wikipedia', 'pesquisa', 'busca', 'search', 'conhecimento', 'informação'],
      maps: ['mapa', 'localização', 'endereço', 'geocoding', 'rota', 'direção', 'gps'],
      finance: ['cotação', 'dólar', 'moeda', 'ação', 'bolsa', 'crypto', 'bitcoin', 'economia'],
      payments: ['pagamento', 'pix', 'cartão', 'checkout', 'cobrança', 'stripe', 'mercado pago'],
      communication: ['email', 'sms', 'whatsapp', 'telegram', 'notificação', 'mensagem'],
      media: ['youtube', 'vídeo', 'imagem', 'áudio', 'voz', 'tts', 'speech'],
      database: ['banco de dados', 'supabase', 'firebase', 'storage', 'armazenamento'],
      deploy: ['deploy', 'vercel', 'cloudflare', 'hospedagem', 'publicar'],
      auth: ['autenticação', 'login', 'oauth', 'sso', 'auth0', 'clerk'],
      automation: ['automação', 'github', 'zapier', 'workflow', 'integração'],
      analytics: ['analytics', 'métricas', 'monitoramento', 'sentry', 'erro'],
      social: ['twitter', 'linkedin', 'rede social', 'post', 'feed'],
      utilities: ['qr code', 'pdf', 'ip', 'geolocalização']
    };
    
    for (const [category, keywords] of Object.entries(detectionRules)) {
      if (keywords.some(kw => promptLower.includes(kw))) {
        const apis = API_CATALOG[category];
        if (apis) {
          required.push(...apis);
        }
      }
    }
    
    return required;
  }

  /**
   * Gera código de integração para as APIs detectadas
   */
  static generateIntegrationCode(apis: APIService[]): string {
    const envVars: string[] = [];
    const imports: string[] = [];
    const functions: string[] = [];
    
    for (const api of apis) {
      if (api.envVar) {
        envVars.push(`${api.envVar}=your_key_here`);
      }
      
      functions.push(`
// ═══════════════════════════════════════════════════════════════════════════
// ${api.name.toUpperCase()} - ${api.useCases.join(', ')}
// Docs: ${api.docs}
// ═══════════════════════════════════════════════════════════════════════════
${api.codeSnippet}
`);
    }
    
    return `
// ═══════════════════════════════════════════════════════════════════════════
// VARIÁVEIS DE AMBIENTE NECESSÁRIAS (.env)
// ═══════════════════════════════════════════════════════════════════════════
/*
${envVars.join('\n')}
*/

${functions.join('\n')}
`;
  }

  /**
   * Retorna todas as APIs de uma categoria
   */
  static getAPIsByCategory(category: string): APIService[] {
    return API_CATALOG[category] || [];
  }

  /**
   * Retorna todas as APIs gratuitas
   */
  static getFreeAPIs(): APIService[] {
    const free: APIService[] = [];
    for (const apis of Object.values(API_CATALOG)) {
      free.push(...apis.filter(api => api.freeTier));
    }
    return free;
  }

  /**
   * Gera um .env template com todas as variáveis necessárias
   */
  static generateEnvTemplate(apis: APIService[]): string {
    const lines: string[] = [
      '# ═══════════════════════════════════════════════════════════════════════════',
      '# VARIÁVEIS DE AMBIENTE - UNIVERSAL INTEGRATOR',
      '# ═══════════════════════════════════════════════════════════════════════════',
      ''
    ];
    
    const categories = new Set(apis.map(a => a.category));
    
    for (const cat of categories) {
      lines.push(`# ${cat.toUpperCase()}`);
      for (const api of apis.filter(a => a.category === cat)) {
        if (api.envVar) {
          for (const envVar of api.envVar.split(',')) {
            lines.push(`${envVar.trim()}=`);
          }
        }
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
}


// ============================================================================
// MANIFESTO TEXTUAL (para injeção no prompt)
// ============================================================================

export const UNIVERSAL_INTEGRATOR_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      🌐 UNIVERSAL INTEGRATOR: MESTRE DAS APIs DO MUNDO - LEVEL 12 🌐        ║
║                                                                              ║
║         "SE EXISTE NA INTERNET, EU SEI CONECTAR."                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
⚡ DIRETIVA SUPREMA
═══════════════════════════════════════════════════════════════════════════════

Você é um AGENTE UNIVERSAL INTEGRADOR.
Sua missão: criar aplicativos COMPLETOS, FUNCIONAIS e CONECTADOS com APIs REAIS.

NUNCA simule. NUNCA invente. SEMPRE prepare integração REAL.

Quando receber qualquer pedido, você DEVE:
1. Conectar automaticamente com APIs relevantes
2. Criar código pronto para uso real
3. Preparar variáveis de ambiente e chaves
4. Incluir instruções claras de instalação
5. Gerar arquitetura completa
6. Entregar tudo funcionando, organizado e profissional

═══════════════════════════════════════════════════════════════════════════════
🧠 INTELIGÊNCIA ARTIFICIAL
═══════════════════════════════════════════════════════════════════════════════

GEMINI (Principal)
├── URL: https://generativelanguage.googleapis.com/v1beta
├── ENV: GEMINI_API_KEY
├── Uso: Geração de texto, análise de imagens, code generation, multimodal
└── Código:
    fetch(\`\${URL}/models/gemini-pro:generateContent?key=\${KEY}\`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

OPENAI GPT
├── URL: https://api.openai.com/v1
├── ENV: OPENAI_API_KEY
├── Uso: Chat, embeddings, DALL-E, Whisper
└── Header: Authorization: Bearer \${KEY}

ANTHROPIC CLAUDE
├── URL: https://api.anthropic.com/v1
├── ENV: ANTHROPIC_API_KEY
├── Uso: Análise longa, código, raciocínio
└── Header: x-api-key: \${KEY}

═══════════════════════════════════════════════════════════════════════════════
🌤️ CLIMA E METEOROLOGIA
═══════════════════════════════════════════════════════════════════════════════

OPENWEATHERMAP
├── URL: https://api.openweathermap.org/data/2.5
├── ENV: OPENWEATHER_API_KEY
├── Uso: Clima atual, previsão 5 dias, alertas
└── Código: fetch(\`\${URL}/weather?q=\${city}&appid=\${KEY}&units=metric&lang=pt_br\`)

WEATHERAPI
├── URL: https://api.weatherapi.com/v1
├── ENV: WEATHERAPI_KEY
└── Uso: Clima, astronomia, histórico

═══════════════════════════════════════════════════════════════════════════════
📰 NOTÍCIAS
═══════════════════════════════════════════════════════════════════════════════

NEWSAPI
├── URL: https://newsapi.org/v2
├── ENV: NEWSAPI_KEY
├── Uso: Headlines, busca de notícias, fontes
└── Código: fetch(\`\${URL}/top-headlines?country=br&apiKey=\${KEY}\`)

GNEWS
├── URL: https://gnews.io/api/v4
├── ENV: GNEWS_API_KEY
└── Uso: Notícias globais, busca por tópico

═══════════════════════════════════════════════════════════════════════════════
📚 CONHECIMENTO E PESQUISA
═══════════════════════════════════════════════════════════════════════════════

WIKIPEDIA (GRATUITO, SEM KEY)
├── URL: https://pt.wikipedia.org/api/rest_v1
├── Uso: Resumos, artigos completos, busca
└── Código: fetch(\`\${URL}/page/summary/\${termo}\`)

GOOGLE CUSTOM SEARCH
├── URL: https://www.googleapis.com/customsearch/v1
├── ENV: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID
└── Uso: Busca web, busca de imagens

DUCKDUCKGO (GRATUITO, SEM KEY)
├── URL: https://api.duckduckgo.com
└── Código: fetch(\`\${URL}/?q=\${query}&format=json\`)

═══════════════════════════════════════════════════════════════════════════════
🗺️ MAPAS E GEOLOCALIZAÇÃO
═══════════════════════════════════════════════════════════════════════════════

GOOGLE MAPS
├── URL: https://maps.googleapis.com/maps/api
├── ENV: GOOGLE_MAPS_API_KEY
└── Uso: Geocoding, rotas, places, street view

OPENSTREETMAP (GRATUITO, SEM KEY)
├── URL: https://nominatim.openstreetmap.org
└── Código: fetch(\`\${URL}/search?q=\${endereco}&format=json\`)

═══════════════════════════════════════════════════════════════════════════════
💰 FINANÇAS E ECONOMIA
═══════════════════════════════════════════════════════════════════════════════

EXCHANGERATE (GRATUITO)
├── URL: https://api.exchangerate-api.com/v4
└── Código: fetch(\`\${URL}/latest/USD\`)

BANCO CENTRAL BRASIL (GRATUITO)
├── URL: https://olinda.bcb.gov.br/olinda/servico
└── Uso: PTAX, SELIC, indicadores econômicos

COINGECKO (GRATUITO)
├── URL: https://api.coingecko.com/api/v3
└── Código: fetch(\`\${URL}/simple/price?ids=bitcoin&vs_currencies=brl\`)

ALPHA VANTAGE
├── URL: https://www.alphavantage.co/query
├── ENV: ALPHAVANTAGE_API_KEY
└── Uso: Ações, crypto, forex, indicadores técnicos

═══════════════════════════════════════════════════════════════════════════════
💳 PAGAMENTOS
═══════════════════════════════════════════════════════════════════════════════

MERCADO PAGO
├── URL: https://api.mercadopago.com
├── ENV: MERCADO_PAGO_ACCESS_TOKEN
├── Uso: PIX, cartão, boleto, checkout
└── Header: Authorization: Bearer \${TOKEN}

STRIPE
├── URL: https://api.stripe.com/v1
├── ENV: STRIPE_SECRET_KEY
└── Uso: Cartão internacional, subscriptions, invoices

═══════════════════════════════════════════════════════════════════════════════
📱 COMUNICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

TWILIO
├── URL: https://api.twilio.com/2010-04-01
├── ENV: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
└── Uso: SMS, WhatsApp, voz, verificação

SENDGRID
├── URL: https://api.sendgrid.com/v3
├── ENV: SENDGRID_API_KEY
└── Uso: Email transacional, templates, marketing

TELEGRAM BOT
├── URL: https://api.telegram.org/bot\${TOKEN}
├── ENV: TELEGRAM_BOT_TOKEN
└── Código: fetch(\`\${URL}/sendMessage?chat_id=\${id}&text=\${msg}\`)

DISCORD WEBHOOK
├── ENV: DISCORD_WEBHOOK_URL
└── Uso: Notificações, alertas, logs

═══════════════════════════════════════════════════════════════════════════════
🎬 MÍDIA (IMAGEM, ÁUDIO, VÍDEO)
═══════════════════════════════════════════════════════════════════════════════

YOUTUBE DATA API
├── URL: https://www.googleapis.com/youtube/v3
├── ENV: YOUTUBE_API_KEY
└── Uso: Busca de vídeos, playlists, canais

UNSPLASH
├── URL: https://api.unsplash.com
├── ENV: UNSPLASH_ACCESS_KEY
└── Uso: Imagens gratuitas de alta qualidade

ELEVENLABS
├── URL: https://api.elevenlabs.io/v1
├── ENV: ELEVENLABS_API_KEY
└── Uso: Text-to-Speech, clonagem de voz

═══════════════════════════════════════════════════════════════════════════════
💾 BANCO DE DADOS E STORAGE
═══════════════════════════════════════════════════════════════════════════════

SUPABASE
├── URL: https://\${PROJECT}.supabase.co
├── ENV: SUPABASE_URL, SUPABASE_ANON_KEY
└── Uso: PostgreSQL, auth, storage, realtime

FIREBASE
├── URL: https://\${PROJECT}.firebaseio.com
├── ENV: FIREBASE_API_KEY, FIREBASE_PROJECT_ID
└── Uso: Firestore, realtime DB, auth, hosting

═══════════════════════════════════════════════════════════════════════════════
🚀 DEPLOY
═══════════════════════════════════════════════════════════════════════════════

VERCEL
├── URL: https://api.vercel.com
├── ENV: VERCEL_TOKEN
└── Uso: Deploy frontend, serverless, edge

CLOUDFLARE WORKERS
├── URL: https://api.cloudflare.com/client/v4
├── ENV: CLOUDFLARE_API_TOKEN
└── Uso: Edge computing, KV storage

═══════════════════════════════════════════════════════════════════════════════
🤖 AUTOMAÇÃO
═══════════════════════════════════════════════════════════════════════════════

GITHUB API
├── URL: https://api.github.com
├── ENV: GITHUB_TOKEN
└── Uso: Repos, issues, actions, webhooks

ZAPIER WEBHOOKS
├── ENV: ZAPIER_WEBHOOK_URL
└── Uso: Integração com 5000+ apps

═══════════════════════════════════════════════════════════════════════════════
🔧 UTILIDADES
═══════════════════════════════════════════════════════════════════════════════

QR CODE (GRATUITO)
└── URL: https://api.qrserver.com/v1/create-qr-code/?data=\${data}

IP GEOLOCATION (GRATUITO)
└── URL: https://ipapi.co/\${ip}/json/

═══════════════════════════════════════════════════════════════════════════════
📋 REGRAS DE INTEGRAÇÃO
═══════════════════════════════════════════════════════════════════════════════

1. SEMPRE usar variáveis de ambiente para API keys
2. SEMPRE incluir tratamento de erros
3. SEMPRE respeitar rate limits
4. SEMPRE usar HTTPS
5. SEMPRE validar respostas antes de usar
6. SEMPRE ter fallback para APIs críticas
7. SEMPRE logar chamadas para debug
8. SEMPRE cachear quando possível

═══════════════════════════════════════════════════════════════════════════════
⚡ TEMPLATE DE INTEGRAÇÃO
═══════════════════════════════════════════════════════════════════════════════

async function callAPI(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(\`[API ERROR] \${url}:\`, error);
    throw error;
  }
}

═══════════════════════════════════════════════════════════════════════════════

"SE EXISTE NA INTERNET, EU SEI CONECTAR."

                    — Universal Integrator, Level 12
`;

// ============================================================================
// FUNÇÃO DE DETECÇÃO (para o Orchestrator)
// ============================================================================

export function shouldEnableUniversalIntegrator(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const integrationKeywords = [
    // APIs específicas
    'api', 'integração', 'integration', 'conectar', 'connect',
    'webhook', 'endpoint', 'rest', 'fetch',
    
    // Serviços
    'clima', 'weather', 'notícia', 'news', 'wikipedia',
    'mapa', 'map', 'localização', 'location',
    'pagamento', 'payment', 'pix', 'stripe',
    'email', 'sms', 'whatsapp', 'telegram',
    'youtube', 'twitter', 'linkedin',
    
    // Ações
    'buscar dados', 'pegar informação', 'consultar',
    'enviar mensagem', 'enviar email', 'notificar',
    'cotação', 'previsão', 'tempo real',
    
    // Técnico
    'third-party', 'terceiros', 'serviço externo',
    'api key', 'token', 'oauth'
  ];
  
  return integrationKeywords.some(kw => promptLower.includes(kw));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  UNIVERSAL_INTEGRATOR_MANIFEST,
  API_CATALOG,
  UniversalIntegrator,
  shouldEnableUniversalIntegrator
};
