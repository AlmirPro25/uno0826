/**
 * 🎨 VISUAL SEARCH ENHANCER
 * Enriquece respostas de pesquisa com imagens, gráficos e conteúdo visual
 */

export interface VisualContent {
  type: 'image' | 'chart' | 'map' | 'video' | 'infographic';
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  source: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface EnrichedSearchResult {
  query: string;
  textContent: string;
  visualContent: VisualContent[];
  layout: 'grid' | 'masonry' | 'carousel' | 'timeline';
  theme: 'default' | 'news' | 'products' | 'educational';
}

/**
 * Buscar imagens relacionadas à query
 */
export async function searchImages(query: string, maxResults: number = 6): Promise<VisualContent[]> {
  try {
    console.log(`🖼️ Buscando imagens para: "${query}"`);
    
    // Chamar backend para buscar imagens
    const response = await fetch('http://localhost:3002/api/search/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults })
    });

    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar imagens, usando fallback');
      return generateFallbackImages(query);
    }

    const data = await response.json();
    return data.images || [];

  } catch (error) {
    console.error('❌ Erro ao buscar imagens:', error);
    return generateFallbackImages(query);
  }
}

/**
 * Gerar imagens de fallback usando APIs públicas
 */
function generateFallbackImages(query: string): VisualContent[] {
  const keywords = query.split(' ').slice(0, 3).join('+');
  
  return [
    {
      type: 'image',
      url: `https://source.unsplash.com/800x600/?${keywords}`,
      thumbnail: `https://source.unsplash.com/400x300/?${keywords}`,
      title: `Imagem relacionada a ${query}`,
      source: 'Unsplash',
      width: 800,
      height: 600
    }
  ];
}

/**
 * Detectar tipo de conteúdo visual apropriado
 */
export function detectVisualType(query: string): 'image' | 'chart' | 'map' | 'video' {
  const lowerQuery = query.toLowerCase();
  
  // Palavras-chave para mapas
  if (lowerQuery.match(/onde|localização|mapa|endereço|como chegar/)) {
    return 'map';
  }
  
  // Palavras-chave para gráficos
  if (lowerQuery.match(/estatística|dados|comparação|crescimento|análise|percentual/)) {
    return 'chart';
  }
  
  // Palavras-chave para vídeos
  if (lowerQuery.match(/como fazer|tutorial|passo a passo|demonstração/)) {
    return 'video';
  }
  
  // Padrão: imagens
  return 'image';
}

/**
 * Enriquecer resposta de pesquisa com conteúdo visual
 */
export async function enrichSearchWithVisuals(
  query: string,
  textContent: string,
  searchResults: any[]
): Promise<EnrichedSearchResult> {
  
  console.log('🎨 Enriquecendo resposta com conteúdo visual...');
  
  // 1. Detectar tipo de visual apropriado
  const visualType = detectVisualType(query);
  
  // 2. Extrair imagens dos resultados de busca
  const extractedImages = extractImagesFromResults(searchResults);
  
  // 3. Buscar imagens adicionais se necessário
  let visualContent: VisualContent[] = extractedImages;
  
  if (visualContent.length < 3) {
    const additionalImages = await searchImages(query, 6 - visualContent.length);
    visualContent = [...visualContent, ...additionalImages];
  }
  
  // 4. Determinar layout baseado no tipo de conteúdo
  const layout = determineLayout(query, visualContent.length);
  
  // 5. Determinar tema visual
  const theme = determineTheme(query);
  
  return {
    query,
    textContent,
    visualContent: visualContent.slice(0, 6), // Máximo 6 imagens
    layout,
    theme
  };
}

/**
 * Extrair imagens dos resultados de busca
 */
function extractImagesFromResults(results: any[]): VisualContent[] {
  const images: VisualContent[] = [];
  
  for (const result of results) {
    // Se o resultado tem imagem
    if (result.image) {
      images.push({
        type: 'image',
        url: result.image,
        thumbnail: result.image,
        title: result.title || 'Imagem',
        description: result.snippet,
        source: result.source || 'Web',
        width: 800,
        height: 600
      });
    }
    
    // Se é um produto com imagem
    if (result.type === 'product' && result.image) {
      images.push({
        type: 'image',
        url: result.image,
        thumbnail: result.image,
        title: result.title,
        description: `${result.price} - ${result.store}`,
        source: result.store,
        metadata: {
          price: result.price,
          priceRaw: result.priceRaw,
          url: result.url
        }
      });
    }
  }
  
  return images;
}

/**
 * Determinar layout ideal
 */
function determineLayout(query: string, imageCount: number): 'grid' | 'masonry' | 'carousel' | 'timeline' {
  const lowerQuery = query.toLowerCase();
  
  // Timeline para histórico/cronologia
  if (lowerQuery.match(/história|cronologia|evolução|linha do tempo/)) {
    return 'timeline';
  }
  
  // Carousel para produtos
  if (lowerQuery.match(/produto|comprar|preço|loja/)) {
    return 'carousel';
  }
  
  // Masonry para muitas imagens
  if (imageCount > 4) {
    return 'masonry';
  }
  
  // Grid padrão
  return 'grid';
}

/**
 * Determinar tema visual
 */
function determineTheme(query: string): 'default' | 'news' | 'products' | 'educational' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.match(/notícia|aconteceu|últimas|breaking/)) {
    return 'news';
  }
  
  if (lowerQuery.match(/produto|comprar|preço|loja/)) {
    return 'products';
  }
  
  if (lowerQuery.match(/como|tutorial|aprender|explicar|o que é/)) {
    return 'educational';
  }
  
  return 'default';
}

export default {
  searchImages,
  enrichSearchWithVisuals,
  detectVisualType
};
