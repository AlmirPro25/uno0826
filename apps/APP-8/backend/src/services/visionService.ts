import { GoogleGenerativeAI } from '@google/generative-ai';
import { executorService } from './executorService';
import * as fs from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ScreenElement {
  type: 'button' | 'input' | 'menu' | 'link' | 'text' | 'icon';
  label: string;
  position: { x: number; y: number };
  confidence: number;
}

interface ScreenAnalysis {
  description: string;
  elements: ScreenElement[];
  suggestions: string[];
  appName?: string;
  windowTitle?: string;
}

export class VisionService {
  private visionModel = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash'
  });

  /**
   * Captura e analisa tela visualmente
   */
  async analyzeScreen(context?: string): Promise<ScreenAnalysis> {
    try {
      // Captura screenshot via Executor
      const screenshot = await executorService.screenshot();
      
      // Lê imagem e converte para base64
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);
      
      const prompt = `Analise esta tela de computador e identifique elementos interativos.

${context ? `CONTEXTO/TAREFA: ${context}\n` : ''}

Identifique:
1. Botões clicáveis (com suas posições aproximadas)
2. Campos de entrada de texto
3. Menus e links
4. Nome do aplicativo/janela
5. Estado atual da interface
6. Ações possíveis para o usuário

Retorne APENAS um JSON válido (sem markdown):
{
  "description": "descrição geral da tela em 2-3 frases",
  "appName": "nome do aplicativo",
  "windowTitle": "título da janela",
  "elements": [
    {
      "type": "button",
      "label": "texto do botão",
      "position": {"x": 100, "y": 200},
      "confidence": 0.95
    }
  ],
  "suggestions": ["ação sugerida 1", "ação sugerida 2"]
}

IMPORTANTE: 
- Posições devem ser coordenadas aproximadas em pixels
- Confidence de 0 a 1
- Seja preciso nas posições dos elementos`;

      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback se não conseguir parsear JSON
      return {
        description: text,
        elements: [],
        suggestions: []
      };
    } catch (error) {
      console.error('Erro ao analisar tela:', error);
      return {
        description: 'Erro ao analisar tela',
        elements: [],
        suggestions: []
      };
    }
  }

  /**
   * Encontra elemento específico na tela
   */
  async findElement(elementDescription: string): Promise<{
    found: boolean;
    position?: { x: number; y: number };
    confidence: number;
    suggestion?: string;
  }> {
    try {
      const screenshot = await executorService.screenshot();
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);

      const prompt = `Encontre o elemento "${elementDescription}" nesta tela.

Retorne APENAS um JSON válido (sem markdown):
{
  "found": true,
  "position": {"x": 100, "y": 200},
  "confidence": 0.95,
  "suggestion": "descrição de como encontrar o elemento"
}

Se não encontrar, retorne:
{
  "found": false,
  "confidence": 0,
  "suggestion": "elemento não encontrado, tente..."
}`;

      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { found: false, confidence: 0 };
    } catch (error) {
      console.error('Erro ao buscar elemento:', error);
      return { found: false, confidence: 0 };
    }
  }

  /**
   * Compara duas telas para detectar mudanças
   */
  async compareScreens(
    beforeImage: string,
    afterImage: string,
    expectedChange: string
  ): Promise<{
    changed: boolean;
    matchesExpectation: boolean;
    description: string;
  }> {
    try {
      const before = await this.readImageAsBase64(beforeImage);
      const after = await this.readImageAsBase64(afterImage);

      const prompt = `Compare estas duas telas (antes e depois de uma ação).

MUDANÇA ESPERADA: ${expectedChange}

Retorne APENAS um JSON válido:
{
  "changed": true,
  "matchesExpectation": true,
  "description": "descrição das mudanças observadas"
}`;

      const result = await this.visionModel.generateContent([
        prompt,
        { inlineData: { mimeType: 'image/png', data: before } },
        { inlineData: { mimeType: 'image/png', data: after } }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        changed: false,
        matchesExpectation: false,
        description: 'Não foi possível comparar as telas'
      };
    } catch (error) {
      console.error('Erro ao comparar telas:', error);
      return {
        changed: false,
        matchesExpectation: false,
        description: 'Erro ao comparar telas'
      };
    }
  }

  /**
   * Detecta texto na tela (OCR via Gemini)
   */
  async extractText(region?: { x: number; y: number; width: number; height: number }): Promise<string> {
    try {
      const screenshot = await executorService.screenshot(undefined, region ? [region.x, region.y, region.width, region.height] : undefined);
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);

      const prompt = `Extraia TODO o texto visível nesta imagem.
      
Retorne apenas o texto, sem formatação adicional.`;

      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        }
      ]);

      return result.response.text();
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      return '';
    }
  }

  /**
   * Verifica se condição visual foi atendida
   */
  async verifyCondition(condition: string): Promise<{
    verified: boolean;
    confidence: number;
    reason: string;
  }> {
    try {
      const screenshot = await executorService.screenshot();
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);

      const prompt = `Verifique se esta condição foi atendida na tela: "${condition}"

Retorne APENAS um JSON válido:
{
  "verified": true,
  "confidence": 0.95,
  "reason": "explicação do que foi observado"
}`;

      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        verified: false,
        confidence: 0,
        reason: 'Não foi possível verificar a condição'
      };
    } catch (error) {
      console.error('Erro ao verificar condição:', error);
      return {
        verified: false,
        confidence: 0,
        reason: 'Erro ao verificar condição'
      };
    }
  }

  private async readImageAsBase64(filename: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filename);
      return buffer.toString('base64');
    } catch (error) {
      console.error('Erro ao ler imagem:', error);
      throw error;
    }
  }
}

export const visionService = new VisionService();
