/**
 * 🧠 CONTENT ANALYZER SERVICE
 * Analisa conteúdo web e gera resumos inteligentes com Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

class ContentAnalyzerService {
    constructor() {
        this.genAI = null;
        this.model = null;
    }

    /**
     * Inicializar Gemini
     */
    async initialize(apiKey) {
        if (!apiKey) {
            throw new Error('API Key do Gemini não fornecida');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        console.log('🧠 Content Analyzer inicializado');
    }

    /**
     * Analisar conteúdo de página e gerar resumo inteligente
     */
    async analyzePage(pageContent, userIntent = '') {
        if (!this.model) {
            throw new Error('Content Analyzer não inicializado');
        }

        const prompt = `
Você é um assistente inteligente que analisa conteúdo web e extrai informações relevantes.

**Conteúdo da Página:**
Título: ${pageContent.title}
URL: ${pageContent.url}
Texto: ${pageContent.text?.substring(0, 5000)}

${userIntent ? `**Intenção do Usuário:** ${userIntent}` : ''}

**Sua Tarefa:**
1. Faça um resumo claro e objetivo do conteúdo (2-3 parágrafos)
2. Identifique os pontos principais e informações mais relevantes
3. Se houver produtos, extraia: nome, preço, descrição
4. Se houver imagens relevantes, liste as mais importantes
5. Se houver links importantes, liste os principais

**Formato de Resposta (JSON):**
{
  "summary": "Resumo inteligente do conteúdo...",
  "keyPoints": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "products": [
    {
      "name": "Nome do produto",
      "price": "R$ 99,90",
      "description": "Descrição",
      "image": "URL da imagem"
    }
  ],
  "images": [
    {
      "src": "URL",
      "title": "Título/descrição",
      "relevance": "alta|média|baixa"
    }
  ],
  "links": [
    {
      "url": "URL",
      "title": "Título do link",
      "description": "Por que é relevante"
    }
  ],
  "recommendation": "Recomendação ou próximos passos para o usuário"
}

Responda APENAS com o JSON, sem texto adicional.
`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();
            
            // Extrair JSON da resposta
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta não contém JSON válido');
            }

            const analysis = JSON.parse(jsonMatch[0]);
            
            console.log('✅ Análise concluída:', {
                summary: analysis.summary?.substring(0, 100) + '...',
                products: analysis.products?.length || 0,
                images: analysis.images?.length || 0,
                links: analysis.links?.length || 0
            });

            return analysis;
        } catch (error) {
            console.error('❌ Erro ao analisar conteúdo:', error);
            
            // Fallback: retornar análise básica
            return {
                summary: `Página: ${pageContent.title}\n\n${pageContent.text?.substring(0, 500)}...`,
                keyPoints: [],
                products: [],
                images: [],
                links: [],
                recommendation: 'Navegue pela página para mais informações.'
            };
        }
    }

    /**
     * Extrair mídia rica do conteúdo
     */
    extractRichMedia(pageContent, analysis) {
        const richMedia = [];

        // Adicionar produtos como mídia
        if (analysis.products && analysis.products.length > 0) {
            analysis.products.forEach(product => {
                richMedia.push({
                    type: 'product',
                    title: product.name,
                    description: product.description,
                    price: product.price,
                    thumbnail: product.image,
                    url: pageContent.url
                });
            });
        }

        // Adicionar imagens relevantes
        if (analysis.images && analysis.images.length > 0) {
            analysis.images
                .filter(img => img.relevance === 'alta' || img.relevance === 'média')
                .slice(0, 6) // Máximo 6 imagens
                .forEach(img => {
                    richMedia.push({
                        type: 'image',
                        src: img.src,
                        title: img.title
                    });
                });
        }

        // Adicionar links importantes
        if (analysis.links && analysis.links.length > 0) {
            analysis.links.slice(0, 5).forEach(link => {
                richMedia.push({
                    type: 'link',
                    url: link.url,
                    title: link.title,
                    description: link.description
                });
            });
        }

        return richMedia;
    }

    /**
     * Analisar múltiplos resultados de busca
     */
    async analyzeSearchResults(results, query) {
        if (!this.model) {
            throw new Error('Content Analyzer não inicializado');
        }

        const prompt = `
Você é um assistente que analisa resultados de busca e fornece insights.

**Consulta:** ${query}

**Resultados:**
${results.map((r, i) => `
${i + 1}. ${r.title}
   URL: ${r.url}
   Snippet: ${r.snippet || 'N/A'}
`).join('\n')}

**Sua Tarefa:**
1. Resuma os principais achados
2. Identifique padrões ou temas comuns
3. Recomende os melhores resultados
4. Sugira próximos passos

**Formato de Resposta (JSON):**
{
  "summary": "Resumo dos resultados...",
  "patterns": ["Padrão 1", "Padrão 2"],
  "topResults": [0, 2, 4],
  "recommendation": "Recomendação..."
}

Responda APENAS com o JSON.
`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta não contém JSON válido');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('❌ Erro ao analisar resultados:', error);
            
            return {
                summary: `Encontrados ${results.length} resultados para "${query}"`,
                patterns: [],
                topResults: [0, 1, 2],
                recommendation: 'Explore os primeiros resultados.'
            };
        }
    }
}

// Singleton
const contentAnalyzerService = new ContentAnalyzerService();

export default contentAnalyzerService;
