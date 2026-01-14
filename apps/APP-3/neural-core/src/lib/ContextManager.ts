/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🧠 CONTEXT MANAGER - SISTEMA DE INJEÇÃO DE CONTEXTO 🧠          ║
 * ║                                                                              ║
 * ║                    "O CÉREBRO QUE ENRIQUECE PROMPTS"                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import {
  ARTISAN_DIGITAL_MANIFESTO,
  FINTECH_ARCHITECT_PROTOCOL,
  FULLSTACK_PRO_PROTOCOL,
  GAME_DEV_PROTOCOL,
  EXCELLENCE_CRITERIA,
  CORE_PRINCIPLE
} from './manifestos.js';

/**
 * Detecta se o prompt é sobre desenvolvimento de jogos
 */
export function detectGameContext(userPrompt: string): boolean {
  const gameKeywords = [
    'jogo', 'game', 'jogador', 'player', 'inimigo', 'enemy',
    'pontuação', 'score', 'level', 'nível', 'fase', 'stage',
    'sprite', 'canvas', 'phaser', 'three.js', 'webgl',
    'colisão', 'collision', 'física', 'physics', 'gameplay',
    'rpg', 'fps', 'platformer', 'puzzle', 'arcade', 'shooter'
  ];

  const promptLower = userPrompt.toLowerCase();
  return gameKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt é sobre fintech/banco/pagamentos
 */
export function detectFintechContext(userPrompt: string): boolean {
  const fintechKeywords = [
    'fintech', 'banco', 'bank', 'pagamento', 'payment', 'pix',
    'transferência', 'transfer', 'empréstimo', 'loan', 'crédito', 'credit',
    'carteira digital', 'wallet', 'conta virtual', 'saldo', 'balance',
    'transação', 'transaction', 'mercado pago', 'stripe', 'paypal',
    'débito', 'debit', 'cartão', 'card', 'fatura', 'invoice'
  ];

  const promptLower = userPrompt.toLowerCase();
  return fintechKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt requer arquitetura fullstack
 */
export function detectFullstackContext(userPrompt: string): boolean {
  const fullstackKeywords = [
    'app', 'aplicativo', 'sistema', 'plataforma', 'saas',
    'dashboard', 'painel', 'admin', 'crud', 'api',
    'backend', 'frontend', 'banco de dados', 'database',
    'autenticação', 'authentication', 'login', 'registro',
    'usuário', 'user', 'perfil', 'profile', 'gerenciar', 'manage'
  ];

  const promptLower = userPrompt.toLowerCase();
  
  // Excluir se for apenas landing page ou site estático
  const isStaticSite = /landing page|página de apresentação|portfólio simples|site institucional/i.test(userPrompt);
  
  if (isStaticSite) return false;
  
  return fullstackKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta se o prompt é sobre single-file app
 */
export function detectSingleFileAppContext(userPrompt: string): boolean {
  const singleFileKeywords = [
    'single file', 'arquivo único', 'standalone', 'portátil',
    'offline', 'sem servidor', 'no server', 'self-contained'
  ];

  const promptLower = userPrompt.toLowerCase();
  return singleFileKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Interface para o resultado do enriquecimento
 */
export interface EnrichedPromptResult {
  enrichedPrompt: string;
  detectedContext: {
    isGame: boolean;
    isFintech: boolean;
    isFullstack: boolean;
    isSingleFile: boolean;
  };
  appliedProtocols: string[];
}

/**
 * FUNÇÃO PRINCIPAL: Constrói o prompt enriquecido com toda a sabedoria do sistema
 */
export function buildEnrichedPrompt(userPrompt: string): EnrichedPromptResult {
  console.log('🧠 Context Manager: Analisando prompt...');
  
  // 1. Detectar intenções
  const isGame = detectGameContext(userPrompt);
  const isFintech = detectFintechContext(userPrompt);
  const isFullstack = detectFullstackContext(userPrompt);
  const isSingleFile = detectSingleFileAppContext(userPrompt);

  console.log('📊 Contextos detectados:', {
    isGame,
    isFintech,
    isFullstack,
    isSingleFile
  });

  // 2. Construir o prompt enriquecido
  let systemInstruction = ARTISAN_DIGITAL_MANIFESTO;
  const appliedProtocols: string[] = ['ARTISAN_DIGITAL_MANIFESTO'];

  // 3. Adicionar protocolos específicos baseados no contexto
  if (isFintech) {
    console.log('🏦 Ativando: FINTECH_ARCHITECT_PROTOCOL');
    systemInstruction += '\n\n' + FINTECH_ARCHITECT_PROTOCOL;
    appliedProtocols.push('FINTECH_ARCHITECT_PROTOCOL');
  }

  if (isGame) {
    console.log('🎮 Ativando: GAME_DEV_PROTOCOL');
    systemInstruction += '\n\n' + GAME_DEV_PROTOCOL;
    appliedProtocols.push('GAME_DEV_PROTOCOL');
  }

  if (isFullstack && !isGame && !isFintech) {
    console.log('⚡ Ativando: FULLSTACK_PRO_PROTOCOL');
    systemInstruction += '\n\n' + FULLSTACK_PRO_PROTOCOL;
    appliedProtocols.push('FULLSTACK_PRO_PROTOCOL');
  }

  // 4. Sempre adicionar critérios de excelência
  systemInstruction += '\n\n' + EXCELLENCE_CRITERIA;
  appliedProtocols.push('EXCELLENCE_CRITERIA');

  // 5. Construir o prompt final
  const enrichedPrompt = `${systemInstruction}

═══════════════════════════════════════════════════════════════════════════════

### 🎯 PEDIDO DO USUÁRIO ###

${userPrompt}

═══════════════════════════════════════════════════════════════════════════════

${CORE_PRINCIPLE.mantra}

AGORA, EXECUTE COM EXCELÊNCIA MÁXIMA!
`;

  console.log('✅ Prompt enriquecido com', appliedProtocols.length, 'protocolos');

  return {
    enrichedPrompt,
    detectedContext: {
      isGame,
      isFintech,
      isFullstack,
      isSingleFile
    },
    appliedProtocols
  };
}

/**
 * Versão simplificada para streaming
 */
export function buildEnrichedPromptForStreaming(userPrompt: string): string {
  const result = buildEnrichedPrompt(userPrompt);
  return result.enrichedPrompt;
}

/**
 * Extrai metadados do contexto sem gerar o prompt completo
 */
export function analyzePromptContext(userPrompt: string) {
  return {
    isGame: detectGameContext(userPrompt),
    isFintech: detectFintechContext(userPrompt),
    isFullstack: detectFullstackContext(userPrompt),
    isSingleFile: detectSingleFileAppContext(userPrompt)
  };
}
