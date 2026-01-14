/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🎼 ORCHESTRA INTEGRATION - INTEGRAÇÃO COM GEMINI SERVICE 🎼         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra o Tool Orchestra com o GeminiService existente.
 * Detecta automaticamente quando usar o pipeline de 3 fases.
 */

import { ToolOrchestra, shouldUseOrchestra, type OrchestraResult, type OrchestraRequest } from './ToolOrchestra';
import pipelineEvents from './PipelineEvents';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface OrchestraIntegrationResult {
  usedOrchestra: boolean;
  result?: OrchestraResult;
  formattedCode?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE INTEGRAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica se deve usar o Orchestra e executa se necessário.
 * Retorna null se não deve usar Orchestra (para continuar com fluxo normal).
 */
export async function tryOrchestraExecution(
  userPrompt: string,
  options?: {
    forceOrchestra?: boolean;
    onPhaseStart?: (phase: any) => void;
    onPhaseComplete?: (phase: any) => void;
    onProgress?: (message: string) => void;
  }
): Promise<OrchestraIntegrationResult | null> {
  
  // Verificar se deve usar Orchestra
  const shouldUse = options?.forceOrchestra || shouldUseOrchestra(userPrompt);
  
  if (!shouldUse) {
    console.log('🎼 [ORCHESTRA] Não ativado - prompt não requer pipeline de 3 fases');
    return null;
  }
  
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🎼 TOOL ORCHESTRA DETECTADO E ATIVADO 🎼                        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  
  try {
    const orchestra = new ToolOrchestra();
    
    const result = await orchestra.orchestrate({
      userPrompt,
      projectType: detectProjectType(userPrompt),
      complexity: detectComplexity(userPrompt),
      onPhaseStart: options?.onPhaseStart,
      onPhaseComplete: options?.onPhaseComplete,
      onProgress: options?.onProgress
    });
    
    if (!result.success) {
      return {
        usedOrchestra: true,
        result,
        error: 'Falha na execução do Orchestra'
      };
    }
    
    // Formatar código para exibição
    const formattedCode = formatOrchestraResult(result);
    
    return {
      usedOrchestra: true,
      result,
      formattedCode
    };
    
  } catch (error) {
    console.error('❌ [ORCHESTRA] Erro na execução:', error);
    return {
      usedOrchestra: true,
      error: String(error)
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta o tipo de projeto baseado no prompt
 */
function detectProjectType(prompt: string): OrchestraRequest['projectType'] {
  const promptLower = prompt.toLowerCase();
  
  if (/fintech|banco|bank|pagamento|pix|carteira/i.test(prompt)) {
    return 'fintech';
  }
  if (/mobile|app|aplicativo|android|ios|react native|flutter/i.test(prompt)) {
    return 'mobile';
  }
  if (/api|backend|servidor|server|rest|graphql/i.test(prompt) && 
      !/frontend|interface|ui|tela/i.test(prompt)) {
    return 'api';
  }
  if (/fullstack|full-stack|sistema completo|complete system/i.test(prompt)) {
    return 'fullstack';
  }
  
  return 'web';
}

/**
 * Detecta a complexidade do projeto baseado no prompt
 */
function detectComplexity(prompt: string): OrchestraRequest['complexity'] {
  const promptLower = prompt.toLowerCase();
  
  // Enterprise
  if (/enterprise|corporativo|grande escala|high scale|microservices/i.test(prompt)) {
    return 'enterprise';
  }
  
  // Complex
  if (/complexo|avançado|advanced|completo|full|dashboard|admin|painel/i.test(prompt)) {
    return 'complex';
  }
  
  // Simple
  if (/simples|simple|básico|basic|mvp|protótipo|prototype/i.test(prompt)) {
    return 'simple';
  }
  
  return 'medium';
}

/**
 * Formata o resultado do Orchestra para exibição
 */
function formatOrchestraResult(result: OrchestraResult): string {
  const allFiles = [
    ...result.finalProduct.backend,
    ...result.finalProduct.frontend,
    ...result.finalProduct.docs,
    ...result.finalProduct.config,
    ...result.finalProduct.tests
  ];
  
  // Criar HTML wrapper com todos os arquivos
  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projeto Gerado pelo Tool Orchestra</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen">
<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🎼 PROJETO GERADO PELO TOOL ORCHESTRA 🎼                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 ESTATÍSTICAS:
- Total de arquivos: ${result.totalFiles}
- Tempo de execução: ${(result.executionTime / 1000).toFixed(2)}s
- Backend: ${result.finalProduct.backend.length} arquivos
- Frontend: ${result.finalProduct.frontend.length} arquivos
- Docs: ${result.finalProduct.docs.length} arquivos
- Config: ${result.finalProduct.config.length} arquivos
- Tests: ${result.finalProduct.tests.length} arquivos

📦 ARQUIVOS INCLUÍDOS:
${allFiles.map(f => `- ${f.path}`).join('\n')}

🚀 INSTRUÇÕES:
1. Use o botão "Exportar Projeto" para extrair todos os arquivos
2. Ou clique em "Ver Arquivos" para navegar pela estrutura
3. Os arquivos estão em tags <script type="text/plain" data-path="...">

-->

<div class="container mx-auto p-8">
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-4">🎼 Projeto Gerado com Sucesso!</h1>
        <p class="text-gray-400">Pipeline de 3 fases executado em ${(result.executionTime / 1000).toFixed(2)}s</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-2">🏗️ Backend</h3>
            <p class="text-3xl font-bold text-blue-400">${result.finalProduct.backend.length}</p>
            <p class="text-gray-400">arquivos</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-2">🎨 Frontend</h3>
            <p class="text-3xl font-bold text-green-400">${result.finalProduct.frontend.length}</p>
            <p class="text-gray-400">arquivos</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-2">📚 Docs & Config</h3>
            <p class="text-3xl font-bold text-purple-400">${result.finalProduct.docs.length + result.finalProduct.config.length}</p>
            <p class="text-gray-400">arquivos</p>
        </div>
    </div>
    
    <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-4">📁 Estrutura do Projeto</h3>
        <div class="font-mono text-sm text-gray-300 space-y-1">
            ${allFiles.map(f => `<div class="hover:bg-gray-700 px-2 py-1 rounded">${f.path}</div>`).join('\n            ')}
        </div>
    </div>
</div>

`;

  // Adicionar cada arquivo como script
  for (const file of allFiles) {
    html += `
<script type="text/plain" data-path="${file.path}">
${file.content}
</script>
`;
  }

  html += `
</body>
</html>`;

  return html;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PARA UI - ESTADO DO PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Retorna o estado atual do pipeline para a UI
 */
export function getPipelineState() {
  return {
    isActive: pipelineEvents.getIsActive(),
    subscribe: pipelineEvents.subscribe.bind(pipelineEvents),
    reset: pipelineEvents.reset.bind(pipelineEvents)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { shouldUseOrchestra, ToolOrchestra };
export default tryOrchestraExecution;
