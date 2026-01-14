/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    STARTER KIT SERVICE - Frontend Client                      ║
 * ║                                                                               ║
 * ║              "Cada geração é um ativo econômico reutilizável"                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * MODELO DE NEGÓCIO:
 * - Usuário gera de graça
 * - Código dele é dele (juridicamente)
 * - Sistema pode vender versões genéricas
 * - Dataset treina modelo interno (lock-in cognitivo)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface StarterKit {
  id: string;
  version: number;
  created_at: string;
  updated_at: string;
  
  // Conteúdo
  code: string;
  prompt: string;
  readme: string;
  architecture: string;
  
  // Metadados
  metadata: StarterKitMetadata;
  
  // Classificação
  classification: StarterKitClassification;
  
  // Marketplace
  marketplace_status: MarketplaceStatus;
  
  // Ownership
  owner_id: string;
  is_public: boolean;
  license_type: string;
}

export interface StarterKitMetadata {
  product_type: string;
  complexity: 'low' | 'medium' | 'high' | 'enterprise';
  estimated_hours: number;
  lines_of_code: number;
  components_count: number;
  technologies: string[];
  patterns: string[];
  integrations: string[];
  trade_offs: TradeOff[];
  tags: string[];
  category: string;
  generated_by: string;
  generated_at: string;
  model_used: string;
  manifest_used: string;
}

export interface TradeOff {
  decision: string;
  reason: string;
  alternative: string;
  impact: string;
}

export interface StarterKitClassification {
  quality_score: number;
  architecture_score: number;
  security_score: number;
  accessibility_score: number;
  performance_score: number;
  maintainability_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  patterns_detected: string[];
  anti_patterns: string[];
  improvements: string[];
  is_valid: boolean;
  validation_errors: string[];
  classified_by: string;
  classified_at: string;
}

export interface MarketplaceStatus {
  is_listed: boolean;
  listed_at?: string;
  unlisted_at?: string;
  price_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  price_usd: number;
  price_brl: number;
  views: number;
  downloads: number;
  purchases: number;
  stars: number;
  is_curated: boolean;
  curated_by?: string;
  curated_at?: string;
  curation_notes?: string;
  is_featured: boolean;
  featured_until?: string;
}

export interface CreateKitRequest {
  code: string;
  prompt: string;
  owner_id: string;
  readme?: string;
  category?: string;
}

export interface ClassifyResult {
  classification: StarterKitClassification;
  category: string;
  complexity: string;
  estimated_hours: number;
  can_be_listed: boolean;
}

export interface MarketplaceStats {
  total_kits: number;
  public_kits: number;
  by_category: Record<string, number>;
  avg_quality: number;
  training_samples: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

const MARKETPLACE_API_URL = import.meta.env.VITE_MARKETPLACE_URL || 'http://localhost:8080';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVIÇO
// ═══════════════════════════════════════════════════════════════════════════════

class StarterKitService {
  private baseUrl: string;
  private ownerId: string | null = null;

  constructor(baseUrl: string = MARKETPLACE_API_URL) {
    this.baseUrl = baseUrl;
    this.loadOwnerId();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  private loadOwnerId(): void {
    try {
      this.ownerId = localStorage.getItem('starter_kit_owner_id');
      if (!this.ownerId) {
        // Gera ID único para o usuário
        this.ownerId = 'user_' + crypto.randomUUID().slice(0, 16);
        localStorage.setItem('starter_kit_owner_id', this.ownerId);
      }
    } catch {
      this.ownerId = 'anonymous';
    }
  }

  public getOwnerId(): string {
    return this.ownerId || 'anonymous';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARTER KITS - CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cria um novo Starter Kit a partir de uma geração.
   * Chamado automaticamente quando código é gerado.
   */
  async createKit(request: CreateKitRequest): Promise<StarterKit | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/marketplace/kits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-ID': request.owner_id || this.getOwnerId(),
        },
        body: JSON.stringify({
          ...request,
          owner_id: request.owner_id || this.getOwnerId(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[StarterKit] Erro ao criar:', error);
        return null;
      }

      const data = await response.json();
      console.log(`[StarterKit] ✅ Kit criado: ${data.kit.id} (Grade: ${data.kit.classification.grade})`);
      return data.kit;
    } catch (error) {
      console.error('[StarterKit] Erro ao criar kit:', error);
      return null;
    }
  }

  /**
   * Lista kits públicos no marketplace.
   */
  async listPublicKits(options?: {
    limit?: number;
    offset?: number;
    category?: string;
  }): Promise<StarterKit[]> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.category) params.append('category', options.category);

      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.kits || [];
    } catch (error) {
      console.error('[StarterKit] Erro ao listar kits:', error);
      return [];
    }
  }

  /**
   * Busca um kit por ID.
   */
  async getKit(id: string): Promise<StarterKit | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/marketplace/kits/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[StarterKit] Erro ao buscar kit:', error);
      return null;
    }
  }

  /**
   * Lista meus kits.
   */
  async listMyKits(limit = 50, offset = 0): Promise<StarterKit[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/my-kits?${params}`,
        {
          headers: { 'X-Owner-ID': this.getOwnerId() },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.kits || [];
    } catch (error) {
      console.error('[StarterKit] Erro ao listar meus kits:', error);
      return [];
    }
  }

  /**
   * Atualiza um kit (README, architecture, etc).
   */
  async updateKit(id: string, updates: Partial<StarterKit>): Promise<StarterKit | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/marketplace/kits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-ID': this.getOwnerId(),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[StarterKit] Erro ao atualizar kit:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIFICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Classifica código sem salvar.
   * Útil para preview antes de criar o kit.
   */
  async classifyCode(code: string, prompt?: string): Promise<ClassifyResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/marketplace/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, prompt }),
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[StarterKit] Erro ao classificar:', error);
      return null;
    }
  }

  /**
   * Reclassifica um kit existente.
   */
  async reclassifyKit(id: string): Promise<StarterKitClassification | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits/${id}/reclassify`,
        { method: 'POST' }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.classification;
    } catch (error) {
      console.error('[StarterKit] Erro ao reclassificar:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETPLACE ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Publica kit no marketplace.
   */
  async publishKit(id: string): Promise<{ success: boolean; suggested_price?: number; reasons?: string[] }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits/${id}/publish`,
        {
          method: 'POST',
          headers: { 'X-Owner-ID': this.getOwnerId() },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, reasons: data.reasons };
      }

      console.log(`[StarterKit] ✅ Kit publicado! Preço sugerido: $${data.suggested_price}`);
      return { success: true, suggested_price: data.suggested_price };
    } catch (error) {
      console.error('[StarterKit] Erro ao publicar:', error);
      return { success: false };
    }
  }

  /**
   * Despublica kit do marketplace.
   */
  async unpublishKit(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits/${id}/unpublish`,
        {
          method: 'POST',
          headers: { 'X-Owner-ID': this.getOwnerId() },
        }
      );
      return response.ok;
    } catch (error) {
      console.error('[StarterKit] Erro ao despublicar:', error);
      return false;
    }
  }

  /**
   * Registra visualização de um kit.
   */
  async recordView(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/v1/marketplace/kits/${id}/view`, {
        method: 'POST',
        headers: { 'X-User-ID': this.getOwnerId() },
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Registra download de um kit.
   */
  async recordDownload(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/v1/marketplace/kits/${id}/download`, {
        method: 'POST',
        headers: { 'X-User-ID': this.getOwnerId() },
      });
    } catch {
      // Silently fail
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAINING DATA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Adiciona kit ao dataset de treinamento.
   */
  async addToTraining(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits/${id}/add-to-training`,
        { method: 'POST' }
      );
      return response.ok;
    } catch (error) {
      console.error('[StarterKit] Erro ao adicionar ao treinamento:', error);
      return false;
    }
  }

  /**
   * Exporta dados para treinamento.
   */
  async getTrainingData(minQuality = 70, limit = 1000): Promise<Array<{ prompt: string; completion: string }>> {
    try {
      const params = new URLSearchParams({
        min_quality: minQuality.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/training-data?${params}`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[StarterKit] Erro ao exportar dados:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtém estatísticas do marketplace.
   */
  async getStats(): Promise<MarketplaceStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/marketplace/stats`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[StarterKit] Erro ao obter stats:', error);
      return null;
    }
  }

  /**
   * Obtém estatísticas do classificador.
   */
  async getClassifierStats(): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/marketplace/classifier/stats`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[StarterKit] Erro ao obter stats do classificador:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // README GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera README para um kit.
   */
  async generateReadme(id: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits/${id}/generate-readme`,
        { method: 'POST' }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.readme;
    } catch (error) {
      console.error('[StarterKit] Erro ao gerar README:', error);
      return null;
    }
  }

  /**
   * Obtém diagrama de arquitetura de um kit.
   */
  async getArchitectureDiagram(id: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/kits/${id}/architecture-diagram`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.diagram;
    } catch (error) {
      console.error('[StarterKit] Erro ao obter diagrama:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Busca kits por texto.
   */
  async searchKits(options: {
    query: string;
    limit?: number;
    category?: string;
    minQuality?: number;
  }): Promise<StarterKit[]> {
    try {
      const params = new URLSearchParams({
        q: options.query,
        limit: (options.limit || 20).toString(),
      });
      
      if (options.category) params.append('category', options.category);
      if (options.minQuality) params.append('min_quality', options.minQuality.toString());

      const response = await fetch(
        `${this.baseUrl}/v1/marketplace/search?${params}`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.kits || [];
    } catch (error) {
      console.error('[StarterKit] Erro ao buscar:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE AND SAVE (endpoint direto)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera código e salva automaticamente como Starter Kit.
   * Usa o endpoint /v1/brain/generate-and-save do Go Brain API.
   */
  async generateAndSave(input: string, context?: Record<string, unknown>): Promise<{
    output: string;
    starterKit?: {
      id: string;
      grade: string;
      quality_score: number;
      category: string;
      complexity: string;
      estimated_hours: number;
    };
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/brain/generate-and-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-ID': this.getOwnerId(),
        },
        body: JSON.stringify({
          input,
          context,
          mode: 'code',
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.starter_kit) {
        console.log(`[StarterKit] ✅ Gerado e salvo: ${data.starter_kit.id}`);
        console.log(`[StarterKit]    Grade: ${data.starter_kit.grade}`);
        console.log(`[StarterKit]    Qualidade: ${data.starter_kit.quality_score}%`);
      }

      return data;
    } catch (error) {
      console.error('[StarterKit] Erro ao gerar e salvar:', error);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTÂNCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const starterKitService = new StarterKitService();

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: AUTO-SAVE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Salva automaticamente uma geração como Starter Kit.
 * Chamado após cada geração de código.
 */
export async function autoSaveGeneration(
  code: string,
  prompt: string,
  options?: {
    readme?: string;
    category?: string;
    modelUsed?: string;
    manifestUsed?: string;
  }
): Promise<StarterKit | null> {
  // Só salva se tiver código substancial
  if (!code || code.length < 100) {
    return null;
  }

  const kit = await starterKitService.createKit({
    code,
    prompt,
    owner_id: starterKitService.getOwnerId(),
    readme: options?.readme,
    category: options?.category,
  });

  if (kit) {
    // Se qualidade for boa, adiciona ao dataset de treinamento
    if (kit.classification.quality_score >= 70) {
      await starterKitService.addToTraining(kit.id);
      console.log(`[StarterKit] 📚 Kit adicionado ao dataset de treinamento`);
    }
  }

  return kit;
}

export default StarterKitService;
