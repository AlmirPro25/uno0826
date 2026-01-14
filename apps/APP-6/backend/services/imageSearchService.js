/**
 * 🖼️ IMAGE SEARCH SERVICE
 * Busca imagens de múltiplas fontes
 */

import { browserService } from './browserService.js';

/**
 * Buscar imagens usando Unsplash API (gratuita)
 */
async function searchUnsplash(query, maxResults = 6) {
    try {
        // Unsplash Source API (sem necessidade de API key)
        const keywords = query.split(' ').slice(0, 3).join(',');
        const images = [];
        
        for (let i = 0; i < maxResults; i++) {
            images.push({
                type: 'image',
                url: `https://source.unsplash.com/800x600/?${keywords}&sig=${i}`,
                thumbnail: `https://source.unsplash.com/400x300/?${keywords}&sig=${i}`,
                title: `Imagem ${i + 1} - ${query}`,
                description: `Resultado da busca por "${query}"`,
                source: 'Unsplash',
                width: 800,
                height: 600
            });
        }
        
        return images;
    } catch (error) {
        console.error('❌ Erro Unsplash:', error);
        return [];
    }
}

/**
 * Buscar imagens usando Bing Images
 */
async function searchBingImages(query, maxResults = 6) {
    const sessionId = `image_search_${Date.now()}`;
    
    try {
        console.log(`🔍 Buscando imagens no Bing: "${query}"`);
        
        // Criar sessão
        await browserService.createSession(sessionId);
        
        // Navegar para Bing Images
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
        await browserService.navigate(sessionId, searchUrl, { timeout: 10000 });
        
        // Aguardar carregamento
        await browserService.waitForLoadState(sessionId, 'networkidle', 5000);
        
        // Extrair imagens
        const content = await browserService.extractContent(sessionId, {
            includeImages: true,
            maxImages: maxResults
        });
        
        // Fechar sessão
        await browserService.closeSession(sessionId);
        
        // Formatar resultados
        const images = (content.images || []).slice(0, maxResults).map((img, index) => ({
            type: 'image',
            url: img.src,
            thumbnail: img.src,
            title: img.alt || `Imagem ${index + 1} - ${query}`,
            description: img.title || '',
            source: 'Bing Images',
            width: img.width || 800,
            height: img.height || 600
        }));
        
        console.log(`✅ ${images.length} imagens encontradas no Bing`);
        return images;
        
    } catch (error) {
        console.error('❌ Erro Bing Images:', error);
        
        // Tentar fechar sessão
        try {
            await browserService.closeSession(sessionId);
        } catch (e) {
            // Ignorar
        }
        
        return [];
    }
}

/**
 * Buscar imagens (combina múltiplas fontes)
 */
export async function searchImages(query, maxResults = 6) {
    console.log(`🖼️ Buscando ${maxResults} imagens para: "${query}"`);
    
    // Tentar Bing primeiro (mais relevante)
    let images = await searchBingImages(query, maxResults);
    
    // Se não encontrou suficientes, complementar com Unsplash
    if (images.length < maxResults) {
        const unsplashImages = await searchUnsplash(query, maxResults - images.length);
        images = [...images, ...unsplashImages];
    }
    
    // Se ainda não tem nenhuma, usar apenas Unsplash
    if (images.length === 0) {
        images = await searchUnsplash(query, maxResults);
    }
    
    console.log(`✅ Total: ${images.length} imagens encontradas`);
    return images;
}

export default {
    searchImages
};
