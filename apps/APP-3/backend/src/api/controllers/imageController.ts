import { Request, Response } from 'express';
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Função para obter instância do GoogleGenAI
function getGeminiInstance(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API Key do Gemini não configurada no backend. Configure GEMINI_API_KEY ou API_KEY no .env');
  }
  return new GoogleGenAI({ apiKey });
}

// Diretório para salvar imagens geradas
const IMAGES_DIR = path.join(process.cwd(), 'public', 'generated-images');

// Garantir que o diretório existe
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

interface ImageGenerationRequest {
  htmlContent: string;
  projectId?: string;
}

interface ImagePlaceholder {
  id: string;
  description: string;
  context: string;
  element: string;
}

/**
 * Analisa o HTML e identifica placeholders de imagem
 */
function extractImagePlaceholders(htmlContent: string): ImagePlaceholder[] {
  const placeholders: ImagePlaceholder[] = [];
  
  // Regex para encontrar placeholders ai-researched-image://
  const imageRegex = /src=["']ai-researched-image:\/\/([^"']+)["']/g;
  let match;
  
  while ((match = imageRegex.exec(htmlContent)) !== null) {
    const description = match[1];
    const id = uuidv4();
    
    // Extrair contexto ao redor do placeholder
    const start = Math.max(0, match.index - 200);
    const end = Math.min(htmlContent.length, match.index + 200);
    const context = htmlContent.substring(start, end);
    
    placeholders.push({
      id,
      description,
      context,
      element: match[0]
    });
  }
  
  return placeholders;
}

/**
 * Gera uma imagem usando Gemini 2.0 Flash Preview Image Generation
 */
async function generateImageWithGemini(description: string, context: string): Promise<string> {
  try {
    // Construir prompt otimizado para geração de imagem
    const enhancedPrompt = `Gere uma imagem profissional e de alta qualidade: ${description}. 
    Contexto: ${context}. 
    Estilo: moderno, limpo, profissional, adequado para web.
    Qualidade: alta resolução, bem iluminada, composição equilibrada.`;

    const ai = getGeminiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ text: enhancedPrompt }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        temperature: 0.7,
      },
    });

    // Processar resposta com validação
    if (!response.candidates || !response.candidates[0]?.content?.parts) {
      throw new Error('Resposta inválida da API Gemini');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        const imageData = part.inlineData.data;
        if (!imageData) {
          continue;
        }
        const buffer = Buffer.from(imageData, 'base64');
        
        // Salvar imagem com nome único
        const filename = `${uuidv4()}.png`;
        const filepath = path.join(IMAGES_DIR, filename);
        
        fs.writeFileSync(filepath, buffer);
        
        // Retornar URL relativa
        return `/api/images/generated/${filename}`;
      }
    }
    
    throw new Error('Nenhuma imagem foi gerada na resposta');
    
  } catch (error: any) {
    console.error('Erro ao gerar imagem:', error);
    throw new Error(`Falha na geração de imagem: ${error.message}`);
  }
}

/**
 * Endpoint principal para processar HTML e gerar imagens
 */
export const processHtmlAndGenerateImages = async (req: Request, res: Response) => {
  try {
    const { htmlContent, projectId }: ImageGenerationRequest = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ 
        error: 'HTML content é obrigatório' 
      });
    }

    console.log('🎨 Iniciando processamento de imagens...');
    
    // 1. Extrair placeholders de imagem
    const placeholders = extractImagePlaceholders(htmlContent);
    
    if (placeholders.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum placeholder de imagem encontrado',
        htmlContent,
        imagesGenerated: 0
      });
    }

    console.log(`📸 Encontrados ${placeholders.length} placeholders de imagem`);
    
    // 2. Gerar imagens para cada placeholder
    let updatedHtml = htmlContent;
    const generatedImages: Array<{id: string, url: string, description: string}> = [];
    
    for (const placeholder of placeholders) {
      try {
        console.log(`🔄 Gerando imagem: ${placeholder.description}`);
        
        const imageUrl = await generateImageWithGemini(
          placeholder.description, 
          placeholder.context
        );
        
        // Substituir placeholder pela URL real
        updatedHtml = updatedHtml.replace(
          placeholder.element,
          placeholder.element.replace(
            `ai-researched-image://${placeholder.description}`,
            imageUrl
          )
        );
        
        generatedImages.push({
          id: placeholder.id,
          url: imageUrl,
          description: placeholder.description
        });
        
        console.log(`✅ Imagem gerada: ${imageUrl}`);
        
      } catch (error: any) {
        console.error(`❌ Erro ao gerar imagem para "${placeholder.description}":`, error);
        
        // Em caso de erro, usar placeholder padrão
        const fallbackUrl = `/api/images/placeholder?text=${encodeURIComponent(placeholder.description)}`;
        updatedHtml = updatedHtml.replace(
          placeholder.element,
          placeholder.element.replace(
            `ai-researched-image://${placeholder.description}`,
            fallbackUrl
          )
        );
      }
    }
    
    console.log(`🎉 Processamento concluído! ${generatedImages.length} imagens geradas`);
    
    res.json({
      success: true,
      htmlContent: updatedHtml,
      imagesGenerated: generatedImages.length,
      images: generatedImages,
      projectId
    });
    
  } catch (error: any) {
    console.error('❌ Erro no processamento de imagens:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

/**
 * Endpoint para servir imagens geradas
 */
export const serveGeneratedImage = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }
    
    // Definir headers apropriados
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    
    // Enviar arquivo
    res.sendFile(filepath);
    
  } catch (error: any) {
    console.error('Erro ao servir imagem:', error);
    res.status(500).json({ error: 'Erro ao carregar imagem' });
  }
};

/**
 * Endpoint para gerar placeholder dinâmico
 */
export const generatePlaceholder = async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    const placeholderText = (text as string) || 'Imagem';
    
    // Gerar SVG placeholder simples
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
              fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
          ${placeholderText}
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
    
  } catch (error: any) {
    console.error('Erro ao gerar placeholder:', error);
    res.status(500).json({ error: 'Erro ao gerar placeholder' });
  }
};

/**
 * Endpoint para limpar imagens antigas
 */
export const cleanupOldImages = async (req: Request, res: Response) => {
  try {
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    const now = Date.now();
    let deletedCount = 0;
    
    const files = fs.readdirSync(IMAGES_DIR);
    
    for (const file of files) {
      const filepath = path.join(IMAGES_DIR, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${deletedCount} imagens antigas removidas`,
      deletedCount
    });
    
  } catch (error: any) {
    console.error('Erro na limpeza de imagens:', error);
    res.status(500).json({ error: 'Erro na limpeza de imagens' });
  }
};