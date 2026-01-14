#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Função para perguntar ao usuário
function pergunta(questao) {
  return new Promise((resolve) => {
    rl.question(questao, (resposta) => {
      resolve(resposta);
    });
  });
}

// Tipos de projeto disponíveis para o sistema anti-simulação
const projetosTipoAntiSimulacao = [
  { id: 'generic', nome: 'Genérico' },
  { id: 'ecommerce', nome: 'E-commerce / Loja Virtual' },
  { id: 'blog', nome: 'Blog / Site de Conteúdo' },
  { id: 'social', nome: 'Rede Social / Comunidade' },
  { id: 'dashboard', nome: 'Painel Administrativo / Dashboard' },
  { id: 'api', nome: 'API / Serviço Backend' }
];

// APIs disponíveis para integração
const apisDisponiveis = [
  { id: 'stripe', nome: 'Stripe (Pagamentos)' },
  { id: 'cloudinary', nome: 'Cloudinary (Imagens e Mídia)' },
  { id: 'nodemailer', nome: 'Nodemailer (Emails)' },
  { id: 'prisma', nome: 'Prisma (ORM para Banco de Dados)' },
  { id: 'axios', nome: 'Axios (Cliente HTTP)' },
  { id: 'firebase', nome: 'Firebase (Auth, Firestore, etc)' },
  { id: 'aws-sdk', nome: 'AWS SDK (S3, Lambda, etc)' },
  { id: 'mongodb', nome: 'MongoDB (Banco de Dados)' },
  { id: 'supabase', nome: 'Supabase (Backend as a Service)' }
];

// Medidas de segurança disponíveis
const medidasSeguranca = [
  { id: 'jwt', nome: 'JWT (Autenticação)' },
  { id: 'bcrypt', nome: 'Bcrypt (Hash de Senhas)' },
  { id: 'helmet', nome: 'Helmet (Proteção de Cabeçalhos HTTP)' },
  { id: 'rate-limiting', nome: 'Rate Limiting (Limitação de Requisições)' },
  { id: 'csrf', nome: 'CSRF (Proteção Cross-Site Request Forgery)' },
  { id: 'xss', nome: 'XSS (Proteção Cross-Site Scripting)' },
  { id: 'input-validation', nome: 'Validação de Entrada de Dados' },
  { id: 'oauth', nome: 'OAuth (Autenticação de Terceiros)' }
];

async function configurarProjeto() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 Iniciando configuração automática do projeto...${colors.reset}\n`);
  
  // Perguntar tipo de projeto
  const tipoProjeto = await pergunta(
    'Qual tipo de projeto deseja configurar?\n' +
    '1. Frontend (React/Next.js)\n' +
    '2. Backend (Node.js/Express)\n' +
    '3. Fullstack (Frontend + Backend)\n' +
    'Escolha (1-3): '
  );
  
  // Perguntar nome do projeto
  const nomeProjeto = await pergunta('Nome do projeto: ');
  
  // Perguntar se deseja usar TypeScript
  const usarTypeScript = (await pergunta('Usar TypeScript? (s/n): ')).toLowerCase() === 's';
  
  // Configurar sistema anti-simulação
  console.log(`\n${colors.bright}${colors.cyan}🛡️ Configurando Sistema Anti-Simulação...${colors.reset}`);
  
  // Perguntar tipo de projeto para anti-simulação
  console.log('\nTipos de projeto disponíveis para o sistema anti-simulação:');
  projetosTipoAntiSimulacao.forEach((tipo, index) => {
    console.log(`${index + 1}. ${tipo.nome}`);
  });
  
  const tipoAntiSimulacaoIndex = parseInt(await pergunta('Escolha o tipo de projeto (1-6): ')) - 1;
  const tipoAntiSimulacao = projetosTipoAntiSimulacao[tipoAntiSimulacaoIndex] || projetosTipoAntiSimulacao[0];
  
  // Perguntar nível de rigor
  const nivelRigor = parseInt(await pergunta('Nível de rigor para detecção de simulações (1-10, padrão: 8): ')) || 8;
  
  // Perguntar sobre APIs necessárias
  console.log('\nAPIs disponíveis para integração:');
  apisDisponiveis.forEach((api, index) => {
    console.log(`${index + 1}. ${api.nome}`);
  });
  
  const apisEscolhidasInput = await pergunta('Digite os números das APIs desejadas, separados por vírgula (ex: 1,3,5): ');
  const apisEscolhidasIndices = apisEscolhidasInput ? apisEscolhidasInput.split(',').map(num => parseInt(num.trim()) - 1) : [];
  const apisEscolhidas = apisEscolhidasIndices
    .filter(index => !isNaN(index) && index >= 0 && index < apisDisponiveis.length)
    .map(index => apisDisponiveis[index].id);
  
  // Perguntar sobre medidas de segurança
  console.log('\nMedidas de segurança disponíveis:');
  medidasSeguranca.forEach((medida, index) => {
    console.log(`${index + 1}. ${medida.nome}`);
  });
  
  const medidasEscolhidasInput = await pergunta('Digite os números das medidas de segurança desejadas, separados por vírgula (ex: 1,3,5): ');
  const medidasEscolhidasIndices = medidasEscolhidasInput ? medidasEscolhidasInput.split(',').map(num => parseInt(num.trim()) - 1) : [];
  const medidasEscolhidas = medidasEscolhidasIndices
    .filter(index => !isNaN(index) && index >= 0 && index < medidasSeguranca.length)
    .map(index => medidasSeguranca[index].id);
  
  // Perguntar sobre configuração automática
  const configAutomatica = (await pergunta('Ativar configuração automática? (s/n, padrão: s): ')).toLowerCase() !== 'n';
  
  // Configurar variáveis de ambiente
  console.log(`\n${colors.cyan}📝 Configurando variáveis de ambiente...${colors.reset}`);
  
  // Preparar configuração do sistema anti-simulação
  const configAntiSimulacao = {
    tipoAntiSimulacao,
    nivelRigor,
    apisEscolhidas,
    medidasEscolhidas,
    configAutomatica
  };
  
  if (tipoProjeto === '2' || tipoProjeto === '3') {
    // Configurar backend
    const portaBackend = await pergunta('Porta para o backend (padrão: 3001): ') || '3001';
    const urlBancoDados = await pergunta('URL do banco de dados PostgreSQL: ');
    const jwtSecret = gerarStringAleatoria(32);
    
    // Criar .env para backend
    const envBackend = `
# Configurações do Servidor
PORT=${portaBackend}
NODE_ENV=development

# Banco de Dados
DATABASE_URL="${urlBancoDados}"

# Autenticação
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=${gerarStringAleatoria(32)}
REFRESH_TOKEN_EXPIRES_IN=30d

# Stripe (Pagamentos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (Upload de Imagens)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app

# Google Gemini API
GEMINI_API_KEY=sua_chave_api_gemini
`;
    
    if (tipoProjeto === '2' || tipoProjeto === '3') {
      const backendDir = tipoProjeto === '3' ? './backend' : '.';
      if (tipoProjeto === '3' && !fs.existsSync(backendDir)) {
        fs.mkdirSync(backendDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(backendDir, '.env'), envBackend.trim());
      fs.writeFileSync(path.join(backendDir, '.env.example'), envBackend.trim());
      
      console.log('✅ Arquivo .env do backend criado com sucesso!');
    }
  }
  
  if (tipoProjeto === '1' || tipoProjeto === '3') {
    // Configurar frontend
    const portaFrontend = await pergunta('Porta para o frontend (padrão: 3000): ') || '3000';
    const urlBackend = await pergunta('URL da API backend (padrão: http://localhost:3001/api): ') || 'http://localhost:3001/api';
    
    // Criar .env para frontend
    const envFrontend = `
# Configurações do App
NEXT_PUBLIC_APP_NAME="${nomeProjeto}"
NEXT_PUBLIC_APP_URL=http://localhost:${portaFrontend}

# API
NEXT_PUBLIC_API_URL=${urlBackend}

# Stripe (Pagamentos)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...

# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_api_gemini
`;
    
    if (tipoProjeto === '1' || tipoProjeto === '3') {
      const frontendDir = tipoProjeto === '3' ? './frontend' : '.';
      if (tipoProjeto === '3' && !fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(frontendDir, '.env.local'), envFrontend.trim());
      fs.writeFileSync(path.join(frontendDir, '.env.example'), envFrontend.trim());
      
      console.log('✅ Arquivo .env do frontend criado com sucesso!');
    }
  }

  // Criar arquivo de configuração para o Gemini
  console.log('\n📝 Configurando integração com Gemini API...');
  const geminiConfig = `
// Configuração do Gemini API
const geminiConfig = {
  apiKey: process.env.${tipoProjeto === '1' ? 'NEXT_PUBLIC_GEMINI_API_KEY' : 'GEMINI_API_KEY'},
  models: {
    text: 'gemini-2.5-pro',
    chat: 'gemini-2.5-pro',
    vision: 'gemini-2.5-pro-vision',
    imageGeneration: 'gemini-2.0-flash-preview-image-generation'
  },
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
};

module.exports = geminiConfig;
`;

  const configDir = tipoProjeto === '3' ? './backend/src/config' : './src/config';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(path.join(configDir, 'gemini.config.js'), geminiConfig.trim());
  console.log('✅ Arquivo de configuração do Gemini criado com sucesso!');
  
  // Criar arquivo README com instruções
  console.log('\n📝 Criando documentação do projeto...');
  const readmeContent = `
# ${nomeProjeto}

## Sobre o Projeto

Este projeto foi configurado automaticamente com integração completa de APIs e serviços externos.

## Configuração

### Pré-requisitos

- Node.js (v14 ou superior)
- NPM ou Yarn
${tipoProjeto === '2' || tipoProjeto === '3' ? '- PostgreSQL' : ''}

### Instalação

1. Clone o repositório
2. Instale as dependências:
   \`\`\`
   npm install
   \`\`\`
3. Configure as variáveis de ambiente:
   - Copie o arquivo \`.env.example\` para \`.env\`
   - Preencha todas as variáveis com seus valores reais

## Integrações de APIs

Este projeto inclui integrações completas com as seguintes APIs e serviços:

### Google Gemini API

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma chave de API
3. Adicione a chave no arquivo \`.env\`:
   \`\`\`
   ${tipoProjeto === '1' ? 'NEXT_PUBLIC_GEMINI_API_KEY' : 'GEMINI_API_KEY'}=sua_chave_api_gemini
   \`\`\`

### Stripe (Pagamentos)

1. Crie uma conta no [Stripe](https://stripe.com)
2. No dashboard do Stripe, vá para Developers > API keys
3. Copie a "Secret key" e a "Publishable key"
4. Adicione as chaves no arquivo \`.env\`:
   \`\`\`
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLIC_KEY=pk_test_...
   \`\`\`
5. Para configurar webhooks, vá para Developers > Webhooks
6. Adicione um endpoint (ex: https://seusite.com/api/webhooks/stripe)
7. Selecione os eventos: payment_intent.succeeded, payment_intent.payment_failed
8. Copie o "Signing secret" e adicione ao \`.env\`:
   \`\`\`
   STRIPE_WEBHOOK_SECRET=whsec_...
   \`\`\`

### Cloudinary (Upload de Imagens)

1. Crie uma conta no [Cloudinary](https://cloudinary.com)
2. No dashboard, vá para Settings > Access Keys
3. Copie o "Cloud name", "API Key" e "API Secret"
4. Adicione ao arquivo \`.env\`:
   \`\`\`
   CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_api_key
   CLOUDINARY_API_SECRET=seu_api_secret
   \`\`\`

### Configuração de Email (Gmail)

1. Vá para sua conta Google > Segurança
2. Ative a verificação em duas etapas
3. Vá para "Senhas de app" e crie uma nova senha para o app
4. Adicione ao arquivo \`.env\`:
   \`\`\`
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=sua_senha_de_app
   \`\`\`

${tipoProjeto === '2' || tipoProjeto === '3' ? `### Banco de Dados PostgreSQL

1. Instale o PostgreSQL ou use um serviço como ElephantSQL/Supabase
2. Crie um novo banco de dados
3. Adicione a URL de conexão ao arquivo \`.env\`:
   \`\`\`
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/meuapp?schema=public"
   \`\`\`
4. Execute as migrações: \`npx prisma migrate dev\`
5. Execute os seeds: \`npx prisma db seed\`
` : ''}
## Inicialização do Projeto

1. Inicie o servidor de desenvolvimento:
   \`\`\`
   npm run dev
   \`\`\`
2. Acesse o projeto em: http://localhost:${tipoProjeto === '1' || tipoProjeto === '3' ? '3000' : '3001'}

## Segurança

- Todas as senhas são armazenadas com hash usando bcrypt
- Autenticação implementada com JWT e refresh tokens
- Headers de segurança configurados com Helmet
- Rate limiting para prevenir ataques de força bruta
- Validação e sanitização de todas as entradas de usuário
- HTTPS em produção

## Licença

Este projeto está licenciado sob a licença MIT.
`;

  fs.writeFileSync('README.md', readmeContent.trim());
  console.log('✅ Arquivo README.md criado com sucesso!');
  
  console.log('\n🎉 Configuração concluída com sucesso!\n');
  console.log('Próximos passos:');
  
  if (tipoProjeto === '2' || tipoProjeto === '3') {
    console.log('1. Configure suas chaves API reais no arquivo .env do backend');
    console.log('2. Execute npx prisma migrate dev para criar o banco de dados');
    console.log('3. Execute npx prisma db seed para popular o banco com dados iniciais');
  }
  
  if (tipoProjeto === '1' || tipoProjeto === '3') {
    console.log('1. Configure suas chaves API reais no arquivo .env.local do frontend');
  }
  
  console.log('\nObrigado por usar o configurador automático!\n');
  
  rl.close();
  
  // Retornar configuração do sistema anti-simulação
  return configAntiSimulacao;
}

// Função para gerar string aleatória (para secrets)
function gerarStringAleatoria(tamanho) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let resultado = '';
  for (let i = 0; i < tamanho; i++) {
    resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return resultado;
}

// Função para criar o arquivo de configuração do sistema anti-simulação
function criarArquivoConfigAntiSimulacao(config) {
  console.log(`\n${colors.cyan}Criando arquivo de configuração do sistema anti-simulação...${colors.reset}`);
  
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const configPath = path.join(configDir, 'antiSimulationConfig.js');
  
  // Gerar conteúdo do arquivo de configuração
  const configContent = `/**
 * Configuração do Sistema Anti-Simulação
 * Gerado automaticamente pelo script de configuração
 */

module.exports = {
  // Configurações gerais
  enabled: true,
  projectType: '${config.tipoAntiSimulacao.id}',
  strictnessLevel: ${config.nivelRigor},
  autoRegenerate: ${config.configAutomatica},
  maxRegenerationAttempts: 3,
  minQualityScore: 85,
  
  // Detecção de simulações
  simulationDetection: {
    detectPlaceholders: true,
    detectIncompleteCode: true,
    detectSecuritySimulations: true,
    detectAPISimulations: true,
    customPatterns: [
      // Adicione padrões personalizados aqui
    ]
  },
  
  // Integração de APIs
  apiIntegration: {
    requiredAPIs: ${JSON.stringify(config.apisEscolhidas)},
    forceRealImplementation: true
  },
  
  // Segurança
  security: {
    requiredMeasures: ${JSON.stringify(config.medidasEscolhidas)},
    enforceSecurityBestPractices: true
  },
  
  // Qualidade de código
  codeQuality: {
    enforceErrorHandling: true,
    enforceDataValidation: true,
    requireDocumentation: true,
    maxComplexity: 15
  },
  
  // Configuração automática
  autoConfiguration: {
    enabled: ${config.configAutomatica},
    generateConfigFiles: true,
    setupEnvironmentVariables: true
  },
  
  // Configurações específicas por tipo de projeto
  projectSpecific: {
    ecommerce: {
      requiredFeatures: ['cart', 'checkout', 'products', 'users'],
      requiredAPIs: ['stripe', 'cloudinary', 'nodemailer'],
      requiredSecurity: ['jwt', 'input-validation', 'xss']
    },
    blog: {
      requiredFeatures: ['posts', 'comments', 'users'],
      requiredAPIs: ['cloudinary', 'nodemailer'],
      requiredSecurity: ['input-validation', 'xss']
    },
    social: {
      requiredFeatures: ['users', 'posts', 'comments', 'notifications'],
      requiredAPIs: ['cloudinary', 'nodemailer'],
      requiredSecurity: ['jwt', 'input-validation', 'xss']
    }
  },
  
  // Mensagens personalizadas
  messages: {
    simulationDetected: 'Simulação detectada! O código gerado contém implementações simuladas que não funcionariam em produção.',
    apiSimulationDetected: 'API simulada detectada! A integração com {api} não está implementada corretamente.',
    securitySimulationDetected: 'Simulação de segurança detectada! A implementação de {security} não é real ou está incompleta.',
    codeQualityIssue: 'Problema de qualidade de código detectado: {issue}',
    regeneratingCode: 'Regenerando código para corrigir simulações...',
    configurationRequired: 'Configuração necessária: {config}'
  }
};
`;
  
  fs.writeFileSync(configPath, configContent);
  console.log(`${colors.green}✅ Arquivo de configuração criado com sucesso: ${configPath}${colors.reset}`);
}

// Executar função principal
console.log('\n📦 Script de Configuração Automática\n');
console.log('Este script irá configurar automaticamente seu projeto com todas as integrações de APIs necessárias.');
console.log('Ele criará os arquivos .env com todas as variáveis de ambiente necessárias e um arquivo de configuração para o Gemini API.');
console.log('\nPara começar, responda às perguntas a seguir:\n');

configuraProjeto().then((config) => {
  // Criar arquivo de configuração do sistema anti-simulação
  if (config && config.tipoAntiSimulacao) {
    criarArquivoConfigAntiSimulacao(config);
  }
  
  console.log(`\n${colors.bright}${colors.green}✨ Configuração concluída com sucesso!${colors.reset}\n`);
  console.log(`${colors.cyan}Para iniciar o servidor de desenvolvimento, execute:${colors.reset}`);
  console.log(`${colors.bright}npm run dev${colors.reset}\n`);
  
  rl.close();
}).catch(erro => {
  console.error(`${colors.red}❌ Erro durante a configuração:${colors.reset}`, erro);
  rl.close();
});