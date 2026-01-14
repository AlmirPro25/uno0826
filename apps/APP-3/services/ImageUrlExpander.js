// services/ImageUrlExpander.js
// Sistema para expandir URLs comprimidas de imagem

/**
 * Expande URLs comprimidas (ai-img://id) para data URLs reais
 */
export function expandImageUrls(htmlContent) {
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
          <rect width="100%" height="100%" fill="#f8d7da"/>
          <text x="200" y="140" font-family="Arial" font-size="14" 
                fill="#721c24" text-anchor="middle" dominant-baseline="middle">
            ❌ Imagem não encontrada
          </text>
          <text x="200" y="160" font-family="Arial" font-size="12" 
                fill="#721c24" text-anchor="middle" dominant-baseline="middle">
            ID: ${imageId}
          </text>
        </svg>
      `)}`;
    });
    
    const expansionsCount = (htmlContent.match(/ai-img:\/\//g) || []).length;
    if (expansionsCount > 0) {
      console.log(`🎉 Expansão de imagens concluída! ${expansionsCount} URLs processadas`);
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
export function compressImageUrls(htmlContent) {
  if (typeof window === 'undefined') return htmlContent;
  
  try {
    const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
    
    // Encontrar data URLs e substituir por URLs comprimidas
    return htmlContent.replace(/src="(data:image\/[^;]+;base64,[^"]+)"/g, (match, dataUrl) => {
      // Procurar se já existe uma URL comprimida para esta imagem
      for (const [imageId, storedImage] of Object.entries(imageStore)) {
        if (storedImage.dataUrl === dataUrl) {
          return `src="ai-img://${imageId}"`;
        }
      }
      
      // Se não encontrar, criar nova URL comprimida
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      imageStore[imageId] = {
        dataUrl,
        description: '',
        timestamp: Date.now()
      };
      
      // Salvar no localStorage
      try {
        localStorage.setItem('ai-generated-images', JSON.stringify(imageStore));
      } catch (storageError) {
        console.warn('⚠️ LocalStorage cheio, limpando cache de imagens antigas...');
        
        // Limpar imagens antigas
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        Object.keys(imageStore).forEach(key => {
          if (now - imageStore[key].timestamp > oneHour) {
            delete imageStore[key];
          }
        });
        
        // Tentar novamente
        try {
          localStorage.setItem('ai-generated-images', JSON.stringify(imageStore));
        } catch (finalError) {
          console.error('❌ Não foi possível salvar imagens no localStorage:', finalError);
        }
      }
      
      return `src="ai-img://${imageId}"`;
    });
  } catch (error) {
    console.error('❌ Erro ao comprimir URLs de imagem:', error);
    return htmlContent;
  }
}