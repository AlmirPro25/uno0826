/**
 * 🧪 TESTES DO BROWSER AUTOMATION ORCHESTRATOR
 * 
 * Valida todas as funcionalidades do Orquestrador Supremo
 */

import {
  BrowserAutomationOrchestrator,
  BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST,
  TOOL_REGISTRY,
  DEFAULT_STEALTH_CONFIG,
  DEFAULT_SECURITY_POLICY,
  ToolCallRequest
} from '../services/manifestos/BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST';

// ============================================================================
// HELPERS
// ============================================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function section(title: string): void {
  console.log('\n' + '─'.repeat(60));
  console.log(`📋 ${title}`);
  console.log('─'.repeat(60));
}

// Mock adapter para testes
async function mockAdapter(name: string, args: Record<string, unknown>): Promise<unknown> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { status: 'ok', data: { tool: name, args } };
}

// ============================================================================
// TESTES
// ============================================================================

async function testManifestStructure(): Promise<void> {
  section('Teste 1: Estrutura do Manifesto');
  
  const manifest = BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST;
  
  assert(manifest.id === 'browser-automation-orchestrator', 'ID do manifesto correto');
  assert(manifest.version === '1.0.0', 'Versão do manifesto correta');
  assert(manifest.identity.role.includes('Orquestrador'), 'Role definida');
  assert(manifest.identity.expertise.length > 0, 'Expertise definida');
  assert(manifest.activation.keywords.length > 0, 'Keywords de ativação definidas');
  assert(manifest.architecture.modules.length === 7, '7 módulos na arquitetura');
  assert(manifest.operationalCycle.length === 9, '9 passos no ciclo operacional');
  assert(manifest.systemPrompt.length > 100, 'System prompt definido');
}

async function testToolRegistry(): Promise<void> {
  section('Teste 2: Tool Registry');
  
  assert(TOOL_REGISTRY.length >= 10, `${TOOL_REGISTRY.length} tools registradas`);
  
  // Verificar tools essenciais
  const essentialTools = [
    'navigate_and_extract',
    'click_element',
    'fill_form',
    'screenshot',
    'solve_captcha',
    'persist_result',
    'search_api'
  ];
  
  for (const toolName of essentialTools) {
    const tool = TOOL_REGISTRY.find(t => t.name === toolName);
    assert(tool !== undefined, `Tool '${toolName}' existe`);
    assert(tool!.inputSchema !== undefined, `Tool '${toolName}' tem inputSchema`);
    assert(tool!.outputSchema !== undefined, `Tool '${toolName}' tem outputSchema`);
    assert(tool!.permissions.length > 0, `Tool '${toolName}' tem permissões`);
  }
}

async function testOrchestratorInstantiation(): Promise<void> {
  section('Teste 3: Instanciação do Orquestrador');
  
  // Instância padrão
  const orchestrator1 = new BrowserAutomationOrchestrator();
  assert(orchestrator1.getAllTools().length > 0, 'Orquestrador padrão tem tools');
  
  // Instância com config customizada
  const orchestrator2 = new BrowserAutomationOrchestrator({
    customTools: [{
      name: 'custom_tool',
      description: 'Tool customizada',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: {} },
      auth: 'test',
      permissions: ['test.permission'],
      timeout: 5000,
      retries: 1
    }]
  });
  
  assert(orchestrator2.getTool('custom_tool') !== undefined, 'Tool customizada registrada');
}

async function testToolValidation(): Promise<void> {
  section('Teste 4: Validação de Tool Calls');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // Validação bem-sucedida
  const validRequest: ToolCallRequest = {
    name: 'navigate_and_extract',
    args: { url: 'https://example.com' }
  };
  
  const validResult = orchestrator.validateToolCall(validRequest);
  assert(validResult.valid === true, 'Request válido passa na validação');
  
  // Tool inexistente
  const invalidTool: ToolCallRequest = {
    name: 'nonexistent_tool',
    args: {}
  };
  
  const invalidToolResult = orchestrator.validateToolCall(invalidTool);
  assert(invalidToolResult.valid === false, 'Tool inexistente falha na validação');
  
  // Campo required faltando
  const missingRequired: ToolCallRequest = {
    name: 'navigate_and_extract',
    args: {} // url é required
  };
  
  const missingResult = orchestrator.validateToolCall(missingRequired);
  assert(missingResult.valid === false, 'Campo required faltando falha na validação');
  
  // Enum inválido
  const invalidEnum: ToolCallRequest = {
    name: 'navigate_and_extract',
    args: { url: 'https://example.com', extractMode: 'invalid_mode' }
  };
  
  const enumResult = orchestrator.validateToolCall(invalidEnum);
  assert(enumResult.valid === false, 'Enum inválido falha na validação');
}

async function testPermissions(): Promise<void> {
  section('Teste 5: Sistema de Permissões');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // Permissões padrão
  assert(orchestrator.checkPermission('browser.open') === true, 'browser.open permitido');
  assert(orchestrator.checkPermission('browser.interact') === true, 'browser.interact permitido');
  assert(orchestrator.checkPermission('db.write') === false, 'db.write negado por padrão');
  
  // Verificar requiresApproval
  assert(orchestrator.requiresApproval('persist_result') === true, 'persist_result requer aprovação');
  assert(orchestrator.requiresApproval('navigate_and_extract') === false, 'navigate_and_extract não requer aprovação');
}

async function testToolExecution(): Promise<void> {
  section('Teste 6: Execução de Tools');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // Execução bem-sucedida
  const result = await orchestrator.executeToolCall({
    name: 'navigate_and_extract',
    args: { url: 'https://example.com' }
  }, mockAdapter);
  
  assert(result.status === 'ok', 'Execução bem-sucedida retorna ok');
  assert(result.latencyMs !== undefined, 'Latência registrada');
  
  // Execução com tool que requer aprovação
  const approvalResult = await orchestrator.executeToolCall({
    name: 'persist_result',
    args: { collection: 'test', payload: {} }
  }, mockAdapter);
  
  assert(approvalResult.status === 'escalated', 'Tool que requer aprovação é escalada');
}

async function testStealthConfig(): Promise<void> {
  section('Teste 7: Configurações Stealth');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // User-Agent aleatório
  const ua1 = orchestrator.getRandomUserAgent();
  const ua2 = orchestrator.getRandomUserAgent();
  assert(ua1.length > 0, 'User-Agent gerado');
  assert(DEFAULT_STEALTH_CONFIG.userAgents.includes(ua1), 'User-Agent está na lista');
  
  // Viewport aleatório
  const viewport = orchestrator.getRandomViewport();
  assert(viewport.width > 0, 'Viewport width válido');
  assert(viewport.height > 0, 'Viewport height válido');
  
  // Delay aleatório
  const delay = orchestrator.getRandomDelay();
  assert(delay >= DEFAULT_STEALTH_CONFIG.minDelay, 'Delay >= minDelay');
  assert(delay <= DEFAULT_STEALTH_CONFIG.maxDelay, 'Delay <= maxDelay');
}

async function testMemory(): Promise<void> {
  section('Teste 8: Sistema de Memória');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // Set e Get
  orchestrator.setMemory('test_key', { value: 123 });
  const retrieved = orchestrator.getMemory<{ value: number }>('test_key');
  
  assert(retrieved !== undefined, 'Valor recuperado da memória');
  assert(retrieved!.value === 123, 'Valor correto recuperado');
  
  // Key inexistente
  const nonexistent = orchestrator.getMemory('nonexistent');
  assert(nonexistent === undefined, 'Key inexistente retorna undefined');
}

async function testEventLog(): Promise<void> {
  section('Teste 9: Event Log');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // Executar algumas tools para gerar eventos
  await orchestrator.executeToolCall({
    name: 'navigate_and_extract',
    args: { url: 'https://example.com' }
  }, mockAdapter);
  
  await orchestrator.executeToolCall({
    name: 'screenshot',
    args: {}
  }, mockAdapter);
  
  const events = orchestrator.getEventLog();
  
  assert(events.length > 0, 'Eventos registrados');
  assert(events[0].runId !== undefined, 'RunId presente nos eventos');
  assert(events[0].timestamp !== undefined, 'Timestamp presente nos eventos');
}

async function testGeminiIntegration(): Promise<void> {
  section('Teste 10: Integração com Gemini');
  
  const orchestrator = new BrowserAutomationOrchestrator();
  
  // Tools para Gemini
  const tools = orchestrator.getToolsForGemini();
  assert(tools.length > 0, 'Tools formatadas para Gemini');
  assert((tools[0] as any).name !== undefined, 'Tool tem name');
  assert((tools[0] as any).description !== undefined, 'Tool tem description');
  assert((tools[0] as any).parameters !== undefined, 'Tool tem parameters');
  
  // System prompt
  const systemPrompt = orchestrator.buildSystemPrompt();
  assert(systemPrompt.includes('OrchestratorGPT'), 'System prompt contém identidade');
  assert(systemPrompt.includes('RULES'), 'System prompt contém regras');
  
  // Parse tool call
  const response1 = '{"name": "navigate_and_extract", "args": {"url": "https://test.com"}}';
  const parsed1 = orchestrator.parseToolCallFromResponse(response1);
  assert(parsed1 !== null, 'Tool call parseado de JSON puro');
  assert(parsed1!.name === 'navigate_and_extract', 'Nome correto parseado');
  
  const response2 = 'Vou extrair os dados. {"name": "screenshot", "args": {}} Pronto.';
  const parsed2 = orchestrator.parseToolCallFromResponse(response2);
  assert(parsed2 !== null, 'Tool call parseado de texto misto');
  assert(parsed2!.name === 'screenshot', 'Nome correto parseado de texto misto');
  
  const response3 = 'Apenas uma resposta sem tool call.';
  const parsed3 = orchestrator.parseToolCallFromResponse(response3);
  assert(parsed3 === null, 'Retorna null quando não há tool call');
  
  // Format result
  const result = { status: 'ok' as const, data: { test: true } };
  const formatted = orchestrator.formatToolResultForGemini(result);
  assert(formatted.includes('ok'), 'Resultado formatado contém status');
}

async function testDefaultConfigs(): Promise<void> {
  section('Teste 11: Configurações Padrão');
  
  // Stealth config
  assert(DEFAULT_STEALTH_CONFIG.userAgents.length > 0, 'User-Agents configurados');
  assert(DEFAULT_STEALTH_CONFIG.viewports.length > 0, 'Viewports configurados');
  assert(DEFAULT_STEALTH_CONFIG.timezone === 'America/Sao_Paulo', 'Timezone brasileiro');
  assert(DEFAULT_STEALTH_CONFIG.languages.includes('pt-BR'), 'Português brasileiro incluído');
  
  // Security policy
  assert(DEFAULT_SECURITY_POLICY.rateLimits.toolCallsPerMinute === 50, 'Rate limit configurado');
  assert(DEFAULT_SECURITY_POLICY.audit.enabled === true, 'Auditoria habilitada');
  assert(DEFAULT_SECURITY_POLICY.requireApproval.includes('db.write'), 'db.write requer aprovação');
}

async function testProtocols(): Promise<void> {
  section('Teste 12: Protocolos Documentados');
  
  const manifest = BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST;
  
  // CDP
  assert(manifest.protocols.cdp.domains.length > 0, 'Domínios CDP documentados');
  assert(manifest.protocols.cdp.domains.some(d => d.name === 'Page.*'), 'Page.* documentado');
  assert(manifest.protocols.cdp.domains.some(d => d.name === 'Network.*'), 'Network.* documentado');
  
  // WebDriver BiDi
  assert(manifest.protocols.webdriverBidi.capabilities.length > 0, 'Capabilities BiDi documentadas');
  
  // WebDriver
  assert(manifest.protocols.webdriver.name === 'WebDriver W3C', 'WebDriver W3C documentado');
}

async function testLibraries(): Promise<void> {
  section('Teste 13: Bibliotecas Documentadas');
  
  const manifest = BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST;
  
  assert(manifest.libraries.length > 0, 'Bibliotecas documentadas');
  
  const playwright = manifest.libraries.find(l => l.name === 'Playwright');
  assert(playwright !== undefined, 'Playwright documentado');
  assert(playwright!.recommended === true, 'Playwright é recomendado');
  
  const puppeteer = manifest.libraries.find(l => l.name === 'Puppeteer');
  assert(puppeteer !== undefined, 'Puppeteer documentado');
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('\n' + '🧪'.repeat(30));
  console.log('   BROWSER AUTOMATION ORCHESTRATOR - TESTES');
  console.log('🧪'.repeat(30));
  
  const tests = [
    testManifestStructure,
    testToolRegistry,
    testOrchestratorInstantiation,
    testToolValidation,
    testPermissions,
    testToolExecution,
    testStealthConfig,
    testMemory,
    testEventLog,
    testGeminiIntegration,
    testDefaultConfigs,
    testProtocols,
    testLibraries
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n❌ TESTE FALHOU: ${test.name}`);
      console.error(`   Erro: ${(error as Error).message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 RESULTADO FINAL: ${passed} passou, ${failed} falhou`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Executar
runAllTests().catch(console.error);
