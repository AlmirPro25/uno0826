
const fs = require('fs');
const path = require('path');

const orchestratorPath = path.join(__dirname, '../services/manifestos/ManifestOrchestrator.ts');
const manifestPath = path.join(__dirname, '../services/manifestos/SPECTRAL_MATH_CORE_MANIFEST.ts');

console.log('🔍 Validando integração do SPECTRAL_MATH_CORE estaticamente...');

try {
    const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    // 1. Validar se o manifesto define as regras de engenharia
    console.log('\n1. Verificando Manifesto (SPECTRAL_MATH_CORE_MANIFEST.ts)...');

    const requiredSections = [
        'operational_rules',
        'cost_model',
        'state_model',
        'spectral_ir',
        'fusion_strategies',
        'reasoning_protocol'
    ];

    let manifestScore = 0;
    requiredSections.forEach(section => {
        if (manifestContent.includes(section)) {
            console.log(`✅ Seção encontrada: ${section}`);
            manifestScore++;
        } else {
            console.log(`❌ Seção FALTANDO: ${section}`);
        }
    });

    // 2. Validar se o orquestrador importa e registra o manifesto
    console.log('\n2. Verificando Orquestrador (ManifestOrchestrator.ts)...');

    const checks = [
        { term: 'import { SPECTRAL_MATH_CORE_MANIFEST', desc: 'Importação' },
        { term: "name: 'SPECTRAL_MATH'", desc: 'Registro do Nome' },
        { term: 'level: 104', desc: 'Nível Correto (104)' },
        { term: 'detector: shouldEnableSpectralMath', desc: 'Detector Conectado' }
    ];

    let orchestratorScore = 0;
    checks.forEach(check => {
        if (orchestratorContent.includes(check.term)) {
            console.log(`✅ ${check.desc} OK`);
            orchestratorScore++;
        } else {
            console.log(`❌ ${check.desc} FALHOU`);
        }
    });

    if (manifestScore === requiredSections.length && orchestratorScore === checks.length) {
        console.log('\n🌟 INTEGRAÇÃO VALIDADA COM SUCESSO! O Matematico Supremo está online.');
        process.exit(0);
    } else {
        console.log('\n⚠️ A validação encontrou problemas.');
        process.exit(1);
    }

} catch (err) {
    console.error('Erro na validação:', err);
    process.exit(1);
}
