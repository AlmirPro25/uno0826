#!/usr/bin/env node

/**
 * Factory MCP Server
 * Integração entre Agentes Inteligentes e a Fábrica OpenCode (APP-3)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Caminho da Fábrica
const FACTORY_BAT_PATH = path.resolve(__dirname, "../factory.bat");

const server = new Server(
    {
        name: "prost-qs-factory",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Lista as ferramentas disponíveis para o Agente
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "ping",
                description: "Testa a conexao com o servidor MCP",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "generate_app",
                description: "Cria um novo Micro-SaaS ou aplicação usando a Fábrica OpenCode.",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "Descrição detalhada do app que deve ser criado (ex: 'Um CRM para dentistas com agendamento').",
                        },
                        output_dir: {
                            type: "string",
                            description: "Nome da pasta de saída (opcional, padrão: automático).",
                        },
                    },
                    required: ["prompt"],
                },
            },
            {
                name: "maintain_app",
                description: "Realiza manutenção ou alteração em um app existente gerado pela fábrica.",
                inputSchema: {
                    type: "object",
                    properties: {
                        app_path: {
                            type: "string",
                            description: "Caminho relativo do app a ser modificado.",
                        },
                        instruction: {
                            type: "string",
                            description: "Instrução do que deve ser alterado ou corrigido.",
                        },
                    },
                    required: ["app_path", "instruction"],
                },
            },
        ],
    };
});

/**
 * Executa as ferramentas quando solicitadas pelo Agente
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "ping") {
        return {
            content: [{ type: "text", text: "PONG! Servidor MCP esta online." }]
        };
    }

    if (name === "generate_app") {
        return await handleGenerateApp(args.prompt, args.output_dir);
    }

    if (name === "maintain_app") {
        return await handleMaintainApp(args.app_path, args.instruction);
    }

    throw new Error(`Ferramenta desconhecida: ${name}`);
});

// Funcao para remover emojis e caracteres especiais da saida
function sanitize(text) {
    if (!text) return '';
    // Remove emojis e caracteres nao-ASCII, mantendo acentos basicos
    return text
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental
        .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols
        .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch
        .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media
        .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Media
        .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
        .replace(/[\u{25B6}]/gu, '')            // Play
        .replace(/[\u{25C0}]/gu, '')            // Reverse
        .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
        .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella
        .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
        .replace(/[\u{267F}]/gu, '')            // Wheelchair
        .replace(/[\u{2693}]/gu, '')            // Anchor
        .replace(/[\u{26A1}]/gu, '')            // Zap
        .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
        .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Balls
        .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Weather
        .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
        .replace(/[\u{26D4}]/gu, '')            // No entry
        .replace(/[\u{26EA}]/gu, '')            // Church
        .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain
        .replace(/[\u{26F5}]/gu, '')            // Boat
        .replace(/[\u{26FA}]/gu, '')            // Tent
        .replace(/[\u{26FD}]/gu, '')            // Fuel
        .replace(/[\u{2702}]/gu, '')            // Scissors
        .replace(/[\u{2705}]/gu, '')            // Check
        .replace(/[\u{2708}-\u{270D}]/gu, '')   // Airplane
        .replace(/[\u{270F}]/gu, '')            // Pencil
        .replace(/[\u{2712}]/gu, '')            // Nib
        .replace(/[\u{2714}]/gu, '')            // Check
        .replace(/[\u{2716}]/gu, '')            // X
        .replace(/[\u{271D}]/gu, '')            // Cross
        .replace(/[\u{2721}]/gu, '')            // Star
        .replace(/[\u{2728}]/gu, '')            // Sparkles
        .replace(/[\u{2733}-\u{2734}]/gu, '')   // Eight pointed
        .replace(/[\u{2744}]/gu, '')            // Snowflake
        .replace(/[\u{2747}]/gu, '')            // Sparkle
        .replace(/[\u{274C}]/gu, '')            // X
        .replace(/[\u{274E}]/gu, '')            // X
        .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question
        .replace(/[\u{2757}]/gu, '')            // Exclamation
        .replace(/[\u{2763}-\u{2764}]/gu, '')   // Heart
        .replace(/[\u{2795}-\u{2797}]/gu, '')   // Math
        .replace(/[\u{27A1}]/gu, '')            // Arrow
        .replace(/[\u{27B0}]/gu, '')            // Curly loop
        .replace(/[\u{27BF}]/gu, '')            // Double loop
        .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
        .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
        .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
        .replace(/[\u{2B50}]/gu, '')            // Star
        .replace(/[\u{2B55}]/gu, '')            // Circle
        .replace(/[\u{3030}]/gu, '')            // Wavy
        .replace(/[\u{303D}]/gu, '')            // Part alternation
        .replace(/[\u{3297}]/gu, '')            // Circled ideograph
        .replace(/[\u{3299}]/gu, '');           // Circled ideograph
}

// Configuração do Caminho da CLI
const CLI_PATH = path.resolve(__dirname, "../cli/index.cjs");

async function handleGenerateApp(prompt, outputDir) {
    // Executa o Open Code CLI diretamente via Node (bypassing .bat para segurança e consistência)
    return new Promise((resolve) => {
        // Enriquecer o prompt se houver outputDir, pois 'run' não aceita --output
        let enhancedPrompt = prompt;
        if (outputDir) {
            enhancedPrompt += ` (Create the project in folder: ${outputDir})`;
        }

        // Argumentos: [script, command, prompt]
        const args = [CLI_PATH, 'run', enhancedPrompt];

        console.error(`[FACTORY-MCP] Executando: node ${args.join(' ')}`);

        let stdout = '';
        let stderr = '';

        const child = spawn('node', args, {
            cwd: path.resolve(__dirname, ".."), // APP-3 Root
            shell: false,
        });

        child.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            console.error(`[FACTORY STDOUT]: ${chunk}`);
        });

        child.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            console.error(`[FACTORY STDERR]: ${chunk}`);
        });

        child.on('close', (code) => {
            const success = code === 0;
            console.error(`[FACTORY-MCP] Processo finalizado com codigo: ${code}`);

            resolve({
                content: [
                    {
                        type: "text",
                        text: success
                            ? `[OK] App Gerado com Sucesso!\n\nPrompt: "${prompt}"\nOutput: ${outputDir || 'auto'}\n\nLogs:\n${sanitize(stdout)}`
                            : `[ERRO] Falha na Geracao\n\nPrompt: "${prompt}"\nCodigo de saida: ${code}\n\nErro:\n${sanitize(stderr || stdout)}`,
                    },
                ],
            });
        });

        child.on('error', (err) => {
            console.error(`[FACTORY-MCP] Erro ao executar: ${err.message}`);
            resolve({
                content: [
                    {
                        type: "text",
                        text: `[ERRO] Erro ao Iniciar Factory\n\nErro: ${err.message}\n\nVerifique se o Bun esta instalado e o caminho esta correto.`,
                    },
                ],
            });
        });
    });
}

async function handleMaintainApp(appPath, instruction) {
    // Executa o Open Code CLI para manutenção
    return new Promise((resolve) => {
        // Passa o caminho do app e a instrução como argumentos
        const args = ['maintain', appPath, instruction];

        console.error(`[FACTORY-MCP] Manutencao: ${FACTORY_BAT_PATH} ${args.join(' ')}`);

        let stdout = '';
        let stderr = '';

        const child = spawn(FACTORY_BAT_PATH, args, {
            cwd: path.dirname(FACTORY_BAT_PATH),
            shell: true,
        });

        child.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            console.error(`[MAINTAIN STDOUT]: ${chunk}`);
        });

        child.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            console.error(`[MAINTAIN STDERR]: ${chunk}`);
        });

        child.on('close', (code) => {
            const success = code === 0;
            console.error(`[FACTORY-MCP] Manutencao finalizada com codigo: ${code}`);

            resolve({
                content: [
                    {
                        type: "text",
                        text: success
                            ? `[OK] Manutencao Concluida!\n\nApp: ${appPath}\nInstrucao: "${instruction}"\n\nLogs:\n${sanitize(stdout)}`
                            : `[ERRO] Falha na Manutencao\n\nApp: ${appPath}\nCodigo de saida: ${code}\n\nErro:\n${sanitize(stderr || stdout)}`,
                    },
                ],
            });
        });

        child.on('error', (err) => {
            console.error(`[FACTORY-MCP] Erro ao executar manutenção: ${err.message}`);
            resolve({
                content: [
                    {
                        type: "text",
                        text: `[ERRO] Erro ao Iniciar Manutencao\n\nErro: ${err.message}`,
                    },
                ],
            });
        });
    });
}

const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
    console.error("Erro ao iniciar servidor Factory MCP:", err);
});
