
import { FOURIER_TRANSFORM_MASTER_MANIFEST, shouldEnableFourierMaster } from '../services/manifestos/FOURIER_TRANSFORM_MASTER_MANIFEST';

console.log("=== VERIFICAÇÃO DO MANIFESTO FOURIER ===");
console.log(`Versão: ${FOURIER_TRANSFORM_MASTER_MANIFEST.metadata.version}`);
console.log(`Nível: ${FOURIER_TRANSFORM_MASTER_MANIFEST.metadata.level}`);
console.log(`Autor: ${FOURIER_TRANSFORM_MASTER_MANIFEST.metadata.author}`);

const testPrompts = [
    "gostaria de uma receita de bolo", // Deve ser FALSE
    "preciso calcular a FFT de um sinal de radar", // Deve ser TRUE
    "qual a diferença entre FNet e Transformer?", // Deve ser TRUE
    "aleatorio nada a ver", // FALSE
    "quantum fourier transform application", // TRUE
    "simetria hermitiana no espaco de frequencia" // TRUE (pela palavra frequencia)
];

console.log("\n--- Teste de Ativação ---");
let passed = 0;
let total = 0;

testPrompts.forEach(prompt => {
    const isActive = shouldEnableFourierMaster(prompt);
    const status = isActive ? 'SIM' : 'NÃO';

    // Log coloridinho se possível, ou simples
    console.log(`Prompt: "${prompt}"`);
    console.log(`  -> Ativou? [${status}]`);

    // Validação básica (eu sei o que espero)
    const expected = (prompt.includes('bolo') || prompt.includes('aleatorio')) ? false : true;

    if (isActive === expected) {
        passed++;
        // console.log("  -> OK");
    } else {
        console.error(`  -> ❌ ERRO: Esperava ${expected ? 'SIM' : 'NÃO'}`);
    }
    total++;
    console.log('---');
});

console.log(`\nResultado: ${passed}/${total} testes passaram.`);

if (passed === total) {
    console.log("✅ MANIFESTO OPERACIONAL E PRONTO PARA COMBATE.");
    process.exit(0);
} else {
    console.error("❌ FALHA NA VALIDAÇÃO.");
    process.exit(1);
}
