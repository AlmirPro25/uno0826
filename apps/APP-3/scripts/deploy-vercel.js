#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deployToVercel() {
  console.log('🚀 AI Web Weaver - Deploy para Vercel\n');

  try {
    // Verificar se o Vercel CLI está instalado
    try {
      execSync('vercel --version', { stdio: 'ignore' });
      console.log('✅ Vercel CLI detectado');
    } catch (error) {
      console.log('⚠️ Vercel CLI não encontrado. Instalando...');
      execSync('npm i -g vercel', { stdio: 'inherit' });
    }

    // Coletar informações
    const geminiApiKey = await question('Cole sua Gemini API Key: ');
    const supabaseUrl = await question('Cole sua Supabase Project URL: ');
    const supabaseAnonKey = await question('Cole sua Supabase Anon Key: ');
    
    // Verificar se o usuário já está logado no Vercel
    let isLoggedIn = false;
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      isLoggedIn = true;
      console.log('✅ Usuário já está logado no Vercel');
    } catch (error) {
      console.log('⚠️ Usuário não está logado no Vercel. Iniciando login...');
      execSync('vercel login', { stdio: 'inherit' });
    }

    // Criar arquivo .env.production
    const envContent = `# AI Web Weaver - Production Environment
VITE_GEMINI_API_KEY=${geminiApiKey}
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}
VITE_API_URL=https://seu-app.vercel.app/api
VITE_DEV_MODE=false
`;

    fs.writeFileSync('.env.production', envContent);
    console.log('✅ Arquivo .env.production criado com sucesso!');

    // Fazer build do projeto
    console.log('\n🔨 Fazendo build do projeto...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build concluído com sucesso!');

    // Perguntar se deseja fazer deploy
    const shouldDeploy = await question('\nDeseja fazer deploy para o Vercel agora? (s/n): ');
    
    if (shouldDeploy.toLowerCase() === 's') {
      console.log('\n🚀 Iniciando deploy para o Vercel...');
      
      // Configurar variáveis de ambiente no Vercel
      console.log('\n⚙️ Configurando variáveis de ambiente no Vercel...');
      execSync(`vercel env add VITE_GEMINI_API_KEY production`, { stdio: 'inherit' });
      execSync(`vercel env add VITE_SUPABASE_URL production`, { stdio: 'inherit' });
      execSync(`vercel env add VITE_SUPABASE_ANON_KEY production`, { stdio: 'inherit' });
      execSync(`vercel env add VITE_DEV_MODE production`, { stdio: 'inherit', input: Buffer.from('false\n') });
      
      // Fazer deploy
      console.log('\n🚀 Fazendo deploy para o Vercel...');
      execSync('vercel --prod', { stdio: 'inherit' });
      
      console.log('\n✅ Deploy concluído com sucesso!');
    } else {
      console.log('\n⏸️ Deploy cancelado pelo usuário.');
      console.log('Para fazer deploy manualmente, execute: vercel --prod');
    }

    console.log('\n🎯 Próximos passos:');
    console.log('1. Verifique se o site está funcionando corretamente');
    console.log('2. Configure o domínio personalizado no dashboard do Vercel (se necessário)');
    console.log('3. Verifique a integração com o Supabase');

  } catch (error) {
    console.error('\n❌ Erro no processo de deploy:', error.message);
  } finally {
    rl.close();
  }
}

deployToVercel();