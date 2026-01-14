// services/EnhancedGeminiService.ts
// Extensão do GeminiService com geração automática de imagens

import { generateAiResponse, AiServicePhase, AiServiceResponse } from './GeminiService';
import { AiResponseType } from './GeminiServiceEnhanced';
import { imageGenerationService, ImageGenerationResponse } from './ImageGenerationService';
import type { Part } from "@google/genai";
import type { ResearchFinding } from './GeminiService';

export interface EnhancedAiResponse extends AiServiceResponse {
  imagesGenerated?: number;
  imageUrls?: string[];
  processingTime?: number;
}

/**
 * Versão aprimorada do generateAiResponse que inclui geração automática de imagens
 */
export async function generateAiResponseWithImages(
  userPromptInput: string,
  phase: AiServicePhase,
  modelName: string,
  currentPlanInput?: string | null,
  currentCodeInput?: string | null,
  initialPlanPromptInput?: string | null,
  researchFindings?: ResearchFinding[],
  attachments?: Part[],
  options: {
    generateImages?: boolean;
    projectId?: string;
    showProgress?: (message: string) => void;
  } = {}
): Promise<EnhancedAiResponse> {
  
  const startTime = Date.now();
  const { generateImages = true, projectId, showProgress } = options;
  
  try {
    // 1. Gerar código usando o GeminiService original
    showProgress?.('🤖 Gerando código com IA...');
    
    const aiResponse = await generateAiResponse(
      userPromptInput,
      phase,
      modelName,
      currentPlanInput,
      currentCodeInput,
      initialPlanPromptInput,
      researchFindings,
      attachments
    );

    // 2. Se não for geração de código ou não tiver placeholders, retornar resposta original
    if (!generateImages || 
        aiResponse.type !== AiResponseType.CODE || 
        !imageGenerationService.hasImagePlaceholders(aiResponse.content)) {
      
      return {
        ...aiResponse,
        imagesGenerated: 0,
        imageUrls: [],
        processingTime: Date.now() - startTime
      };
    }

    // 3. Contar placeholders para feedback
    const placeholderCount = imageGenerationService.countImagePlaceholders(aiResponse.content);
    showProgress?.(`📸 Encontrados ${placeholderCount} placeholders de imagem. Gerando...`);

    // 4. Processar e gerar imagens
    const imageResponse: ImageGenerationResponse = await imageGenerationService.processHtmlAndGenerateImages(
      aiResponse.content,
      projectId
    );

    // 5. Retornar resposta aprimorada
    const enhancedResponse: EnhancedAiResponse = {
      ...aiResponse,
      content: imageResponse.htmlContent,
      imagesGenerated: imageResponse.imagesGenerated,
      imageUrls: imageResponse.images.map(img => img.url),
      processingTime: Date.now() - startTime
    };

    showProgress?.(`✅ Concluído! ${imageResponse.imagesGenerated} imagens geradas em ${Math.round(enhancedResponse.processingTime! / 1000)}s`);

    return enhancedResponse;

  } catch (error: any) {
    console.error('❌ Erro na geração aprimorada:', error);
    
    // Em caso de erro na geração de imagens, retornar resposta original
    showProgress?.('⚠️ Erro na geração de imagens, usando placeholders...');
    
    const fallbackResponse = await generateAiResponse(
      userPromptInput,
      phase,
      modelName,
      currentPlanInput,
      currentCodeInput,
      initialPlanPromptInput,
      researchFindings,
      attachments
    );

    return {
      ...fallbackResponse,
      imagesGenerated: 0,
      imageUrls: [],
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Função para pré-visualização com placeholders temporários
 */
export function generatePreviewWithPlaceholders(htmlContent: string): string {
  return imageGenerationService.replaceWithPreviewPlaceholders(htmlContent);
}

/**
 * Função para processar imagens em HTML já existente
 */
export async function processExistingHtmlImages(
  htmlContent: string,
  projectId?: string,
  showProgress?: (message: string) => void
): Promise<{ htmlContent: string; imagesGenerated: number }> {
  
  if (!imageGenerationService.hasImagePlaceholders(htmlContent)) {
    return { htmlContent, imagesGenerated: 0 };
  }

  const placeholderCount = imageGenerationService.countImagePlaceholders(htmlContent);
  showProgress?.(`📸 Processando ${placeholderCount} imagens...`);

  try {
    const result = await imageGenerationService.processHtmlAndGenerateImages(htmlContent, projectId);
    
    showProgress?.(`✅ ${result.imagesGenerated} imagens geradas com sucesso!`);
    
    return {
      htmlContent: result.htmlContent,
      imagesGenerated: result.imagesGenerated
    };
    
  } catch (error: any) {
    console.error('Erro no processamento de imagens:', error);
    showProgress?.('⚠️ Erro na geração, usando placeholders temporários');
    
    return {
      htmlContent: imageGenerationService.replaceWithPreviewPlaceholders(htmlContent),
      imagesGenerated: 0
    };
  }
}

/**
 * Função utilitária para análise de conteúdo de imagem
 */
export function analyzeImageContent(htmlContent: string): {
  hasImages: boolean;
  placeholderCount: number;
  descriptions: string[];
  estimatedGenerationTime: number;
} {
  const hasImages = imageGenerationService.hasImagePlaceholders(htmlContent);
  const placeholderCount = imageGenerationService.countImagePlaceholders(htmlContent);
  const descriptions = imageGenerationService.extractImageDescriptions(htmlContent);
  
  // Estimar tempo baseado na quantidade de imagens (aproximadamente 10-15s por imagem)
  const estimatedGenerationTime = placeholderCount * 12; // segundos
  
  return {
    hasImages,
    placeholderCount,
    descriptions,
    estimatedGenerationTime
  };
}