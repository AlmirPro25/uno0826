/**
 * 🚀 TESTE: GERAÇÃO DE APP COMPLETO COM MÚLTIPLOS MANIFESTOS
 * 
 * Este teste simula a criação de um app de controle de gastos pessoais
 * que ativa múltiplos manifestos do sistema Alexandria Bridge.
 */

import { 
  searchManifests, 
  getAuroraManifestContext,
  listAllManifests,
  alexandriaBridge
} from '../services/AlexandriaManifestBridge';

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    🚀 TESTE: GERAÇÃO DE APP COMPLETO COM MÚLTIPLOS MANIFESTOS 🚀            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT DO APP COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════

const APP_PROMPT = `
Criar um aplicativo mobile de controle de gastos pessoais com as seguintes características:

FRONTEND:
- React Native com Expo
- Interface moderna com Tailwind (NativeWind)
- Componentes Shadcn adaptados para mobile
- Dashboard com gráficos de gastos por categoria
- Modo escuro/claro

BACKEND:
- Supabase como backend (PostgreSQL + Auth + Storage)
- Prisma como ORM para type-safety
- Row Level Security para multi-tenancy
- Edge Functions para lógica de negócio

FUNCIONALIDADES:
- Autenticação com email/senha e Google OAuth
- CRUD de transações (receitas e despesas)
- Categorização automática de gastos
- Relatórios mensais com gráficos
- Exportação para PDF/Excel
- Notificações push para lembretes
- Modo offline com sincronização

MONETIZAÇÃO:
- Versão gratuita com anúncios (AdMob)
- Versão premium sem anúncios (in-app purchase)
- Banner na tela principal
- Interstitial entre telas
- Rewarded para desbloquear features

EXTRAS:
- Testes automatizados (Jest + Testing Library)
- CI/CD com GitHub Actions
- Deploy automático na Expo/EAS
`;

console.log('📱 PROMPT DO APP:');
console.log('─'.repeat(80));
console.log(APP_PROMPT);
console.log('─'.repeat(80));

// ═══════════════════════════════════════════════════════════════════════════════
// ANÁLISE: QUAIS MANIFESTOS SÃO DETECTADOS?
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n🔍 ANÁLISE: MANIFESTOS DETECTADOS\n');

const results = searchManifests(APP_PROMPT);

console.log(`Total de manifestos detectados: ${results.length}\n`);

console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
console.log('│ MANIFESTO              │ RELEVÂNCIA │ KEYWORDS MATCHED                      │');
console.log('├─────────────────────────────────────────────────────────────────────────────┤');

for (const r of results) {
  const name = r.manifest.name.padEnd(20);
  const relevance = `${(r.relevance * 100).toFixed(0)}%`.padStart(6);
  const keywords = r.matchedKeywords.slice(0, 4).join(', ');
  console.log(`│ ${name} │ ${relevance}    │ ${keywords.substring(0, 40).padEnd(40)} │`);
}

console.log('└─────────────────────────────────────────────────────────────────────────────┘');

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIZAÇÃO DOS MANIFESTOS DETECTADOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📊 CATEGORIZAÇÃO DOS MANIFESTOS DETECTADOS\n');

const categories = {
  fundamental: results.filter(r => r.manifest.category === 'fundamental'),
  standard: results.filter(r => r.manifest.category === 'standard'),
  specialized: results.filter(r => r.manifest.category === 'specialized'),
  advanced: results.filter(r => r.manifest.category === 'advanced')
};

console.log(`🔵 FUNDAMENTAIS (${categories.fundamental.length}):`);
for (const r of categories.fundamental) {
  console.log(`   - ${r.manifest.name}: ${r.manifest.description}`);
}

console.log(`\n🟢 STANDARD (${categories.standard.length}):`);
for (const r of categories.standard) {
  console.log(`   - ${r.manifest.name}: ${r.manifest.description}`);
}

console.log(`\n🟡 ESPECIALIZADOS (${categories.specialized.length}):`);
for (const r of categories.specialized) {
  console.log(`   - ${r.manifest.name}: ${r.manifest.description}`);
}

console.log(`\n🔴 AVANÇADOS (${categories.advanced.length}):`);
for (const r of categories.advanced) {
  console.log(`   - ${r.manifest.name}: ${r.manifest.description}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTOS ESPERADOS vs DETECTADOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n✅ VERIFICAÇÃO: MANIFESTOS ESPERADOS\n');

const expectedManifests = [
  { name: 'MOBILE', reason: 'React Native, Expo, app mobile' },
  { name: 'SUPABASE', reason: 'Backend Supabase, PostgreSQL, Auth' },
  { name: 'PRISMA', reason: 'ORM Prisma para type-safety' },
  { name: 'TAILWIND', reason: 'NativeWind (Tailwind para RN)' },
  { name: 'SHADCN', reason: 'Componentes Shadcn' },
  { name: 'AD_MONETIZATION_SUPREME', reason: 'AdMob, monetização, anúncios' },
  { name: 'TDD', reason: 'Testes automatizados, Jest' },
  { name: 'ENGINEERING', reason: 'CI/CD, GitHub Actions, deploy' },
  { name: 'AUTH_PAYMENTS_FORTRESS', reason: 'Autenticação, OAuth' },
];

const detectedNames = results.map(r => r.manifest.name);

for (const expected of expectedManifests) {
  const found = detectedNames.includes(expected.name);
  const status = found ? '✅' : '❌';
  console.log(`${status} ${expected.name.padEnd(25)} - ${expected.reason}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTO GERADO PARA AURORA BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📄 CONTEXTO GERADO PARA AURORA BUILDER\n');

const context = getAuroraManifestContext(APP_PROMPT);

console.log('Tamanho do contexto:', context.length, 'caracteres');
console.log('\nPrimeiros 1000 caracteres do contexto:');
console.log('─'.repeat(80));
console.log(context.substring(0, 1000));
console.log('─'.repeat(80));
console.log('...[truncado]');

// ═══════════════════════════════════════════════════════════════════════════════
// ESTATÍSTICAS FINAIS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📈 ESTATÍSTICAS FINAIS\n');

const stats = alexandriaBridge.getStats() as { totalManifests: number; byCategory: Record<string, number>; byLevel: Record<string, number> };
const allManifests = listAllManifests();

console.log(`Total de manifestos no sistema: ${allManifests.length}`);
console.log(`Manifestos ativados para este prompt: ${results.length}`);
console.log(`Taxa de ativação: ${((results.length / allManifests.length) * 100).toFixed(1)}%`);
console.log(`\nManifestos por categoria:`, stats.byCategory);

// Manifestos com maior relevância
console.log('\n🏆 TOP 5 MANIFESTOS MAIS RELEVANTES:');
for (const r of results.slice(0, 5)) {
  console.log(`   ${r.manifest.name}: ${(r.relevance * 100).toFixed(0)}% (${r.matchedKeywords.length} keywords)`);
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ✅ ANÁLISE COMPLETA CONCLUÍDA ✅                          ║
║                                                                              ║
║  O sistema Alexandria Bridge detectou ${results.length.toString().padStart(2)} manifestos relevantes           ║
║  para a criação do app de controle de gastos pessoais.                      ║
║                                                                              ║
║  Próximo passo: Usar AuroraBuilder para gerar a estrutura do projeto.       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
