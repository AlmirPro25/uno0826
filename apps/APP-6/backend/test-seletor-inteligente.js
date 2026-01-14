/**
 * 🧪 TESTE: Seletor Inteligente de Sites
 * Testa a detecção de intenção e seleção de sites
 */

import { selectSitesForIntent, generateSearchUrls, detectUserIntent } from './services/intelligentSiteSelector.js';

console.log('🧪 ========== TESTE: SELETOR INTELIGENTE ==========\n');

// Testes de detecção de intenção
const testQueries = [
    'notícias sobre COP 30 em Belém',
    'pesquise iPhone 15',
    'previsão do tempo Salvador',
    'sintomas de gripe',
    'cotação do dólar hoje',
    'notebooks gamer',
    'como aprender Python',
    'filmes de ação',
    'passagem para Paris',
];

console.log('📊 TESTE 1: Detecção de Intenção\n');
testQueries.forEach(query => {
    const intent = detectUserIntent(query);
    console.log(`Query: "${query}"`);
    console.log(`Intenção: ${intent}\n`);
});

console.log('\n📋 TESTE 2: Seleção de Sites\n');

// Teste 1: Notícias
console.log('=== TESTE: Notícias ===');
const news = selectSitesForIntent('notícias sobre COP 30 em Belém', 5);
console.log(`Intenção: ${news.intent}`);
console.log(`Sites (${news.sites.length}):`, news.sites.map(s => s.name).join(', '));
console.log('');

// Teste 2: Produtos
console.log('=== TESTE: Produtos ===');
const products = selectSitesForIntent('pesquise iPhone 15', 5);
console.log(`Intenção: ${products.intent}`);
console.log(`Sites (${products.sites.length}):`, products.sites.map(s => s.name).join(', '));
console.log('');

// Teste 3: Clima
console.log('=== TESTE: Clima ===');
const weather = selectSitesForIntent('previsão do tempo Salvador', 5);
console.log(`Intenção: ${weather.intent}`);
console.log(`Sites (${weather.sites.length}):`, weather.sites.map(s => s.name).join(', '));
console.log('');

// Teste 4: Saúde
console.log('=== TESTE: Saúde ===');
const health = selectSitesForIntent('sintomas de gripe', 5);
console.log(`Intenção: ${health.intent}`);
console.log(`Sites (${health.sites.length}):`, health.sites.map(s => s.name).join(', '));
console.log('');

// Teste 5: Finanças
console.log('=== TESTE: Finanças ===');
const finance = selectSitesForIntent('cotação do dólar hoje', 5);
console.log(`Intenção: ${finance.intent}`);
console.log(`Sites (${finance.sites.length}):`, finance.sites.map(s => s.name).join(', '));
console.log('');

console.log('\n🔗 TESTE 3: Geração de URLs\n');

// Teste geração de URLs
const urls = generateSearchUrls('iPhone 15', 5);
console.log(`Query: "${urls.query}"`);
console.log(`Intenção: ${urls.intent}`);
console.log(`URLs geradas (${urls.urls.length}):`);
urls.urls.forEach((u, i) => {
    console.log(`${i + 1}. ${u.site}: ${u.url}`);
});

console.log('\n✅ ========== TESTES CONCLUÍDOS ==========');
