/**
 * 📋 EXEMPLO DE USO DO DESIGN DOC ARCHITECT
 * 
 * Este exemplo mostra como usar o Design Doc Architect
 * integrado com o AuroraBuilder para gerar documentação
 * estilo Big Tech ANTES de gerar código.
 */

import { AuroraBuilder } from '../aurora-build/core/AuroraBuilder';
import { DesignDocArchitect } from '../aurora-build/core/DesignDocArchitect';

// ============================================================================
// EXEMPLO 1: Gerar apenas Design Doc
// ============================================================================

async function exemploDesignDocSozinho() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 EXEMPLO 1: DESIGN DOC SOZINHO 📋                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const architect = new DesignDocArchitect();
  
  const result = await architect.generate({
    userPrompt: 'Sistema de pagamentos PIX em tempo real para fintech',
    autoDetectStyle: true, // Detecta automaticamente o melhor estilo
    author: 'João Silva',
    team: 'Payments Team'
  });
  
  console.log(`🎨 Estilo detectado: ${result.designDoc.style} (${result.designDoc.company})`);
  console.log(`📄 Palavras: ${result.designDoc.metadata.wordCount}`);
  console.log(`⏱️ Tempo de leitura: ${result.designDoc.metadata.estimatedReadTime}`);
  
  console.log('\n📋 SEÇÕES GERADAS:');
  console.log(`• TL;DR: ${result.designDoc.sections.tldr.substring(0, 100)}...`);
  console.log(`• Goals: ${result.designDoc.sections.goals.length} itens`);
  console.log(`• Non-Goals: ${result.designDoc.sections.nonGoals.length} itens`);
  console.log(`• Alternativas: ${result.designDoc.sections.alternatives.length} itens`);
  console.log(`• Riscos: ${result.designDoc.sections.risks.length} itens`);
  
  console.log('\n📄 MARKDOWN GERADO (primeiras 500 chars):');
  console.log(result.designDoc.markdown.substring(0, 500) + '...');
  
  return result;
}

// ============================================================================
// EXEMPLO 2: Design Doc + Código (Fluxo Completo)
// ============================================================================

async function exemploFluxoCompleto() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 EXEMPLO 2: DESIGN DOC + CÓDIGO 📋                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const aurora = new AuroraBuilder();
  
  const result = await aurora.build({
    userPrompt: 'E-commerce completo com carrinho, pagamentos Stripe e dashboard admin',
    generateDesignDoc: true, // Gera Design Doc ANTES do código
    designDocStyle: 'universal', // Usa o template Universal (melhor de todos)
    complexity: 'complex',
    author: 'Maria Santos',
    team: 'E-commerce Team'
  });
  
  console.log('📋 DESIGN DOC GERADO:');
  if (result.designDoc) {
    console.log(`• Estilo: ${result.designDoc.style}`);
    console.log(`• Goals: ${result.designDoc.sections.goals.join(', ')}`);
    console.log(`• Non-Goals: ${result.designDoc.sections.nonGoals.join(', ')}`);
  }
  
  console.log('\n🏗️ CÓDIGO GERADO:');
  console.log(`• Arquivos: ${result.code.files.length}`);
  console.log(`• Score: ${result.code.qualityScore}/100`);
  console.log(`• Pronto para produção: ${result.code.readyForProduction ? 'SIM' : 'NÃO'}`);
  
  console.log('\n📁 ARQUIVOS:');
  result.code.files.slice(0, 10).forEach(f => {
    console.log(`• ${f.path} (${f.language})`);
  });
  
  return result;
}

// ============================================================================
// EXEMPLO 3: Diferentes Estilos de Design Doc
// ============================================================================

async function exemploDiferentesEstilos() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 EXEMPLO 3: DIFERENTES ESTILOS 📋                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const architect = new DesignDocArchitect();
  
  const prompts = [
    { prompt: 'Novo produto para clientes mobile', expectedStyle: 'amazon_prfaq' },
    { prompt: 'Decisão: usar PostgreSQL ou MongoDB', expectedStyle: 'netflix' },
    { prompt: 'Refatorar API de autenticação', expectedStyle: 'stripe' },
    { prompt: 'Sistema para milhões de usuários', expectedStyle: 'meta' },
    { prompt: 'Sistema enterprise com ROI', expectedStyle: 'microsoft' },
    { prompt: 'Microserviços com Kubernetes', expectedStyle: 'uber' },
    { prompt: 'Estratégia de longo prazo', expectedStyle: 'amazon_6p' },
  ];
  
  for (const { prompt, expectedStyle } of prompts) {
    const result = await architect.generate({
      userPrompt: prompt,
      autoDetectStyle: true
    });
    
    const match = result.designDoc.style === expectedStyle ? '✅' : '⚠️';
    console.log(`${match} "${prompt.substring(0, 40)}..." → ${result.designDoc.style} (esperado: ${expectedStyle})`);
  }
}

// ============================================================================
// EXEMPLO 4: Usar Design Doc como Contexto
// ============================================================================

async function exemploDesignDocComoContexto() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 EXEMPLO 4: DESIGN DOC COMO CONTEXTO 📋                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Primeiro, gerar o Design Doc
  const architect = new DesignDocArchitect();
  const designDocResult = await architect.generate({
    userPrompt: 'Sistema de chat em tempo real com WebSocket',
    style: 'google'
  });
  
  console.log('📋 Design Doc gerado com sucesso!');
  console.log(`• Goals: ${designDocResult.designDoc.sections.goals.length}`);
  console.log(`• Riscos: ${designDocResult.designDoc.sections.risks.length}`);
  
  // Depois, usar o contexto do Design Doc no AuroraBuilder
  const aurora = new AuroraBuilder();
  const codeResult = await aurora.build({
    userPrompt: 'Sistema de chat em tempo real com WebSocket',
    context: designDocResult.auroraContext, // Passa o contexto do Design Doc
    generateDesignDoc: false // Não gerar novamente
  });
  
  console.log('\n🏗️ Código gerado com contexto do Design Doc:');
  console.log(`• Arquivos: ${codeResult.code.files.length}`);
  console.log(`• Score: ${codeResult.code.qualityScore}/100`);
}

// ============================================================================
// EXECUTAR EXEMPLOS
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║     📋 DESIGN DOC ARCHITECT - EXEMPLOS DE USO 📋                            ║');
  console.log('║                                                                              ║');
  console.log('║     "ANTES DE ESCREVER CÓDIGO, ESCREVA O PLANO."                            ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Descomentar para executar:
    // await exemploDesignDocSozinho();
    // await exemploFluxoCompleto();
    // await exemploDiferentesEstilos();
    // await exemploDesignDocComoContexto();
    
    console.log('✅ Exemplos disponíveis! Descomente as funções para executar.');
    console.log('\nEstilos disponíveis:');
    console.log('• google - Google Design Doc');
    console.log('• meta - Meta Technical Spec');
    console.log('• amazon_6p - Amazon 6-Pager');
    console.log('• amazon_prfaq - Amazon PR/FAQ');
    console.log('• microsoft - Microsoft Spec');
    console.log('• stripe - Stripe RFC');
    console.log('• netflix - Netflix ADR');
    console.log('• uber - Uber TDD');
    console.log('• universal - Best of All (recomendado)');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();
