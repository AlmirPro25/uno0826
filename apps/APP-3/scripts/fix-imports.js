#!/usr/bin/env node

/**
 * Script para corrigir imports após reorganização de estrutura
 * 
 * Corrige imports em arquivos dentro de src/ que precisam
 * subir um nível (../) para acessar pastas na raiz
 */

const fs = require('fs');
const path = require('path');

const FOLDERS_TO_FIX = ['src'];
const FOLDERS_IN_ROOT = ['services', 'components', 'store', 'types', 'hooks', 'lib'];

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Corrigir imports estáticos
  FOLDERS_IN_ROOT.forEach(folder => {
    const oldPattern = new RegExp(`from ['"]\\.\/${folder}`, 'g');
    const newPattern = `from '../${folder}`;
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
    }
  });

  // Corrigir imports dinâmicos
  FOLDERS_IN_ROOT.forEach(folder => {
    const oldPattern = new RegExp(`import\\(['"]\\.\/${folder}`, 'g');
    const newPattern = `import('../${folder}`;
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigido: ${filePath}`);
    return true;
  }

  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalFixed += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportsInFile(filePath)) {
        totalFixed++;
      }
    }
  });

  return totalFixed;
}

console.log('🔧 Corrigindo imports...\n');

let totalFixed = 0;
FOLDERS_TO_FIX.forEach(folder => {
  if (fs.existsSync(folder)) {
    console.log(`📁 Processando ${folder}/...`);
    totalFixed += processDirectory(folder);
  }
});

console.log(`\n✨ Total de arquivos corrigidos: ${totalFixed}`);

if (totalFixed === 0) {
  console.log('✅ Nenhuma correção necessária!');
} else {
  console.log('✅ Imports corrigidos com sucesso!');
}
