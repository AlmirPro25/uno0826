/**
 * Teste de Integração do ADMIN_SYSTEM_MANIFEST
 * Verifica se o manifesto foi corretamente integrado ao Alexandria Bridge
 */

const path = require('path');
const fs = require('fs');

console.log('🏛️ Testando ADMIN_SYSTEM_MANIFEST Integration...\n');

// 1. Verificar se o arquivo do manifesto existe
const manifestPath = path.join(__dirname, '../services/manifestos/ADMIN_SYSTEM_MANIFEST.ts');
const manifestExists = fs.existsSync(manifestPath);
console.log(`✅ ADMIN_SYSTEM_MANIFEST.ts existe: ${manifestExists ? 'SIM' : 'NÃO'}`);

// 2. Verificar se o steering file existe
const steeringPath = path.join(__dirname, '../.kiro/steering/admin-system-master.md');
const steeringExists = fs.existsSync(steeringPath);
console.log(`✅ admin-system-master.md existe: ${steeringExists ? 'SIM' : 'NÃO'}`);

// 3. Verificar se o import foi adicionado ao Alexandria Bridge
const bridgePath = path.join(__dirname, '../services/AlexandriaManifestBridge.ts');
const bridgeContent = fs.readFileSync(bridgePath, 'utf-8');

const hasImport = bridgeContent.includes("import { ADMIN_SYSTEM_MANIFEST } from './manifestos/ADMIN_SYSTEM_MANIFEST'");
console.log(`✅ Import no Alexandria Bridge: ${hasImport ? 'SIM' : 'NÃO'}`);

// 4. Verificar se a entrada no catálogo foi adicionada
const hasCatalogEntry = bridgeContent.includes("name: 'ADMIN_SYSTEM'");
console.log(`✅ Entrada no MANIFEST_CATALOG: ${hasCatalogEntry ? 'SIM' : 'NÃO'}`);

// 5. Verificar keywords importantes
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
const keywords = [
  'admin', 'backoffice', 'rbac', 'audit', 'command center',
  'kill switch', 'feature flag', 'permissões'
];

console.log('\n📋 Keywords verificadas:');
keywords.forEach(kw => {
  const found = manifestContent.toLowerCase().includes(kw.toLowerCase());
  console.log(`   ${found ? '✅' : '❌'} ${kw}`);
});

// 6. Verificar estrutura do manifesto
const hasPhilosophy = manifestContent.includes('philosophy');
const hasArchitecture = manifestContent.includes('architecture');
const hasAuthModel = manifestContent.includes('authModel');
const hasCommandCenter = manifestContent.includes('commandCenter');
const hasAuditTrail = manifestContent.includes('auditTrail');
const hasSecurity = manifestContent.includes('security');
const hasTemplates = manifestContent.includes('templates');
const hasChecklist = manifestContent.includes('checklist');
const hasAntiPatterns = manifestContent.includes('antiPatterns');

console.log('\n📦 Estrutura do Manifesto:');
console.log(`   ${hasPhilosophy ? '✅' : '❌'} philosophy`);
console.log(`   ${hasArchitecture ? '✅' : '❌'} architecture`);
console.log(`   ${hasAuthModel ? '✅' : '❌'} authModel`);
console.log(`   ${hasCommandCenter ? '✅' : '❌'} commandCenter`);
console.log(`   ${hasAuditTrail ? '✅' : '❌'} auditTrail`);
console.log(`   ${hasSecurity ? '✅' : '❌'} security`);
console.log(`   ${hasTemplates ? '✅' : '❌'} templates`);
console.log(`   ${hasChecklist ? '✅' : '❌'} checklist`);
console.log(`   ${hasAntiPatterns ? '✅' : '❌'} antiPatterns`);

// 7. Verificar regra de ouro
const hasGoldenRule = manifestContent.includes('goldenRule') || manifestContent.includes('PAUSAR, AUDITAR, REVERTER');
console.log(`\n🏆 Regra de Ouro presente: ${hasGoldenRule ? 'SIM' : 'NÃO'}`);

// Resultado final
const allPassed = manifestExists && steeringExists && hasImport && hasCatalogEntry &&
  hasPhilosophy && hasArchitecture && hasAuthModel && hasCommandCenter &&
  hasAuditTrail && hasSecurity && hasTemplates && hasChecklist && hasAntiPatterns;

console.log('\n' + '═'.repeat(60));
if (allPassed) {
  console.log('✅ ADMIN_SYSTEM_MANIFEST integrado com SUCESSO!');
  console.log('   Level: 72 (Sprint 4 - Admin & Operations)');
  console.log('   Category: advanced');
} else {
  console.log('❌ Algumas verificações falharam. Revisar integração.');
}
console.log('═'.repeat(60));
