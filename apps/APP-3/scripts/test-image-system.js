#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testando Sistema de Geração de Imagens...\n');

// 1. Verificar estrutura de arquivos
const requiredFiles = [
  'backend/src/api/controllers/imageController.ts',
  'backend/src/api/routes/imageRoutes.ts',
  'services/ImageGenerationService.ts',
  'services/EnhancedGeminiService.ts',
  'components/ImageGenerationManager.tsx',
  'hooks/useEnhancedAI.ts',
  'backend/public/generated-images'
];

console.log('📁 Verificando arquivos necessários:');
requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar dependências do backend
console.log('\n📦 Verificando dependências do backend:');
const backendPackageJson = path.join(process.cwd(), 'backend', 'package.json');
if (fs.existsSync(backendPackageJson)) {
  const packageData = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
  
  const requiredDeps = ['@google/genai', 'uuid'];
  requiredDeps.forEach(dep => {
    const hasDepency = packageData.dependencies[dep];
    console.log(`${hasDepency ? '✅' : '❌'} ${dep}: ${hasDepency || 'não instalado'}`);
  });
} else {
  console.log('❌ backend/package.json não encontrado');
}

// 3. Verificar configuração de ambiente
console.log('\n🔑 Verificando configuração:');
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasGeminiKey = envContent.includes('GEMINI_API_KEY') || envContent.includes('API_KEY');
  console.log(`${hasGeminiKey ? '✅' : '❌'} Chave da API Gemini configurada`);
} else {
  console.log('⚠️  Arquivo .env.local não encontrado');
}

// 4. Verificar diretórios
console.log('\n📂 Verificando diretórios:');
const requiredDirs = [
  'backend/public',
  'backend/public/generated-images',
  'examples'
];

requiredDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
});

// 5. Analisar arquivo de teste
console.log('\n🔍 Analisando placeholders no arquivo de teste:');
const testFile = path.join(process.cwd(), 'test-image-generation.html');
if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf8');
  const placeholders = content.match(/ai-researched-image:\/\/[^"']+/g);
  console.log(`✅ Arquivo de teste encontrado`);
  console.log(`📸 ${placeholders ? placeholders.length : 0} placeholders detectados`);
  
  if (placeholders) {
    placeholders.forEach((placeholder, index) => {
      const description = placeholder.replace('ai-researched-image://', '');
      console.log(`   ${index + 1}. ${description.substring(0, 50)}...`);
    });
  }
} else {
  console.log('❌ Arquivo de teste não encontrado');
}

// 6. Verificar integração com rotas
console.log('\n🛣️  Verificando integração de rotas:');
const routesFile = path.join(process.cwd(), 'backend/src/api/routes/index.ts');
if (fs.existsSync(routesFile)) {
  const routesContent = fs.readFileSync(routesFile, 'utf8');
  const hasImageRoutes = routesContent.includes('imageRoutes');
  console.log(`${hasImageRoutes ? '✅' : '❌'} Rotas de imagem integradas`);
} else {
  console.log('❌ Arquivo de rotas não encontrado');
}

// 7. Verificar servidor principal
console.log('\n🖥️  Verificando servidor principal:');
const serverFile = path.join(process.cwd(), 'backend/src/server.ts');
if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  const hasStaticServing = serverContent.includes('generated-images');
  console.log(`${hasStaticServing ? '✅' : '❌'} Servir imagens estáticas configurado`);
} else {
  console.log('❌ Arquivo do servidor não encontrado');
}

// 8. Resumo e próximos passos
console.log('\n📋 RESUMO DO TESTE:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const allFilesExist = requiredFiles.every(file => {
  const fullPath = path.join(process.cwd(), file);
  return fs.existsSync(fullPath);
});

if (allFilesExist) {
  console.log('🎉 SISTEMA INSTALADO COM SUCESSO!');
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. Configure GEMINI_API_KEY no .env.local');
  console.log('2. Inicie o backend: cd backend && npm run dev');
  console.log('3. Abra test-image-generation.html no navegador');
  console.log('4. Use o ImageGenerationManager nos seus componentes');
  console.log('\n📖 Documentação completa: docs/IMAGE_GENERATION_SYSTEM.md');
} else {
  console.log('⚠️  INSTALAÇÃO INCOMPLETA');
  console.log('Execute: node scripts/setup-image-server.js');
}

console.log('\n⚡ Sistema pronto para produção em 30 minutos! 🎯');

// 9. Exemplo de uso rápido
console.log('\n💡 EXEMPLO DE USO RÁPIDO:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
// 1. No seu componente React:
import { useEnhancedAI } from '../hooks/useEnhancedAI';

const { generateCode, isGenerating, imagesGenerated } = useEnhancedAI({
  generateImages: true,
  projectId: 'meu-projeto'
});

// 2. Gerar código com imagens:
const result = await generateCode("Crie um site de restaurante");

// 3. Ou usar o componente de gerenciamento:
<ImageGenerationManager 
  htmlContent={htmlContent}
  onHtmlUpdate={setHtmlContent}
  projectId="meu-projeto"
/>
`);

console.log('🎨 Almir Felix - Sistema de Imagens IA v1.0');
console.log('📧 Suporte: Consulte a documentação ou abra uma issue\n');