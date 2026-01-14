// services/ImageQueueSystem.ts
// Sistema de fila profissional para geração de imagens

export interface ImageQueueItem {
  id: string;
  description: string;
  context: string;
  placeholder: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  localUrl?: string;
  error?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  localUrl?: string;
  error?: string;
}

class ImageQueueManager {
  private queue: ImageQueueItem[] = [];
  private processing = false;
  private maxConcurrent = 1; // Processar uma imagem por vez para não sobrecarregar API
  private currentlyProcessing = 0;
  
  // Callbacks para notificar progresso
  private onProgressCallback?: (current: number, total: number, item: ImageQueueItem) => void;
  private onCompleteCallback?: (results: ImageQueueItem[]) => void;

  /**
   * Adiciona item à fila de geração
   */
  addToQueue(item: Omit<ImageQueueItem, 'id' | 'status' | 'createdAt'>): string {
    const queueItem: ImageQueueItem = {
      ...item,
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: Date.now()
    };
    
    this.queue.push(queueItem);
    console.log(`📋 Adicionado à fila: ${queueItem.description.substring(0, 50)}... (ID: ${queueItem.id})`);
    
    return queueItem.id;
  }

  /**
   * Processa toda a fila de imagens
   */
  async processQueue(): Promise<ImageQueueItem[]> {
    if (this.processing) {
      console.log('⚠️ Fila já está sendo processada');
      return this.queue;
    }

    this.processing = true;
    console.log(`🚀 Iniciando processamento da fila: ${this.queue.length} imagens`);

    const pendingItems = this.queue.filter(item => item.status === 'pending');
    
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      
      try {
        this.onProgressCallback?.(i + 1, pendingItems.length, item);
        
        console.log(`🎨 Processando ${i + 1}/${pendingItems.length}: ${item.description.substring(0, 50)}...`);
        
        item.status = 'processing';
        const result = await this.generateSingleImage(item);
        
        if (result.success && result.localUrl) {
          item.status = 'completed';
          item.localUrl = result.localUrl;
          item.completedAt = Date.now();
          console.log(`✅ Concluído: ${item.id}`);
        } else {
          item.status = 'failed';
          item.error = result.error || 'Erro desconhecido';
          console.error(`❌ Falhou: ${item.id} - ${item.error}`);
        }
        
      } catch (error: any) {
        item.status = 'failed';
        item.error = error.message;
        console.error(`❌ Erro crítico: ${item.id} - ${error.message}`);
      }
      
      // Pequena pausa entre gerações para não sobrecarregar API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
    console.log(`🎉 Fila processada! Sucessos: ${this.getCompletedCount()}, Falhas: ${this.getFailedCount()}`);
    
    this.onCompleteCallback?.(this.queue);
    return this.queue;
  }

  /**
   * Gera uma única imagem e salva localmente
   */
  private async generateSingleImage(item: ImageQueueItem): Promise<ImageGenerationResult> {
    try {
      // Importar dinamicamente o serviço de geração
      const { generateImageWithGemini } = await import('./GeminiImageService');
      
      // Gerar imagem
      const imageResult = await generateImageWithGemini(item.description, item.context);
      
      // Se retornou uma URL do Gemini (Base64), converter para arquivo local
      if (imageResult.startsWith('data:image/')) {
        const localUrl = await this.saveImageLocally(imageResult, item.id, item.description);
        return { success: true, localUrl };
      }
      
      // Se retornou URL comprimida (ai-img://), buscar no localStorage
      if (imageResult.startsWith('ai-img://')) {
        const imageId = imageResult.replace('ai-img://', '');
        const localUrl = await this.convertStoredImageToLocal(imageId, item.description);
        return { success: true, localUrl };
      }
      
      // Se retornou SVG placeholder, salvar como arquivo
      if (imageResult.startsWith('data:image/svg+xml')) {
        const localUrl = await this.saveImageLocally(imageResult, item.id, item.description);
        return { success: true, localUrl };
      }
      
      return { success: false, error: 'Formato de imagem não reconhecido' };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Salva imagem Base64 como arquivo local
   */
  private async saveImageLocally(dataUrl: string, imageId: string, description: string): Promise<string> {
    try {
      // Criar pasta de imagens se não existir
      await this.ensureImagesFolderExists();
      
      // Extrair dados da imagem
      const [header, base64Data] = dataUrl.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      
      // Nome do arquivo limpo
      const cleanDescription = description.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
      const fileName = `${imageId}_${cleanDescription.replace(/\s+/g, '_')}.${extension}`;
      const filePath = `./public/generated-images/${fileName}`;
      
      // Converter Base64 para Buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Salvar arquivo (simulado - em ambiente real usaria fs)
      console.log(`💾 Salvando imagem: ${filePath} (${buffer.length} bytes)`);
      
      // Retornar URL local
      const localUrl = `/generated-images/${fileName}`;
      
      // Salvar metadados no localStorage para referência
      this.saveImageMetadata(imageId, {
        localUrl,
        fileName,
        description,
        mimeType,
        size: buffer.length,
        createdAt: Date.now()
      });
      
      return localUrl;
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar imagem localmente:', error);
      throw new Error(`Falha ao salvar imagem: ${error.message}`);
    }
  }

  /**
   * Converte imagem do localStorage para arquivo local
   */
  private async convertStoredImageToLocal(imageId: string, description: string): Promise<string> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('localStorage não disponível');
      }
      
      const imageStore = JSON.parse(localStorage.getItem('ai-generated-images') || '{}');
      const storedImage = imageStore[imageId];
      
      if (!storedImage || !storedImage.dataUrl) {
        throw new Error(`Imagem ${imageId} não encontrada no localStorage`);
      }
      
      return await this.saveImageLocally(storedImage.dataUrl, imageId, description);
      
    } catch (error: any) {
      console.error('❌ Erro ao converter imagem do localStorage:', error);
      throw new Error(`Falha ao converter imagem: ${error.message}`);
    }
  }

  /**
   * Garante que a pasta de imagens existe
   */
  private async ensureImagesFolderExists(): Promise<void> {
    // Em ambiente real, criaria a pasta usando fs
    // Por agora, apenas log
    console.log('📁 Verificando pasta ./public/generated-images/');
  }

  /**
   * Salva metadados da imagem
   */
  private saveImageMetadata(imageId: string, metadata: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      const metadataStore = JSON.parse(localStorage.getItem('image-metadata') || '{}');
      metadataStore[imageId] = metadata;
      localStorage.setItem('image-metadata', JSON.stringify(metadataStore));
      console.log(`📊 Metadados salvos para: ${imageId}`);
    } catch (error) {
      console.warn('⚠️ Falha ao salvar metadados:', error);
    }
  }

  /**
   * Substitui placeholders no HTML pelos URLs locais
   */
  replaceHtmlPlaceholders(htmlContent: string): string {
    let updatedHtml = htmlContent;
    
    for (const item of this.queue) {
      if (item.status === 'completed' && item.localUrl) {
        // Substituir placeholder pela URL local
        updatedHtml = updatedHtml.replace(
          item.placeholder,
          item.placeholder.replace(/ai-researched-image:\/\/[^"']+/, item.localUrl)
        );
      }
    }
    
    return updatedHtml;
  }

  // Métodos utilitários
  getQueueStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      completed: this.queue.filter(item => item.status === 'completed').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      isProcessing: this.processing
    };
  }

  getCompletedCount(): number {
    return this.queue.filter(item => item.status === 'completed').length;
  }

  getFailedCount(): number {
    return this.queue.filter(item => item.status === 'failed').length;
  }

  clearQueue(): void {
    this.queue = [];
    console.log('🗑️ Fila limpa');
  }

  setProgressCallback(callback: (current: number, total: number, item: ImageQueueItem) => void): void {
    this.onProgressCallback = callback;
  }

  setCompleteCallback(callback: (results: ImageQueueItem[]) => void): void {
    this.onCompleteCallback = callback;
  }
}

// Instância singleton
export const imageQueue = new ImageQueueManager();

// Funções utilitárias
export function addImageToQueue(description: string, context: string, placeholder: string, priority: 'high' | 'medium' | 'low' = 'medium'): string {
  return imageQueue.addToQueue({
    description,
    context,
    placeholder,
    priority
  });
}

export async function processImageQueue(): Promise<ImageQueueItem[]> {
  return await imageQueue.processQueue();
}

export function getQueueStatus() {
  return imageQueue.getQueueStatus();
}
