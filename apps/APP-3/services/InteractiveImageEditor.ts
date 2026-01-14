// services/InteractiveImageEditor.ts
// Sistema de edição interativa de imagens no preview usando data-aid

export interface EditableImageElement {
  element: HTMLImageElement;
  dataAid: string;
  originalSrc: string;
  description: string;
  isEditing: boolean;
}

export interface ImageEditOptions {
  newDescription?: string;
  customUrl?: string;
  style?: 'realistic' | 'artistic' | 'minimalist' | 'professional';
  mood?: 'bright' | 'dark' | 'neutral' | 'vibrant';
  composition?: 'portrait' | 'landscape' | 'square' | 'wide';
}

export class InteractiveImageEditor {
  private editableImages: Map<string, EditableImageElement> = new Map();
  private isInitialized = false;
  private editModal: HTMLElement | null = null;

  /**
   * Inicializa o sistema de edição interativa
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    console.log('🎨 Inicializando sistema de edição interativa de imagens');
    
    // Criar modal de edição
    this.createEditModal();
    
    // Observar mudanças no DOM para detectar novas imagens
    this.observeImageChanges();
    
    // Escanear imagens existentes
    this.scanExistingImages();
    
    this.isInitialized = true;
    console.log('✅ Sistema de edição interativa inicializado');
  }

  /**
   * Escaneia imagens existentes no DOM
   */
  private scanExistingImages(): void {
    const images = document.querySelectorAll('img[data-aid]');
    
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        this.makeImageEditable(img);
      }
    });
    
    console.log(`🔍 ${images.length} imagens editáveis encontradas`);
  }

  /**
   * Observa mudanças no DOM para detectar novas imagens
   */
  private observeImageChanges(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Verificar se o próprio elemento é uma imagem
            if (node instanceof HTMLImageElement && node.hasAttribute('data-aid')) {
              this.makeImageEditable(node);
            }
            
            // Verificar imagens filhas
            const childImages = node.querySelectorAll('img[data-aid]');
            childImages.forEach((img) => {
              if (img instanceof HTMLImageElement) {
                this.makeImageEditable(img);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Torna uma imagem editável
   */
  private makeImageEditable(img: HTMLImageElement): void {
    const dataAid = img.getAttribute('data-aid');
    if (!dataAid || this.editableImages.has(dataAid)) return;

    // Extrair descrição da imagem (do alt, title ou src)
    const description = img.alt || img.title || this.extractDescriptionFromSrc(img.src);

    const editableImage: EditableImageElement = {
      element: img,
      dataAid,
      originalSrc: img.src,
      description,
      isEditing: false
    };

    this.editableImages.set(dataAid, editableImage);

    // Adicionar estilos de hover e cursor
    img.style.cursor = 'pointer';
    img.style.transition = 'all 0.3s ease';
    
    // Adicionar eventos
    this.addImageEvents(img, editableImage);
    
    console.log(`✨ Imagem editável: ${dataAid} - ${description.substring(0, 30)}...`);
  }

  /**
   * Adiciona eventos de interação à imagem
   */
  private addImageEvents(img: HTMLImageElement, editableImage: EditableImageElement): void {
    // Hover effects
    img.addEventListener('mouseenter', () => {
      if (!editableImage.isEditing) {
        img.style.transform = 'scale(1.02)';
        img.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)';
        img.style.border = '2px solid #3b82f6';
        
        // Mostrar tooltip
        this.showEditTooltip(img, 'Clique para editar esta imagem');
      }
    });

    img.addEventListener('mouseleave', () => {
      if (!editableImage.isEditing) {
        img.style.transform = 'scale(1)';
        img.style.boxShadow = 'none';
        img.style.border = 'none';
        
        // Esconder tooltip
        this.hideEditTooltip();
      }
    });

    // Click para editar
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openEditModal(editableImage);
    });

    // Duplo clique para regenerar rapidamente
    img.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.quickRegenerate(editableImage);
    });
  }

  /**
   * Mostra tooltip de edição
   */
  private showEditTooltip(img: HTMLImageElement, text: string): void {
    const existing = document.getElementById('image-edit-tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.id = 'image-edit-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(tooltip);

    const rect = img.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
  }

  /**
   * Esconde tooltip de edição
   */
  private hideEditTooltip(): void {
    const tooltip = document.getElementById('image-edit-tooltip');
    if (tooltip) tooltip.remove();
  }

  /**
   * Cria modal de edição
   */
  private createEditModal(): void {
    const modal = document.createElement('div');
    modal.id = 'image-edit-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    modal.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">
            🎨 Editar Imagem
          </h3>
          <button id="close-edit-modal" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 16px;">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button id="mode-generate" class="mode-btn active" style="
              flex: 1;
              padding: 8px 16px;
              border: 2px solid #3b82f6;
              background: #3b82f6;
              color: white;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">🎨 Gerar IA</button>
            <button id="mode-pixabay" class="mode-btn" style="
              flex: 1;
              padding: 8px 16px;
              border: 2px solid #e5e7eb;
              background: white;
              color: #374151;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">📸 Pixabay</button>
            <button id="mode-url" class="mode-btn" style="
              flex: 1;
              padding: 8px 16px;
              border: 2px solid #e5e7eb;
              background: white;
              color: #374151;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">🔗 URL Custom</button>
          </div>
          
          <div id="generate-mode" style="display: block;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
              Nova Descrição:
            </label>
            <textarea id="edit-description" style="
              width: 100%;
              height: 80px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              font-size: 14px;
              resize: vertical;
              box-sizing: border-box;
            " placeholder="Descreva como você quer que a imagem seja..."></textarea>
          </div>
          
          <div id="pixabay-mode" style="display: none;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
              Buscar no Pixabay:
            </label>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <input type="text" id="pixabay-search" style="
                flex: 1;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                font-size: 14px;
                box-sizing: border-box;
              " placeholder="Digite o que você procura...">
              <button id="pixabay-search-btn" style="
                padding: 12px 20px;
                border: none;
                background: #10b981;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
              ">🔍</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <select id="pixabay-category" style="
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                padding: 8px;
                font-size: 12px;
              ">
                <option value="">Todas Categorias</option>
                <option value="nature">Natureza</option>
                <option value="people">Pessoas</option>
                <option value="animals">Animais</option>
                <option value="food">Comida</option>
                <option value="travel">Viagem</option>
                <option value="business">Negócios</option>
                <option value="technology">Tecnologia</option>
                <option value="backgrounds">Fundos</option>
              </select>
              
              <select id="pixabay-orientation" style="
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                padding: 8px;
                font-size: 12px;
              ">
                <option value="all">Todas Orientações</option>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
            
            <div id="pixabay-results" style="
              max-height: 200px;
              overflow-y: auto;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 8px;
              background: #f9fafb;
              display: none;
            ">
              <div id="pixabay-loading" style="text-align: center; padding: 20px; color: #6b7280;">
                🔍 Buscando imagens...
              </div>
              <div id="pixabay-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 8px;
              "></div>
            </div>
            
            <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
              📸 Imagens gratuitas do Pixabay - Clique para selecionar
            </div>
          </div>
          
          <div id="url-mode" style="display: none;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
              URL da Imagem:
            </label>
            <input type="url" id="custom-url" style="
              width: 100%;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              font-size: 14px;
              box-sizing: border-box;
            " placeholder="Cole aqui o link da imagem da internet...">
            <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
              💡 Cole qualquer URL de imagem da internet (JPG, PNG, GIF, WebP)
            </div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
              Estilo:
            </label>
            <select id="edit-style" style="
              width: 100%;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              font-size: 14px;
            ">
              <option value="realistic">Realista</option>
              <option value="artistic">Artístico</option>
              <option value="minimalist">Minimalista</option>
              <option value="professional">Profissional</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
              Humor:
            </label>
            <select id="edit-mood" style="
              width: 100%;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              font-size: 14px;
            ">
              <option value="neutral">Neutro</option>
              <option value="bright">Brilhante</option>
              <option value="dark">Escuro</option>
              <option value="vibrant">Vibrante</option>
            </select>
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="cancel-edit" style="
            padding: 10px 20px;
            border: 2px solid #e5e7eb;
            background: white;
            color: #374151;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          ">Cancelar</button>
          
          <button id="regenerate-image" style="
            padding: 10px 20px;
            border: none;
            background: #3b82f6;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          ">🎨 Regenerar</button>
        </div>
        
        <div id="edit-progress" style="
          display: none;
          margin-top: 16px;
          text-align: center;
          color: #6b7280;
        ">
          <div style="margin-bottom: 8px;">Gerando nova imagem...</div>
          <div style="
            width: 100%;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
          ">
            <div style="
              width: 0%;
              height: 100%;
              background: #3b82f6;
              transition: width 0.3s ease;
              animation: progress-pulse 2s infinite;
            "></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.editModal = modal;

    // Adicionar eventos do modal
    this.addModalEvents();

    // Adicionar CSS de animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes progress-pulse {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Adiciona eventos do modal
   */
  private addModalEvents(): void {
    if (!this.editModal) return;

    // Fechar modal
    const closeBtn = this.editModal.querySelector('#close-edit-modal');
    const cancelBtn = this.editModal.querySelector('#cancel-edit');
    
    [closeBtn, cancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => this.closeEditModal());
    });

    // Fechar ao clicar fora
    this.editModal.addEventListener('click', (e) => {
      if (e.target === this.editModal) {
        this.closeEditModal();
      }
    });

    // Botões de modo
    const generateModeBtn = this.editModal.querySelector('#mode-generate');
    const pixabayModeBtn = this.editModal.querySelector('#mode-pixabay');
    const urlModeBtn = this.editModal.querySelector('#mode-url');
    const generateDiv = this.editModal.querySelector('#generate-mode');
    const pixabayDiv = this.editModal.querySelector('#pixabay-mode');
    const urlDiv = this.editModal.querySelector('#url-mode');

    const activeModeStyle = `
      flex: 1; padding: 8px 16px; border: 2px solid #3b82f6; background: #3b82f6; 
      color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
    `;
    const inactiveModeStyle = `
      flex: 1; padding: 8px 16px; border: 2px solid #e5e7eb; background: white; 
      color: #374151; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
    `;

    generateModeBtn?.addEventListener('click', () => {
      (generateModeBtn as HTMLElement).style.cssText = activeModeStyle;
      (pixabayModeBtn as HTMLElement).style.cssText = inactiveModeStyle;
      (urlModeBtn as HTMLElement).style.cssText = inactiveModeStyle;
      (generateDiv as HTMLElement).style.display = 'block';
      (pixabayDiv as HTMLElement).style.display = 'none';
      (urlDiv as HTMLElement).style.display = 'none';
    });

    pixabayModeBtn?.addEventListener('click', () => {
      (generateModeBtn as HTMLElement).style.cssText = inactiveModeStyle;
      (pixabayModeBtn as HTMLElement).style.cssText = activeModeStyle;
      (urlModeBtn as HTMLElement).style.cssText = inactiveModeStyle;
      (generateDiv as HTMLElement).style.display = 'none';
      (pixabayDiv as HTMLElement).style.display = 'block';
      (urlDiv as HTMLElement).style.display = 'none';
    });

    urlModeBtn?.addEventListener('click', () => {
      (generateModeBtn as HTMLElement).style.cssText = inactiveModeStyle;
      (pixabayModeBtn as HTMLElement).style.cssText = inactiveModeStyle;
      (urlModeBtn as HTMLElement).style.cssText = activeModeStyle;
      (generateDiv as HTMLElement).style.display = 'none';
      (pixabayDiv as HTMLElement).style.display = 'none';
      (urlDiv as HTMLElement).style.display = 'block';
    });

    // Eventos do Pixabay
    const pixabaySearchBtn = this.editModal.querySelector('#pixabay-search-btn');
    const pixabaySearchInput = this.editModal.querySelector('#pixabay-search') as HTMLInputElement;
    
    pixabaySearchBtn?.addEventListener('click', () => this.searchPixabayImages());
    pixabaySearchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchPixabayImages();
      }
    });

    // Regenerar imagem
    const regenerateBtn = this.editModal.querySelector('#regenerate-image');
    regenerateBtn?.addEventListener('click', () => this.handleRegenerate());
  }

  /**
   * Abre modal de edição
   */
  private openEditModal(editableImage: EditableImageElement): void {
    if (!this.editModal) return;

    editableImage.isEditing = true;
    
    // Preencher campos
    const descriptionField = this.editModal.querySelector('#edit-description') as HTMLTextAreaElement;
    if (descriptionField) {
      descriptionField.value = editableImage.description;
    }

    // Mostrar modal
    this.editModal.style.display = 'block';
    
    // Armazenar referência da imagem sendo editada
    (this.editModal as any).currentEditableImage = editableImage;
    
    console.log(`🎨 Abrindo editor para: ${editableImage.dataAid}`);
  }

  /**
   * Fecha modal de edição
   */
  private closeEditModal(): void {
    if (!this.editModal) return;

    const currentImage = (this.editModal as any).currentEditableImage as EditableImageElement;
    if (currentImage) {
      currentImage.isEditing = false;
    }

    this.editModal.style.display = 'none';
    
    // Limpar campos
    const descriptionField = this.editModal.querySelector('#edit-description') as HTMLTextAreaElement;
    if (descriptionField) {
      descriptionField.value = '';
    }
  }

  /**
   * Busca imagens no Pixabay
   */
  private async searchPixabayImages(): Promise<void> {
    if (!this.editModal) return;

    const searchInput = this.editModal.querySelector('#pixabay-search') as HTMLInputElement;
    const categorySelect = this.editModal.querySelector('#pixabay-category') as HTMLSelectElement;
    const orientationSelect = this.editModal.querySelector('#pixabay-orientation') as HTMLSelectElement;
    const resultsDiv = this.editModal.querySelector('#pixabay-results') as HTMLElement;
    const loadingDiv = this.editModal.querySelector('#pixabay-loading') as HTMLElement;
    const gridDiv = this.editModal.querySelector('#pixabay-grid') as HTMLElement;

    const query = searchInput?.value?.trim();
    if (!query) {
      alert('Digite algo para buscar no Pixabay');
      return;
    }

    // Mostrar loading
    resultsDiv.style.display = 'block';
    loadingDiv.style.display = 'block';
    gridDiv.innerHTML = '';

    try {
      // Importar serviço Pixabay
      const { PixabayService } = await import('./PixabayService');
      
      // Fazer busca com filtros
      const result = await PixabayService.searchImagesAdvanced(query, {
        category: categorySelect?.value as any || undefined,
        orientation: orientationSelect?.value as any || 'all',
        perPage: 12,
        imageType: 'photo'
      });

      loadingDiv.style.display = 'none';

      if (result.hits.length === 0) {
        gridDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">Nenhuma imagem encontrada</div>';
        return;
      }

      // Renderizar resultados
      gridDiv.innerHTML = result.hits.map(image => `
        <div class="pixabay-image-item" data-url="${image.webformatURL}" style="
          cursor: pointer;
          border-radius: 6px;
          overflow: hidden;
          transition: transform 0.2s ease;
          border: 2px solid transparent;
        ">
          <img src="${image.previewURL}" alt="${image.tags}" style="
            width: 100%;
            height: 60px;
            object-fit: cover;
            display: block;
          ">
          <div style="
            padding: 4px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            background: white;
          ">${image.likes} ❤️</div>
        </div>
      `).join('');

      // Adicionar eventos de clique
      const imageItems = gridDiv.querySelectorAll('.pixabay-image-item');
      imageItems.forEach(item => {
        item.addEventListener('click', () => {
          const imageUrl = item.getAttribute('data-url');
          if (imageUrl) {
            this.selectPixabayImage(imageUrl);
          }
        });

        item.addEventListener('mouseenter', () => {
          (item as HTMLElement).style.transform = 'scale(1.05)';
          (item as HTMLElement).style.borderColor = '#3b82f6';
        });

        item.addEventListener('mouseleave', () => {
          (item as HTMLElement).style.transform = 'scale(1)';
          (item as HTMLElement).style.borderColor = 'transparent';
        });
      });

      console.log(`✅ ${result.hits.length} imagens encontradas no Pixabay`);

    } catch (error) {
      console.error('❌ Erro ao buscar no Pixabay:', error);
      loadingDiv.style.display = 'none';
      gridDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Erro ao buscar imagens</div>';
    }
  }

  /**
   * Seleciona uma imagem do Pixabay
   */
  private async selectPixabayImage(imageUrl: string): Promise<void> {
    if (!this.editModal) return;

    const currentImage = (this.editModal as any).currentEditableImage as EditableImageElement;
    if (!currentImage) return;

    this.showEditProgress(true);

    try {
      await this.setCustomImageUrl(currentImage, imageUrl);
      this.closeEditModal();
      console.log('✅ Imagem do Pixabay aplicada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aplicar imagem do Pixabay:', error);
      this.showEditProgress(false);
      alert('Erro ao aplicar imagem do Pixabay');
    }
  }

  /**
   * Manipula regeneração de imagem
   */
  private async handleRegenerate(): Promise<void> {
    if (!this.editModal) return;

    const currentImage = (this.editModal as any).currentEditableImage as EditableImageElement;
    if (!currentImage) return;

    // Verificar qual modo está ativo
    const generateDiv = this.editModal.querySelector('#generate-mode') as HTMLElement;
    const pixabayDiv = this.editModal.querySelector('#pixabay-mode') as HTMLElement;
    const urlDiv = this.editModal.querySelector('#url-mode') as HTMLElement;
    
    const isPixabayMode = pixabayDiv.style.display !== 'none';
    const isUrlMode = urlDiv.style.display !== 'none';

    if (isPixabayMode) {
      // Modo Pixabay - fazer busca
      await this.searchPixabayImages();
      return;
    }

    if (isUrlMode) {
      // Modo URL customizada
      const customUrlField = this.editModal.querySelector('#custom-url') as HTMLInputElement;
      const customUrl = customUrlField?.value?.trim();

      if (!customUrl) {
        alert('Por favor, insira uma URL válida da imagem.');
        return;
      }

      // Validar URL
      if (!this.isValidImageUrl(customUrl)) {
        alert('URL inválida. Use uma URL que termine com .jpg, .png, .gif, .webp ou similar.');
        return;
      }

      // Mostrar progresso
      this.showEditProgress(true);

      try {
        await this.setCustomImageUrl(currentImage, customUrl);
        this.closeEditModal();
      } catch (error) {
        console.error('❌ Erro ao definir URL customizada:', error);
        this.showEditProgress(false);
        alert('Erro ao carregar imagem da URL. Verifique se o link está correto.');
      }
    } else {
      // Modo geração IA
      const descriptionField = this.editModal.querySelector('#edit-description') as HTMLTextAreaElement;
      const styleField = this.editModal.querySelector('#edit-style') as HTMLSelectElement;
      const moodField = this.editModal.querySelector('#edit-mood') as HTMLSelectElement;

      const options: ImageEditOptions = {
        newDescription: descriptionField?.value || currentImage.description,
        style: styleField?.value as any || 'realistic',
        mood: moodField?.value as any || 'neutral'
      };

      // Mostrar progresso
      this.showEditProgress(true);

      try {
        await this.regenerateImage(currentImage, options);
        this.closeEditModal();
      } catch (error) {
        console.error('❌ Erro ao regenerar imagem:', error);
        this.showEditProgress(false);
        alert('Erro ao regenerar imagem. Tente novamente.');
      }
    }
  }

  /**
   * Valida se uma URL é uma URL de imagem válida
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
      
      return validExtensions.some(ext => pathname.endsWith(ext)) || 
             url.includes('unsplash.com') || 
             url.includes('pixabay.com') ||
             url.includes('pexels.com') ||
             url.includes('imgur.com') ||
             url.includes('cloudinary.com');
    } catch {
      return false;
    }
  }

  /**
   * Define URL customizada para uma imagem
   */
  private async setCustomImageUrl(editableImage: EditableImageElement, customUrl: string): Promise<void> {
    console.log(`🔗 Definindo URL customizada: ${editableImage.dataAid} -> ${customUrl}`);

    return new Promise((resolve, reject) => {
      // Criar imagem temporária para testar carregamento
      const testImg = new Image();
      
      testImg.onload = () => {
        // URL válida, aplicar à imagem
        editableImage.element.src = customUrl;
        editableImage.description = `Imagem customizada: ${customUrl}`;
        
        // Salvar no localStorage para referência
        const metadata = {
          dataAid: editableImage.dataAid,
          customUrl: customUrl,
          timestamp: Date.now(),
          type: 'custom-url'
        };
        
        const existingData = JSON.parse(localStorage.getItem('image-metadata') || '[]');
        const updatedData = existingData.filter((item: any) => item.dataAid !== editableImage.dataAid);
        updatedData.push(metadata);
        localStorage.setItem('image-metadata', JSON.stringify(updatedData));
        
        console.log(`✅ URL customizada aplicada: ${editableImage.dataAid}`);
        resolve();
      };
      
      testImg.onerror = () => {
        console.error(`❌ Falha ao carregar URL: ${customUrl}`);
        reject(new Error('Falha ao carregar imagem da URL'));
      };
      
      // Adicionar CORS proxy se necessário
      const proxyUrl = customUrl.startsWith('http') && !customUrl.includes(window.location.hostname) 
        ? `https://cors-anywhere.herokuapp.com/${customUrl}` 
        : customUrl;
      
      testImg.src = proxyUrl;
    });
  }

  /**
   * Regenera uma imagem
   */
  private async regenerateImage(editableImage: EditableImageElement, options: ImageEditOptions): Promise<void> {
    console.log(`🔄 Regenerando imagem: ${editableImage.dataAid}`);

    // Importar serviço de geração
    const { generateImageWithGemini } = await import('./EnhancedGeminiImageService');

    // Construir descrição melhorada
    const enhancedDescription = this.buildEnhancedDescription(
      options.newDescription || editableImage.description,
      options
    );

    // Gerar nova imagem
    const newImageUrl = await generateImageWithGemini(enhancedDescription, '');

    // Atualizar elemento
    editableImage.element.src = newImageUrl;
    editableImage.description = options.newDescription || editableImage.description;

    console.log(`✅ Imagem regenerada: ${editableImage.dataAid}`);
  }

  /**
   * Regeneração rápida (duplo clique)
   */
  private async quickRegenerate(editableImage: EditableImageElement): Promise<void> {
    console.log(`⚡ Regeneração rápida: ${editableImage.dataAid}`);

    try {
      editableImage.isEditing = true;
      
      // Mostrar indicador visual
      editableImage.element.style.opacity = '0.5';
      editableImage.element.style.filter = 'blur(2px)';

      await this.regenerateImage(editableImage, {
        newDescription: editableImage.description,
        style: 'realistic',
        mood: 'neutral'
      });

      // Remover indicador visual
      editableImage.element.style.opacity = '1';
      editableImage.element.style.filter = 'none';
      editableImage.isEditing = false;

    } catch (error) {
      console.error('❌ Erro na regeneração rápida:', error);
      editableImage.element.style.opacity = '1';
      editableImage.element.style.filter = 'none';
      editableImage.isEditing = false;
    }
  }

  /**
   * Constrói descrição melhorada
   */
  private buildEnhancedDescription(description: string, options: ImageEditOptions): string {
    let enhanced = description;

    // Adicionar estilo
    if (options.style) {
      const styleMap = {
        realistic: 'realistic, high-quality photograph',
        artistic: 'artistic illustration, creative style',
        minimalist: 'minimalist design, clean and simple',
        professional: 'professional photography, corporate style'
      };
      enhanced = `${styleMap[options.style]} of ${enhanced}`;
    }

    // Adicionar humor/mood
    if (options.mood) {
      const moodMap = {
        bright: 'bright lighting, cheerful atmosphere',
        dark: 'dramatic lighting, moody atmosphere',
        neutral: 'balanced lighting, neutral tone',
        vibrant: 'vibrant colors, energetic mood'
      };
      enhanced += `, ${moodMap[options.mood]}`;
    }

    return enhanced;
  }

  /**
   * Mostra/esconde progresso de edição
   */
  private showEditProgress(show: boolean): void {
    if (!this.editModal) return;

    const progressDiv = this.editModal.querySelector('#edit-progress');
    const regenerateBtn = this.editModal.querySelector('#regenerate-image') as HTMLButtonElement;

    if (progressDiv && regenerateBtn) {
      progressDiv.style.display = show ? 'block' : 'none';
      regenerateBtn.disabled = show;
      regenerateBtn.style.opacity = show ? '0.5' : '1';
    }
  }

  /**
   * Extrai descrição do src da imagem
   */
  private extractDescriptionFromSrc(src: string): string {
    if (src.includes('ai-researched-image://')) {
      return decodeURIComponent(src.split('ai-researched-image://')[1] || 'Imagem');
    }
    return 'Imagem gerada';
  }

  /**
   * Obtém estatísticas das imagens editáveis
   */
  getStats() {
    return {
      totalImages: this.editableImages.size,
      editingImages: Array.from(this.editableImages.values()).filter(img => img.isEditing).length,
      isInitialized: this.isInitialized
    };
  }
}

// Instância singleton
export const interactiveImageEditor = new InteractiveImageEditor();

// Auto-inicializar quando DOM estiver pronto
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      interactiveImageEditor.initialize();
    });
  } else {
    interactiveImageEditor.initialize();
  }
}

// Funções utilitárias
export function initializeImageEditor(): void {
  interactiveImageEditor.initialize();
}

export function getImageEditorStats() {
  return interactiveImageEditor.getStats();
}
