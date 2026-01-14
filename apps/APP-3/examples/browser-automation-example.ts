/**
 * 🌐 BROWSER AUTOMATION ORCHESTRATOR - EXEMPLO COMPLETO
 * 
 * Demonstra integração com Gemini + Playwright para navegação autônoma
 */

import { 
  BrowserAutomationOrchestrator,
  ToolCallRequest,
  ToolCallResult,
  TOOL_REGISTRY
} from '../services/manifestos/BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST';

// ============================================================================
// CONFIGURAÇÃO DO ORQUESTRADOR
// ============================================================================

const orchestrator = new BrowserAutomationOrchestrator({
  stealthConfig: {
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    ],
    viewports: [{ width: 1920, height: 1080 }],
    webglVendor: 'Google Inc.',
    webglRenderer: 'ANGLE (Intel)',
    timezone: 'America/Sao_Paulo',
    languages: ['pt-BR', 'pt', 'en-US'],
    plugins: ['Chrome PDF Plugin'],
    minDelay: 100,
    maxDelay: 500,
    mouseMovement: 'bezier-curve'
  }
});

// ============================================================================
// ADAPTER SIMULADO (em produção, usar Playwright real)
// ============================================================================

async function mockPlaywrightAdapter(
  toolName: string, 
  args: Record<string, unknown>
): Promise<unknown> {
  console.log(`\n🔧 Executando tool: ${toolName}`);
  console.log(`   Args: ${JSON.stringify(args, null, 2)}`);
  
  // Simula delay de execução
  await new Promise(resolve => setTimeout(resolve, 500));
  
  switch (toolName) {
    case 'navigate_and_extract':
      return {
        status: 'ok',
        text: `Conteúdo extraído de ${args.url}`,
        metadata: {
          url: args.url,
          timestamp: new Date().toISOString(),
          extractMode: args.extractMode || 'text'
        }
      };
      
    case 'click_element':
      return {
        status: 'ok',
        usedSelector: args.selector
      };
      
    case 'fill_form':
      return {
        status: 'ok',
        filledFields: Object.keys(args.fields as object)
      };
      
    case 'screenshot':
      return {
        status: 'ok',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        width: 1920,
        height: 1080
      };
      
    case 'search_api':
      return {
        status: 'ok',
        results: [
          { title: 'Resultado 1', url: 'https://example.com/1', snippet: 'Descrição...' },
          { title: 'Resultado 2', url: 'https://example.com/2', snippet: 'Descrição...' }
        ]
      };
      
    case 'persist_result':
      return {
        status: 'ok',
        id: `doc-${Date.now()}`
      };
      
    default:
      return { status: 'error', error: `Tool ${toolName} not implemented` };
  }
}

// ============================================================================
// EXEMPLO 1: EXECUÇÃO SIMPLES DE TOOL
// ============================================================================

async function exemploExecucaoSimples() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 1: Execução Simples de Tool');
  console.log('='.repeat(60));
  
  const request: ToolCallRequest = {
    name: 'navigate_and_extract',
    args: {
      url: 'https://example.com',
      extractMode: 'text',
      waitForSelector: '#main-content',
      timeoutMs: 30000
    }
  };
  
  // Validar antes de executar
  const validation = orchestrator.validateToolCall(request);
  console.log(`\n✅ Validação: ${validation.valid ? 'OK' : 'FALHOU'}`);
  if (!validation.valid) {
    console.log(`   Erros: ${validation.errors?.join(', ')}`);
    return;
  }
  
  // Executar
  const result = await orchestrator.executeToolCall(request, mockPlaywrightAdapter);
  console.log(`\n📦 Resultado:`, JSON.stringify(result, null, 2));
}

// ============================================================================
// EXEMPLO 2: FLUXO DE LOGIN COMPLETO
// ============================================================================

async function exemploFluxoLogin() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 2: Fluxo de Login Completo');
  console.log('='.repeat(60));
  
  const loginFlow: ToolCallRequest[] = [
    {
      name: 'navigate_and_extract',
      args: { url: 'https://app.example.com/login' }
    },
    {
      name: 'fill_form',
      args: {
        fields: {
          '#email': 'usuario@exemplo.com',
          '#password': '********'
        },
        humanLike: true
      }
    },
    {
      name: 'click_element',
      args: {
        selector: 'button[type="submit"]',
        waitForNavigation: true,
        humanLike: true
      }
    },
    {
      name: 'wait_for_condition',
      args: {
        condition: 'navigation',
        url: '/dashboard',
        timeoutMs: 10000
      }
    },
    {
      name: 'screenshot',
      args: { fullPage: false }
    }
  ];
  
  console.log(`\n🔄 Executando ${loginFlow.length} passos...`);
  
  for (let i = 0; i < loginFlow.length; i++) {
    const step = loginFlow[i];
    console.log(`\n📍 Passo ${i + 1}/${loginFlow.length}: ${step.name}`);
    
    const result = await orchestrator.executeToolCall(step, mockPlaywrightAdapter);
    
    if (result.status === 'error') {
      console.log(`❌ Erro no passo ${i + 1}: ${result.error}`);
      break;
    }
    
    console.log(`✅ Sucesso: ${JSON.stringify(result.data)}`);
  }
}

// ============================================================================
// EXEMPLO 3: SCRAPING MULTI-SITE PARALELO
// ============================================================================

async function exemploScrapingParalelo() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 3: Scraping Multi-Site Paralelo');
  console.log('='.repeat(60));
  
  const sites = [
    'https://loja1.com/produto/123',
    'https://loja2.com/item/456',
    'https://loja3.com/p/789'
  ];
  
  console.log(`\n🔄 Extraindo dados de ${sites.length} sites em paralelo...`);
  
  const startTime = Date.now();
  
  const results = await Promise.all(
    sites.map(url => orchestrator.executeToolCall({
      name: 'navigate_and_extract',
      args: {
        url,
        extractMode: 'json',
        waitForSelector: '.price'
      }
    }, mockPlaywrightAdapter))
  );
  
  const elapsed = Date.now() - startTime;
  
  console.log(`\n⏱️ Tempo total: ${elapsed}ms`);
  console.log(`📊 Resultados:`);
  
  results.forEach((result, i) => {
    console.log(`   ${sites[i]}: ${result.status}`);
  });
}

// ============================================================================
// EXEMPLO 4: INTEGRAÇÃO COM GEMINI (SIMULADA)
// ============================================================================

async function exemploIntegracaoGemini() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 4: Integração com Gemini (Simulada)');
  console.log('='.repeat(60));
  
  // 1. Obter tools para enviar ao Gemini
  const toolsForGemini = orchestrator.getToolsForGemini();
  console.log(`\n📋 ${toolsForGemini.length} tools disponíveis para Gemini`);
  
  // 2. System prompt
  const systemPrompt = orchestrator.buildSystemPrompt();
  console.log(`\n📝 System Prompt (${systemPrompt.length} chars)`);
  
  // 3. Simular resposta do Gemini com tool call
  const geminiResponse = `
    Vou extrair os dados do site solicitado.
    
    {"name": "navigate_and_extract", "args": {"url": "https://example.com/data", "extractMode": "table"}}
  `;
  
  // 4. Parsear tool call da resposta
  const toolCall = orchestrator.parseToolCallFromResponse(geminiResponse);
  
  if (toolCall) {
    console.log(`\n🎯 Tool call detectado: ${toolCall.name}`);
    
    // 5. Executar tool
    const result = await orchestrator.executeToolCall(toolCall, mockPlaywrightAdapter);
    
    // 6. Formatar resultado para enviar de volta ao Gemini
    const formattedResult = orchestrator.formatToolResultForGemini(result);
    console.log(`\n📤 Resultado formatado para Gemini:`);
    console.log(formattedResult);
  } else {
    console.log('\n❌ Nenhum tool call detectado na resposta');
  }
}

// ============================================================================
// EXEMPLO 5: VERIFICAÇÃO DE PERMISSÕES E APROVAÇÃO
// ============================================================================

async function exemploPermissoes() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 5: Verificação de Permissões');
  console.log('='.repeat(60));
  
  const toolsToCheck = ['navigate_and_extract', 'persist_result', 'escalate_to_human'];
  
  console.log('\n📋 Verificando permissões:');
  
  for (const toolName of toolsToCheck) {
    const tool = orchestrator.getTool(toolName);
    if (tool) {
      const requiresApproval = orchestrator.requiresApproval(toolName);
      const permissions = tool.permissions.map(p => 
        `${p}: ${orchestrator.checkPermission(p) ? '✅' : '❌'}`
      );
      
      console.log(`\n   ${toolName}:`);
      console.log(`      Permissões: ${permissions.join(', ')}`);
      console.log(`      Requer aprovação: ${requiresApproval ? '⚠️ SIM' : '✅ NÃO'}`);
    }
  }
}

// ============================================================================
// EXEMPLO 6: STEALTH E ANTI-DETECÇÃO
// ============================================================================

async function exemploStealth() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 6: Configurações Stealth');
  console.log('='.repeat(60));
  
  console.log('\n🎭 Gerando configurações aleatórias:');
  
  for (let i = 0; i < 3; i++) {
    const userAgent = orchestrator.getRandomUserAgent();
    const viewport = orchestrator.getRandomViewport();
    const delay = orchestrator.getRandomDelay();
    
    console.log(`\n   Sessão ${i + 1}:`);
    console.log(`      User-Agent: ${userAgent.substring(0, 50)}...`);
    console.log(`      Viewport: ${viewport.width}x${viewport.height}`);
    console.log(`      Delay: ${delay}ms`);
  }
}

// ============================================================================
// EXEMPLO 7: EVENT LOG E OBSERVABILIDADE
// ============================================================================

async function exemploObservabilidade() {
  console.log('\n' + '='.repeat(60));
  console.log('📌 EXEMPLO 7: Event Log e Observabilidade');
  console.log('='.repeat(60));
  
  // Executar algumas tools para gerar eventos
  await orchestrator.executeToolCall({
    name: 'navigate_and_extract',
    args: { url: 'https://site1.com' }
  }, mockPlaywrightAdapter);
  
  await orchestrator.executeToolCall({
    name: 'screenshot',
    args: { fullPage: true }
  }, mockPlaywrightAdapter);
  
  // Obter log de eventos
  const events = orchestrator.getEventLog();
  
  console.log(`\n📊 ${events.length} eventos registrados:`);
  
  events.forEach(event => {
    console.log(`   [${event.phase}] ${event.tool}: ${event.status} (${event.latencyMs}ms)`);
  });
}

// ============================================================================
// EXECUTAR TODOS OS EXEMPLOS
// ============================================================================

async function main() {
  console.log('\n' + '🌐'.repeat(30));
  console.log('   BROWSER AUTOMATION ORCHESTRATOR - EXEMPLOS');
  console.log('🌐'.repeat(30));
  
  try {
    await exemploExecucaoSimples();
    await exemploFluxoLogin();
    await exemploScrapingParalelo();
    await exemploIntegracaoGemini();
    await exemploPermissoes();
    await exemploStealth();
    await exemploObservabilidade();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS EXEMPLOS EXECUTADOS COM SUCESSO!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erro durante execução:', error);
  }
}

// Executar
main().catch(console.error);

// ============================================================================
// EXPORT PARA USO EM OUTROS MÓDULOS
// ============================================================================

export {
  orchestrator,
  mockPlaywrightAdapter,
  exemploExecucaoSimples,
  exemploFluxoLogin,
  exemploScrapingParalelo,
  exemploIntegracaoGemini
};
