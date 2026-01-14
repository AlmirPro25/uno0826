/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Integration Example                                   ║
 * ║                                                                              ║
 * ║              Exemplo de como integrar o DAIA no AI Web Weaver                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import {
    sendToDAIA,
    enrichWithDAIA,
    getDAIASuggestion,
    isDAIAAvailable,
    getDAIAStats,
    createDAIAStoreHandlers,
    // v2.0 - Brain (Gemini + Tool Calling)
    askDAIABrain,
    generateWithDAIABrain,
    isDAIABrainAvailable,
    getDAIAFullStatus
} from '../services/DAIAIntegration';

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 1: Verificar se DAIA está disponível
// ═══════════════════════════════════════════════════════════════════════════════

async function checkDAIAStatus() {
    console.log('🔍 Verificando status do DAIA...');

    const available = await isDAIAAvailable();

    if (available) {
        console.log('✅ DAIA está online!');

        const stats = await getDAIAStats();
        if (stats) {
            console.log(`📊 Estatísticas:`);
            console.log(`   - Templates: ${stats.total_templates}`);
            console.log(`   - Score médio: ${stats.avg_score}`);
            console.log(`   - Armazenamento: ${stats.storage_size_mb} MB`);
        }
    } else {
        console.log('❌ DAIA está offline. Execute start-daia.bat');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 2: Enviar código aprovado para aprendizado
// ═══════════════════════════════════════════════════════════════════════════════

async function learnFromApprovedCode() {
    console.log('\n📚 Enviando código aprovado para DAIA...');

    const code = `
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard de Vendas</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white p-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard de Vendas</h1>
    <div class="grid grid-cols-3 gap-4">
        <div class="bg-slate-800 p-4 rounded-lg">
            <h2 class="text-lg text-slate-400">Total de Vendas</h2>
            <p class="text-2xl font-bold text-green-400">R$ 125.430,00</p>
        </div>
    </div>
</body>
</html>`;

    const success = await sendToDAIA({
        code,
        prompt: 'Crie um dashboard de vendas moderno com cards de métricas',
        modelUsed: 'gemini-2.5-flash',
        userRating: 'liked',
        isGoodForTraining: true
    });

    if (success) {
        console.log('✅ Código aprendido com sucesso!');
    } else {
        console.log('❌ Falha ao enviar código');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 3: Enriquecer prompt com templates similares
// ═══════════════════════════════════════════════════════════════════════════════

async function enrichPromptBeforeGeneration() {
    console.log('\n🔮 Enriquecendo prompt com templates do DAIA...');

    const originalPrompt = 'Crie um painel administrativo com gráficos de vendas';

    const result = await enrichWithDAIA(originalPrompt);

    console.log(`📝 Prompt original: ${result.originalPrompt}`);
    console.log(`🔄 Foi enriquecido: ${result.wasEnriched ? 'Sim' : 'Não'}`);

    if (result.wasEnriched) {
        console.log(`📚 Templates usados: ${result.usedTemplates.length}`);
        result.usedTemplates.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.id} (${(t.similarity * 100).toFixed(1)}% similar)`);
        });
        console.log(`\n📄 Prompt enriquecido (primeiros 500 chars):`);
        console.log(result.enrichedPrompt.substring(0, 500) + '...');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 4: Verificar se existe sugestão muito similar
// ═══════════════════════════════════════════════════════════════════════════════

async function checkForExistingSuggestion() {
    console.log('\n💡 Verificando se existe sugestão similar...');

    const prompt = 'Crie um dashboard de vendas com cards';

    const suggestion = await getDAIASuggestion(prompt);

    if (suggestion) {
        console.log(`✅ Encontrada sugestão muito similar!`);
        console.log(`   - ID: ${suggestion.id}`);
        console.log(`   - Similaridade: ${(suggestion.similarity * 100).toFixed(1)}%`);
        console.log(`   - Categoria: ${suggestion.category}`);
        console.log(`   - Prompt original: ${suggestion.prompt}`);
        console.log(`\n💡 Você pode usar este código como base ou gerar um novo.`);
    } else {
        console.log('❌ Nenhuma sugestão encontrada. Gerando código novo...');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 5: Integração com Store (Zustand)
// ═══════════════════════════════════════════════════════════════════════════════

function demonstrateStoreIntegration() {
    console.log('\n🏪 Demonstrando integração com Store...');

    const handlers = createDAIAStoreHandlers();

    console.log('Handlers disponíveis:');
    console.log('  - onCodeLiked(code, prompt, model)');
    console.log('  - onMarkedForTraining(code, prompt, model)');
    console.log('  - onBeforeGenerate(prompt)');
    console.log('  - onCheckSuggestion(prompt)');

    console.log(`
// Exemplo de uso no store:

// Quando usuário clica em "Like":
handleLikeInteraction: async () => {
    const { htmlCode, initialPlanPrompt, selectedTextModel } = get();
    await handlers.onCodeLiked(htmlCode, initialPlanPrompt, selectedTextModel);
},

// Quando usuário marca como "Bom para Treinamento":
toggleGoodForTraining: async (interactionId) => {
    const interaction = get().loggedInteractions.find(i => i.interactionId === interactionId);
    if (interaction?.isGoodForTraining) {
        await handlers.onMarkedForTraining(
            interaction.finalUserCode,
            interaction.userPrompt,
            interaction.modelVersionUsed
        );
    }
},

// Antes de gerar código:
generateCode: async (prompt) => {
    // Verifica se existe sugestão muito similar
    const suggestion = await handlers.onCheckSuggestion(prompt);
    if (suggestion) {
        // Mostra modal perguntando se quer usar o template
        return;
    }
    
    // Enriquece prompt com templates similares
    const { enrichedPrompt } = await handlers.onBeforeGenerate(prompt);
    
    // Gera código com prompt enriquecido
    const code = await geminiService.generate(enrichedPrompt);
}
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 6: Usar o Brain (Gemini 2.5 Flash + Tool Calling) - NOVO v2.0
// ═══════════════════════════════════════════════════════════════════════════════

async function useBrainForGeneration() {
    console.log('\n🧠 Usando DAIA Brain (Gemini 2.5 Flash + Tools)...');

    // Verifica se o Brain está disponível
    const brainAvailable = await isDAIABrainAvailable();
    
    if (!brainAvailable) {
        console.log('❌ Brain não disponível. Verifique GEMINI_API_KEY no .env');
        return;
    }

    console.log('✅ Brain disponível!');

    // Pede ao Brain para pensar sobre uma tarefa
    console.log('\n📝 Pedindo ao Brain para pensar...');
    const thinkResult = await askDAIABrain(
        'Preciso criar um dashboard de vendas moderno. O que você sugere?',
        { projectType: 'dashboard' }
    );

    if (thinkResult.usedBrain) {
        console.log(`\n🤖 Resposta do Brain:`);
        console.log(thinkResult.response.substring(0, 500) + '...');
        console.log(`\n🔧 Tools usadas: ${thinkResult.toolsUsed.map(t => t.name).join(', ')}`);
    }

    // Gera código usando o Brain com memória
    console.log('\n🎨 Gerando código com Brain...');
    const generateResult = await generateWithDAIABrain(
        'Crie um dashboard de vendas com cards de métricas e gráfico de linha',
        { useTemplates: true }
    );

    if (generateResult.usedBrain) {
        console.log(`\n📄 Código gerado (primeiros 500 chars):`);
        console.log(generateResult.code.substring(0, 500) + '...');
        console.log(`\n🔧 Tools usadas: ${generateResult.toolsUsed.map(t => t.name).join(', ')}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 7: Status completo (Serviço + Brain)
// ═══════════════════════════════════════════════════════════════════════════════

async function checkFullStatus() {
    console.log('\n📊 Verificando status completo do DAIA...');

    const status = await getDAIAFullStatus();

    console.log('\n📦 Serviço de Templates:');
    console.log(`   - Disponível: ${status.service.available ? '✅' : '❌'}`);
    console.log(`   - Templates: ${status.service.templates}`);

    console.log('\n🧠 Brain (Gemini 2.5 Flash):');
    console.log(`   - Disponível: ${status.brain.available ? '✅' : '❌'}`);
    if (status.brain.available) {
        console.log(`   - Modelo: ${status.brain.model}`);
        console.log(`   - Conversa: ${status.brain.conversationLength} mensagens`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTAR EXEMPLOS
// ═══════════════════════════════════════════════════════════════════════════════

async function runExamples() {
    console.log('═'.repeat(60));
    console.log('🧠 DAIA Integration Examples (v2.0 com Brain)');
    console.log('═'.repeat(60));

    await checkDAIAStatus();
    await checkFullStatus();
    await learnFromApprovedCode();
    await enrichPromptBeforeGeneration();
    await checkForExistingSuggestion();
    await useBrainForGeneration();
    demonstrateStoreIntegration();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Exemplos concluídos!');
    console.log('═'.repeat(60));
}

// Exporta para uso em testes
export {
    checkDAIAStatus,
    checkFullStatus,
    learnFromApprovedCode,
    enrichPromptBeforeGeneration,
    checkForExistingSuggestion,
    useBrainForGeneration,
    demonstrateStoreIntegration,
    runExamples
};

// Executa se chamado diretamente
if (typeof window === 'undefined') {
    runExamples().catch(console.error);
}
