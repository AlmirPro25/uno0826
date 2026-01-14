/**
 * 🌐 EXEMPLO DE USO DO WEB RESEARCH ENGINE
 * 
 * Demonstra como usar o sistema de pesquisa real na internet
 * 
 * Para executar:
 * npx ts-node examples/web-research-example.ts
 */

import { WebResearchEngine } from '../services/WebResearchEngine';
import { AIResearchBrain } from '../services/AIResearchBrain';

// ============================================================================
// EXEMPLO 1: Pesquisa Simples na Wikipedia
// ============================================================================

async function exemploWikipedia() {
  console.log('\n📚 EXEMPLO 1: Pesquisa na Wikipedia\n');
  
  const engine = new WebResearchEngine();
  
  // Pesquisar em português
  const resultadosPT = await engine.quickWikipedia('Inteligência Artificial', 'pt');
  
  console.log('Resultados em Português:');
  for (const resultado of resultadosPT) {
    console.log(`\n  📄 ${resultado.title}`);
    console.log(`     ${resultado.summary.slice(0, 200)}...`);
    console.log(`     🔗 ${resultado.url}`);
  }
  
  // Pesquisar em inglês
  const resultadosEN = await engine.quickWikipedia('Machine Learning', 'en');
  
  console.log('\n\nResultados em Inglês:');
  for (const resultado of resultadosEN) {
    console.log(`\n  📄 ${resultado.title}`);
    console.log(`     ${resultado.summary.slice(0, 200)}...`);
  }
}

// ============================================================================
// EXEMPLO 2: Pesquisa de Notícias Tech
// ============================================================================

async function exemploNoticias() {
  console.log('\n📰 EXEMPLO 2: Notícias Tech (Hacker News)\n');
  
  const engine = new WebResearchEngine();
  
  const noticias = await engine.quickNews('GPT AI LLM');
  
  console.log('Últimas notícias sobre IA:');
  for (const noticia of noticias.slice(0, 5)) {
    console.log(`\n  📰 ${noticia.title}`);
    console.log(`     👤 ${noticia.metadata.author || 'Anônimo'}`);
    console.log(`     🔗 ${noticia.url}`);
    console.log(`     ⭐ Relevância: ${(noticia.relevanceScore * 100).toFixed(0)}%`);
  }
}

// ============================================================================
// EXEMPLO 3: Pesquisa de Tutoriais
// ============================================================================

async function exemploTutoriais() {
  console.log('\n📚 EXEMPLO 3: Tutoriais (DEV.to)\n');
  
  const engine = new WebResearchEngine();
  
  const tutoriais = await engine.quickTutorials('react');
  
  console.log('Tutoriais sobre React:');
  for (const tutorial of tutoriais.slice(0, 5)) {
    console.log(`\n  📖 ${tutorial.title}`);
    console.log(`     👤 ${tutorial.metadata.author || 'Anônimo'}`);
    console.log(`     ⏱️  ${tutorial.metadata.readingTime} min de leitura`);
    console.log(`     🔗 ${tutorial.url}`);
  }
}

// ============================================================================
// EXEMPLO 4: Pesquisa Completa Multi-Fonte
// ============================================================================

async function exemploPesquisaCompleta() {
  console.log('\n🔍 EXEMPLO 4: Pesquisa Completa Multi-Fonte\n');
  
  const engine = new WebResearchEngine();
  
  const resultado = await engine.research({
    query: 'Playwright browser testing automation',
    maxResults: 10,
    includeCode: true,
    includeNews: true,
    language: 'en'
  });
  
  console.log('📊 Estatísticas da Pesquisa:');
  console.log(`   ⏱️  Tempo: ${resultado.searchTime}ms`);
  console.log(`   📄 Resultados: ${resultado.totalResults}`);
  console.log(`   📚 Fontes: ${resultado.sources.join(', ')}`);
  
  console.log('\n📝 Resumo:');
  console.log(resultado.summary);
  
  console.log('\n📄 Detalhes dos Resultados:');
  for (const packet of resultado.packets.slice(0, 5)) {
    console.log(`\n  • ${packet.title}`);
    console.log(`    Fonte: ${packet.source} | Tipo: ${packet.type}`);
    console.log(`    Relevância: ${(packet.relevanceScore * 100).toFixed(0)}%`);
    if (packet.codeBlocks.length > 0) {
      console.log(`    📦 ${packet.codeBlocks.length} blocos de código`);
    }
  }
}

// ============================================================================
// EXEMPLO 5: AI Research Brain - Pesquisa Inteligente
// ============================================================================

async function exemploAIResearchBrain() {
  console.log('\n🧠 EXEMPLO 5: AI Research Brain - Pesquisa Inteligente\n');
  
  const brain = new AIResearchBrain();
  
  // Pergunta que requer pesquisa
  const pergunta = 'Quais são as principais diferenças entre Playwright e Puppeteer para automação de testes?';
  
  console.log(`❓ Pergunta: "${pergunta}"\n`);
  console.log('🔄 Processando com pesquisa automática...\n');
  
  const resposta = await brain.process({
    userPrompt: pergunta,
    enableResearch: true,
    researchDepth: 'normal',
    includeCode: true
  });
  
  console.log('📊 Resultado:');
  console.log(`   ✅ Usou pesquisa: ${resposta.usedResearch ? 'Sim' : 'Não'}`);
  console.log(`   📈 Confiança: ${(resposta.confidence * 100).toFixed(0)}%`);
  console.log(`   ⏱️  Tempo: ${resposta.processingTime}ms`);
  console.log(`   📚 Fontes: ${resposta.sources.join(', ') || 'Nenhuma'}`);
  
  console.log('\n📝 Resposta:');
  console.log('-'.repeat(50));
  console.log(resposta.answer);
  console.log('-'.repeat(50));
}

// ============================================================================
// EXEMPLO 6: Pesquisa Rápida vs Profunda
// ============================================================================

async function exemploComparacaoProfundidade() {
  console.log('\n⚡ EXEMPLO 6: Comparação - Pesquisa Rápida vs Profunda\n');
  
  const brain = new AIResearchBrain();
  const query = 'WebAssembly';
  
  // Pesquisa rápida
  console.log('🚀 Pesquisa RÁPIDA:');
  const startRapida = Date.now();
  const resultadoRapido = await brain.quickSearch(query);
  console.log(`   ⏱️  Tempo: ${Date.now() - startRapida}ms`);
  console.log(`   📄 Resultados: ${resultadoRapido.packets.length}`);
  
  // Pesquisa profunda
  console.log('\n🔬 Pesquisa PROFUNDA:');
  const startProfunda = Date.now();
  const resultadoProfundo = await brain.deepSearch(query);
  console.log(`   ⏱️  Tempo: ${Date.now() - startProfunda}ms`);
  console.log(`   📄 Resultados: ${resultadoProfundo.packets.length}`);
  console.log(`   📚 Fontes: ${resultadoProfundo.sources.join(', ')}`);
}

// ============================================================================
// EXEMPLO 7: Listar Todas as Fontes Disponíveis
// ============================================================================

async function exemploListarFontes() {
  console.log('\n📚 EXEMPLO 7: Fontes Disponíveis\n');
  
  const engine = new WebResearchEngine();
  const fontes = engine.listSources();
  
  // Agrupar por tipo
  const porTipo: Record<string, typeof fontes> = {};
  for (const fonte of fontes) {
    if (!porTipo[fonte.type]) porTipo[fonte.type] = [];
    porTipo[fonte.type].push(fonte);
  }
  
  for (const [tipo, lista] of Object.entries(porTipo)) {
    console.log(`\n📁 ${tipo.toUpperCase()}:`);
    for (const fonte of lista) {
      console.log(`   • ${fonte.name}`);
      console.log(`     URL: ${fonte.url}`);
      console.log(`     Prioridade: ${fonte.priority}/10`);
      console.log(`     Rate Limit: ${fonte.rateLimit} req/min`);
    }
  }
}

// ============================================================================
// EXEMPLO 8: Uso Prático - Pesquisar Documentação
// ============================================================================

async function exemploDocumentacao() {
  console.log('\n📖 EXEMPLO 8: Pesquisar Documentação Técnica\n');
  
  const brain = new AIResearchBrain();
  
  const perguntas = [
    'Como usar async/await em JavaScript?',
    'O que é o useEffect no React?',
    'Como fazer uma requisição HTTP em Go?'
  ];
  
  for (const pergunta of perguntas) {
    console.log(`\n❓ "${pergunta}"`);
    
    const resposta = await brain.process({
      userPrompt: pergunta,
      enableResearch: true,
      researchDepth: 'quick'
    });
    
    console.log(`   📚 Fontes: ${resposta.sources.slice(0, 3).join(', ')}`);
    console.log(`   📈 Confiança: ${(resposta.confidence * 100).toFixed(0)}%`);
    console.log(`   📝 Resumo: ${resposta.answer.slice(0, 200)}...`);
  }
}

// ============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🌐 WEB RESEARCH ENGINE - EXEMPLOS DE USO');
  console.log('='.repeat(60));
  
  try {
    await exemploWikipedia();
    await exemploNoticias();
    await exemploTutoriais();
    await exemploPesquisaCompleta();
    await exemploAIResearchBrain();
    await exemploComparacaoProfundidade();
    await exemploListarFontes();
    // await exemploDocumentacao(); // Descomente para testar
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Todos os exemplos executados com sucesso!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erro ao executar exemplos:', error);
  }
}

// Executar se chamado diretamente
main();
