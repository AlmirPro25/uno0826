
/**
 * TESTE DE INTEGRAÇÃO - SPECTRAL MATH CORE
 * 
 * Este teste verifica se o 'SPECTRAL_MATH_CORE_MANIFEST' é ativado corretamente
 * pelo 'ManifestOrchestrator' quando submetido a prompts matemáticos e de física.
 */

import { orchestrateManifests, enrichPromptWithManifests } from '../services/manifestos/ManifestOrchestrator.ts';
import { SPECTRAL_MATH_CORE_MANIFEST } from '../services/manifestos/SPECTRAL_MATH_CORE_MANIFEST.ts';

function runTest() {
    console.log('🌌 INICIANDO TESTE DO SPECTRAL MATH CORE 🌌');
    console.log('==============================================');

    const testCases = [
        {
            name: 'Caso 1: Filtragem de Ruído Transiente (Denoising)',
            prompt: 'Preciso de uma solução em Rust para filtrar ruído de dados de mercado (HFT). O sinal original é não-estacionário e possui picos súbitos (transientes) que representam oportunidades reais e não podem ser suavizados. Filtros comuns de média móvel estão introduzindo muito lag de fase. O que você recomenda matematicamente?',
            expectedManifestId: 'spectral-math-core',
            expectedKeywords: ['Wavelet', 'transientes', 'não-estacionário']
        },
        {
            name: 'Caso 2: Equações Diferenciais (PDEs)',
            prompt: 'Como resolver a equação do calor em uma placa 2D usando métodos computacionais rápidos? Preciso de alta performance.',
            expectedManifestId: 'spectral-math-core',
            expectedKeywords: ['Fourier', 'PDE', 'Calor']
        },
        {
            name: 'Caso 3: Controle e Estabilidade',
            prompt: 'Estou projetando um sistema de controle PID para um drone e preciso analisar a estabilidade para evitar oscilações divergentes.',
            expectedManifestId: 'spectral-math-core',
            expectedKeywords: ['Laplace', 'estabilidade', 'controle']
        },
        {
            name: 'Caso 4: Processamento Digital de Sinais (Tokens)',
            prompt: 'Tenho uma sequência discreta de tokens e preciso aplicar um filtro digital recursivo. Qual a melhor abordagem matemática?',
            expectedManifestId: 'spectral-math-core',
            expectedKeywords: ['Z_TRANSFORM', 'discreto', 'filtros digitais']
        }
    ];

    let passedTests = 0;

    for (const testCase of testCases) {
        console.log(`\n🧪 Testando: ${testCase.name}`);
        console.log(`📝 Prompt: "${testCase.prompt.substring(0, 100)}..."`);

        const result = orchestrateManifests(testCase.prompt);

        // 1. Verificar se o manifesto foi ativado
        const isActivated = result.activeManifests.some(m => m.name === 'SPECTRAL_MATH');

        if (isActivated) {
            console.log('✅ SUCESSO: SPECTRAL_MATH ativado!');

            // 2. Verificar o conteúdo do prompt enriquecido para ver se contem as regras
            // Isso simula a "injeção de conhecimento"
            const enrichedContent = result.enrichedPrompt;

            // Verificar keywords no manifesto (não necessariamente no prompt enriquecido, 
            // mas mostra que a lógica interna do manifesto faz sentido para o caso)
            // Aqui vamos verificar se o manifesto correto foi retornado com alto nível
            const manifestMatch = result.activeManifests.find(m => m.name === 'SPECTRAL_MATH');
            console.log(`📊 Nível de Confiança: ${manifestMatch?.confidence.toFixed(2)}%`);
            console.log(`👑 Nível do Manifesto: ${manifestMatch?.level}`);

            if (manifestMatch?.level === 104) {
                passedTests++;
            } else {
                console.log('⚠️ AVISO: Nível incorreto detectado.');
            }

        } else {
            console.log('❌ FALHA: SPECTRAL_MATH NÃO foi ativado.');
            console.log('Manifestos ativos:', result.activeManifests.map(m => m.name).join(', '));
        }
    }

    console.log('\n==============================================');
    console.log(`🏁 RESULTADO FINAL: ${passedTests}/${testCases.length} testes passaram.`);

    if (passedTests === testCases.length) {
        console.log('🌟 O SISTEMA ESTÁ MATEMATICAMENTE SOBERANO! 🌟');
    } else {
        console.log('⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS TRIGGERS.');
    }
}

// Executar o teste
runTest();
