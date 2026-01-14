// Teste de importação
import fs from 'fs';
import path from 'path';

console.log('🔍 Verificando arquivos...');

const files = [
  'components/ChatPanel.tsx',
  'components/ResumePreview.tsx',
  'types.ts',
  'App.tsx'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Existe' : 'Não encontrado'}`);
});

console.log('\n🔍 Verificando conteúdo do App.tsx...');
const appContent = fs.readFileSync('App.tsx', 'utf8');
const hasImport = appContent.includes("import ChatPanel from './components/ChatPanel'");
console.log(`${hasImport ? '✅' : '❌'} Import do ChatPanel: ${hasImport ? 'Encontrado' : 'Não encontrado'}`);