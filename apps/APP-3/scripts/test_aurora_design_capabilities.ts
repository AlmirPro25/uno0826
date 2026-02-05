
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 🛠️ CONFIGURAÇÃO DE AMBIENTE (Antes de tudo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Carregar .env manualmente (Multiplas tentativas)
const POSSIBLE_PATHS = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env')
];

console.log("📂 Inicializando ambiente...");

let foundFile = false;
for (const envPath of POSSIBLE_PATHS) {
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
        foundFile = true;
        if (process.env.VITE_GEMINI_API_KEY) {
            console.log(`✅ Chave encontrada carregada de: ${envPath}`);
            break;
        }
    }
}

if (!foundFile) {
    console.warn("⚠️ Nenhum .env encontrado.");
} else {
    console.log("🔍 Status da Chave: ", process.env.VITE_GEMINI_API_KEY ? "✅ PRESENTE" : "❌ AUSENTE");
}

// 2. Mock localStorage
if (typeof localStorage === "undefined" || localStorage === null) {
    (global as any).localStorage = {
        getItem: (key: string) => null,
        setItem: (key: string, value: string) => { },
        removeItem: (key: string) => { },
        clear: () => { }
    };
}

// 🚀 IMPORTAÇÕES DINÂMICAS (Para garantir que o env já esteja carregado)
async function testAuroraDesign() {
    console.log("\n🎨 INICIANDO TESTE DE CAPACIDADE DE DESIGN DO AURORA...");
    console.log("=========================================================");

    // Importar módulos AGORA, depois que o env está setado
    const { AuroraBuilder } = await import('../aurora-build/core/AuroraBuilder');
    const { ApiKeyManager } = await import('../services/ApiKeyManager');

    // Verificar chaves
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
        console.error("❌ ERRO: Nenhuma API Key encontrada.");
        console.error("   Certifique-se de que VITE_GEMINI_API_KEY está definida em um arquivo .env");
        return;
    }

    console.log(`🔑 Chave em uso: ...${apiKey.slice(-6)}`);

    const aurora = new AuroraBuilder();

    // Prompt específico para testar os princípios (Financeiro + Dark Mode)
    const prompt = "Crie um Card de 'Saldo Total' para um Dashboard Financeiro (Fintech) em Dark Mode. Deve ser extremamente premium, estilo Stripe/Mercury. Use 'tabular-nums' para os valores.";

    console.log(`📝 PROMPT: "${prompt}"`);
    console.log("⏳ Gerando (Arquiteto + Artesão)... aguarde (pode levar 30s)...");

    try {
        const result = await aurora.build({
            userPrompt: prompt,
            projectType: 'fintech',
            complexity: 'medium',
            generateDesignDoc: false
        });

        console.log("\n✅ GERAÇÃO CONCLUÍDA!");
        console.log(`🎯 Score de Qualidade: ${result.totalScore}`);

        console.log("\n🧐 ANÁLISE AUTOMÁTICA DO CÓDIGO GERADO:");

        const code = result.code.files.map(f => f.content).join('\n');

        // Verificações baseadas no DESIGN_PRINCIPLES_MANIFEST
        const checks = [
            { name: "Grid de 4px (gap-4, p-4, m-4)", regex: /gap-4|p-4|m-4|gap-2|p-6|px-4/ },
            { name: "Bordas Sutis (border-white/10, etc)", regex: /border.*white.*(10|5)|border-gray-800|border-slate-800/ },
            { name: "Tipografia Numérica (tabular-nums ou monospace)", regex: /tabular-nums|font-mono/ },
            { name: "Sombra Controlada/Removida (Dark Mode)", regex: /shadow-sm|shadow-none/ },
            { name: "Classes Flex/Grid", regex: /flex|grid/ }
        ];

        checks.forEach(check => {
            const pass = check.regex.test(code);
            console.log(`   ${pass ? '✅' : '⚠️'} ${check.name}`);
        });

        if (result.totalScore > 0 && result.code.files.length > 0) {
            console.log("\n---- AMOSTRA DE CÓDIGO (Arquivo Principal) ----");
            console.log(result.code.files[0].content);
            // console.log(result.code.files[0].content.substring(0, 1500));
        }

    } catch (error) {
        console.error("❌ ERRO DURANTE O TESTE:", error);
    }
}

testAuroraDesign();
