// services/ImageUrlExpander.ts
// Sistema para expandir URLs comprimidas de imagem

export interface StoredImage {
  dataUrl: string;
  description: string;
  timestamp: number;
}

/**
 * Expande URLs comprimidas (ai-img://id) para data URLs reais
 */
export function expandImageUrls(htmlContent: string): string {
  if (typeof window === 'undefined') return htmlContent || '';
  if (!htmlContent || typeof htmlContent !== 'string') {
    console.log('⚠️ HTML content inválido ou vazio');
    return '';
  }
  
  // Logs reduzidos para evitar spam no console
  const hasAiImages = htmlContent && htmlContent.includes('ai-img://');
  if (hasAiImages) {
    console.log('🔍 EXPANDINDO URLs DE IMAGEM...');
  }
  
  try {
    const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
    const imageIds = Object.keys(imageStore);
    
    // Encontrar todas as URLs ai-img:// no HTML
    const aiImgMatches = htmlContent.match(/ai-img:\/\/([^"'\s]+)/g) || [];
    
    if (hasAiImages || aiImgMatches.length > 0) {
      console.log(`💾 LocalStorage: ${imageIds.length} imagens | URLs encontradas: ${aiImgMatches.length}`);
    }
    
    // Substituir todas as URLs comprimidas por data URLs reais
    const expandedHtml = htmlContent.replace(/ai-img:\/\/([^"'\s]+)/g, (match, imageId) => {
      console.log(`🔄 Expandindo ${match} (ID: ${imageId})`);
      
      const storedImage = imageStore[imageId];
      if (storedImage && storedImage.dataUrl) {
        console.log(`✅ Imagem encontrada! Tamanho: ${storedImage.dataUrl.length} chars`);
        return storedImage.dataUrl;
      }
      
      console.log(`❌ Imagem não encontrada para ID: ${imageId}`);
      
      // Fallback para placeholder se não encontrar
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#dc3545"/>
          <text x="200" y="140" font-family="Arial" font-size="14" 
                fill="white" text-anchor="middle" dominant-baseline="middle">
            ❌ Imagem não encontrada
          </text>
          <text x="200" y="160" font-family="Arial" font-size="12" 
                fill="white" text-anchor="middle" dominant-baseline="middle">
            ID: ${imageId}
          </text>
        </svg>
      `)}`;
    });
    
    const expansionsCount = (htmlContent.match(/ai-img:\/\//g) || []).length;
    if (expansionsCount > 0) {
      console.log(`🎉 Expansão concluída! ${expansionsCount} URLs processadas`);
    }
    
    return expandedHtml;
  } catch (error) {
    console.error('❌ Erro ao expandir URLs de imagem:', error);
    return htmlContent;
  }
}

/**
 * Comprime data URLs longas em URLs curtas
 */
export function compressImageUrls(htmlContent: string): string {
  if (typeof window === 'undefined') return htmlContent;
  
  try {
    const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
    
    // Encontrar data URLs longas e substituir por URLs comprimidas
    return htmlContent.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g, (dataUrl) => {
      // Procurar se já existe uma URL comprimida para esta data URL
      for (const [imageId, storedImage] of Object.entries(imageStore)) {
        if ((storedImage as StoredImage).dataUrl === dataUrl) {
          return `ai-img://${imageId}`;
        }
      }
      
      // Se não encontrar, criar nova URL comprimida
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      imageStore[imageId] = {
        dataUrl,
        description: 'Imagem gerada',
        timestamp: Date.now()
      };
      localStorage.setItem('ai-generated-images', JSON.stringify(imageStore));
      
      return `ai-img://${imageId}`;
    });
  } catch (error) {
    console.error('Erro ao comprimir URLs de imagem:', error);
    return htmlContent;
  }
}

/**
 * Limpa imagens antigas do localStorage (mais de 24h)
 */
export function cleanupOldImages(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    let cleaned = 0;
    for (const [imageId, storedImage] of Object.entries(imageStore)) {
      if (now - (storedImage as StoredImage).timestamp > maxAge) {
        delete imageStore[imageId];
        cleaned++;
      }
    }
    
    localStorage.setItem('ai-generated-images', JSON.stringify(imageStore));
    
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} imagens antigas removidas do cache`);
    }
  } catch (error) {
    console.error('Erro ao limpar imagens antigas:', error);
  }
}

/**
 * Obtém estatísticas do cache de imagens
 */
export function getImageCacheStats(): { count: number; totalSize: number } {
  if (typeof window === 'undefined') return { count: 0, totalSize: 0 };
  
  try {
    const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
    const count = Object.keys(imageStore).length;
    const totalSize = JSON.stringify(imageStore).length;
    
    return { count, totalSize };
  } catch (error) {
    return { count: 0, totalSize: 0 };
  }
}