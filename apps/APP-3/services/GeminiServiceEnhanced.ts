// services/GeminiServiceEnhanced.ts

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { AiPersona, getPersonaById } from './GeminiService';
import { simulationDetector } from '../src/utils/SimulationDetector';
import GeminiEnhancer from '../src/utils/GeminiEnhancer';

// Tipos de resposta do serviço Gemini
export enum AiResponseType {
  CODE = 'code',
  PLAN = 'plan',
  CRITIQUE = 'critique',
  STREAM_CHUNK = 'stream_chunk',
  PERSONA_RESPONSE = 'persona_response',
  CHAT_AGENT_RESPONSE = 'chat_agent_response',
  SPECIALIZED_RESEARCH = 'specialized_research',
  BRAINSTORM_IDEAS = 'brainstorm_ideas',
  THEME_COLORS = 'theme_colors',
  ANALYSIS = 'analysis',
  README = 'readme',
  EXPLANATION = 'explanation',
  REFACTOR_SUGGESTION = 'refactor_suggestion',
  TEST_SUGGESTIONS = 'test_suggestions',
  DEBUG_ANALYSIS = 'debug_analysis',
  ERROR = 'error',
  // 🏢 ENTERPRISE PIPELINE: Evento especial quando o pipeline completa
  // Contém o código já convertido para o formato <script data-path="...">
  ENTERPRISE_COMPLETE = 'enterprise_complete'
}

// Interface para opções de geração de conteúdo aprimorado
export interface EnhancedGenerationOptions {
  projectType: string;
  eliminateSimulations: boolean;
  improveCodeQuality: boolean;
  forceApiIntegration: boolean;
  forceSecurityImplementation: boolean;
  autoConfiguration: boolean;
  modelName?: string;
}

// Função para obter instância do GoogleGenAI com chave dinâmica
function getGeminiInstance(): GoogleGenAI {
  const apiKey = ApiKeyManager.getKeyToUse();
  if (!apiKey) {
    throw new Error('Nenhuma API Key disponível. Configure sua chave do Gemini.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * GeminiServiceEnhanced - Versão aprimorada do GeminiService com recursos anti-simulação
 * 
 * Este serviço estende as funcionalidades do GeminiService original, adicionando:
 * 1. Detecção e eliminação de simulações
 * 2. Melhoria automática da qualidade do código
 * 3. Integração forçada de APIs reais
 * 4. Implementação de segurança
 * 5. Configuração automática
 */
class GeminiServiceEnhanced {
  /**
   * Gera conteúdo aprimorado usando o Gemini API com detecção e correção de simulações
   */
  public async generateEnhancedContent(
    prompt: string,
    options: EnhancedGenerationOptions = {
      projectType: 'generic',
      eliminateSimulations: true,
      improveCodeQuality: true,
      forceApiIntegration: true,
      forceSecurityImplementation: true,
      autoConfiguration: true,
      modelName: 'gemini-2.5-pro'
    }
  ) {
    try {
      // 1. Modificar o prompt para evitar simulações desde o início
      const enhancedPrompt = this.enhancePromptWithAntiSimulationRules(prompt, options);
      
      // 2. Gerar conteúdo inicial com o Gemini API
      const initialContent = await this.callGeminiAPI(enhancedPrompt, options.modelName);
      
      // 3. Verificar se há simulações no conteúdo gerado
      const simulationResult = simulationDetector.detectSimulations(initialContent);
      
      // 4. Se não houver simulações, retornar o conteúdo original
      if (!simulationResult.detected) {
        return {
          content: initialContent,
          enhanced: false,
          simulationDetected: false,
          qualityScore: 100
        };
      }
      
      // 5. Caso contrário, melhorar o conteúdo com o GeminiEnhancer
      const enhancementResult = await GeminiEnhancer.enhanceCode(
        initialContent,
        options.projectType
      );
      
      // 6. Retornar o conteúdo aprimorado
      return {
        content: enhancementResult.enhancedCode,
        enhanced: true,
        simulationDetected: simulationResult.detected,
        qualityScore: 90, // Score estimado após enhancement
        improvements: enhancementResult.improvements,
        apiIntegrationsAdded: enhancementResult.apiIntegrationsAdded,
        securityImplementationsAdded: enhancementResult.securityImplementationsAdded
      };
    } catch (error) {
      console.error('Erro ao gerar conteúdo aprimorado:', error);
      throw error;
    }
  }
  
  /**
   * Gera conteúdo com persona específica e aprimoramento anti-simulação
   */
  public async generateContentWithPersonaEnhanced(
    prompt: string,
    personaId: string,
    options: EnhancedGenerationOptions = {
      projectType: 'generic',
      eliminateSimulations: true,
      improveCodeQuality: true,
      forceApiIntegration: true,
      forceSecurityImplementation: true,
      autoConfiguration: true,
      modelName: 'gemini-2.5-pro'
    }
  ) {
    try {
      // Obter a persona
      const persona = getPersonaById(personaId);
      if (!persona) {
        throw new Error(`Persona com ID ${personaId} não encontrada`);
      }
      
      // 1. Modificar o prompt para evitar simulações desde o início
      const enhancedPrompt = this.enhancePromptWithAntiSimulationRules(prompt, options);
      
      // 2. Construir o prompt com a persona
      const personaPrompt = this.buildPersonaPrompt(enhancedPrompt, persona);
      
      // 3. Gerar conteúdo inicial com o Gemini API
      const initialContent = await this.callGeminiAPI(personaPrompt, options.modelName);
      
      // 4. Verificar se há simulações no conteúdo gerado
      const simulationResult = simulationDetector.detectSimulations(initialContent);
      
      // 5. Se não houver simulações, retornar o conteúdo original
      if (!simulationResult.detected) {
        return {
          content: initialContent,
          enhanced: false,
          simulationDetected: false,
          qualityScore: 100,
          persona: persona
        };
      }
      
      // 6. Caso contrário, melhorar o conteúdo com o GeminiEnhancer
      const enhancementResult = await GeminiEnhancer.enhanceCode(
        initialContent,
        options.projectType
      );
      
      // 7. Retornar o conteúdo aprimorado
      return {
        content: enhancementResult.enhancedCode,
        enhanced: true,
        simulationDetected: simulationResult.detected,
        qualityScore: 90, // Score estimado após enhancement
        improvements: enhancementResult.improvements,
        apiIntegrationsAdded: enhancementResult.apiIntegrationsAdded,
        securityImplementationsAdded: enhancementResult.securityImplementationsAdded,
        persona: persona
      };
    } catch (error) {
      console.error('Erro ao gerar conteúdo aprimorado com persona:', error);
      throw error;
    }
  }
  
  /**
   * Constrói o prompt com a persona
   */
  private buildPersonaPrompt(prompt: string, persona: AiPersona): string {
    return `${persona.systemPrompt}\n\n${prompt}`;
  }
  
  /**
   * Melhora o prompt original com regras anti-simulação
   */
  private enhancePromptWithAntiSimulationRules(prompt: string, options: EnhancedGenerationOptions): string {
    // Base do prompt aprimorado
    let enhancedPrompt = prompt;
    
    // Adicionar regras anti-simulação
    if (options.eliminateSimulations) {
      enhancedPrompt += `\n\n### REGRAS OBRIGATÓRIAS - NÃO SIMULE, IMPLEMENTE CÓDIGO REAL:\n\n`;
      enhancedPrompt += `1. NUNCA use placeholders como "lorem ipsum", "TODO", "FIXME" ou "implementar depois".\n`;
      enhancedPrompt += `2. SEMPRE implemente código 100% funcional e pronto para produção.\n`;
      enhancedPrompt += `3. NUNCA deixe funções vazias ou incompletas.\n`;
      enhancedPrompt += `4. SEMPRE implemente tratamento de erros completo.\n`;
      enhancedPrompt += `5. SEMPRE implemente validação de dados.\n`;
    }
    
    // Adicionar regras de integração de API
    if (options.forceApiIntegration) {
      enhancedPrompt += `\n### INTEGRAÇÕES DE API OBRIGATÓRIAS:\n\n`;
      
      // Adicionar integrações específicas com base no tipo de projeto
      if (options.projectType.toLowerCase().includes('ecommerce')) {
        enhancedPrompt += `1. IMPLEMENTE integração completa com Stripe para processamento de pagamentos.\n`;
        enhancedPrompt += `2. IMPLEMENTE upload de imagens com Cloudinary para produtos.\n`;
      } else if (options.projectType.toLowerCase().includes('blog')) {
        enhancedPrompt += `1. IMPLEMENTE upload de imagens com Cloudinary para posts.\n`;
        enhancedPrompt += `2. IMPLEMENTE integração com serviços de email para notificações.\n`;
      } else if (options.projectType.toLowerCase().includes('social')) {
        enhancedPrompt += `1. IMPLEMENTE upload de mídia com Cloudinary.\n`;
        enhancedPrompt += `2. IMPLEMENTE notificações em tempo real.\n`;
      } else {
        enhancedPrompt += `1. IMPLEMENTE integrações reais com APIs externas relevantes para o projeto.\n`;
        enhancedPrompt += `2. IMPLEMENTE upload de arquivos quando necessário.\n`;
      }
      
      enhancedPrompt += `3. IMPLEMENTE integração completa com banco de dados usando Prisma.\n`;
    }
    
    // Adicionar regras de segurança
    if (options.forceSecurityImplementation) {
      enhancedPrompt += `\n### IMPLEMENTAÇÕES DE SEGURANÇA OBRIGATÓRIAS:\n\n`;
      enhancedPrompt += `1. IMPLEMENTE autenticação completa com JWT e bcrypt.\n`;
      enhancedPrompt += `2. IMPLEMENTE proteção contra XSS, CSRF e injeção SQL.\n`;
      enhancedPrompt += `3. IMPLEMENTE validação e sanitização de todas as entradas de usuário.\n`;
      enhancedPrompt += `4. IMPLEMENTE rate limiting para prevenir ataques de força bruta.\n`;
    }
    
    // Adicionar regras de configuração automática
    if (options.autoConfiguration) {
      enhancedPrompt += `\n### CONFIGURAÇÃO AUTOMÁTICA OBRIGATÓRIA:\n\n`;
      enhancedPrompt += `1. IMPLEMENTE configuração via variáveis de ambiente (.env).\n`;
      enhancedPrompt += `2. IMPLEMENTE configurações específicas para ambientes de desenvolvimento e produção.\n`;
      enhancedPrompt += `3. FORNEÇA exemplos de configuração para todas as APIs externas utilizadas.\n`;
    }
    
    // Adicionar lembrete final
    enhancedPrompt += `\n\n### LEMBRETE FINAL:\n\nEste código será usado em produção imediatamente. NÃO SIMULE. Implemente TODAS as funcionalidades de forma COMPLETA e REAL. O código deve estar pronto para uso com o mínimo de configuração manual possível.\n`;
    
    return enhancedPrompt;
  }
  
  /**
   * Chama a API do Gemini
   */
  private async callGeminiAPI(prompt: string, modelName: string = 'gemini-2.5-pro'): Promise<string> {
    try {
      const ai = getGeminiInstance();
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ text: prompt }]
      });
      return result.text || '';
    } catch (error) {
      console.error('Erro na API do Gemini:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se o código gerado contém simulações
   */
  public async checkForSimulations(code: string) {
    return simulationDetector.detectSimulations(code);
  }
  
  /**
   * Melhora o código existente eliminando simulações
   */
  public async enhanceExistingCode(code: string, projectType: string = 'generic', filePath: string = 'unknown') {
    return await GeminiEnhancer.enhanceCode(code, projectType, filePath);
  }
}

// Exporta uma instância única do serviço
export default new GeminiServiceEnhanced();