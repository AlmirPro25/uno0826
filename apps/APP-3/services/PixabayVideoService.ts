// services/PixabayVideoService.ts
// Sistema para buscar e processar vídeos do Pixabay no frontend

import { PixabayVideo, searchVideos } from './PixabayService';
import { StoredVideo } from './VideoUrlExpander';

/**
 * Interface para placeholder de vídeo
 */
export interface VideoPlaceholder {
  id: string;
  description: string;
  context: string;
  originalSrc: string;
}

/**
 * Interface para vídeo gerado
 */
export interface GeneratedVideo {
  id: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  originalSrc: string;
}

/**
 * Função auxiliar para salvar vídeo no localStorage com limpeza automática
 */
export function saveVideoToStorage(videoId: string, videoUrl: string, thumbnailUrl: string, description: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const videoStore = JSON.parse(localStorage.getItem('ai-generated-videos') || '{}');
    
    // Limpar vídeos antigos se localStorage estiver cheio
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    Object.keys(videoStore).forEach(key => {
      if (now - videoStore[key].timestamp > oneHour) {
        delete videoStore[key];
      }
    });
    
    videoStore[videoId] = {
      videoUrl,
      thumbnailUrl,
      description,
      timestamp: now
    };
    
    localStorage.setItem('ai-generated-videos', JSON.stringify(videoStore));
    console.log(`💾 Vídeo salvo no localStorage: ${videoId} (URL: ${videoUrl})`);
    console.log(`📊 Total de vídeos no storage: ${Object.keys(videoStore).length}`);
    
  } catch (storageError) {
    console.warn('⚠️ LocalStorage cheio, limpando cache de vídeos...');
    localStorage.removeItem('ai-generated-videos');
    
    // Tentar novamente com storage limpo
    try {
      const newStore = {};
      newStore[videoId] = {
        videoUrl,
        thumbnailUrl,
        description,
        timestamp: Date.now()
      };
      localStorage.setItem('ai-generated-videos', JSON.stringify(newStore));
      console.log(`💾 Vídeo salvo após limpeza: ${videoId}`);
    } catch (finalError) {
      console.error('❌ Não foi possível salvar no localStorage:', finalError);
      // Continuar sem salvar no localStorage
    }
  }
}

/**
 * Extrai placeholders de vídeo do HTML
 */
export function extractVideoPlaceholders(htmlContent: string): VideoPlaceholder[] {
  const placeholders: VideoPlaceholder[] = [];
  const videoRegex = /src=["']ai-researched-video:\/\/([^"']+)["']/g;
  let match;
  
  while ((match = videoRegex.exec(htmlContent)) !== null) {
    const description = match[1];
    const id = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
 * Busca vídeo no Pixabay e retorna URL comprimida
 */
export async function searchVideoWithPixabay(description: string): Promise<string> {
  try {
    console.log(`🔍 Buscando vídeo no Pixabay: ${description}`);
    
    // Buscar vídeos no Pixabay
    const videos = await searchVideos(description);
    
    if (videos && videos.length > 0) {
      // Selecionar o primeiro vídeo
      const video = videos[0];
      
      // Preferir qualidade média para melhor performance, com fallback para alta qualidade
      const videoFile = video.videos.medium || video.videos.large;
      const videoUrl = videoFile.url;
      const thumbnailUrl = videoFile.thumbnail;
      
      console.log(`✅ Vídeo encontrado no Pixabay: ${videoUrl}`);
      
      // Gerar ID único para o vídeo
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      // Salvar no localStorage
      saveVideoToStorage(videoId, videoUrl, thumbnailUrl, description);
      
      // Retornar URL comprimida
      return `ai-vid://${videoId}`;
    }
    
    console.warn(`⚠️ Nenhum vídeo encontrado no Pixabay para: ${description}`);
    return generatePlaceholderVideo(description);
    
  } catch (error) {
    console.error('❌ Erro ao buscar vídeo no Pixabay:', error);
    return generatePlaceholderVideo(description);
  }
}

/**
 * Gera placeholder para vídeo em caso de erro
 */
function generatePlaceholderVideo(description: string): string {
  const shortDesc = description.length > 30 ? description.substring(0, 30) + '...' : description;
  
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1f2937"/>
    <rect x="10" y="10" width="380" height="280" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="10,5"/>
    <text x="200" y="140" font-family="Arial, sans-serif" font-size="14" 
          fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
      🎬 Vídeo não encontrado
    </text>
    <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" 
          fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
      ${shortDesc}
    </text>
  </svg>`;
  
  // Criar ID único para o placeholder
  const videoId = `vid_placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  // Salvar no localStorage
  const placeholderUrl = `data:video/mp4,${encodeURIComponent('Vídeo não encontrado')}`;
  const thumbnailUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  saveVideoToStorage(videoId, placeholderUrl, thumbnailUrl, description);
  
  // Retornar URL comprimida
  return `ai-vid://${videoId}`;
}

/**
 * Processa HTML completo e busca todos os vídeos
 */
export async function processHtmlAndSearchVideos(
  htmlContent: string,
  onProgress?: (current: number, total: number, description: string) => void
): Promise<{ htmlContent: string; videosFound: number; videos: GeneratedVideo[] }> {
  
  // 1. Extrair placeholders
  const placeholders = extractVideoPlaceholders(htmlContent);
  
  if (placeholders.length === 0) {
    return {
      htmlContent,
      videosFound: 0,
      videos: []
    };
  }
  
  console.log(`🎬 Encontrados ${placeholders.length} placeholders de vídeo`);
  
  // 2. Buscar vídeos
  let updatedHtml = htmlContent;
  const foundVideos: GeneratedVideo[] = [];
  
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    
    try {
      onProgress?.(i + 1, placeholders.length, placeholder.description);
      
      const compressedUrl = await searchVideoWithPixabay(placeholder.description);
      
      // Substituir placeholder pela URL comprimida
      updatedHtml = updatedHtml.replace(
        placeholder.originalSrc,
        placeholder.originalSrc.replace(
          `ai-researched-video://${placeholder.description}`,
          compressedUrl
        )
      );
      
      // Obter informações do vídeo do localStorage
      const videoId = compressedUrl.replace('ai-vid://', '');
      const videoStore = JSON.parse(localStorage.getItem('ai-generated-videos') || '{}');
      const storedVideo = videoStore[videoId] as StoredVideo;
      
      if (storedVideo) {
        foundVideos.push({
          id: videoId,
          description: placeholder.description,
          videoUrl: storedVideo.videoUrl,
          thumbnailUrl: storedVideo.thumbnailUrl,
          originalSrc: placeholder.originalSrc
        });
      }
      
      console.log(`✅ Vídeo ${i + 1}/${placeholders.length} encontrado`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao buscar vídeo ${i + 1}:`, error);
      
      // Em caso de erro, usar placeholder
      const placeholderUrl = generatePlaceholderVideo(placeholder.description);
      updatedHtml = updatedHtml.replace(
        placeholder.originalSrc,
        placeholder.originalSrc.replace(
          `ai-researched-video://${placeholder.description}`,
          placeholderUrl
        )
      );
    }
  }
  
  return {
    htmlContent: updatedHtml,
    videosFound: foundVideos.length,
    videos: foundVideos
  };
}