
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 🛠️ CONFIGURAÇÃO DE AMBIENTE 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

// 2. Mock localStorage
if (typeof localStorage === "undefined" || localStorage === null) {
    (global as any).localStorage = { getItem: () => null, setItem: () => { } };
}

async function generateShowcase() {
    console.log("🎨 GERANDO COMPONENTE PREMIUM PARA DEMONSTRAÇÃO...");

    const { AuroraBuilder } = await import('../aurora-build/core/AuroraBuilder');
    const aurora = new AuroraBuilder();

    // Prompt focado em DESIGN PURO
    const prompt = `Crie um componente React (Next.js) chamado 'RevenueCard.tsx'. 
  É um card financeiro para um dashboard SaaS. 
  
  Requisitos Visuais (Design Principles):
  1. Estilo 'Sophistication & Trust' (Stripe/Mercury).
  2. Dark Mode nativo (use border-white/5 ou white/10 em vez de sombras).
  3. Fonte tabular para números (font-mono ou tabular-nums).
  4. Padding simétrico e Grid de 4px.
  5. Use ícones do lucide-react ou phosphor.
  6. Inclua um 'mini sparkline' ou indicador de tendência positivo (verde desaturado) ou negativo.
  7. Valores: Receita Total ($42,500.00), Crescimento (+12.5%).
  
  Gere APENAS o código do componente.`;

    try {
        const result = await aurora.build({
            userPrompt: prompt,
            projectType: 'fintech',
            complexity: 'medium',
            generateDesignDoc: false // Rapidez
        });

        const code = result.code.files[0].content;
        const outputPath = path.resolve(__dirname, '../components/RevenueCard.tsx');

        // Garantir diretório
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        fs.writeFileSync(outputPath, code);

        console.log("\n✅ COMPONENTE GERADO E SALVO!");
        console.log(`📂 Caminho: ${outputPath}`);
        console.log("\n---- PREVIEW DO CÓDIGO (Início) ----");
        console.log(code.substring(0, 1000));

    } catch (error) {
        console.error("❌ ERRO:", error);
    }
}

generateShowcase();
