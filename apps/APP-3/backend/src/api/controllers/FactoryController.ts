import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

export class FactoryController {

    // Endpoint para criar um novo App via Open Code CLI
    static async genterateApp(req: Request, res: Response) {
        try {
            const { prompt, projectName } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt é obrigatório' });
            }

            console.log(`🏭 FACTORY: Iniciando geração de app. Prompt: "${prompt}"`);

            // Caminho para o script batch do factory
            // Ajustando path relativo para a raiz do APP-3 onde está o factory.bat
            // backend/src/api/controllers -> ../../../factory.bat
            const factoryScript = path.resolve(__dirname, '../../../../factory.bat');

            // Construir um prompt enriquecido com os detalhes para o Agente
            let enhancedPrompt = prompt;

            if (projectName) {
                enhancedPrompt += ` Crie o projeto em uma pasta chamada "${projectName}".`;
            }

            // Processar stack completa se fornecida e adicionar ao prompt
            const { fullStack } = req.body;
            if (fullStack) {
                const stackDetails = [];
                if (fullStack.frontend) stackDetails.push(`Frontend: ${fullStack.frontend}`);
                if (fullStack.backend) stackDetails.push(`Backend: ${fullStack.backend}`);
                if (fullStack.styling) stackDetails.push(`Styling: ${fullStack.styling}`);

                if (stackDetails.length > 0) {
                    enhancedPrompt += ` Requisitos da Tech Stack: ${stackDetails.join(', ')}.`;
                    console.log(`🏭 FACTORY: Stack configurada e injetada no prompt:`, fullStack);
                }
            }

            // Argumentos para o Open Code (usando comando 'run' que existe na CLI)
            // A CLI espera: opencode run "mensagem"
            const args = ['run', enhancedPrompt];

            // Executar node diretamente para evitar problemas com .bat e shell quoting
            const cliScript = path.resolve(__dirname, '../../../../cli/index.cjs');

            // Argumentos finais: [script_path, ...nossos_args]
            const nodeArgs = [cliScript, ...args];

            console.log(`🏭 FACTORY: Executando: node ${nodeArgs.join(' ')}`);

            // Inicia o processo em background
            const process = spawn('node', nodeArgs, {
                cwd: path.dirname(factoryScript), // Executa na raiz do APP-3
                shell: false // IMPORTANTE: shell false evita problemas de aspas no Windows
            });

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                const chunk = data.toString();
                console.log(`[FACTORY]: ${chunk}`);
                output += chunk;
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`[FACTORY ERR]: ${data}`);
            });

            process.on('close', (code) => {
                console.log(`🏭 FACTORY: Processo finalizado com código ${code}`);

                if (code === 0) {
                    res.json({
                        success: true,
                        message: 'App gerado com sucesso!',
                        logs: output,
                        projectPath: projectName ? `./workspace/${projectName}` : 'auto-generated'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Falha na geração do app',
                        details: errorOutput,
                        logs: output
                    });
                }
            });

        } catch (error) {
            console.error('Erro no FactoryController:', error);
            res.status(500).json({ error: 'Erro interno no servidor de fábrica' });
        }
    }
}
