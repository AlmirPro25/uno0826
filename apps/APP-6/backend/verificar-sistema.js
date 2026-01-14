/**
 * 🔍 VERIFICADOR DO SISTEMA
 * Verifica se tudo está configurado corretamente
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  🔍 VERIFICADOR DO SISTEMA                            ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const checks = [];

// Verificação 1: Node.js
async function checkNode() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    checks.push({
      name: 'Node.js',
      status: true,
      message: `Versão ${version}`
    });
  } catch (error) {
    checks.push({
      name: 'Node.js',
      status: false,
      message: 'Node.js não encontrado'
    });
  }
}

// Verificação 2: NPM
async function checkNpm() {
  try {
    const { stdout } = await execAsync('npm --version');
    const version = stdout.trim();
    checks.push({
      name: 'NPM',
      status: true,
      message: `Versão ${version}`
    });
  } catch (error) {
    checks.push({
      name: 'NPM',
      status: false,
      message: 'NPM não encontrado'
    });
  }
}

// Verificação 3: Playwright
async function checkPlaywright() {
  try {
    const { stdout } = await execAsync('npm list playwright');
    if (stdout.includes('playwright@')) {
      const match = stdout.match(/playwright@([\d.]+)/);
      const version = match ? match[1] : 'desconhecida';
      checks.push({
        name: 'Playwright',
        status: true,
        message: `Versão ${version}`
      });
    } else {
      checks.push({
        name: 'Playwright',
        status: false,
        message: 'Não instalado'
      });
    }
  } catch (error) {
    checks.push({
      name: 'Playwright',
      status: false,
      message: 'Não instalado'
    });
  }
}

// Verificação 4: Chromium
async function checkChromium() {
  try {
    const { stdout } = await execAsync('npx playwright --version');
    if (stdout.includes('Version')) {
      checks.push({
        name: 'Chromium',
        status: true,
        message: 'Instalado'
      });
    } else {
      checks.push({
        name: 'Chromium',
        status: false,
        message: 'Não instalado'
      });
    }
  } catch (error) {
    checks.push({
      name: 'Chromium',
      status: false,
      message: 'Não instalado'
    });
  }
}

// Verificação 5: Porta 3002
async function checkPort() {
  try {
    const { stdout } = await execAsync('netstat -ano | findstr :3002');
    if (stdout.trim()) {
      checks.push({
        name: 'Porta 3002',
        status: false,
        message: 'Porta em uso (servidor pode estar rodando)'
      });
    } else {
      checks.push({
        name: 'Porta 3002',
        status: true,
        message: 'Porta livre'
      });
    }
  } catch (error) {
    // Erro significa que a porta está livre
    checks.push({
      name: 'Porta 3002',
      status: true,
      message: 'Porta livre'
    });
  }
}

// Verificação 6: Arquivos essenciais
async function checkFiles() {
  const files = [
    'services/remoteBrowserService.js',
    'services/browserService.js',
    'server.js',
    'package.json'
  ];
  
  let allExist = true;
  const missing = [];
  
  for (const file of files) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      allExist = false;
      missing.push(file);
    }
  }
  
  checks.push({
    name: 'Arquivos essenciais',
    status: allExist,
    message: allExist ? 'Todos presentes' : `Faltando: ${missing.join(', ')}`
  });
}

// Verificação 7: Dependências
async function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    
    const required = ['playwright', 'socket.io', 'express', 'cors'];
    const missing = required.filter(dep => !deps[dep]);
    
    checks.push({
      name: 'Dependências',
      status: missing.length === 0,
      message: missing.length === 0 ? 'Todas instaladas' : `Faltando: ${missing.join(', ')}`
    });
  } catch (error) {
    checks.push({
      name: 'Dependências',
      status: false,
      message: 'Erro ao ler package.json'
    });
  }
}

// Executar todas as verificações
async function runChecks() {
  console.log('🔍 Executando verificações...\n');
  
  await checkNode();
  await checkNpm();
  await checkPlaywright();
  await checkChromium();
  await checkPort();
  await checkFiles();
  await checkDependencies();
  
  // Exibir resultados
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESULTADOS                                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  
  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌';
    const name = check.name.padEnd(20);
    const message = check.message.padEnd(30);
    console.log(`║  ${icon} ${name} ${message.substring(0, 25)} ║`);
  });
  
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Resumo
  const passed = checks.filter(c => c.status).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`📊 Resultado: ${passed}/${total} verificações passaram (${percentage}%)\n`);
  
  // Recomendações
  const failed = checks.filter(c => !c.status);
  
  if (failed.length > 0) {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  💡 RECOMENDAÇÕES                                     ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    failed.forEach(check => {
      console.log(`║  ❌ ${check.name}`);
      
      if (check.name === 'Playwright') {
        console.log('║     Solução: npm install playwright');
      } else if (check.name === 'Chromium') {
        console.log('║     Solução: npx playwright install chromium');
      } else if (check.name === 'Porta 3002') {
        console.log('║     Solução: Servidor já está rodando ou porta ocupada');
        console.log('║     Execute: netstat -ano | findstr :3002');
      } else if (check.name === 'Dependências') {
        console.log('║     Solução: npm install');
      }
      console.log('║');
    });
    
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    // Script de correção automática
    console.log('🔧 Deseja corrigir automaticamente? Execute:\n');
    
    if (failed.some(c => c.name === 'Playwright' || c.name === 'Chromium')) {
      console.log('   npm install playwright');
      console.log('   npx playwright install chromium\n');
    }
    
    if (failed.some(c => c.name === 'Dependências')) {
      console.log('   npm install\n');
    }
    
  } else {
    console.log('🎉 Tudo está configurado corretamente!\n');
    console.log('Para iniciar o servidor, execute:');
    console.log('   npm start\n');
    console.log('Para testar o navegador remoto, execute:');
    console.log('   node test-navegador-remoto.js\n');
  }
}

// Executar
runChecks().catch(error => {
  console.error('❌ Erro ao executar verificações:', error);
  process.exit(1);
});

