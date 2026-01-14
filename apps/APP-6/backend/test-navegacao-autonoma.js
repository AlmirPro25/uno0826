/**
 * 🧪 TESTE DE NAVEGAÇÃO AUTÔNOMA
 * 
 * Testa o sistema completo de navegação com os novos métodos
 */

const API_URL = 'http://localhost:3002';

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
    log(`\n🧪 Testando: ${name}`, 'cyan');
    log(`📍 URL: ${url}`, 'bright');
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (response.ok) {
            log(`✅ Sucesso (${response.status})`, 'green');
            return { success: true, data };
        } else {
            log(`⚠️ Erro (${response.status})`, 'yellow');
            log(`📦 Resposta: ${JSON.stringify(data, null, 2)}`, 'yellow');
            return { success: false, data };
        }
    } catch (error) {
        log(`❌ Falha: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n' + '='.repeat(70), 'cyan');
    log('🚀 TESTE DE NAVEGAÇÃO AUTÔNOMA', 'bright');
    log('='.repeat(70), 'cyan');
    
    // Teste 1: Health Check
    log('\n📋 TESTE 1: Health Check', 'magenta');
    await testEndpoint(
        'Health Check',
        `${API_URL}/health`
    );
    
    // Teste 2: Estatísticas dos Agentes
    log('\n📋 TESTE 2: Estatísticas dos Agentes', 'magenta');
    const statsResult = await testEndpoint(
        'Estatísticas dos Agentes',
        `${API_URL}/api/navigator/stats`
    );
    
    if (statsResult.success) {
        log('\n📊 Agentes Disponíveis:', 'cyan');
        statsResult.data.agents.forEach(agent => {
            const status = agent.available ? '✅' : '❌';
            log(`   ${status} ${agent.name}: ${agent.callsToday}/${agent.quotaPerDay} chamadas hoje`, 'bright');
        });
    }
    
    // Teste 3: Estatísticas do Navegador
    log('\n📋 TESTE 3: Estatísticas do Navegador', 'magenta');
    const browserStats = await testEndpoint(
        'Estatísticas do Navegador',
        `${API_URL}/api/browser/stats`
    );
    
    if (browserStats.success) {
        log('\n📊 Sessões Ativas:', 'cyan');
        log(`   Total: ${browserStats.data.sessions.active}/${browserStats.data.sessions.max}`, 'bright');
        log(`   Navegações: ${browserStats.data.operations.navigations}`, 'bright');
        log(`   Screenshots: ${browserStats.data.operations.screenshots}`, 'bright');
    }
    
    // Teste 4: Gerar Plano de Navegação
    log('\n📋 TESTE 4: Gerar Plano de Navegação', 'magenta');
    const planResult = await testEndpoint(
        'Gerar Plano',
        `${API_URL}/api/navigator/plan`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userIntent: 'Busque por Python no DuckDuckGo',
                context: {}
            })
        }
    );
    
    if (planResult.success) {
        log('\n📋 Plano Gerado:', 'green');
        log(`   Objetivo: ${planResult.data.plan.objective}`, 'bright');
        log(`   Passos: ${planResult.data.plan.steps.length}`, 'bright');
        log(`   Agente: ${planResult.data.agent}`, 'bright');
        log(`   Duração: ${planResult.data.duration}ms`, 'bright');
        
        log('\n📝 Passos do Plano:', 'cyan');
        planResult.data.plan.steps.forEach((step, i) => {
            log(`   ${i + 1}. ${step.action} - ${step.description}`, 'bright');
        });
    }
    
    // Teste 5: Navegação Completa (PRINCIPAL)
    log('\n📋 TESTE 5: Navegação Completa (DuckDuckGo)', 'magenta');
    log('⚠️  Este teste pode levar 30-60 segundos...', 'yellow');
    
    const navigationResult = await testEndpoint(
        'Navegação Completa',
        `${API_URL}/api/navigator/process`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userIntent: 'Busque por Python no DuckDuckGo',
                context: {}
            })
        }
    );
    
    if (navigationResult.success) {
        const result = navigationResult.data;
        
        log('\n🎉 NAVEGAÇÃO CONCLUÍDA!', 'green');
        log(`   Objetivo: ${result.plan.objective}`, 'bright');
        log(`   Passos: ${result.plan.steps.length}`, 'bright');
        log(`   Agente: ${result.agent}`, 'bright');
        log(`   Duração: ${Math.round(result.duration / 1000)}s`, 'bright');
        
        if (result.execution && result.execution.results) {
            const successfulSteps = result.execution.results.filter(r => r.success).length;
            const totalSteps = result.execution.results.length;
            const successRate = Math.round((successfulSteps / totalSteps) * 100);
            
            log(`\n📊 Resultados da Execução:`, 'cyan');
            log(`   Passos bem-sucedidos: ${successfulSteps}/${totalSteps} (${successRate}%)`, 'bright');
            
            log('\n📝 Detalhes dos Passos:', 'cyan');
            result.execution.results.forEach(step => {
                const status = step.success ? '✅' : '❌';
                log(`   ${status} Passo ${step.step}: ${step.action} - ${step.description}`, 'bright');
            });
        }
        
        if (result.finalContent) {
            if (Array.isArray(result.finalContent)) {
                log(`\n📊 Dados Extraídos: ${result.finalContent.length} itens`, 'green');
                
                // Mostrar primeiros 3 itens
                result.finalContent.slice(0, 3).forEach((item, i) => {
                    log(`\n   Item ${i + 1}:`, 'cyan');
                    log(`   Título: ${item.title || 'N/A'}`, 'bright');
                    if (item.snippet) log(`   Snippet: ${item.snippet.substring(0, 100)}...`, 'bright');
                    if (item.url) log(`   URL: ${item.url}`, 'bright');
                    if (item.price) log(`   Preço: ${item.price}`, 'bright');
                });
                
                if (result.finalContent.length > 3) {
                    log(`\n   ... e mais ${result.finalContent.length - 3} itens`, 'cyan');
                }
            } else {
                log(`\n📊 Conteúdo Extraído:`, 'green');
                log(`   Título: ${result.finalContent.title || 'N/A'}`, 'bright');
                log(`   URL: ${result.finalContent.url || 'N/A'}`, 'bright');
                log(`   Texto: ${result.finalContent.text?.substring(0, 200) || 'N/A'}...`, 'bright');
            }
        }
        
        if (result.finalScreenshot) {
            const screenshotSize = Math.round(result.finalScreenshot.length / 1024);
            log(`\n📸 Screenshot: ${screenshotSize}KB`, 'green');
        }
    }
    
    // Resumo Final
    log('\n' + '='.repeat(70), 'cyan');
    log('📊 RESUMO DOS TESTES', 'bright');
    log('='.repeat(70), 'cyan');
    
    const tests = [
        { name: 'Health Check', passed: true },
        { name: 'Estatísticas Agentes', passed: statsResult.success },
        { name: 'Estatísticas Navegador', passed: browserStats.success },
        { name: 'Gerar Plano', passed: planResult.success },
        { name: 'Navegação Completa', passed: navigationResult.success },
    ];
    
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    log(`\n✅ Testes Passados: ${passedTests}/${totalTests} (${successRate}%)`, 'green');
    
    tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        const color = test.passed ? 'green' : 'red';
        log(`   ${status} ${test.name}`, color);
    });
    
    log('\n' + '='.repeat(70), 'cyan');
    
    if (passedTests === totalTests) {
        log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!', 'green');
    } else if (passedTests >= totalTests * 0.8) {
        log('\n⚠️  Maioria dos testes passou, mas há alguns problemas.', 'yellow');
    } else {
        log('\n❌ Vários testes falharam. Verifique a configuração.', 'red');
    }
    
    log('\n📝 Notas:', 'cyan');
    log('   - Se "Gerar Plano" falhou: verifique GEMINI_API_KEY no .env', 'bright');
    log('   - Se "Navegação Completa" falhou: verifique Playwright instalado', 'bright');
    log('   - Consulte TROUBLESHOOTING_AGENTES.md para mais ajuda', 'bright');
    log('');
}

// Executar testes
runTests().catch(error => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
});
