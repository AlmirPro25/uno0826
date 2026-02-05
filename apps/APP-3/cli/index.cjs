const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log("🚀 INICIANDO OPENCODE CLI VIA APP-3 WRAPPER...");

// Caminho para o diretório do Open Code
const openCodeDir = path.resolve(__dirname, '../opencode-dev/opencode-dev');
const openCodePackage = path.join(openCodeDir, 'packages/opencode');

// Verifica se o diretório existe
if (!fs.existsSync(openCodePackage)) {
    console.error(`❌ ERRO: Não foi possível encontrar o pacote OpenCode em: ${openCodePackage}`);
    console.error("Certifique-se de que a pasta 'opencode-dev' foi copiada corretamente para dentro de APP-3.");
    process.exit(1);
}

console.log(`✅ Pacote OpenCode encontrado em: ${openCodePackage}`);
console.log("ℹ️  Tentando executar via 'bun' (requer Bun instalado)...");

// Argumentos passados para a CLI
const args = process.argv.slice(2);

// Tenta localizar o executável do Bun (path absoluto ou no PATH)
const userProfile = process.env.USERPROFILE || process.env.HOME;
const bunPathData = path.join(userProfile, '.bun', 'bin', 'bun.exe');
const bunCmd = fs.existsSync(bunPathData) ? bunPathData : 'bun';

console.log(`ℹ️  Usando Bun em: ${bunCmd}`);

// Tenta rodar usando Bun direto do fonte (modo DEV)
// Comando equivalente: bun run --conditions=browser ./src/index.ts [args]
const child = spawn(bunCmd, ['run', '--conditions=browser', './src/index.ts', ...args], {
    cwd: openCodePackage,
    stdio: 'inherit',
    shell: false
});

child.on('error', (err) => {
    console.error("❌ Falha ao iniciar o processo do OpenCode via Bun.");
    console.error("Você tem o Bun instalado? (https://bun.sh)");
    console.error(`Erro original: ${err.message}`);
});

child.on('close', (code) => {
    if (code !== 0) {
        console.log(`⚠️ Processo do OpenCode finalizou com código: ${code}`);
    } else {
        console.log("✅ Execução do OpenCode finalizada com sucesso.");
    }
});
