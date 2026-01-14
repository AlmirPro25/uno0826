/**
 * 📱 WHATSAPP & SOCIAL APIS SUPREME MASTER MANIFEST
 * 
 * Especialista em criar chatbots, automações e integrações
 * com WhatsApp e redes sociais usando IA (Gemini, GPT).
 */

export const WHATSAPP_SOCIAL_MASTER_MANIFEST = {
  id: 'whatsapp-social-master',
  name: 'WhatsApp & Social APIs Supreme Master',
  version: '1.0.0',
  description: 'Especialista em chatbots, automações e integrações com redes sociais',

  // ============================================================
  // IDENTIDADE
  // ============================================================
  identity: {
    role: 'Mestre Supremo em WhatsApp & Social APIs',
    mission: 'Criar chatbots inteligentes e automações para redes sociais',
    philosophy: 'Cada mensagem é uma oportunidade de conexão. Cada automação deve parecer humana.',
    principles: [
      'Oficial quando possível - APIs oficiais para produção crítica',
      'Não-oficial para inovação - Bibliotecas RE para features avançadas',
      'IA para inteligência - LLMs transformam bots em assistentes'
    ]
  },

  // ============================================================
  // AS 30 BIBLIOTECAS ESSENCIAIS
  // ============================================================
  libraries: {
    whatsappNodeJS: [
      {
        name: 'whatsapp-web.js',
        npm: 'whatsapp-web.js',
        language: 'Node.js',
        type: 'não-oficial',
        description: 'Puppeteer-based, API orientada a objetos',
        useCase: 'Chatbots completos, fácil de usar',
        github: 'https://github.com/pedroslopez/whatsapp-web.js'
      },
      {
        name: 'Baileys',
        npm: '@whiskeysockets/baileys',
        language: 'TypeScript',
        type: 'não-oficial',
        description: 'WebSocket direto, sem browser',
        useCase: 'Alta performance, múltiplas sessões',
        github: 'https://github.com/WhiskeySockets/Baileys'
      },
      {
        name: 'venom-bot',
        npm: 'venom-bot',
        language: 'Node.js',
        type: 'não-oficial',
        description: 'Alto desempenho, Puppeteer',
        useCase: 'Integração rápida, tutoriais',
        github: 'https://github.com/orkestral/venom'
      },
      {
        name: 'open-wa/wa-automate',
        npm: '@open-wa/wa-automate',
        language: 'Node.js',
        type: 'não-oficial',
        description: 'EASY API, Node-RED ready',
        useCase: 'Automações visuais',
        github: 'https://github.com/open-wa/wa-automate-nodejs'
      },
      {
        name: 'wppconnect',
        npm: '@wppconnect-team/wppconnect',
        language: 'Node.js',
        type: 'não-oficial',
        description: 'Servidor REST pronto',
        useCase: 'Microservices, APIs',
        github: 'https://github.com/wppconnect-team/wppconnect'
      }
    ],
    whatsappOtherLanguages: [
      {
        name: 'whatsmeow',
        language: 'Go',
        type: 'não-oficial',
        description: 'Multi-device, alta escala',
        github: 'https://github.com/tulir/whatsmeow'
      },
      {
        name: 'go-whatsapp',
        language: 'Go',
        type: 'não-oficial',
        description: 'Implementação WebSocket',
        github: 'https://github.com/Rhymen/go-whatsapp'
      },
      {
        name: 'yowsup',
        language: 'Python',
        type: 'não-oficial',
        description: 'Histórica, engenharia reversa',
        github: 'https://github.com/tgalal/yowsup'
      }
    ],
    whatsappOfficial: [
      {
        name: 'WhatsApp Business Cloud API',
        type: 'oficial',
        provider: 'Meta',
        useCase: 'Produção, compliance, templates',
        docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api'
      },
      {
        name: 'Twilio WhatsApp',
        type: 'oficial',
        provider: 'Twilio',
        useCase: 'Fácil integração, billing',
        docs: 'https://www.twilio.com/whatsapp'
      },
      {
        name: '360dialog',
        type: 'oficial',
        provider: '360dialog',
        useCase: 'Enterprise, multi-número',
        docs: 'https://www.360dialog.com/'
      }
    ],
    // 📸 INSTAGRAM (14-17)
    instagram: [
      {
        id: 14,
        name: 'instagram-private-api',
        npm: 'instagram-private-api',
        language: 'Node.js',
        type: 'não-oficial',
        description: 'API completa: DMs, posts, stories, likes, follows',
        features: ['Direct Messages', 'Post/Story upload', 'Like/Comment', 'Follow/Unfollow', 'Search'],
        github: 'https://github.com/dilame/instagram-private-api',
        useCase: 'Automação completa de conta'
      },
      {
        id: 15,
        name: 'instaloader',
        pip: 'instaloader',
        language: 'Python',
        type: 'não-oficial',
        description: 'Download de perfis, posts, stories, highlights',
        features: ['Download posts', 'Download stories', 'Download highlights', 'Metadata extraction'],
        github: 'https://instaloader.github.io',
        useCase: 'Backup, análise de conteúdo'
      },
      {
        id: 16,
        name: 'instagram-web-api',
        npm: 'instagram-web-api',
        language: 'Node.js',
        type: 'não-oficial',
        description: 'Scraping via web, sem app',
        features: ['Profile scraping', 'Post data', 'Comments', 'Followers list'],
        github: 'https://github.com/jlobos/instagram-web-api',
        useCase: 'Scraping leve sem autenticação'
      },
      {
        id: 17,
        name: 'Instagram Graph API',
        language: 'REST',
        type: 'oficial',
        description: 'Business accounts, insights, publicação',
        features: ['Publish content', 'Get insights', 'Manage comments', 'Business discovery'],
        docs: 'https://developers.facebook.com/docs/instagram-api',
        useCase: 'Produção, contas business'
      }
    ],

    // 🐦 TWITTER/X (18-20)
    twitter: [
      {
        id: 18,
        name: 'twitter-api-v2',
        npm: 'twitter-api-v2',
        language: 'Node.js',
        type: 'oficial',
        description: 'SDK moderno para API v2',
        features: ['Tweet', 'Retweet', 'Like', 'Search', 'Streams', 'Spaces'],
        github: 'https://github.com/PLhery/node-twitter-api-v2',
        useCase: 'Bots, automação oficial'
      },
      {
        id: 19,
        name: 'tweepy',
        pip: 'tweepy',
        language: 'Python',
        type: 'oficial',
        description: 'SDK mais popular para Python',
        features: ['Tweet', 'Timeline', 'Search', 'Streaming', 'User management'],
        docs: 'https://tweepy.org',
        useCase: 'Análise de dados, bots Python'
      },
      {
        id: 20,
        name: 'snscrape',
        pip: 'snscrape',
        language: 'Python',
        type: 'não-oficial',
        description: 'Scraping sem API, tweets históricos',
        features: ['Historical tweets', 'User tweets', 'Search without limits', 'No API key needed'],
        github: 'https://github.com/JustAnotherArchivist/snscrape',
        useCase: 'Pesquisa, coleta de dados históricos'
      }
    ],

    // 💬 TELEGRAM (21-23)
    telegram: [
      {
        id: 21,
        name: 'telegraf',
        npm: 'telegraf',
        language: 'Node.js',
        type: 'oficial',
        description: 'Framework completo, middlewares',
        features: ['Bot API', 'Inline mode', 'Webhooks', 'Middlewares', 'Scenes/Wizards'],
        docs: 'https://telegraf.js.org',
        useCase: 'Bots complexos com fluxos'
      },
      {
        id: 22,
        name: 'python-telegram-bot',
        pip: 'python-telegram-bot',
        language: 'Python',
        type: 'oficial',
        description: 'SDK oficial, muito documentado',
        features: ['Bot API completa', 'Handlers', 'Conversations', 'Persistence'],
        docs: 'https://python-telegram-bot.org',
        useCase: 'Bots Python, integração com ML'
      },
      {
        id: 23,
        name: 'gramJS',
        npm: 'telegram',
        language: 'TypeScript',
        type: 'não-oficial',
        description: 'MTProto client, acesso total',
        features: ['User account', 'Channels', 'Groups', 'Messages history', 'Media download'],
        github: 'https://github.com/AlttiRi/gramjs',
        useCase: 'Automação de conta de usuário'
      }
    ],

    // 🎮 DISCORD (24-25)
    discord: [
      {
        id: 24,
        name: 'discord.js',
        npm: 'discord.js',
        language: 'Node.js',
        type: 'oficial',
        description: 'SDK mais popular, slash commands',
        features: ['Slash commands', 'Voice', 'Threads', 'Buttons', 'Modals', 'Embeds'],
        docs: 'https://discord.js.org',
        useCase: 'Bots de servidor, moderação'
      },
      {
        id: 25,
        name: 'discord.py',
        pip: 'discord.py',
        language: 'Python',
        type: 'oficial',
        description: 'SDK Python, cogs, extensions',
        features: ['Commands', 'Cogs', 'Voice', 'Events', 'Tasks'],
        docs: 'https://discordpy.readthedocs.io',
        useCase: 'Bots Python, integração com IA'
      }
    ],

    // 🌐 OUTRAS REDES (26-30)
    other: [
      {
        id: 26,
        name: 'praw',
        pip: 'praw',
        platform: 'Reddit',
        language: 'Python',
        type: 'oficial',
        description: 'Reddit API Wrapper',
        features: ['Posts', 'Comments', 'Subreddits', 'User data', 'Moderation'],
        docs: 'https://praw.readthedocs.io',
        useCase: 'Bots de subreddit, análise'
      },
      {
        id: 27,
        name: 'TikTok-Api',
        pip: 'TikTokApi',
        platform: 'TikTok',
        language: 'Python',
        type: 'não-oficial',
        description: 'Vídeos, perfis, trending, hashtags',
        features: ['Trending videos', 'User videos', 'Hashtag search', 'Sound search'],
        github: 'https://github.com/davidteather/TikTok-Api',
        useCase: 'Análise de tendências, scraping'
      },
      {
        id: 28,
        name: 'linkedin-api',
        pip: 'linkedin-api',
        platform: 'LinkedIn',
        language: 'Python',
        type: 'não-oficial',
        description: 'Perfis, conexões, vagas, mensagens',
        features: ['Profile data', 'Connections', 'Job search', 'Messages', 'Company data'],
        github: 'https://github.com/tomquirk/linkedin-api',
        useCase: 'Automação de networking, recrutamento'
      },
      {
        id: 29,
        name: 'fbchat',
        pip: 'fbchat',
        platform: 'Messenger',
        language: 'Python',
        type: 'não-oficial',
        description: 'Facebook Messenger, grupos, reações',
        features: ['Send messages', 'Groups', 'Reactions', 'Attachments', 'Threads'],
        github: 'https://github.com/fbchat-dev/fbchat',
        useCase: 'Automação de Messenger pessoal'
      },
      {
        id: 30,
        name: 'mastodon.py',
        pip: 'Mastodon.py',
        platform: 'Mastodon',
        language: 'Python',
        type: 'oficial',
        description: 'Fediverso, toots, timelines',
        features: ['Post toots', 'Timelines', 'Notifications', 'Search', 'Media upload'],
        docs: 'https://mastodonpy.readthedocs.io',
        useCase: 'Bots para redes descentralizadas'
      }
    ],

    // 🔧 FERRAMENTAS DE SUPORTE (31-35)
    supportTools: [
      {
        id: 31,
        name: 'Puppeteer',
        npm: 'puppeteer',
        language: 'Node.js',
        description: 'Browser automation, base para whatsapp-web.js',
        useCase: 'Scraping, automação de browser'
      },
      {
        id: 32,
        name: 'Playwright',
        npm: 'playwright',
        language: 'Node.js/Python',
        description: 'Alternativa moderna ao Puppeteer',
        useCase: 'Testes E2E, scraping avançado'
      },
      {
        id: 33,
        name: 'Selenium',
        pip: 'selenium',
        language: 'Multi',
        description: 'Clássico, multi-linguagem',
        useCase: 'Automação cross-browser'
      },
      {
        id: 34,
        name: 'Cheerio',
        npm: 'cheerio',
        language: 'Node.js',
        description: 'HTML parsing, scraping leve',
        useCase: 'Parsing de HTML sem browser'
      },
      {
        id: 35,
        name: 'Axios',
        npm: 'axios',
        language: 'Node.js',
        description: 'HTTP client para APIs REST',
        useCase: 'Requisições HTTP'
      }
    ]
  },

  // ============================================================
  // DECISÃO: OFICIAL vs NÃO-OFICIAL
  // ============================================================
  decisionMatrix: {
    useOfficial: [
      'Produção com clientes reais',
      'Compliance obrigatório (LGPD, financeiro)',
      'Precisa de templates aprovados',
      'Volume alto (>1000 msgs/dia)',
      'Não pode ter risco de bloqueio',
      'Empresa grande / contrato formal'
    ],
    useUnofficial: [
      'Prototipagem / MVP rápido',
      'Features do cliente web (reactions, status, grupos)',
      'Projeto pessoal / interno',
      'Precisa de controle total',
      'Orçamento limitado',
      'Aceita risco de quebra por updates'
    ],
    risksUnofficial: [
      'Pode parar de funcionar após update do WhatsApp',
      'Risco de ban do número',
      'Viola termos de serviço',
      'Sem suporte oficial'
    ]
  },

  // ============================================================
  // ARQUITETURA DE CHATBOT COM IA
  // ============================================================
  architecture: {
    layers: [
      {
        name: 'Message Gateway',
        description: 'Recebe mensagens de múltiplas plataformas',
        components: ['Webhook endpoint', 'WebSocket client', 'Normalizer']
      },
      {
        name: 'Session Manager',
        description: 'Gerencia estado da conversa',
        components: ['Redis store', 'Context history', 'User state']
      },
      {
        name: 'NLU Pipeline',
        description: 'Processa linguagem natural',
        components: ['Intent Classifier', 'Entity Extractor', 'Policy Moderator']
      },
      {
        name: 'LLM Service',
        description: 'Gera respostas inteligentes',
        components: ['Prompt Builder', 'Gemini/GPT API', 'Response Parser']
      },
      {
        name: 'Action Executor',
        description: 'Executa ações no backend',
        components: ['CRM connector', 'Payment gateway', 'Calendar API']
      },
      {
        name: 'Response Sender',
        description: 'Envia resposta ao usuário',
        components: ['Message formatter', 'Media handler', 'Rate limiter']
      }
    ]
  },

  // ============================================================
  // FLUXOS DE ATENDIMENTO
  // ============================================================
  flows: {
    faq: {
      name: 'FAQ Automatizado',
      steps: [
        'Usuário faz pergunta',
        'Classificar intenção como FAQ',
        'Buscar resposta no banco de FAQs',
        'Retornar resposta formatada'
      ]
    },
    humanHandoff: {
      name: 'Escalonamento Humano',
      steps: [
        'Usuário pede atendente',
        'Criar ticket no sistema',
        'Notificar atendente humano',
        'Transferir conversa'
      ]
    },
    purchase: {
      name: 'Vendas com Pagamento',
      steps: [
        'Usuário quer comprar',
        'Extrair produto desejado',
        'Buscar preço e disponibilidade',
        'Gerar cobrança PIX',
        'Enviar QR Code',
        'Confirmar pagamento via webhook'
      ]
    },
    scheduling: {
      name: 'Agendamento',
      steps: [
        'Usuário quer agendar',
        'Perguntar data preferida',
        'Buscar horários disponíveis',
        'Confirmar horário escolhido',
        'Criar evento no calendário',
        'Enviar confirmação'
      ]
    }
  },

  // ============================================================
  // PROMPTS PARA LLM (GEMINI/GPT)
  // ============================================================
  prompts: {
    atendimentoGeral: `Você é um assistente de atendimento via WhatsApp para {empresa}.
Seu nome é {nomeBot}.

REGRAS:
1. Seja conciso (máximo 300 caracteres por mensagem)
2. Use emojis com moderação
3. Sempre confirme dados importantes
4. Se não souber, diga que vai verificar
5. Para assuntos complexos, ofereça falar com humano

Histórico: {history}
Mensagem do cliente: {message}

Responda de forma natural e útil.`,

    classificadorIntencao: `Classifique a intenção da mensagem do usuário.

INTENÇÕES POSSÍVEIS:
- SAUDACAO: Oi, olá, bom dia
- FAQ: Perguntas sobre horário, preço, localização
- COMPRA: Quer comprar, fazer pedido
- SUPORTE: Problema, reclamação, dúvida técnica
- AGENDAMENTO: Marcar, agendar, reservar
- HUMANO: Quer falar com atendente
- CANCELAMENTO: Cancelar pedido, desistir
- OUTRO: Não se encaixa nas anteriores

Mensagem: "{message}"

Responda APENAS com o nome da intenção.`,

    extratorEntidades: `Extraia as entidades da mensagem do usuário.

ENTIDADES: nome, telefone, email, produto, data, horario, valor, pedido

Mensagem: "{message}"

Responda em JSON: { "entidades": { "nome": "valor ou null", ... } }`,

    resumidorContexto: `Resuma a conversa abaixo em no máximo 100 palavras,
mantendo apenas informações relevantes para continuar o atendimento.

Conversa: {fullHistory}

Resumo:`
  },

  // ============================================================
  // INTEGRAÇÕES COMUNS
  // ============================================================
  integrations: {
    payments: [
      { name: 'Mercado Pago', features: ['PIX', 'Cartão', 'Boleto'] },
      { name: 'Stripe', features: ['Cartão', 'Link de pagamento'] },
      { name: 'PagSeguro', features: ['PIX', 'Cartão', 'Boleto'] }
    ],
    crm: [
      { name: 'HubSpot', features: ['Contatos', 'Deals', 'Tickets'] },
      { name: 'Pipedrive', features: ['Leads', 'Pipeline'] },
      { name: 'Salesforce', features: ['Enterprise CRM'] }
    ],
    calendar: [
      { name: 'Google Calendar', features: ['Agendamentos', 'Lembretes'] },
      { name: 'Calendly', features: ['Links de agendamento'] }
    ],
    helpdesk: [
      { name: 'Zendesk', features: ['Tickets', 'Knowledge base'] },
      { name: 'Freshdesk', features: ['Tickets', 'Automações'] }
    ]
  },

  // ============================================================
  // MÉTRICAS
  // ============================================================
  metrics: {
    responseTime: { target: '< 3s', description: 'Tempo até primeira resposta' },
    resolutionRate: { target: '> 70%', description: 'Resolvido sem humano' },
    csat: { target: '> 4.0', description: 'Satisfação do cliente' },
    fallbackRate: { target: '< 20%', description: 'Transferido para humano' },
    uptime: { target: '> 99.5%', description: 'Disponibilidade do bot' }
  },

  // ============================================================
  // CHECKLIST
  // ============================================================
  checklist: {
    antesComeco: [
      'Definir: API oficial ou não-oficial?',
      'Número de WhatsApp dedicado (não usar pessoal!)',
      'Ambiente de teste separado',
      'Política de privacidade definida'
    ],
    desenvolvimento: [
      'Tratamento de erros robusto',
      'Reconexão automática',
      'Rate limiting (não spammar)',
      'Logs estruturados',
      'Timeout em chamadas de API'
    ],
    producao: [
      'Backup de credenciais/sessão',
      'Monitoramento de uptime',
      'Alertas de desconexão',
      'Fallback para humano',
      'Métricas de atendimento'
    ],
    seguranca: [
      'Não logar mensagens sensíveis',
      'Criptografar dados em repouso',
      'Validar inputs do usuário',
      'Rate limit por usuário',
      'Opt-in explícito para marketing'
    ]
  },

  // ============================================================
  // ANTI-PATTERNS
  // ============================================================
  antiPatterns: [
    {
      name: 'Spam e Mensagens em Massa',
      description: 'Enviar mensagens para lista de números sem opt-in',
      consequence: 'Ban permanente do número'
    },
    {
      name: 'Ignorar Rate Limits',
      description: 'Enviar muitas mensagens sem delay',
      consequence: 'Bloqueio temporário ou permanente'
    },
    {
      name: 'Não Tratar Desconexões',
      description: 'Bot morre silenciosamente sem reconectar',
      consequence: 'Perda de mensagens e clientes'
    },
    {
      name: 'Respostas Muito Longas',
      description: 'Enviar textos gigantes de uma vez',
      consequence: 'Experiência ruim, mensagens cortadas'
    }
  ],

  // ============================================================
  // JURAMENTO
  // ============================================================
  oath: `
    Eu não construo bots.
    Eu construo experiências de comunicação.

    Cada mensagem é uma oportunidade de ajudar.
    Cada automação deve parecer humana.
    Cada integração deve ser confiável.

    Eu respeito os limites das plataformas.
    Eu protejo os dados dos usuários.
    Eu sempre ofereço caminho para humano.

    Meus bots não apenas respondem.
    Eles CONECTAM pessoas e soluções.
  `
};

export default WHATSAPP_SOCIAL_MASTER_MANIFEST;
