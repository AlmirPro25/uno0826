// services/ImageGenerationService.ts

export interface ImageGenerationResponse {
  success: boolean;
  htmlContent: string;
  imagesGenerated: number;
  images: Array<{
    id: string;
    url: string;
    description: string;
  }>;
  projectId?: string;
}

export interface ImageGenerationError {
  error: string;
  details?: string;
}

class ImageGenerationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Processa HTML e gera imagens automaticamente
   */
  async processHtmlAndGenerateImages(
    htmlContent: string, 
    projectId?: string
  ): Promise<ImageGenerationResponse> {
    try {
      console.log('🎨 Iniciando geração de imagens...');
      
      const response = await fetch(`${this.baseUrl}/api/images/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          projectId
        })
      });

      if (!response.ok) {
        const errorData: ImageGenerationError = await response.json();
        throw new Error(errorData.error || 'Erro na geração de imagens');
      }

      const result: ImageGenerationResponse = await response.json();
      
      console.log(`✅ Geração concluída! ${result.imagesGenerated} imagens criadas`);
      
      return result;
      
    } catch (error: any) {
      console.error('❌ Erro na geração de imagens:', error);
      throw new Error(`Falha na geração de imagens: ${error.message}`);
    }
  }

  /**
   * Analisa HTML e conta quantas imagens serão geradas
   */
  countImagePlaceholders(htmlContent: string): number {
    const imageRegex = /src=["']ai-researched-image:\/\/([^"']+)["']/g;
    const matches = htmlContent.match(imageRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Extrai descrições dos placeholders de imagem
   */
  extractImageDescriptions(htmlContent: string): string[] {
    const descriptions: string[] = [];
    const imageRegex = /src=["']ai-researched-image:\/\/([^"']+)["']/g;
    let match;
    
    while ((match = imageRegex.exec(htmlContent)) !== null) {
      descriptions.push(match[1]);
    }
    
    return descriptions;
  }

  /**
   * Verifica se o HTML contém placeholders de imagem
   */
  hasImagePlaceholders(htmlContent: string): boolean {
    return /ai-researched-image:\/\//.test(htmlContent);
  }

  /**
   * Limpa imagens antigas do servidor
   */
  async cleanupOldImages(): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/images/cleanup`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro na limpeza de imagens');
      }

      return await response.json();
      
    } catch (error: any) {
      console.error('Erro na limpeza:', error);
      throw error;
    }
  }

  /**
   * Gera URL de placeholder para preview
   */
  generatePlaceholderUrl(description: string): string {
    return `${this.baseUrl}/api/images/placeholder?text=${encodeURIComponent(description)}`;
  }

  /**
   * Substitui placeholders por URLs de preview temporárias
   */
  replaceWithPreviewPlaceholders(htmlContent: string): string {
    return htmlContent.replace(
      /src=["']ai-researched-image:\/\/([^"']+)["']/g,
      (match, description) => {
        const previewUrl = this.generatePlaceholderUrl(description);
        return match.replace(`ai-researched-image://${description}`, previewUrl);
      }
    );
  }
}

// Instância singleton
export const imageGenerationService = new ImageGenerationService();

// Hook personalizado para React (se necessário)
export function useImageGeneration() {
  const processImages = async (htmlContent: string, projectId?: string) => {
    return await imageGenerationService.processHtmlAndGenerateImages(htmlContent, projectId);
  };

  const countPlaceholders = (htmlContent: string) => {
    return imageGenerationService.countImagePlaceholders(htmlContent);
  };

  const hasPlaceholders = (htmlContent: string) => {
    return imageGenerationService.hasImagePlaceholders(htmlContent);
  };

  const getPreviewHtml = (htmlContent: string) => {
    return imageGenerationService.replaceWithPreviewPlaceholders(htmlContent);
  };

  return {
    processImages,
    countPlaceholders,
    hasPlaceholders,
    getPreviewHtml,
    cleanupOldImages: imageGenerationService.cleanupOldImages.bind(imageGenerationService)
  };
}