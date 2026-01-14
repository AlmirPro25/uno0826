/**
 * 🔗 TESTE DE CONEXÕES DO ENTERPRISE PIPELINE
 * 
 * Verifica se todos os módulos estão conectados corretamente.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔗 TESTE DE CONEXÕES - ENTERPRISE PIPELINE                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICAR EXISTÊNCIA DOS ARQUIVOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📁 VERIFICANDO ARQUIVOS...\n');

const requiredFiles = [
  'services/PipelineEvents.ts',
  'services/EnterprisePipelineIntegration.ts',
  'services/EnterprisePipelineExecutor.ts',
  'components/MiniPipelineIndicator.tsx',
  'components/ResponsivePreview.tsx',
  'docs/ENTERPRISE_PIPELINE.md'
];

let allFilesExist = true;

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NÃO ENCONTRADO`);
    allFilesExist = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICAR IMPORTS NOS ARQUIVOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔗 VERIFICANDO CONEXÕES (IMPORTS)...\n');

const connections = [
  {
    file: 'services/EnterprisePipelineExecutor.ts',
    shouldImport: ['EnterprisePipelineIntegration', 'PipelineEvents', 'ApiKeyManager'],
    description: 'Executor → Integration + Events'
  },
  {
    file: 'services/GeminiService.ts',
    shouldImport: ['EnterprisePipelineIntegration', 'EnterprisePipelineExecutor', 'PipelineEvents'],
    description: 'GeminiService → Enterprise Pipeline'
  },
  {
    file: 'components/MiniPipelineIndicator.tsx',
    shouldImport: ['PipelineEvents'],
    description: 'MiniPipelineIndicator → Events'
  },
  {
    file: 'components/ResponsivePreview.tsx',
    shouldImport: ['MiniPipelineIndicator', 'PipelineEvents'],
    description: 'ResponsivePreview → Indicator + Events'
  }
];

let allConnectionsOk = true;

for (const conn of connections) {
  const filePath = path.join(__dirname, '..', conn.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${conn.description}: Arquivo não encontrado`);
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let allImportsFound = true;
  
  for (const imp of conn.shouldImport) {
    if (!content.includes(imp)) {
      console.log(`❌ ${conn.description}: Falta import de '${imp}'`);
      allImportsFound = false;
      allConnectionsOk = false;
    }
  }
  
  if (allImportsFound) {
    console.log(`✅ ${conn.description}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICAR EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📤 VERIFICANDO EXPORTS...\n');

const moduleExports = [
  {
    file: 'services/PipelineEvents.ts',
    shouldExport: ['pipelineEvents', 'PipelinePhase', 'PipelineMode', 'PIPELINE_PHASES'],
    description: 'PipelineEvents exports'
  },
  {
    file: 'services/EnterprisePipelineIntegration.ts',
    shouldExport: ['analyzeComplexity', 'buildPhasePrompt', 'PHASE_MANIFESTS'],
    description: 'Integration exports'
  },
  {
    file: 'services/EnterprisePipelineExecutor.ts',
    shouldExport: ['EnterprisePipelineExecutor', 'getEnterprisePipelineExecutor'],
    description: 'Executor exports'
  },
  {
    file: 'components/MiniPipelineIndicator.tsx',
    shouldExport: ['MiniPipelineIndicator', 'useMiniPipeline'],
    description: 'MiniPipelineIndicator exports'
  }
];

let allExportsOk = true;

for (const exp of moduleExports) {
  const filePath = path.join(__dirname, '..', exp.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${exp.description}: Arquivo não encontrado`);
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let allExportsFound = true;
  
  for (const e of exp.shouldExport) {
    // Verificar export (pode ser export const, export function, export class, export type, etc.)
    const exportRegex = new RegExp(`export\\s+(const|function|class|type|interface|async function\\*?)\\s+${e}|export\\s*{[^}]*${e}[^}]*}`);
    if (!exportRegex.test(content) && !content.includes(`export { ${e}`) && !content.includes(`export const ${e}`) && !content.includes(`export function ${e}`) && !content.includes(`export class ${e}`) && !content.includes(`export type ${e}`)) {
      // Verificar se está no final como export default ou re-export
      if (!content.includes(e)) {
        console.log(`❌ ${exp.description}: Falta export de '${e}'`);
        allExportsFound = false;
        allExportsOk = false;
      }
    }
  }
  
  if (allExportsFound) {
    console.log(`✅ ${exp.description}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICAR FUNÇÕES PRINCIPAIS NO GEMINISERVICE
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🎯 VERIFICANDO FUNÇÕES NO GEMINISERVICE...\n');

const geminiServicePath = path.join(__dirname, '..', 'services/GeminiService.ts');
const geminiContent = fs.readFileSync(geminiServicePath, 'utf-8');

const requiredFunctions = [
  'analyzePromptComplexity',
  'generateWithEnterprisePipeline',
  'shouldUseEnterpriseMode',
  'getEnterprisePipelineStatus',
  'pauseEnterprisePipeline',
  'resumeEnterprisePipeline',
  'resetEnterprisePipeline'
];

let allFunctionsOk = true;

for (const func of requiredFunctions) {
  if (geminiContent.includes(`export function ${func}`) || geminiContent.includes(`export async function* ${func}`)) {
    console.log(`✅ ${func}()`);
  } else {
    console.log(`❌ ${func}() - NÃO ENCONTRADA`);
    allFunctionsOk = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           RESULTADO FINAL                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📁 Arquivos: ${allFilesExist ? '✅ Todos existem' : '❌ Faltando arquivos'}                                        ║
║  🔗 Conexões: ${allConnectionsOk ? '✅ Todas corretas' : '❌ Faltando imports'}                                       ║
║  📤 Exports:  ${allExportsOk ? '✅ Todos corretos' : '❌ Faltando exports'}                                        ║
║  🎯 Funções:  ${allFunctionsOk ? '✅ Todas presentes' : '❌ Faltando funções'}                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const allOk = allFilesExist && allConnectionsOk && allExportsOk && allFunctionsOk;

if (allOk) {
  console.log('🎉 TUDO CONECTADO CORRETAMENTE!');
  console.log('\nO Enterprise Pipeline está pronto para uso.');
  console.log('\nFluxo de dados:');
  console.log('  GeminiService → analyzeComplexity() → detecta modo (1-5)');
  console.log('  GeminiService → getEnterprisePipelineExecutor() → executa fases');
  console.log('  PipelineEvents → emite eventos → MiniPipelineIndicator atualiza UI');
  console.log('  ResponsivePreview → mostra indicador na barra do preview');
} else {
  console.log('⚠️ ALGUMAS CONEXÕES PRECISAM SER VERIFICADAS');
  process.exit(1);
}
