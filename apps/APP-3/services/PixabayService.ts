// services/PixabayService.ts
// Sistema completo da API Pixabay v2 com rate limiting, cache e filtros avançados

const API_KEY = '50487374-d9af04e209f2b2aa0afaa3ff0';
const BASE_URL = 'https://pixabay.com/api/';
const VIDEO_URL = 'https://pixabay.com/api/videos/';

// Interfaces completas baseadas na documentação oficial
export interface PixabayImage {
    id: number;
    pageURL: string;
    type: 'photo' | 'illustration' | 'vector';
    tags: string;
    previewURL: string;
    previewWidth: number;
    previewHeight: number;
    webformatURL: string;
    webformatWidth: number;
    webformatHeight: number;
    largeImageURL: string;
    fullHDURL?: string;
    imageURL?: string;
    vectorURL?: string;
    imageWidth: number;
    imageHeight: number;
    imageSize: number;
    views: number;
    downloads: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
}

export interface VideoFile {
    url: string;
    width: number;
    height: number;
    size: number;
    thumbnail: string;
}

export interface PixabayVideo {
    id: number;
    pageURL: string;
    type: 'film' | 'animation';
    tags: string;
    duration: number;
    videos: {
        large: VideoFile;
        medium: VideoFile;
        small: VideoFile;
        tiny: VideoFile;
    };
    views: number;
    downloads: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
}

export interface PixabayResponse<T> {
    total: number;
    totalHits: number;
    hits: T[];
}

// Parâmetros de busca completos
export interface ImageSearchParams {
    q?: string;
    lang?: 'cs' | 'da' | 'de' | 'en' | 'es' | 'fr' | 'id' | 'it' | 'hu' | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'sk' | 'fi' | 'sv' | 'tr' | 'vi' | 'th' | 'bg' | 'ru' | 'el' | 'ja' | 'ko' | 'zh';
    id?: string;
    image_type?: 'all' | 'photo' | 'illustration' | 'vector';
    orientation?: 'all' | 'horizontal' | 'vertical';
    category?: 'backgrounds' | 'fashion' | 'nature' | 'science' | 'education' | 'feelings' | 'health' | 'people' | 'religion' | 'places' | 'animals' | 'industry' | 'computer' | 'food' | 'sports' | 'transportation' | 'travel' | 'buildings' | 'business' | 'music';
    min_width?: number;
    min_height?: number;
    colors?: string;
    editors_choice?: boolean;
    safesearch?: boolean;
    order?: 'popular' | 'latest';
    page?: number;
    per_page?: number;
}

export interface VideoSearchParams {
    q?: string;
    lang?: 'cs' | 'da' | 'de' | 'en' | 'es' | 'fr' | 'id' | 'it' | 'hu' | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'sk' | 'fi' | 'sv' | 'tr' | 'vi' | 'th' | 'bg' | 'ru' | 'el' | 'ja' | 'ko' | 'zh';
    id?: string;
    video_type?: 'all' | 'film' | 'animation';
    category?: 'backgrounds' | 'fashion' | 'nature' | 'science' | 'education' | 'feelings' | 'health' | 'people' | 'religion' | 'places' | 'animals' | 'industry' | 'computer' | 'food' | 'sports' | 'transportation' | 'travel' | 'buildings' | 'business' | 'music';
    min_width?: number;
    min_height?: number;
    editors_choice?: boolean;
    safesearch?: boolean;
    order?: 'popular' | 'latest';
    page?: number;
    per_page?: number;
}

// Sistema de Rate Limiting
interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
    lastRequest: number;
}

// Sistema de Cache
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class PixabayCache {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas conforme documentação

    set<T>(key: string, data: T): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + this.CACHE_DURATION
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}


// Classe principal do serviço Pixabay
class PixabayService {
    private cache = new PixabayCache();
    private rateLimitInfo: RateLimitInfo = {
        limit: 100,
        remaining: 100,
        reset: 0,
        lastRequest: 0
    };

    /**
     * Verifica se podemos fazer uma requisição baseado no rate limit
     */
    private canMakeRequest(): boolean {
        const now = Date.now();
        
        // Se passou mais de 60 segundos desde o reset, resetar contadores
        if (now - this.rateLimitInfo.reset > 60000) {
            this.rateLimitInfo.remaining = this.rateLimitInfo.limit;
            this.rateLimitInfo.reset = now;
        }

        return this.rateLimitInfo.remaining > 0;
    }

    /**
     * Atualiza informações de rate limit baseado nos headers da resposta
     */
    private updateRateLimit(headers: Headers): void {
        const limit = headers.get('X-RateLimit-Limit');
        const remaining = headers.get('X-RateLimit-Remaining');
        const reset = headers.get('X-RateLimit-Reset');

        if (limit) this.rateLimitInfo.limit = parseInt(limit);
        if (remaining) this.rateLimitInfo.remaining = parseInt(remaining);
        if (reset) this.rateLimitInfo.reset = Date.now() + (parseInt(reset) * 1000);
        
        this.rateLimitInfo.lastRequest = Date.now();

        console.log(`🔄 Rate Limit: ${this.rateLimitInfo.remaining}/${this.rateLimitInfo.limit} restantes`);
    }

    /**
     * Constrói URL de busca com parâmetros
     */
    private buildSearchUrl(baseUrl: string, params: ImageSearchParams | VideoSearchParams): string {
        const urlParams = new URLSearchParams();
        urlParams.set('key', API_KEY);

        // Adicionar todos os parâmetros válidos
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'q' && typeof value === 'string') {
                    // Truncar query conforme documentação
                    const truncatedQuery = value.substring(0, 100);
                    urlParams.set(key, truncatedQuery);
                } else {
                    urlParams.set(key, value.toString());
                }
            }
        });

        return `${baseUrl}?${urlParams.toString()}`;
    }

    /**
     * Faz requisição HTTP com tratamento completo de erros
     */
    private async makeRequest<T>(url: string, cacheKey: string): Promise<PixabayResponse<T> | null> {
        // Verificar cache primeiro
        const cachedData = this.cache.get<PixabayResponse<T>>(cacheKey);
        if (cachedData) {
            console.log(`📦 Cache hit: ${cacheKey}`);
            return cachedData;
        }

        // Verificar rate limit
        if (!this.canMakeRequest()) {
            const waitTime = Math.ceil((this.rateLimitInfo.reset - Date.now()) / 1000);
            console.warn(`⚠️ Rate limit atingido. Aguarde ${waitTime}s`);
            throw new Error(`Rate limit excedido. Aguarde ${waitTime} segundos.`);
        }

        try {
            console.log(`🌐 Fazendo requisição: ${url}`);
            const response = await fetch(url);

            // Atualizar rate limit info
            this.updateRateLimit(response.headers);

            if (!response.ok) {
                const errorBody = await response.text();
                
                if (response.status === 429) {
                    throw new Error('Rate limit da API Pixabay excedido');
                } else if (response.status === 400) {
                    throw new Error(`Parâmetros inválidos: ${errorBody}`);
                } else if (response.status === 403) {
                    throw new Error('Chave de API inválida ou acesso negado');
                } else {
                    throw new Error(`Erro da API Pixabay: ${response.status} - ${errorBody}`);
                }
            }

            const data: PixabayResponse<T> = await response.json();
            
            // Salvar no cache
            this.cache.set(cacheKey, data);
            
            console.log(`✅ Sucesso: ${data.totalHits} resultados encontrados`);
            return data;

        } catch (error) {
            console.error('❌ Erro na requisição Pixabay:', error);
            throw error;
        }
    }

    /**
     * Busca imagens com parâmetros completos
     */
    async searchImages(params: ImageSearchParams = {}): Promise<PixabayResponse<PixabayImage>> {
        // Parâmetros padrão
        const defaultParams: ImageSearchParams = {
            lang: 'pt',
            image_type: 'photo',
            safesearch: true,
            per_page: 20,
            page: 1,
            order: 'popular',
            ...params
        };

        const url = this.buildSearchUrl(BASE_URL, defaultParams);
        const cacheKey = `images_${JSON.stringify(defaultParams)}`;
        
        const result = await this.makeRequest<PixabayImage>(url, cacheKey);
        return result || { total: 0, totalHits: 0, hits: [] };
    }

    /**
     * Busca vídeos com parâmetros completos
     */
    async searchVideos(params: VideoSearchParams = {}): Promise<PixabayResponse<PixabayVideo>> {
        // Parâmetros padrão
        const defaultParams: VideoSearchParams = {
            lang: 'pt',
            video_type: 'all',
            safesearch: true,
            per_page: 20,
            page: 1,
            order: 'popular',
            ...params
        };

        const url = this.buildSearchUrl(VIDEO_URL, defaultParams);
        const cacheKey = `videos_${JSON.stringify(defaultParams)}`;
        
        const result = await this.makeRequest<PixabayVideo>(url, cacheKey);
        return result || { total: 0, totalHits: 0, hits: [] };
    }

    /**
     * Busca imagem por ID específico
     */
    async getImageById(id: string): Promise<PixabayImage | null> {
        const result = await this.searchImages({ id });
        return result.hits[0] || null;
    }

    /**
     * Busca vídeo por ID específico
     */
    async getVideoById(id: string): Promise<PixabayVideo | null> {
        const result = await this.searchVideos({ id });
        return result.hits[0] || null;
    }

    /**
     * Busca imagens com filtros avançados
     */
    async searchImagesAdvanced(
        query: string,
        options: {
            category?: ImageSearchParams['category'];
            orientation?: ImageSearchParams['orientation'];
            colors?: string;
            minWidth?: number;
            minHeight?: number;
            editorsChoice?: boolean;
            imageType?: ImageSearchParams['image_type'];
            perPage?: number;
        } = {}
    ): Promise<PixabayResponse<PixabayImage>> {
        return this.searchImages({
            q: query,
            category: options.category,
            orientation: options.orientation,
            colors: options.colors,
            min_width: options.minWidth,
            min_height: options.minHeight,
            editors_choice: options.editorsChoice,
            image_type: options.imageType || 'photo',
            per_page: options.perPage || 20
        });
    }

    /**
     * Busca vídeos com filtros avançados
     */
    async searchVideosAdvanced(
        query: string,
        options: {
            category?: VideoSearchParams['category'];
            videoType?: VideoSearchParams['video_type'];
            minWidth?: number;
            minHeight?: number;
            editorsChoice?: boolean;
            perPage?: number;
        } = {}
    ): Promise<PixabayResponse<PixabayVideo>> {
        return this.searchVideos({
            q: query,
            category: options.category,
            video_type: options.videoType,
            min_width: options.minWidth,
            min_height: options.minHeight,
            editors_choice: options.editorsChoice,
            per_page: options.perPage || 20
        });
    }

    /**
     * Obtém estatísticas do cache e rate limit
     */
    getStats(): {
        cache: { size: number; };
        rateLimit: RateLimitInfo;
    } {
        return {
            cache: { size: this.cache.size() },
            rateLimit: { ...this.rateLimitInfo }
        };
    }

    /**
     * Limpa o cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log('🗑️ Cache Pixabay limpo');
    }
}

// Instância singleton
const pixabayService = new PixabayService();

// Funções de conveniência (compatibilidade com código existente)
export async function searchImages(query: string): Promise<PixabayImage[]> {
    const result = await pixabayService.searchImages({ q: query, per_page: 5 });
    return result.hits;
}

export async function searchVideos(query: string): Promise<PixabayVideo[]> {
    const result = await pixabayService.searchVideos({ q: query, per_page: 5 });
    return result.hits;
}

// Exportar instância principal para uso avançado
export { pixabayService as PixabayService };

// Utilitários para URLs de imagem
export class PixabayImageUtils {
    /**
     * Obtém URL da imagem em diferentes tamanhos
     */
    static getImageUrl(image: PixabayImage, size: 'preview' | 'web' | 'large' | 'fullHD' | 'original' = 'web'): string {
        switch (size) {
            case 'preview':
                return image.previewURL;
            case 'web':
                return image.webformatURL;
            case 'large':
                return image.largeImageURL;
            case 'fullHD':
                return image.fullHDURL || image.largeImageURL;
            case 'original':
                return image.imageURL || image.largeImageURL;
            default:
                return image.webformatURL;
        }
    }

    /**
     * Modifica URL para diferentes tamanhos (conforme documentação)
     */
    static resizeImageUrl(webformatURL: string, size: '180' | '340' | '640' | '960'): string {
        return webformatURL.replace('_640', `_${size}`);
    }

    /**
     * Obtém URL de download da imagem
     */
    static getDownloadUrl(imageUrl: string): string {
        return `${imageUrl}?download=1`;
    }
}

// Utilitários para vídeos
export class PixabayVideoUtils {
    /**
     * Obtém URL do vídeo em qualidade específica
     */
    static getVideoUrl(video: PixabayVideo, quality: 'tiny' | 'small' | 'medium' | 'large' = 'medium'): string {
        return video.videos[quality]?.url || video.videos.medium.url;
    }

    /**
     * Obtém thumbnail do vídeo
     */
    static getThumbnailUrl(video: PixabayVideo, quality: 'tiny' | 'small' | 'medium' | 'large' = 'medium'): string {
        return video.videos[quality]?.thumbnail || video.videos.medium.thumbnail;
    }

    /**
     * Obtém URL de download do vídeo
     */
    static getDownloadUrl(videoUrl: string): string {
        return `${videoUrl}?download=1`;
    }

    /**
     * Formata duração do vídeo
     */
    static formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}