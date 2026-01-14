#!/usr/bin/env node

/**
 * Script para configurar e testar os servidores MCP
 * Foco: FUNCIONALIDADE REAL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Servidores MCP para Funcionalidade Real...\n');

// 1. Verificar se o diretório mcp-servers existe
const mcpDir = path.join(process.cwd(), 'mcp-servers');
if (!fs.existsSync(mcpDir)) {
  console.error('❌ Diretório mcp-servers não encontrado!');
  process.exit(1);
}

// 2. Instalar dependências MCP
console.log('📦 Instalando dependências MCP...');
try {
  process.chdir(mcpDir);
  execSync('npm install @modelcontextprotocol/sdk', { stdio: 'inherit' });
  console.log('✅ Dependências MCP instaladas\n');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

// 3. Verificar configuração MCP
const configPath = path.join(process.cwd(), '..', '.kiro', 'settings', 'mcp.json');
if (fs.existsSync(configPath)) {
  console.log('✅ Configuração MCP encontrada em .kiro/settings/mcp.json');
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const servers = Object.keys(config.mcpServers || {});
  console.log(`📋 Servidores configurados: ${servers.join(', ')}\n`);
} else {
  console.log('⚠️  Configuração MCP não encontrada\n');
}

// 4. Testar servidores (sintaxe básica)
console.log('🔍 Testando sintaxe dos servidores...');

const servers = [
  'ai-learning-server.js',
  'project-intelligence.js'
];

servers.forEach(server => {
  try {
    execSync(`node --check ${server}`, { stdio: 'pipe' });
    console.log(`✅ ${server} - Sintaxe OK`);
  } catch (error) {
    console.error(`❌ ${server} - Erro de sintaxe:`, error.message);
  }
});

console.log('\n🎯 Configuração MCP concluída!');
console.log('\n📚 O que foi configurado:');
console.log('• ai-learning-server: Ensina IA sobre tecnologias com foco em funcionalidade');
console.log('• project-intelligence: Analisa necessidades reais do usuário');
console.log('\n🚀 A IA agora sabe:');
console.log('• Criar jogos funcionais em HTML');
console.log('• Gerar APIs sem frontend quando não necessário');
console.log('• Focar em funcionalidade ao invés de "rostinho bonito"');
console.log('• Evitar complexidade desnecessária');
console.log('\n💡 Próximo passo: Reiniciar Kiro para carregar os servidores MCP');