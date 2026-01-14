#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 AI Web Weaver - Configuração de Ambiente de Produção\n');

  try {
    // Coletar informações
    const geminiApiKey = await question('Cole sua Gemini API Key: ');
    const supabaseUrl = await question('Cole sua Supabase Project URL: ');
    const supabaseAnonKey = await question('Cole sua Supabase Anon Key: ');

    // Criar arquivo .env.production
    const envContent = `# AI Web Weaver - Production Environment
VITE_GEMINI_API_KEY=${geminiApiKey}
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}
VITE_API_URL=https://your-app.vercel.app/api
VITE_DEV_MODE=false
`;

    fs.writeFileSync('.env.production', envContent);
    console.log('✅ Arquivo .env.production criado com sucesso!');

    // Atualizar .env.local para desenvolvimento
    const devEnvContent = `# AI Web Weaver - Development Environment
VITE_GEMINI_API_KEY=${geminiApiKey}
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}
VITE_API_URL=http://localhost:5173/api
VITE_DEV_MODE=true
`;

    fs.writeFileSync('.env.local', devEnvContent);
    console.log('✅ Arquivo .env.local atualizado!');

    console.log('\n🎯 Próximos passos:');
    console.log('1. Execute: npm run build');
    console.log('2. Execute: vercel --prod');
    console.log('3. Configure as mesmas variáveis no dashboard da Vercel');

  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  } finally {
    rl.close();
  }
}

setupEnvironment();