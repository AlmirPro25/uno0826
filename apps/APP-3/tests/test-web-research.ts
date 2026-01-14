/**
 * 🧪 TESTE DO WEB RESEARCH ENGINE
 * 
 * Testa o sistema de pesquisa real na internet
 */

import { WebResearchEngine, webResearchEngine } from '../services/WebResearchEngine';
import { AIResearchBrain, aiResearchBrain } from '../services/AIResearchBrain';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

// ============================================================================
// TESTES
// ============================================================================

async function testWikipediaAPI() {
  logSection('TESTE 1: Wikipedia API');
  
  try {
    const engine = new WebResearchEngine();
    
    logInfo('Pesquisando "TypeScript" na Wikipedia...');
    const results = await engine.quickWikipedia('TypeScript', 'en');
    
    if (results.length > 0) {
      logSuccess(`Encontrados ${results.length} resultados`);
      
      for (const packet of results) {
        console.log(`\n📄 ${packet.title}`);
        console.log(`   Fonte: ${packet.source}`);
        console.log(`   URL: ${packet.url}`);
        console.log(`   Palavras: ${packet.metadata.wordCount}`);
        console.log(`   Resumo: ${packet.summary.slice(0, 200)}...`);
      }
      
      return true;
    } else {
      logError('Nenhum resultado encontrado');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

async function testDuckDuckGoAPI() {
  logSection('TESTE 2: DuckDuckGo Instant Answers');
  
  try {
    const engine = new WebResearchEngine();
    
    logInfo('Pesquisando "React JavaScript" no DuckDuckGo...');
    
    // Usar o método interno via research
    const results = await engine.research({
      query: 'React JavaScript framework',
      maxResults: 5
    });
    
    if (results.packets.length > 0) {
      logSuccess(`Encontrados ${results.packets.length} resultados em ${results.searchTime}ms`);
      
      console.log(`\n📊 Resumo:`);
      console.log(results.summary);
      
      return true;
    } else {
      logError('Nenhum resultado encontrado');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

async function testHackerNewsAPI() {
  logSection('TESTE 3: Hacker News API');
  
  try {
    const engine = new WebResearchEngine();
    
    logInfo('Pesquisando notícias sobre "AI" no Hacker News...');
    const results = await engine.quickNews('AI artificial intelligence');
    
    if (results.length > 0) {
      logSuccess(`Encontradas ${results.length} notícias`);
      
      for (const packet of results.slice(0, 3)) {
        console.log(`\n📰 ${packet.title}`);
        console.log(`   Autor: ${packet.metadata.author || 'N/A'}`);
        console.log(`   URL: ${packet.url}`);
        console.log(`   Relevância: ${(packet.relevanceScore * 100).toFixed(0)}%`);
      }
      
      return true;
    } else {
      logError('Nenhuma notícia encontrada');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

async function testDevToAPI() {
  logSection('TESTE 4: DEV.to API');
  
  try {
    const engine = new WebResearchEngine();
    
    logInfo('Pesquisando tutoriais sobre "javascript" no DEV.to...');
    const results = await engine.quickTutorials('javascript');
    
    if (results.length > 0) {
      logSuccess(`Encontrados ${results.length} tutoriais`);
      
      for (const packet of results.slice(0, 3)) {
        console.log(`\n📚 ${packet.title}`);
        console.log(`   Autor: ${packet.metadata.author || 'N/A'}`);
        console.log(`   Tempo de leitura: ${packet.metadata.readingTime} min`);
        console.log(`   URL: ${packet.url}`);
      }
      
      return true;
    } else {
      logError('Nenhum tutorial encontrado');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

async function testFullResearch() {
  logSection('TESTE 5: Pesquisa Completa (Múltiplas Fontes)');
  
  try {
    const engine = new WebResearchEngine();
    
    logInfo('Executando pesquisa completa sobre "Playwright browser automation"...');
    const results = await engine.research({
      query: 'Playwright browser automation testing',
      maxResults: 10,
      includeCode: true,
      includeNews: true
    });
    
    logSuccess(`Pesquisa concluída em ${results.searchTime}ms`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   Total de resultados: ${results.totalResults}`);
    console.log(`   Fontes: ${results.sources.join(', ')}`);
    
    console.log(`\n📝 Resumo:`);
    console.log(results.summary);
    
    console.log(`\n📄 Top 3 Resultados:`);
    for (const packet of results.packets.slice(0, 3)) {
      console.log(`\n   • ${packet.title} (${packet.source})`);
      console.log(`     Tipo: ${packet.type}`);
      console.log(`     Relevância: ${(packet.relevanceScore * 100).toFixed(0)}%`);
      if (packet.codeBlocks.length > 0) {
        console.log(`     Código: ${packet.codeBlocks.length} blocos encontrados`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

async function testAIResearchBrain() {
  logSection('TESTE 6: AI Research Brain (Integração com IA)');
  
  try {
    const brain = new AIResearchBrain();
    
    logInfo('Processando pergunta com pesquisa automática...');
    logInfo('Pergunta: "O que é WebAssembly e quais são suas vantagens?"');
    
    const response = await brain.process({
      userPrompt: 'O que é WebAssembly e quais são suas vantagens?',
      enableResearch: true,
      researchDepth: 'normal'
    });
    
    logSuccess(`Resposta gerada em ${response.processingTime}ms`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   Usou pesquisa: ${response.usedResearch ? 'Sim' : 'Não'}`);
    console.log(`   Confiança: ${(response.confidence * 100).toFixed(0)}%`);
    console.log(`   Fontes: ${response.sources.join(', ') || 'Nenhuma'}`);
    
    console.log(`\n📝 Resposta:`);
    console.log(response.answer.slice(0, 1000) + '...');
    
    return true;
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

async function testListSources() {
  logSection('TESTE 7: Listar Fontes Disponíveis');
  
  try {
    const engine = new WebResearchEngine();
    const sources = engine.listSources();
    
    logSuccess(`${sources.length} fontes configuradas`);
    
    console.log('\n📚 Fontes por tipo:');
    
    const byType: Record<string, string[]> = {};
    for (const source of sources) {
      if (!byType[source.type]) byType[source.type] = [];
      byType[source.type].push(`${source.name} (prioridade: ${source.priority})`);
    }
    
    for (const [type, names] of Object.entries(byType)) {
      console.log(`\n   ${type.toUpperCase()}:`);
      for (const name of names) {
        console.log(`     • ${name}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Erro: ${error}`);
    return false;
  }
}

// ============================================================================
// EXECUÇÃO DOS TESTES
// ============================================================================

async function runAllTests() {
  console.log('\n');
  log('🌐 WEB RESEARCH ENGINE - SUITE DE TESTES', colors.magenta);
  log('=' .repeat(60), colors.magenta);
  
  const results: { name: string; passed: boolean }[] = [];
  
  // Teste 1: Wikipedia
  results.push({
    name: 'Wikipedia API',
    passed: await testWikipediaAPI()
  });
  
  // Teste 2: DuckDuckGo
  results.push({
    name: 'DuckDuckGo API',
    passed: await testDuckDuckGoAPI()
  });
  
  // Teste 3: Hacker News
  results.push({
    name: 'Hacker News API',
    passed: await testHackerNewsAPI()
  });
  
  // Teste 4: DEV.to
  results.push({
    name: 'DEV.to API',
    passed: await testDevToAPI()
  });
  
  // Teste 5: Pesquisa Completa
  results.push({
    name: 'Pesquisa Completa',
    passed: await testFullResearch()
  });
  
  // Teste 6: AI Research Brain
  results.push({
    name: 'AI Research Brain',
    passed: await testAIResearchBrain()
  });
  
  // Teste 7: Listar Fontes
  results.push({
    name: 'Listar Fontes',
    passed: await testListSources()
  });
  
  // Resumo
  logSection('RESUMO DOS TESTES');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  for (const result of results) {
    if (result.passed) {
      logSuccess(result.name);
    } else {
      logError(result.name);
    }
  }
  
  console.log('\n' + '-'.repeat(40));
  log(`Total: ${passed}/${results.length} testes passaram`, passed === results.length ? colors.green : colors.yellow);
  
  if (failed > 0) {
    log(`⚠️  ${failed} teste(s) falharam`, colors.yellow);
  }
}

// Executar
runAllTests().catch(console.error);
