// services/MediaIntegrationService.ts
// Sistema integrado para processamento de imagens e vídeos no frontend

import { processHtmlAndSearchImages } from './PixabayImageService';
import { processHtmlAndSearchVideos } from './PixabayVideoService';
import { compressImageUrls } from './ImageUrlExpander';
import { compressVideoUrls } from './VideoUrlExpander';

/**
 * Interface para progresso do processamento de mídia
 */
export interface MediaProcessProgress {
  current: number;
  total: number;
  type: 'image' | 'video';
  description: string;
}

/**
 * Processa HTML completo e busca todas as mídias (imagens e vídeos)
 */
export async function processHtmlAndGenerateMedia(
  htmlContent: string,
  onProgress?: (progress: MediaProcessProgress) => void
): Promise<string> {
  if (!htmlContent) return '';
  
  console.log('🎬 INICIANDO PROCESSAMENTO DE MÍDIA...');
  
  // 1. Processar imagens
  const imageResult = await processHtmlAndSearchImages(
    htmlContent,
    (current, total, description) => {
      onProgress?.({ current, total, type: 'image', description });
    }
  );
  
  console.log(`📸 Processamento de imagens concluído: ${imageResult.imagesFound} encontradas`);
  
  // 2. Processar vídeos
  const videoResult = await processHtmlAndSearchVideos(
    imageResult.htmlContent,
    (current, total, description) => {
      onProgress?.({ current, total, type: 'video', description });
    }
  );
  
  console.log(`🎥 Processamento de vídeos concluído: ${videoResult.videosFound} encontrados`);
  
  // 3. Comprimir URLs para o editor
  let finalHtml = videoResult.htmlContent;
  
  // Comprimir URLs de imagem e vídeo para o editor
  finalHtml = compressImageUrls(finalHtml);
  finalHtml = compressVideoUrls(finalHtml);
  
  console.log('✅ PROCESSAMENTO DE MÍDIA CONCLUÍDO!');
  
  return finalHtml;
}

/**
 * Extrai placeholders de mídia do HTML
 */
export function extractMediaPlaceholders(htmlContent: string): { images: number; videos: number } {
  const imagePlaceholders = (htmlContent.match(/ai-researched-image:\/\/([^"'\s]+)/g) || []).length;
  const videoPlaceholders = (htmlContent.match(/ai-researched-video:\/\/([^"'\s]+)/g) || []).length;
  
  return {
    images: imagePlaceholders,
    videos: videoPlaceholders
  };
}

/**
 * Verifica se o HTML contém placeholders de mídia
 */
export function hasMediaPlaceholders(htmlContent: string): boolean {
  return htmlContent.includes('ai-researched-image://') || htmlContent.includes('ai-researched-video://');
}

/**
 * Cria um elemento de vídeo com os atributos corretos
 */
export function createVideoElement(description: string, className: string = ''): string {
  return `<video src="ai-researched-video://${description}" controls class="${className}" width="100%" height="auto" preload="metadata">
    Seu navegador não suporta a tag de vídeo.
  </video>`;
}

/**
 * Cria um elemento de imagem com os atributos corretos
 */
export function createImageElement(description: string, className: string = '', alt: string = ''): string {
  return `<img src="ai-researched-image://${description}" class="${className}" alt="${alt || description}" loading="lazy" />`;
}