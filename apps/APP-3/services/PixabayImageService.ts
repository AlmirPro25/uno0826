// services/PixabayImageService.ts
// Sistema para buscar e processar imagens do Pixabay no frontend

import { PixabayImage, searchImages } from './PixabayService';

/**
 * Interface para placeholder de imagem
 */
export interface ImagePlaceholder {
  id: string;
  description: string;
  context: string;
  originalSrc: string;
}

/**
 * Interface para imagem gerada
 */
export interface GeneratedImage {
  id: string;
  description: string;
  dataUrl: string;
  originalSrc: string;
}

/**
 * Função auxiliar para salvar imagem no localStorage com limpeza automática
 */
export function saveImageToStorage(imageId: string, dataUrl: string, description: string): void {
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
 * Busca imagem no Pixabay e retorna URL comprimida
 */
export async function searchImageWithPixabay(description: string, context: string = ''): Promise<string> {
  try {
    console.log(`🔍 Buscando imagem no Pixabay: ${description}`);
    
    // Analisar contexto para determinar categoria
    const isFood = /pizza|hambúrguer|comida|restaurante|culinária/i.test(context);
    const isProduct = /produto|smartphone|tecnologia|e-commerce/i.test(context);
    const isInterior = /interior|ambiente|sala|escritório|decoração/i.test(context);
    const isPerson = /pessoa|profissional|equipe|cliente/i.test(context);
    
    let category = '';
    if (isFood) category = 'food';
    if (isProduct) category = 'science';
    if (isInterior) category = 'buildings';
    if (isPerson) category = 'people';
    
    // Buscar imagens no Pixabay
    const images = await searchImages(description);
    
    if (images && images.length > 0) {
      // Selecionar a primeira imagem
      const image = images[0];
      const imageUrl = image.largeImageURL;
      
      console.log(`✅ Imagem encontrada no Pixabay: ${imageUrl}`);
      
      // Gerar ID único para a imagem
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      // Salvar no localStorage
      saveImageToStorage(imageId, imageUrl, description);
      
      // Retornar URL comprimida
      return `ai-img://${imageId}`;
    }
    
    console.warn(`⚠️ Nenhuma imagem encontrada no Pixabay para: ${description}`);
    return generatePlaceholderSVG(description);
    
  } catch (error) {
    console.error('❌ Erro ao buscar imagem no Pixabay:', error);
    return generatePlaceholderSVG(description);
  }
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
      🎨 Imagem não encontrada
    </text>
    <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" 
          fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
      ${shortDesc}
    </text>
  </svg>`;
  
  // Usar encodeURIComponent para caracteres especiais
  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  
  // Gerar ID único para o placeholder
  const imageId = `img_placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  // Salvar no localStorage
  saveImageToStorage(imageId, dataUrl, description);
  
  // Retornar URL comprimida
  return `ai-img://${imageId}`;
}

/**
 * Processa HTML completo e busca todas as imagens
 */
export async function processHtmlAndSearchImages(
  htmlContent: string,
  onProgress?: (current: number, total: number, description: string) => void
): Promise<{ htmlContent: string; imagesFound: number; images: GeneratedImage[] }> {
  
  // 1. Extrair placeholders
  const placeholders = extractImagePlaceholders(htmlContent);
  
  if (placeholders.length === 0) {
    return {
      htmlContent,
      imagesFound: 0,
      images: []
    };
  }
  
  console.log(`📸 Encontrados ${placeholders.length} placeholders de imagem`);
  
  // 2. Buscar imagens
  let updatedHtml = htmlContent;
  const foundImages: GeneratedImage[] = [];
  
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    
    try {
      onProgress?.(i + 1, placeholders.length, placeholder.description);
      
      const compressedUrl = await searchImageWithPixabay(
        placeholder.description,
        placeholder.context
      );
      
      // Substituir placeholder pela URL comprimida
      updatedHtml = updatedHtml.replace(
        placeholder.originalSrc,
        placeholder.originalSrc.replace(
          `ai-researched-image://${placeholder.description}`,
          compressedUrl
        )
      );
      
      // Obter informações da imagem do localStorage
      const imageId = compressedUrl.replace('ai-img://', '');
      const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
      const storedImage = imageStore[imageId];
      
      if (storedImage) {
        foundImages.push({
          id: imageId,
          description: placeholder.description,
          dataUrl: storedImage.dataUrl,
          originalSrc: placeholder.originalSrc
        });
      }
      
      console.log(`✅ Imagem ${i + 1}/${placeholders.length} encontrada`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao buscar imagem ${i + 1}:`, error);
      
      // Em caso de erro, usar placeholder
      const placeholderUrl = generatePlaceholderSVG(placeholder.description);
      updatedHtml = updatedHtml.replace(
        placeholder.originalSrc,
        placeholder.originalSrc.replace(
          `ai-researched-image://${placeholder.description}`,
          placeholderUrl
        )
      );
    }
  }
  
  return {
    htmlContent: updatedHtml,
    imagesFound: foundImages.length,
    images: foundImages
  };
}