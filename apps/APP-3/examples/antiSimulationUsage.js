/**
 * Exemplo de Uso do Sistema Anti-Simulação
 * 
 * Este arquivo demonstra como utilizar o sistema anti-simulação
 * em diferentes cenários de desenvolvimento.
 */

// Importar componentes necessários
const AntiSimulationIntegration = require('../src/integration/AntiSimulationIntegration').default;
const GeminiServiceEnhanced = require('../services/GeminiServiceEnhanced').default;
const SimulationDetector = require('../src/utils/SimulationDetector').default;
const CodeQualityChecker = require('../src/utils/CodeQualityChecker').default;

// Exemplo 1: Verificação básica de código
async function verificarCodigo() {
  console.log('\n--- Exemplo 1: Verificação básica de código ---');
  
  const codigo = `
    // Função de processamento de pagamento simulada
    function processarPagamento(valor, cartao) {
      // TODO: Implementar integração real com Stripe
      console.log(\`Processando pagamento de R$ \${valor}\`);
      return { sucesso: true, id: 'pagamento_123' };
    }
  `;
  
  // Criar instância do detector de simulações
  const detector = new SimulationDetector();
  
  // Verificar se o código contém simulações
  const resultado = detector.detectSimulations(codigo);
  
  console.log('Resultado da verificação:');
  console.log(`- Contém simulações: ${resultado.hasSimulation}`);
  console.log(`- Pontuação de simulação: ${resultado.simulationScore}`);
  console.log(`- Tipos de simulação detectados: ${resultado.detectedPatterns.map(p => p.type).join(', ')}`);
  console.log(`- Recomendações: ${resultado.recommendations.join('\n  ')}`);
}

// Exemplo 2: Geração de conteúdo aprimorado
async function gerarConteudoAprimorado() {
  console.log('\n--- Exemplo 2: Geração de conteúdo aprimorado ---');
  
  // Configurar o sistema anti-simulação
  AntiSimulationIntegration.updateOptions({
    projectType: 'ecommerce',
    strictnessLevel: 9,
    autoRegenerate: true,
    maxRegenerationAttempts: 3
  });
  
  // Gerar conteúdo com sistema anti-simulação
  const prompt = 'Crie uma função para processar pagamentos com Stripe';
  
  try {
    console.log(`Gerando código para: "${prompt}"...`);
    const resultado = await AntiSimulationIntegration.generateEnhancedContent(prompt);
    
    console.log('\nCódigo gerado:');
    console.log(resultado.content);
    console.log(`\nQualidade do código: ${resultado.qualityScore}%`);
    console.log(`Simulações detectadas: ${resultado.hasSimulations ? 'Sim' : 'Não'}`);
  } catch (erro) {
    console.error('Erro ao gerar conteúdo:', erro);
  }
}

// Exemplo 3: Geração de conteúdo com persona específica
async function gerarConteudoComPersona() {
  console.log('\n--- Exemplo 3: Geração de conteúdo com persona específica ---');
  
  // Configurar o sistema anti-simulação
  AntiSimulationIntegration.updateOptions({
    projectType: 'blog',
    strictnessLevel: 8
  });
  
  // Gerar conteúdo com persona específica
  const prompt = 'Crie um componente de upload de imagens para um blog';
  const persona = 'frontend_expert';
  
  try {
    console.log(`Gerando código com persona "${persona}" para: "${prompt}"...`);
    const resultado = await AntiSimulationIntegration.generateContentWithPersona(prompt, persona);
    
    console.log('\nCódigo gerado:');
    console.log(resultado.content);
    console.log(`\nQualidade do código: ${resultado.qualityScore}%`);
  } catch (erro) {
    console.error('Erro ao gerar conteúdo com persona:', erro);
  }
}

// Exemplo 4: Melhorar código existente
async function melhorarCodigoExistente() {
  console.log('\n--- Exemplo 4: Melhorar código existente ---');
  
  const codigoExistente = `
    // Função para enviar email
    function enviarEmail(destinatario, assunto, mensagem) {
      // TODO: Implementar envio real de email
      console.log(\`Enviando email para \${destinatario}\`);
      console.log(\`Assunto: \${assunto}\`);
      return true;
    }
  `;
  
  // Criar instância do GeminiEnhancer
  const geminiEnhancer = new GeminiServiceEnhanced();
  
  try {
    console.log('Melhorando código existente...');
    const resultado = await geminiEnhancer.enhanceExistingCode(codigoExistente, {
      requiredAPIs: ['nodemailer'],
      forceRealImplementation: true
    });
    
    console.log('\nCódigo melhorado:');
    console.log(resultado.enhancedCode);
    console.log(`\nMelhorias realizadas: ${resultado.improvements.join(', ')}`);
  } catch (erro) {
    console.error('Erro ao melhorar código:', erro);
  }
}

// Exemplo 5: Obter requisitos de projeto
async function obterRequisitosDeProjetoEcommerce() {
  console.log('\n--- Exemplo 5: Obter requisitos de projeto (E-commerce) ---');
  
  // Configurar para projeto de e-commerce
  AntiSimulationIntegration.updateOptions({
    projectType: 'ecommerce'
  });
  
  // Obter requisitos para o projeto
  const requisitos = AntiSimulationIntegration.getProjectRequirements();
  
  console.log('Requisitos para projeto de e-commerce:');
  console.log(`- APIs necessárias: ${requisitos.requiredAPIs.join(', ')}`);
  console.log(`- Medidas de segurança: ${requisitos.requiredSecurity.join(', ')}`);
  console.log(`- Funcionalidades: ${requisitos.requiredFeatures.join(', ')}`);
}

async function obterRequisitosDeProjeto() {
  console.log('\n--- Exemplo 6: Obter requisitos de projeto (Blog) ---');
  
  // Configurar para projeto de blog
  AntiSimulationIntegration.updateOptions({
    projectType: 'blog'
  });
  
  // Obter requisitos para o projeto
  const requisitos = AntiSimulationIntegration.getProjectRequirements();
  
  console.log('Requisitos para projeto de blog:');
  console.log(`- APIs necessárias: ${requisitos.requiredAPIs.join(', ')}`);
  console.log(`- Medidas de segurança: ${requisitos.requiredSecurity.join(', ')}`);
  console.log(`- Funcionalidades: ${requisitos.requiredFeatures.join(', ')}`);
}

// Executar exemplos
async function executarExemplos() {
  try {
    await verificarCodigo();
    await gerarConteudoAprimorado();
    await gerarConteudoComPersona();
    await melhorarCodigoExistente();
    await obterRequisitosDeProjetoEcommerce();
    await obterRequisitosDeProjeto();
    
    console.log('\n✅ Todos os exemplos foram executados com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao executar exemplos:', erro);
  }
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
  console.log('🚀 Executando exemplos do Sistema Anti-Simulação...');
  executarExemplos();
}

module.exports = {
  verificarCodigo,
  gerarConteudoAprimorado,
  gerarConteudoComPersona,
  melhorarCodigoExistente,
  obterRequisitosDeProjetoEcommerce,
  obterRequisitosDeProjeto,
  executarExemplos
};