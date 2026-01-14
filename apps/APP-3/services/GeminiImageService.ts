// services/GeminiImageService.ts
// Sistema de geração de imagens integrado ao GeminiService existente

import { GoogleGenAI, Modality } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';

// Função para obter instância do GoogleGenAI com chave dinâmica
function getGeminiInstance(): GoogleGenAI {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
        throw new Error('Nenhuma API Key disponível. Configure sua chave do Gemini.');
    }
    return new GoogleGenAI({ apiKey });
}

// Função auxiliar para salvar imagem no localStorage com limpeza automática
function saveImageToStorage(imageId: string, dataUrl: string, description: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
    
    // Limpar imagens antigas se localStorage estiver cheio
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    Object.keys(imageStore).forEach(key => {
      if (now - imageStore[key].timestamp > oneHour) {
        delete imageStore[key];
      }
    });
    
    imageStore[imageId] = {
      dataUrl,
      description,
      timestamp: now
    };
    
    localStorage.setItem('ai-generated-images', JSON.stringify(imageStore));
    console.log(`💾 Imagem salva no localStorage: ${imageId} (${dataUrl.length} chars)`);
    console.log(`📊 Total de imagens no storage: ${Object.keys(imageStore).length}`);
    
  } catch (storageError) {
    console.warn('⚠️ LocalStorage cheio, limpando cache de imagens...');
    localStorage.removeItem('ai-generated-images');
    
    // Tentar novamente com storage limpo
    try {
      const newStore = {};
      newStore[imageId] = {
        dataUrl,
        description,
        timestamp: Date.now()
      };
      localStorage.setItem('ai-generated-images', JSON.stringify(newStore));
      console.log(`💾 Imagem salva após limpeza: ${imageId}`);
    } catch (finalError) {
      console.error('❌ Não foi possível salvar no localStorage:', finalError);
      // Continuar sem salvar no localStorage
    }
  }
}

export interface ImagePlaceholder {
  id: string;
  description: string;
  context: string;
  originalSrc: string;
}

export interface GeneratedImage {
  id: string;
  description: string;
  dataUrl: string; // Base64 data URL para usar diretamente no HTML
  originalSrc: string;
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
 * Gera uma imagem usando Imagen 3.0 (modelo correto do Gemini)
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
    
    console.log(`🔥 PROMPT RÍGIDO ENVIADO: ${rigidPrompt.substring(0, 100)}...`);
    
    // USAR O MODELO OFICIAL: gemini-2.0-flash-preview-image-generation
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: rigidPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    console.log(`📥 RESPOSTA RECEBIDA:`, response.candidates?.[0]?.content?.parts?.length || 0, 'parts');
    console.log(`📊 RESPOSTA COMPLETA:`, JSON.stringify(response, null, 2).substring(0, 500) + '...');

    // Processar resposta e extrair imagem com nova estrutura
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
    
    console.log(`📥 SEGUNDA TENTATIVA - RESPOSTA:`, retryResponse.candidates?.[0]?.content?.parts?.length || 0, 'parts');
    
    const retryResult = await processImageResponse(retryResponse, description);
    if (retryResult) {
      return retryResult;
    }
    
    // TERCEIRA TENTATIVA: Prompt minimalista com palavras-chave
    console.log(`🔄 SEGUNDA TENTATIVA FALHOU. TENTATIVA FINAL COM PROMPT MINIMALISTA...`);
    
    const keywords = extractKeywords(description);
    const minimalPrompt = buildMinimalPrompt(keywords);
    
    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: minimalPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    console.log(`📥 TERCEIRA TENTATIVA - RESPOSTA:`, finalResponse.candidates?.[0]?.content?.parts?.length || 0, 'parts');
    
    const finalResult = await processImageResponse(finalResponse, description);
    if (finalResult) {
      return finalResult;
    }
    
    console.log(`❌ TODAS AS TENTATIVAS FALHARAM para: ${description}`);
    
    // FALLBACK TEMPORARIAMENTE DESABILITADO - Pixabay pausado para testes
    console.log(`⏸️ PIXABAY PAUSADO - Usando apenas Gemini para testes`);
    // TODO: Reabilitar Pixabay quando sistema de fila estiver pronto
    // try {
    //   const { searchImages } = await import('./PixabayService');
    //   const images = await searchImages(description);
    //   if (images && images.length > 0) {
    //     return images[0].largeImageURL;
    //   }
    // } catch (pixabayError) {
    //   console.error(`❌ PIXABAY falhou:`, pixabayError);
    // }
    
    throw new Error('Nenhuma imagem foi gerada após 3 tentativas + Pixabay');
    
  } catch (error: any) {
    console.error('❌ ERRO FINAL na geração de imagem:', error);
    console.error('📋 DETALHES DO ERRO:', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    
    // FALLBACK FINAL TEMPORARIAMENTE DESABILITADO
    console.log(`⏸️ PIXABAY FALLBACK PAUSADO - Sistema em modo de teste Gemini apenas`);
    // TODO: Reabilitar quando sistema de fila estiver implementado
    // try {
    //   const { searchImages } = await import('./PixabayService');
    //   const images = await searchImages(description);
    //   if (images && images.length > 0) {
    //     return images[0].largeImageURL;
    //   }
    // } catch (pixabayError) {
    //   console.error(`❌ Pixabay falhou:`, pixabayError);
    // }
    
    // Retornar placeholder SVG como último recurso
    console.log(`🎨 Usando placeholder SVG para: ${description}`);
    return generatePlaceholderSVG(description);
  }
}

/**
 * Constrói prompt RÍGIDO e específico para geração de imagem (formato oficial Google)
 */
function buildRigidImagePrompt(description: string, context: string): string {
  const styleInstructions = determineImageStyle(context);
  
  return `Hi, can you create a high-quality professional ${styleInstructions.toLowerCase()} of: ${description}. Please generate an image for this.`;
}

/**
 * Constrói prompt ultra-específico para segunda tentativa
 */
function buildUltraSpecificPrompt(description: string): string {
  return `Hi, can you create a professional photograph of: ${description}. High quality, realistic image. I need you to provide an image for this.`;
}

/**
 * Constrói prompt minimalista para terceira tentativa
 */
function buildMinimalPrompt(keywords: string): string {
  return `Can you create an image of: ${keywords}. Please generate a visual image.`;
}

/**
 * Extrai palavras-chave principais da descrição
 */
function extractKeywords(description: string): string {
  return description.split(' ').slice(0, 4).join(' ');
}

/**
 * Determina estilo da imagem baseado no contexto
 */
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

/**
 * Processa resposta da API e extrai imagem
 */
async function processImageResponse(response: any, description: string): Promise<string | null> {
  if (response.candidates?.[0]?.content?.parts) {
    console.log(`🔍 ANALISANDO ${response.candidates[0].content.parts.length} PARTS DA RESPOSTA`);
    
    for (let i = 0; i < response.candidates[0].content.parts.length; i++) {
      const part = response.candidates[0].content.parts[i];
      console.log(`📋 PART ${i + 1}:`, {
        hasInlineData: !!part.inlineData,
        mimeType: part.inlineData?.mimeType,
        hasText: !!part.text,
        textPreview: part.text?.substring(0, 50),
        dataSize: part.inlineData?.data?.length || 0
      });
      
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        
        console.log(`🎉 IMAGEM ENCONTRADA! Tipo: ${mimeType}, Tamanho: ${imageData.length} chars`);
        
        // Criar URL comprimida para manter o código limpo
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const compressedUrl = `ai-img://${imageId}`;
        
        // Armazenar a data URL real para uso posterior
        const dataUrl = `data:${mimeType};base64,${imageData}`;
        
        // Armazenar no localStorage para referência
        saveImageToStorage(imageId, dataUrl, description);
        
        console.log(`✅ IMAGEM SALVA COM SUCESSO! ID: ${imageId}`);
        return compressedUrl;
      }
    }
  }
  
  return null;
}

/**
 * Gera placeholder SVG em caso de erro
 */
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
  
  // Usar encodeURIComponent para caracteres especiais
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Processa HTML completo e gera todas as imagens
 */
export async function processHtmlAndGenerateImages(
  htmlContent: string,
  onProgress?: (current: number, total: number, description: string) => void
): Promise<{ htmlContent: string; imagesGenerated: number; images: GeneratedImage[] }> {
  
  // 1. Extrair placeholders
  const placeholders = extractImagePlaceholders(htmlContent);
  
  if (placeholders.length === 0) {
    return {
      htmlContent,
      imagesGenerated: 0,
      images: []
    };
  }
  
  console.log(`📸 Encontrados ${placeholders.length} placeholders de imagem`);
  
  // 2. Gerar imagens
  let updatedHtml = htmlContent;
  const generatedImages: GeneratedImage[] = [];
  
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    
    try {
      onProgress?.(i + 1, placeholders.length, placeholder.description);
      
      const dataUrl = await generateImageWithGemini(
        placeholder.description,
        placeholder.context
      );
      
      // Substituir placeholder pela data URL
      updatedHtml = updatedHtml.replace(
        placeholder.originalSrc,
        placeholder.originalSrc.replace(
          `ai-researched-image://${placeholder.description}`,
          dataUrl
        )
      );
      
      generatedImages.push({
        id: placeholder.id,
        description: placeholder.description,
        dataUrl,
        originalSrc: placeholder.originalSrc
      });
      
      console.log(`✅ Imagem ${i + 1}/${placeholders.length} gerada`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao gerar imagem ${i + 1}:`, error);
      
      // Em caso de erro, usar placeholder
      const placeholderSvg = generatePlaceholderSVG(placeholder.description);
      updatedHtml = updatedHtml.replace(
        placeholder.originalSrc,
        placeholder.originalSrc.replace(
          `ai-researched-image://${placeholder.description}`,
          placeholderSvg
        )
      );
    }
  }
  
  console.log(`🎉 Processamento concluído! ${generatedImages.length}/${placeholders.length} imagens geradas`);
  
  return {
    htmlContent: updatedHtml,
    imagesGenerated: generatedImages.length,
    images: generatedImages
  };
}

/**
 * Verifica se HTML contém placeholders de imagem
 */
export function hasImagePlaceholders(htmlContent: string): boolean {
  return /ai-researched-image:\/\//.test(htmlContent);
}

/**
 * Conta quantos placeholders existem
 */
export function countImagePlaceholders(htmlContent: string): number {
  const matches = htmlContent.match(/ai-researched-image:\/\/[^"']+/g);
  return matches ? matches.length : 0;
}