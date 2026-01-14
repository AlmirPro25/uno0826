#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Configurando Servidor de Imagens AI...\n');

// 1. Criar diretórios necessários
const directories = [
  'backend/public',
  'backend/public/generated-images'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Diretório criado: ${dir}`);
  } else {
    console.log(`📁 Diretório já existe: ${dir}`);
  }
});

// 2. Verificar variáveis de ambiente
const envFile = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envFile)) {
  envContent = fs.readFileSync(envFile, 'utf8');
}

// Verificar se GEMINI_API_KEY está configurada
if (!envContent.includes('GEMINI_API_KEY') && !envContent.includes('API_KEY')) {
  console.log('\n⚠️  ATENÇÃO: Configure sua chave da API do Gemini!');
  console.log('Adicione ao arquivo .env.local:');
  console.log('GEMINI_API_KEY=sua_chave_aqui');
  console.log('ou');
  console.log('API_KEY=sua_chave_aqui\n');
}

// 3. Verificar dependências do backend
const backendPackageJson = path.join(process.cwd(), 'backend', 'package.json');
if (fs.existsSync(backendPackageJson)) {
  const packageData = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
  
  const requiredDeps = ['@google/genai', 'uuid'];
  const missingDeps = requiredDeps.filter(dep => !packageData.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('\n📦 Instalando dependências do backend...');
    console.log('Execute: cd backend && npm install');
  } else {
    console.log('✅ Dependências do backend OK');
  }
}

// 4. Criar arquivo de exemplo de uso
const exampleFile = path.join(process.cwd(), 'examples', 'image-generation-example.html');
const exampleContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exemplo - Geração de Imagens AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Pizzaria Bella Vista</h1>
        
        <!-- Exemplo de placeholder de imagem -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-gray-800 rounded-lg p-6">
                <img 
                    src="ai-researched-image://pizza margherita artesanal com mussarela de búfala, tomate san marzano e manjericão fresco em forno a lenha"
                    alt="Pizza Margherita"
                    class="w-full h-48 object-cover rounded-lg mb-4"
                    data-aid="image-pizza-margherita"
                />
                <h3 class="text-xl font-semibold mb-2">Pizza Margherita Premium</h3>
                <p class="text-gray-400">Mussarela de búfala, tomate San Marzano, manjericão fresco</p>
                <p class="text-green-400 font-bold text-lg mt-2">R$ 48,90</p>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <img 
                    src="ai-researched-image://interior aconchegante de pizzaria italiana com forno a lenha, mesas de madeira e iluminação quente"
                    alt="Interior da Pizzaria"
                    class="w-full h-48 object-cover rounded-lg mb-4"
                    data-aid="image-restaurant-interior"
                />
                <h3 class="text-xl font-semibold mb-2">Ambiente Acolhedor</h3>
                <p class="text-gray-400">Tradição italiana desde 1985</p>
            </div>
        </div>
    </div>
</body>
</html>`;

if (!fs.existsSync(path.dirname(exampleFile))) {
  fs.mkdirSync(path.dirname(exampleFile), { recursive: true });
}

fs.writeFileSync(exampleFile, exampleContent);
console.log('✅ Arquivo de exemplo criado: examples/image-generation-example.html');

// 5. Instruções finais
console.log('\n🚀 CONFIGURAÇÃO CONCLUÍDA!');
console.log('\nPara usar o sistema de geração de imagens:');
console.log('1. Configure sua GEMINI_API_KEY no .env.local');
console.log('2. Inicie o backend: cd backend && npm run dev');
console.log('3. Use placeholders: src="ai-researched-image://descrição detalhada"');
console.log('4. O sistema substituirá automaticamente por URLs reais');
console.log('\n📖 Exemplo disponível em: examples/image-generation-example.html');
console.log('\n⚡ Pronto para produção em 30 minutos! 🎯');