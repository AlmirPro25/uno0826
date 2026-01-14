// services/EnhancedGeminiImageService.ts
// Sistema profissional integrado com fila e URLs locais

import { GoogleGenAI, Modality } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { imageQueue, addImageToQueue, processImageQueue, type ImageQueueItem } from './ImageQueueSystem';

// Função para obter instância do GoogleGenAI com chave dinâmica
function getGeminiInstance(): GoogleGenAI {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
        throw new Error('Nenhuma API Key disponível. Configure sua chave do Gemini.');
    }
    return new GoogleGenAI({ apiKey });
}

export interface ImagePlaceholder {
  id: string;
  description: string;
  context: string;
  originalSrc: string;
}

export interface ProcessingResult {
  htmlContent: string;
  imagesQueued: number;
  queueItems: ImageQueueItem[];
}

/**
 * NOVA ABORDAGEM: Processa HTML e adiciona imagens à fila (não gera imediatamente)
 */
export async function processHtmlAndQueueImages(
  htmlContent: string,
  onProgress?: (current: number, total: number, description: string) => void
): Promise<ProcessingResult> {
  
  // 1. Extrair placeholders
  const placeholders = extractImagePlaceholders(htmlContent);
  
  if (placeholders.length === 0) {
    return {
      htmlContent,
      imagesQueued: 0,
      queueItems: []
    };
  }
  
  console.log(`📋 Adicionando ${placeholders.length} imagens à fila de processamento`);
  
  // 2. Adicionar à fila (não processar ainda)
  const queueItems: ImageQueueItem[] = [];
  
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    
    onProgress?.(i + 1, placeholders.length, placeholder.description);
    
    const queueId = addImageToQueue(
      placeholder.description,
      placeholder.context,
      placeholder.originalSrc,
      'medium'
    );
    
    // Buscar item da fila para retornar
    const queueItem = imageQueue['queue'].find(item => item.id === queueId);
    if (queueItem) {
      queueItems.push(queueItem);
    }
    
    console.log(`📋 Adicionado à fila: ${placeholder.description.substring(0, 50)}...`);
  }
  
  console.log(`✅ ${placeholders.length} imagens adicionadas à fila. Use processImageQueue() para gerar.`);
  
  return {
    htmlContent, // HTML original (placeholders serão substituídos após processamento da fila)
    imagesQueued: placeholders.length,
    queueItems
  };
}

/**
 * Processa a fila completa e substitui placeholders no HTML
 */
export async function processQueueAndUpdateHtml(
  originalHtml: string,
  onProgress?: (current: number, total: number, item: ImageQueueItem) => void
): Promise<{ htmlContent: string; imagesGenerated: number; results: ImageQueueItem[] }> {
  
  console.log('🚀 Iniciando processamento da fila de imagens...');
  
  // Configurar callbacks de progresso
  if (onProgress) {
    imageQueue.setProgressCallback(onProgress);
  }
  
  // Processar fila
  const results = await processImageQueue();
  
  // Substituir placeholders no HTML
  const updatedHtml = imageQueue.replaceHtmlPlaceholders(originalHtml);
  
  const successCount = results.filter(item => item.status === 'completed').length;
  
  console.log(`🎉 Processamento concluído! ${successCount}/${results.length} imagens geradas`);
  
  return {
    htmlContent: updatedHtml,
    imagesGenerated: successCount,
    results
  };
}

/**
 * Extrai placeholders de imagem do HTML
 */
export function extractImagePlaceholders(htmlContent: string): ImagePlaceholder[] {
  const placeholders: ImagePlaceholder[] = [];
  const imageRegex = /src=["']ai-researched-image:\/\/([^"']+)["']/g;
  let match;
  
  while ((match = imageRegex.exec(htmlContent)) !== null) {
    const description = match[1];
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extrair contexto ao redor do placeholder (200 chars antes e depois)
    const start = Math.max(0, match.index - 200);
    const end = Math.min(htmlContent.length, match.index + 200);
    const context = htmlContent.substring(start, end);
    
    placeholders.push({
      id,
      description,
      context,
      originalSrc: match[0]
    });
  }
  
  return placeholders;
}

/**
 * Gera uma imagem usando Gemini (usado internamente pela fila)
 */
export async function generateImageWithGemini(
  description: string, 
  context: string
): Promise<string> {
  try {
    console.log(`🎨 Gerando imagem: ${description.substring(0, 50)}...`);
    
    // Verificar se API key está disponível
    const ai = getGeminiInstance();
    console.log(`🔑 API Key disponível:`, !!ai);
    
    // PROMPT RÍGIDO E ESPECÍFICO PARA GERAÇÃO DE IMAGEM
    const rigidPrompt = buildRigidImagePrompt(description, context);
    
    console.log(`🔥 PROMPT ENVIADO: ${rigidPrompt.substring(0, 100)}...`);
    
    // USAR O MODELO OFICIAL: gemini-2.0-flash-preview-image-generation
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: rigidPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    console.log(`📥 RESPOSTA RECEBIDA:`, response.candidates?.[0]?.content?.parts?.length || 0, 'parts');
    
    // Processar resposta e extrair imagem
    const result = await processImageResponse(response, description);
    if (result) {
      return result;
    }
    
    console.log(`⚠️ PRIMEIRA TENTATIVA FALHOU - Tentando com prompt alternativo...`);
    
    // SEGUNDA TENTATIVA: Prompt ultra-específico
    const ultraSpecificPrompt = buildUltraSpecificPrompt(description);
    
    const retryResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: ultraSpecificPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    const retryResult = await processImageResponse(retryResponse, description);
    if (retryResult) {
      return retryResult;
    }
    
    // TERCEIRA TENTATIVA: Prompt minimalista
    console.log(`🔄 SEGUNDA TENTATIVA FALHOU. TENTATIVA FINAL...`);
    
    const keywords = extractKeywords(description);
    const minimalPrompt = buildMinimalPrompt(keywords);
    
    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: minimalPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    const finalResult = await processImageResponse(finalResponse, description);
    if (finalResult) {
      return finalResult;
    }
    
    console.log(`❌ TODAS AS TENTATIVAS FALHARAM para: ${description}`);
    
    // Retornar placeholder SVG como último recurso
    console.log(`🎨 Usando placeholder SVG para: ${description}`);
    return generatePlaceholderSVG(description);
    
  } catch (error: any) {
    console.error('❌ ERRO FINAL na geração de imagem:', error);
    
    // Retornar placeholder SVG em caso de erro
    console.log(`🎨 Usando placeholder SVG para: ${description}`);
    return generatePlaceholderSVG(description);
  }
}

/**
 * Processa resposta da API e extrai imagem
 */
async function processImageResponse(response: any, description: string): Promise<string | null> {
  if (response.candidates?.[0]?.content?.parts) {
    console.log(`🔍 ANALISANDO ${response.candidates[0].content.parts.length} PARTS DA RESPOSTA`);
    
    for (let i = 0; i < response.candidates[0].content.parts.length; i++) {
      const part = response.candidates[0].content.parts[i];
      
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        
        console.log(`🎉 IMAGEM ENCONTRADA! Tipo: ${mimeType}, Tamanho: ${imageData.length} chars`);
        
        // Retornar data URL diretamente (será processado pela fila)
        const dataUrl = `data:${mimeType};base64,${imageData}`;
        
        console.log(`✅ IMAGEM GERADA COM SUCESSO!`);
        return dataUrl;
      }
    }
  }
  
  return null;
}

// Funções auxiliares de prompt
function buildRigidImagePrompt(description: string, context: string): string {
  const styleInstructions = determineImageStyle(context);
  return `Hi, can you create a high-quality professional ${styleInstructions.toLowerCase()} of: ${description}. Please generate an image for this.`;
}

function buildUltraSpecificPrompt(description: string): string {
  return `Hi, can you create a professional photograph of: ${description}. High quality, realistic image. I need you to provide an image for this.`;
}

function buildMinimalPrompt(keywords: string): string {
  return `Can you create an image of: ${keywords}. Please generate a visual image.`;
}

function extractKeywords(description: string): string {
  return description.split(' ').slice(0, 4).join(' ');
}

function determineImageStyle(context: string): string {
  const isFood = /pizza|hambúrguer|comida|restaurante|culinária/i.test(context);
  const isProduct = /produto|smartphone|tecnologia|e-commerce/i.test(context);
  const isInterior = /interior|ambiente|sala|escritório|decoração/i.test(context);
  const isPerson = /pessoa|profissional|equipe|cliente/i.test(context);
  
  if (isFood) return 'Professional food photography, natural lighting, elegant background';
  if (isProduct) return 'Product photography, minimalist background, soft lighting';
  if (isInterior) return 'Interior architecture photography, natural lighting, cozy atmosphere';
  if (isPerson) return 'Professional corporate photography, natural lighting, neutral background';
  
  return 'Professional high-quality photography, balanced composition';
}

function generatePlaceholderSVG(description: string): string {
  const shortDesc = description.length > 30 ? description.substring(0, 30) + '...' : description;
  
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1f2937"/>
    <rect x="10" y="10" width="380" height="280" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="10,5"/>
    <text x="200" y="140" font-family="Arial, sans-serif" font-size="14" 
          fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
      🎨 Gerando imagem...
    </text>
    <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" 
          fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
      ${shortDesc}
    </text>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Funções utilitárias para verificação
export function hasImagePlaceholders(htmlContent: string): boolean {
  return /ai-researched-image:\/\//.test(htmlContent);
}

export function countImagePlaceholders(htmlContent: string): number {
  const matches = htmlContent.match(/ai-researched-image:\/\/[^"']+/g);
  return matches ? matches.length : 0;
}

// Função para obter status da fila
export function getImageQueueStatus() {
  return imageQueue.getQueueStatus();
}
