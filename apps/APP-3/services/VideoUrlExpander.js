// services/VideoUrlExpander.js
// Sistema para expandir URLs comprimidas de vídeo

/**
 * Expande URLs comprimidas (ai-vid://id) para URLs reais de vídeo
 */
export function expandVideoUrls(htmlContent) {
  if (typeof window === 'undefined') return htmlContent || '';
  if (!htmlContent || typeof htmlContent !== 'string') {
    console.log('⚠️ HTML content inválido ou vazio');
    return '';
  }
  
  // Logs reduzidos para evitar spam no console
  const hasAiVideos = htmlContent && htmlContent.includes('ai-vid://');
  if (hasAiVideos) {
    console.log('🎬 EXPANDINDO URLs DE VÍDEO...');
  }
  
  try {
    const videoStore = JSON.parse(localStorage.getItem('ai-generated-videos') || '{}');
    const videoIds = Object.keys(videoStore);
    
    // Encontrar todas as URLs ai-vid:// no HTML
    const aiVidMatches = htmlContent.match(/ai-vid:\/\/([^"'\s]+)/g) || [];
    
    if (hasAiVideos || aiVidMatches.length > 0) {
      console.log(`💾 LocalStorage: ${videoIds.length} vídeos | URLs encontradas: ${aiVidMatches.length}`);
    }
    
    // Substituir todas as URLs comprimidas por URLs reais de vídeo
    const expandedHtml = htmlContent.replace(/ai-vid:\/\/([^"'\s]+)/g, (match, videoId) => {
      console.log(`🔄 Expandindo ${match} (ID: ${videoId})`);
      
      const storedVideo = videoStore[videoId];
      if (storedVideo && storedVideo.videoUrl) {
        console.log(`✅ Vídeo encontrado! URL: ${storedVideo.videoUrl}`);
        
        // Criar elemento de vídeo com poster (thumbnail)
        return `${storedVideo.videoUrl}" data-poster="${storedVideo.thumbnailUrl || ''}" data-description="${storedVideo.description || ''}`;
      }
      
      console.log(`❌ Vídeo não encontrado para ID: ${videoId}`);
      
      // Fallback para placeholder se não encontrar
      return `data:video/mp4,${encodeURIComponent('Vídeo não encontrado')}" poster="data:image/svg+xml,${encodeURIComponent(`
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#dc3545"/>
          <text x="200" y="140" font-family="Arial" font-size="14" 
                fill="white" text-anchor="middle" dominant-baseline="middle">
            ❌ Vídeo não encontrado
          </text>
          <text x="200" y="160" font-family="Arial" font-size="12" 
                fill="white" text-anchor="middle" dominant-baseline="middle">
            ID: ${videoId}
          </text>
        </svg>
      `)}`;
    });
    
    const expansionsCount = (htmlContent.match(/ai-vid:\/\//g) || []).length;
    if (expansionsCount > 0) {
      console.log(`🎉 Expansão de vídeos concluída! ${expansionsCount} URLs processadas`);
    }
    
    return expandedHtml;
  } catch (error) {
    console.error('❌ Erro ao expandir URLs de vídeo:', error);
    return htmlContent;
  }
}

/**
 * Comprime URLs longas de vídeo em URLs curtas
 */
export function compressVideoUrls(htmlContent) {
  if (typeof window === 'undefined') return htmlContent;
  
  try {
    const videoStore = JSON.parse(localStorage.getItem('ai-generated-videos') || '{}');
    
    // Encontrar URLs de vídeo e substituir por URLs comprimidas
    // Procura por src="http..." com atributos data-poster e data-description
    return htmlContent.replace(/src="(https?:\/\/[^"]+)"\s+data-poster="([^"]+)"\s+data-description="([^"]+)"/g, (match, videoUrl, thumbnailUrl, description) => {
      // Procurar se já existe uma URL comprimida para este vídeo
      for (const [videoId, storedVideo] of Object.entries(videoStore)) {
        if (storedVideo.videoUrl === videoUrl) {
          return `src="ai-vid://${videoId}"`;
        }
      }
      
      // Se não encontrar, criar nova URL comprimida
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      videoStore[videoId] = {
        videoUrl,
        thumbnailUrl,
        description,
        timestamp: Date.now()
      };
      
      // Salvar no localStorage
      try {
        localStorage.setItem('ai-generated-videos', JSON.stringify(videoStore));
      } catch (storageError) {
        console.warn('⚠️ LocalStorage cheio, limpando cache de vídeos antigos...');
        
        // Limpar vídeos antigos
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        Object.keys(videoStore).forEach(key => {
          if (now - videoStore[key].timestamp > oneHour) {
            delete videoStore[key];
          }
        });
        
        // Tentar novamente
        try {
          localStorage.setItem('ai-generated-videos', JSON.stringify(videoStore));
        } catch (finalError) {
          console.error('❌ Não foi possível salvar vídeos no localStorage:', finalError);
        }
      }
      
      return `src="ai-vid://${videoId}"`;
    });
  } catch (error) {
    console.error('❌ Erro ao comprimir URLs de vídeo:', error);
    return htmlContent;
  }
}