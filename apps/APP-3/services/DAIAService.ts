/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Service - Frontend Integration                        ║
 * ║                                                                              ║
 * ║              Conecta AI Web Weaver ao DAIA (Database AI Apprentice)          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este serviço gerencia a comunicação entre o frontend e o servidor DAIA local.
 * 
 * Funcionalidades:
 * - Enviar códigos aprovados (like) para aprendizado
 * - Buscar templates similares antes de gerar novo código
 * - Verificar status do servidor DAIA
 * - Gerenciar templates salvos
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface DAIAConfig {
    baseUrl: string;
    enabled: boolean;
    autoLearn: boolean;  // Aprender automaticamente quando usuário dá like
    autoSuggest: boolean;  // Sugerir templates similares automaticamente
    similarityThreshold: number;  // Threshold mínimo de similaridade (0-1)
}

export interface LearnRequest {
    code: string;
    prompt: string;
    category?: string;
    score?: number;
    metadata?: Record<string, unknown>;
}

export interface LearnResponse {
    success: boolean;
    message: string;
    template_id: string;
    category: string;
    is_duplicate: boolean;
}

export interface SearchRequest {
    prompt: string;
    limit?: number;
    category?: string;
    min_score?: number;
}

export interface TemplateResult {
    id: string;
    prompt: string;
    code: string;
    category: string | null;
    score: number | null;
    similarity: number;
    created_at: string;
}

export interface DAIAStats {
    total_templates: number;
    categories: Record<string, number>;
    avg_score: number;
    storage_size_mb: number;
    last_learned: string | null;
}

export interface DAIAHealthStatus {
    status: 'online' | 'offline' | 'error';
    components?: {
        database: string;
        embedder: string;
        similarity: string;
    };
    stats?: DAIAStats;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO PADRÃO
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: DAIAConfig = {
    baseUrl: 'http://localhost:8765',
    enabled: true,
    autoLearn: true,
    autoSuggest: true,
    similarityThreshold: 0.7
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVIÇO DAIA
// ═══════════════════════════════════════════════════════════════════════════════

class DAIAService {
    private config: DAIAConfig;
    private isOnline: boolean = false;
    private lastHealthCheck: number = 0;
    private healthCheckInterval: number = 300000; // 5 MINUTOS (era 30 segundos)
    // ⚠️ Aumentado para evitar chamadas excessivas à API

    constructor(config: Partial<DAIAConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // Carrega configuração do localStorage
        this.loadConfig();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    private loadConfig(): void {
        try {
            const saved = localStorage.getItem('daia_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = { ...this.config, ...parsed };
            }
        } catch (e) {
            console.warn('[DAIA] Erro ao carregar configuração:', e);
        }
    }

    public saveConfig(): void {
        try {
            localStorage.setItem('daia_config', JSON.stringify(this.config));
        } catch (e) {
            console.warn('[DAIA] Erro ao salvar configuração:', e);
        }
    }

    public getConfig(): DAIAConfig {
        return { ...this.config };
    }

    public updateConfig(updates: Partial<DAIAConfig>): void {
        this.config = { ...this.config, ...updates };
        this.saveConfig();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HEALTH CHECK
    // ═══════════════════════════════════════════════════════════════════════════

    public async checkHealth(force: boolean = false): Promise<DAIAHealthStatus> {
        // Cache de health check
        const now = Date.now();
        if (!force && this.lastHealthCheck > 0 && (now - this.lastHealthCheck) < this.healthCheckInterval) {
            return {
                status: this.isOnline ? 'online' : 'offline'
            };
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000) // 5 segundos timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.isOnline = true;
            this.lastHealthCheck = now;

            return {
                status: 'online',
                components: data.components,
                stats: data.stats
            };
        } catch (error) {
            this.isOnline = false;
            this.lastHealthCheck = now;

            return {
                status: 'offline',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }

    public isAvailable(): boolean {
        return this.config.enabled && this.isOnline;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // APRENDIZADO
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Envia um código aprovado para o DAIA aprender.
     * Chamado quando o usuário dá like em um código gerado.
     */
    public async learn(request: LearnRequest): Promise<LearnResponse | null> {
        if (!this.config.enabled) {
            console.log('[DAIA] Serviço desabilitado');
            return null;
        }

        // Verifica se está online
        const health = await this.checkHealth();
        if (health.status !== 'online') {
            console.warn('[DAIA] Servidor offline, não foi possível aprender');
            return null;
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/learn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
                signal: AbortSignal.timeout(30000) // 30 segundos para processar embedding
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            const data: LearnResponse = await response.json();
            
            console.log(`[DAIA] ✅ Template aprendido: ${data.template_id} (${data.category})`);
            
            return data;
        } catch (error) {
            console.error('[DAIA] Erro ao aprender:', error);
            return null;
        }
    }

    /**
     * Wrapper para aprendizado automático.
     * Detecta categoria e adiciona metadados automaticamente.
     */
    public async autoLearn(
        code: string,
        prompt: string,
        modelUsed: string,
        userRating?: 'liked' | 'disliked'
    ): Promise<LearnResponse | null> {
        if (!this.config.autoLearn) {
            return null;
        }

        // Só aprende códigos que o usuário gostou
        if (userRating !== 'liked') {
            return null;
        }

        return this.learn({
            code,
            prompt,
            score: 80, // Score base para códigos aprovados
            metadata: {
                model: modelUsed,
                source: 'ai-web-weaver',
                timestamp: new Date().toISOString(),
                autoLearned: true
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCA
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Busca templates similares ao prompt.
     * Usado para encontrar exemplos antes de gerar novo código.
     */
    public async search(request: SearchRequest): Promise<TemplateResult[]> {
        if (!this.config.enabled) {
            return [];
        }

        // Verifica se está online
        const health = await this.checkHealth();
        if (health.status !== 'online') {
            return [];
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: request.prompt,
                    limit: request.limit || 5,
                    category: request.category,
                    min_score: request.min_score
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const results: TemplateResult[] = await response.json();
            
            // Filtra por threshold de similaridade
            return results.filter(r => r.similarity >= this.config.similarityThreshold);
        } catch (error) {
            console.error('[DAIA] Erro na busca:', error);
            return [];
        }
    }

    /**
     * Busca automática de sugestões.
     * Retorna o melhor template se a similaridade for alta o suficiente.
     */
    public async getSuggestion(prompt: string): Promise<TemplateResult | null> {
        if (!this.config.autoSuggest) {
            return null;
        }

        const results = await this.search({ prompt, limit: 1 });
        
        if (results.length > 0 && results[0].similarity >= 0.85) {
            console.log(`[DAIA] 💡 Sugestão encontrada: ${results[0].id} (${(results[0].similarity * 100).toFixed(1)}% similar)`);
            return results[0];
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERENCIAMENTO DE TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Lista todos os templates salvos.
     */
    public async listTemplates(
        limit: number = 50,
        offset: number = 0,
        category?: string
    ): Promise<{ templates: TemplateResult[]; total: number }> {
        if (!this.config.enabled) {
            return { templates: [], total: 0 };
        }

        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString()
            });
            if (category) {
                params.append('category', category);
            }

            const response = await fetch(`${this.config.baseUrl}/templates?${params}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[DAIA] Erro ao listar templates:', error);
            return { templates: [], total: 0 };
        }
    }

    /**
     * Obtém um template específico.
     */
    public async getTemplate(templateId: string): Promise<TemplateResult | null> {
        if (!this.config.enabled) {
            return null;
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/templates/${templateId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[DAIA] Erro ao obter template:', error);
            return null;
        }
    }

    /**
     * Remove um template.
     */
    public async deleteTemplate(templateId: string): Promise<boolean> {
        if (!this.config.enabled) {
            return false;
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/templates/${templateId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            return response.ok;
        } catch (error) {
            console.error('[DAIA] Erro ao deletar template:', error);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ESTATÍSTICAS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Obtém estatísticas do banco de templates.
     */
    public async getStats(): Promise<DAIAStats | null> {
        if (!this.config.enabled) {
            return null;
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/stats`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[DAIA] Erro ao obter estatísticas:', error);
            return null;
        }
    }

    /**
     * Lista categorias disponíveis.
     */
    public async getCategories(): Promise<Array<{ name: string; count: number }>> {
        if (!this.config.enabled) {
            return [];
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/categories`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.categories || [];
        } catch (error) {
            console.error('[DAIA] Erro ao obter categorias:', error);
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORTAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Exporta templates para fine-tuning.
     */
    public async exportForTraining(category?: string): Promise<Array<{ prompt: string; completion: string }>> {
        if (!this.config.enabled) {
            return [];
        }

        try {
            const params = category ? `?category=${encodeURIComponent(category)}` : '';
            const response = await fetch(`${this.config.baseUrl}/export${params}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('[DAIA] Erro ao exportar:', error);
            return [];
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTÂNCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// INSTÂNCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const daiaService = new DAIAService();

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Enriquece o prompt com templates similares do DAIA.
 * Usado antes de chamar o Gemini para melhorar a geração.
 */
export async function enrichPromptWithDAIA(prompt: string): Promise<{
    enrichedPrompt: string;
    usedTemplates: TemplateResult[];
}> {
    const templates = await daiaService.search({ prompt, limit: 3 });
    
    if (templates.length === 0) {
        return { enrichedPrompt: prompt, usedTemplates: [] };
    }

    // Adiciona exemplos ao prompt
    const examples = templates.map((t, i) => 
        `### Exemplo ${i + 1} (${(t.similarity * 100).toFixed(0)}% similar):\n` +
        `Prompt: ${t.prompt}\n` +
        `Código: ${t.code.substring(0, 500)}...`
    ).join('\n\n');

    const enrichedPrompt = `${prompt}\n\n` +
        `[DAIA] Encontrei ${templates.length} templates similares no banco de conhecimento:\n\n` +
        `${examples}\n\n` +
        `Use esses exemplos como referência para manter consistência de estilo e qualidade.`;

    return { enrichedPrompt, usedTemplates: templates };
}

export default DAIAService;
