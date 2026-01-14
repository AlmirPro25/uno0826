/**
 * 🦾 INTERACTION SERVICE
 * Sistema de interação autônoma - Gemini decide, Playwright executa
 * 
 * Ações disponíveis:
 * - click(selector) - Clicar em elemento
 * - fill(selector, text) - Preencher campo
 * - press(selector, key) - Pressionar tecla
 * - scroll(direction, pixels) - Rolar página
 * - hover(selector) - Passar mouse
 * - select(selector, value) - Selecionar opção
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { browserService } from './browserService.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * 🧠 Gemini decide qual ação tomar baseado no screenshot
 */
export async function decideNextAction(screenshot, objective, context = {}) {
    console.log('🧠 Gemini decidindo próxima ação...');

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Você é um AGENTE DE AUTOMAÇÃO WEB. Analise esta captura de tela e decida a próxima ação.

**OBJETIVO:**
${objective}

**CONTEXTO:**
${JSON.stringify(context, null, 2)}

**AÇÕES DISPONÍVEIS:**
1. **click** - Clicar em um elemento
   - Exemplo: { "action": "click", "selector": "button.search", "description": "Clicar no botão de busca" }

2. **fill** - Preencher um campo de texto
   - Exemplo: { "action": "fill", "selector": "input[name='q']", "value": "iPhone 15", "description": "Preencher campo de busca" }

3. **press** - Pressionar uma tecla
   - Exemplo: { "action": "press", "selector": "input[name='q']", "key": "Enter", "description": "Pressionar Enter" }

4. **scroll** - Rolar a página
   - Exemplo: { "action": "scroll", "direction": "down", "pixels": 500, "description": "Rolar para baixo" }

5. **hover** - Passar mouse sobre elemento
   - Exemplo: { "action": "hover", "selector": ".menu-item", "description": "Passar mouse no menu" }

6. **select** - Selecionar opção em dropdown
   - Exemplo: { "action": "select", "selector": "select#category", "value": "electronics", "description": "Selecionar categoria" }

7. **wait** - Aguardar carregamento
   - Exemplo: { "action": "wait", "milliseconds": 2000, "description": "Aguardar 2 segundos" }

8. **extract** - Extrair informações (objetivo alcançado)
   - Exemplo: { "action": "extract", "description": "Extrair resultados da busca" }

9. **done** - Objetivo concluído
   - Exemplo: { "action": "done", "description": "Tarefa concluída" }

**INSTRUÇÕES:**
1. ANALISE a captura de tela cuidadosamente
2. IDENTIFIQUE elementos interativos (botões, campos, links)
3. DECIDA a melhor ação para alcançar o objetivo
4. FORNEÇA seletores CSS precisos
5. Se não conseguir identificar elementos, use "scroll" para explorar

**DICAS PARA SELETORES:**
- Botões: "button", ".btn", "a.button"
- Campos de busca: "input[type='search']", "input[name='q']", "#search"
- Links: "a[href*='keyword']", ".link-class"
- Menus: ".menu", "nav a", ".dropdown"

**FORMATO DE RESPOSTA (JSON):**
{
  "action": "click|fill|press|scroll|hover|select|wait|extract|done",
  "selector": "seletor CSS (se aplicável)",
  "value": "valor (se aplicável)",
  "key": "tecla (se aplicável)",
  "direction": "up|down (se scroll)",
  "pixels": 500 (se scroll),
  "milliseconds": 2000 (se wait),
  "description": "O que esta ação faz",
  "reasoning": "Por que escolheu esta ação",
  "confidence": 1-10
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

        const imagePart = {
            inlineData: {
                data: screenshot,
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response.text();

        // Extrair JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Gemini não retornou JSON válido');
        }

        const decision = JSON.parse(jsonMatch[0]);
        
        console.log('✅ Decisão tomada:');
        console.log(`   Ação: ${decision.action}`);
        console.log(`   Descrição: ${decision.description}`);
        console.log(`   Confiança: ${decision.confidence}/10`);

        return decision;

    } catch (error) {
        console.error('❌ Erro ao decidir ação:', error);
        throw error;
    }
}

/**
 * 🦾 Executar ação decidida pelo Gemini
 */
export async function executeAction(sessionId, action) {
    console.log(`🦾 Executando: ${action.action} - ${action.description}`);

    try {
        let result;

        switch (action.action) {
            case 'click':
                result = await browserService.click(sessionId, action.selector);
                console.log(`✅ Clicou em: ${action.selector}`);
                break;

            case 'fill':
                result = await browserService.fill(sessionId, action.selector, action.value);
                console.log(`✅ Preencheu: ${action.selector} = "${action.value}"`);
                break;

            case 'press':
                result = await browserService.press(sessionId, action.selector, action.key);
                console.log(`✅ Pressionou: ${action.key} em ${action.selector}`);
                break;

            case 'scroll':
                result = await browserService.scroll(sessionId, action.direction, action.pixels);
                console.log(`✅ Rolou: ${action.direction} ${action.pixels}px`);
                break;

            case 'hover':
                result = await browserService.hover(sessionId, action.selector);
                console.log(`✅ Passou mouse em: ${action.selector}`);
                break;

            case 'select':
                // Playwright select
                result = await browserService.executeScript(sessionId, `
                    document.querySelector('${action.selector}').value = '${action.value}';
                    document.querySelector('${action.selector}').dispatchEvent(new Event('change'));
                `);
                console.log(`✅ Selecionou: ${action.value} em ${action.selector}`);
                break;

            case 'wait':
                await new Promise(resolve => setTimeout(resolve, action.milliseconds));
                result = { success: true };
                console.log(`✅ Aguardou: ${action.milliseconds}ms`);
                break;

            case 'extract':
                result = await browserService.extractContent(sessionId, {
                    includeText: true,
                    includeLinks: true,
                    includeImages: false
                });
                console.log(`✅ Extraiu conteúdo: ${result.text?.length || 0} caracteres`);
                break;

            case 'done':
                result = { success: true, done: true };
                console.log(`✅ Tarefa concluída!`);
                break;

            default:
                throw new Error(`Ação desconhecida: ${action.action}`);
        }

        // Aguardar um pouco após a ação
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            action: action.action,
            result
        };

    } catch (error) {
        console.error(`❌ Erro ao executar ${action.action}:`, error.message);
        return {
            success: false,
            action: action.action,
            error: error.message
        };
    }
}

/**
 * 🔄 Loop de interação autônoma
 */
export async function autonomousInteractionLoop(sessionId, objective, maxSteps = 10, onProgress) {
    console.log('\n🔄 ========== LOOP DE INTERAÇÃO AUTÔNOMA ==========');
    console.log(`🎯 Objetivo: ${objective}`);
    console.log(`📍 Máximo de passos: ${maxSteps}`);

    const actions = [];
    let step = 0;
    let done = false;

    try {
        while (step < maxSteps && !done) {
            step++;
            console.log(`\n📍 PASSO ${step}/${maxSteps}`);

            if (onProgress) {
                onProgress({
                    step,
                    maxSteps,
                    status: 'analyzing',
                    message: 'Analisando página...'
                });
            }

            // 1. Tirar screenshot
            const screenshot = await browserService.screenshot(sessionId, {
                type: 'jpeg',
                quality: 80,
                fullPage: false
            });

            console.log('📸 Screenshot capturado');

            // 2. Gemini decide próxima ação
            const decision = await decideNextAction(screenshot, objective, {
                step,
                previousActions: actions.slice(-3) // Últimas 3 ações
            });

            if (onProgress) {
                onProgress({
                    step,
                    maxSteps,
                    status: 'executing',
                    message: `Executando: ${decision.description}`,
                    decision
                });
            }

            // 3. Executar ação
            const executionResult = await executeAction(sessionId, decision);

            // 4. Registrar ação
            actions.push({
                step,
                decision,
                executionResult,
                timestamp: Date.now()
            });

            // 5. Verificar se concluiu
            if (decision.action === 'done' || executionResult.result?.done) {
                done = true;
                console.log('\n✅ Objetivo alcançado!');
            }

            // 6. Verificar se falhou
            if (!executionResult.success) {
                console.warn(`⚠️ Ação falhou, mas continuando...`);
            }

            // Delay entre ações
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        if (!done && step >= maxSteps) {
            console.warn('\n⚠️ Máximo de passos atingido sem concluir objetivo');
        }

        console.log('\n========================================');
        console.log(`📊 Total de ações: ${actions.length}`);
        console.log(`✅ Sucessos: ${actions.filter(a => a.executionResult.success).length}`);
        console.log(`❌ Falhas: ${actions.filter(a => !a.executionResult.success).length}`);

        return {
            objective,
            completed: done,
            totalSteps: step,
            actions,
            success: done
        };

    } catch (error) {
        console.error('\n❌ Erro no loop de interação:', error);
        return {
            objective,
            completed: false,
            totalSteps: step,
            actions,
            success: false,
            error: error.message
        };
    }
}

/**
 * 🎯 Workflow completo: Navegar + Interagir + Extrair
 */
export async function navigateAndInteract(url, objective, options = {}) {
    const {
        maxSteps = 10,
        onProgress
    } = options;

    console.log('\n🎯 ========== NAVEGAR E INTERAGIR ==========');
    console.log(`🌐 URL: ${url}`);
    console.log(`🎯 Objetivo: ${objective}`);

    try {
        // 1. Criar sessão
        const sessionId = `interact_${Date.now()}`;
        await browserService.createSession(sessionId);

        if (onProgress) {
            onProgress({ phase: 'navigation', message: 'Navegando...' });
        }

        // 2. Navegar
        await browserService.navigate(sessionId, url, {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        console.log('✅ Página carregada');

        if (onProgress) {
            onProgress({ phase: 'interaction', message: 'Iniciando interação...' });
        }

        // 3. Loop de interação
        const result = await autonomousInteractionLoop(
            sessionId,
            objective,
            maxSteps,
            onProgress
        );

        // 4. Extrair resultado final
        if (onProgress) {
            onProgress({ phase: 'extraction', message: 'Extraindo resultado...' });
        }

        const finalContent = await browserService.extractContent(sessionId, {
            includeText: true,
            includeLinks: true,
            includeImages: false
        });

        const finalScreenshot = await browserService.screenshot(sessionId);

        // 5. Fechar sessão
        await browserService.closeSession(sessionId);

        if (onProgress) {
            onProgress({ phase: 'complete', message: 'Concluído!' });
        }

        return {
            url,
            objective,
            interactionResult: result,
            finalContent,
            finalScreenshot,
            success: result.success
        };

    } catch (error) {
        console.error('\n❌ Erro:', error);
        return {
            url,
            objective,
            success: false,
            error: error.message
        };
    }
}

export default {
    decideNextAction,
    executeAction,
    autonomousInteractionLoop,
    navigateAndInteract
};
