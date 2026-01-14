/**
 * 🔗 TESTE DO CICLO RLAIF COMPLETO
 * 
 * Reinforcement Learning from AI Feedback
 * 
 * Testa o ciclo completo:
 * 1. SoulArchitect forja especialista
 * 2. Código é "gerado" (simulado)
 * 3. UnifiedQualitySystem avalia (7 camadas)
 * 4. QualityFeedbackBridge envia para Evolver
 * 5. Evolver aprende e evolui
 */

import { getSoulArchitect } from '../services/SoulArchitect';
import { getSupremeEvolver } from '../services/SupremeManifestEvolver';
import { getQualityFeedbackBridge } from '../services/QualityFeedbackBridge';

async function testRLAIFCycle() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔗 TESTE DO CICLO RLAIF - REINFORCEMENT LEARNING 🔗                 ║
║                                                                              ║
║         O QA vira os olhos do Evolver!                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  const architect = getSoulArchitect();
  const evolver = getSupremeEvolver();
  const bridge = getQualityFeedbackBridge();

  // Resetar estado para teste limpo
  evolver.resetState();

  // ═══════════════════════════════════════════════════════════════════════════
  // SIMULAÇÃO DE 5 CICLOS DE GERAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const testCases = [
    {
      prompt: "Crie um formulário de login com validação",
      code: generateMockCode('login', 85), // Código bom
      expectedSuccess: true
    },
    {
      prompt: "Crie um dashboard de analytics",
      code: generateMockCode('dashboard', 92), // Código excelente
      expectedSuccess: true
    },
    {
      prompt: "Crie uma landing page",
      code: generateMockCode('landing', 60), // Código ruim
      expectedSuccess: false
    },
    {
      prompt: "Crie um sistema de pagamentos PIX",
      code: generateMockCode('fintech', 88), // Código bom
      expectedSuccess: true
    },
    {
      prompt: "Crie um chat em tempo real",
      code: generateMockCode('chat', 75), // Código médio
      expectedSuccess: false
    }
  ];

  console.log('\n📋 Executando 5 ciclos de geração + avaliação + feedback...\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔄 CICLO ${i + 1}/5: ${testCase.prompt.substring(0, 40)}...`);
    console.log(`${'═'.repeat(70)}`);

    // 1. Forjar especialista
    console.log('\n🔮 Forjando especialista...');
    const soulResult = await architect.forgeAgentSoul(testCase.prompt);
    
    if (!soulResult.success || !soulResult.soul) {
      console.log('❌ Falha ao forjar especialista, pulando...');
      continue;
    }
    
    console.log(`   ✅ ${soulResult.soul.name}`);

    // 2. "Gerar" código (simulado)
    console.log('\n💻 Código gerado (simulado)...');
    const generatedCode = testCase.code;
    console.log(`   📝 ${generatedCode.split('\n').length} linhas`);

    // 3. Avaliar e enviar feedback (RLAIF!)
    console.log('\n🔗 Avaliando e enviando feedback (RLAIF)...');
    const feedbackResult = bridge.evaluateAndFeedback(
      generatedCode,
      soulResult.soul,
      Math.random() * 30000 + 10000 // Tempo simulado
    );

    console.log(`   📊 Score: ${feedbackResult.qualityReport.overallScore}/100`);
    console.log(`   ${feedbackResult.qualityReport.passed ? '✅ APROVADO' : '❌ REPROVADO'}`);
    console.log(`   🧬 Feedback enviado: ${feedbackResult.feedbackSent ? 'SIM' : 'NÃO'}`);
    
    if (feedbackResult.evolutionTriggered) {
      console.log(`   🧬 EVOLUÇÃO DISPARADA!`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORÇAR EVOLUÇÃO (para teste)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n\n🧬 Forçando evolução para análise...');
  await bridge.forceEvolution();

  // ═══════════════════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n' + bridge.generateRLAIFReport());

  // Mostrar princípios emergentes (se houver)
  const evolverStats = evolver.getStats();
  if (evolverStats.emergentPrinciples > 0) {
    console.log('\n💡 PRINCÍPIOS EMERGENTES DESCOBERTOS:');
    const principles = evolver.getEmergentPrinciplesForDomain('general');
    principles.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.principle.substring(0, 70)}...`);
    });
  }

  // Mostrar top manifestos
  const topPerformers = evolver.getTopPerformers(5);
  if (topPerformers.length > 0) {
    console.log('\n🏆 TOP MANIFESTOS (por performance):');
    topPerformers.forEach((g, i) => {
      console.log(`   ${i + 1}. ${g.manifestoId}: ${(g.successRate * 100).toFixed(1)}% sucesso, ${g.avgQualityScore.toFixed(1)} qualidade média`);
    });
  }

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎉 TESTE RLAIF COMPLETO! 🎉                                         ║
║                                                                              ║
║         O sistema está aprendendo automaticamente!                          ║
║         • QA avalia código (7 camadas)                                      ║
║         • Feedback alimenta o Evolver                                       ║
║         • Evolver ajusta pesos e descobre princípios                        ║
║         • Próximas gerações serão melhores!                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Gera código mock com qualidade controlada para teste
 */
function generateMockCode(type: string, targetQuality: number): string {
  // Base HTML com qualidade variável
  const hasDoctype = targetQuality > 50;
  const hasLang = targetQuality > 60;
  const hasViewport = targetQuality > 70;
  const hasSemantics = targetQuality > 75;
  const hasAccessibility = targetQuality > 80;
  const hasPerformance = targetQuality > 85;

  let code = '';

  if (hasDoctype) code += '<!DOCTYPE html>\n';
  code += `<html${hasLang ? ' lang="pt-BR"' : ''}>\n`;
  code += '<head>\n';
  code += '  <meta charset="UTF-8">\n';
  if (hasViewport) code += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  code += `  <title>${type} - Sistema</title>\n`;
  if (targetQuality > 85) code += '  <meta name="description" content="Descrição completa do sistema">\n';
  code += '</head>\n';
  code += '<body>\n';

  if (hasSemantics) {
    code += '  <header role="banner">\n';
    code += '    <nav role="navigation">\n';
    code += '      <a href="/">Home</a>\n';
    code += '    </nav>\n';
    code += '  </header>\n';
    code += '  <main role="main">\n';
  } else {
    code += '  <div class="header">\n';
    code += '    <div class="nav">\n';
    code += '      <a href="/">Home</a>\n';
    code += '    </div>\n';
    code += '  </div>\n';
    code += '  <div class="main">\n';
  }

  // Conteúdo específico por tipo
  if (type === 'login') {
    code += '    <form>\n';
    if (hasAccessibility) {
      code += '      <label for="email">Email</label>\n';
      code += '      <input type="email" id="email" name="email" required aria-required="true">\n';
      code += '      <label for="password">Senha</label>\n';
      code += '      <input type="password" id="password" name="password" required aria-required="true">\n';
    } else {
      code += '      <input type="email" placeholder="Email">\n';
      code += '      <input type="password" placeholder="Senha">\n';
    }
    code += '      <button type="submit">Entrar</button>\n';
    code += '    </form>\n';
  } else if (type === 'dashboard') {
    code += '    <section aria-label="Métricas">\n';
    code += '      <div class="card">Usuários: 1000</div>\n';
    code += '      <div class="card">Vendas: R$ 50.000</div>\n';
    code += '    </section>\n';
  } else if (type === 'fintech') {
    code += '    <section aria-label="Saldo">\n';
    code += '      <h1>Sua Carteira</h1>\n';
    code += '      <p>Saldo: R$ 1.500,00</p>\n';
    code += '      <button>Transferir via PIX</button>\n';
    code += '    </section>\n';
  } else {
    code += '    <h1>Bem-vindo</h1>\n';
    code += '    <p>Conteúdo da página</p>\n';
  }

  if (hasSemantics) {
    code += '  </main>\n';
    code += '  <footer role="contentinfo">\n';
    code += '    <p>© 2025</p>\n';
    code += '  </footer>\n';
  } else {
    code += '  </div>\n';
    code += '  <div class="footer">\n';
    code += '    <p>© 2025</p>\n';
    code += '  </div>\n';
  }

  if (hasPerformance) {
    code += '  <script defer>\n';
  } else {
    code += '  <script>\n';
  }
  code += '    console.log("Loaded");\n';
  code += '  </script>\n';
  code += '</body>\n';
  code += '</html>';

  return code;
}

// Executar teste
testRLAIFCycle().catch(console.error);
