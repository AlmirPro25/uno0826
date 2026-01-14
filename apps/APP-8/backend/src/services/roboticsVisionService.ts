/**
 * 🤖 Robotics Vision Service
 * Usa Gemini Robotics ER 1.5 para detecção avançada de objetos
 * Baseado no sistema de visão robótica do Google
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { executorService } from './executorService.js';
import * as fs from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface BoundingBox2D {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Point {
  x: number;
  y: number;
  label: string;
}

interface SegmentationMask {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  imageData: any;
}

type DetectType = '2D bounding boxes' | 'Segmentation masks' | 'Points';

export class RoboticsVisionService {
  private roboticsModel = genAI.getGenerativeModel({ 
    model: 'gemini-robotics-er-1.5-preview'
  });

  /**
   * Detecta objetos na tela com bounding boxes 2D
   */
  async detect2DBoundingBoxes(
    targetItems: string,
    maxItems: number = 20,
    enableThinking: boolean = false
  ): Promise<BoundingBox2D[]> {
    try {
      console.log(`🤖 Detectando "${targetItems}" com Robotics Vision...`);
      
      // Captura screenshot
      const screenshot = await executorService.screenshot();
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);

      const prompt = `Detect ${targetItems}, with no more than ${maxItems} items. Output a json list where each entry contains the 2D bounding box in "box_2d" and a text label in "label".`;

      const generationConfig: any = {
        temperature: 0.4,
        responseMimeType: 'application/json',
      };

      if (!enableThinking) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const result = await this.roboticsModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig
      });

      let response = result.response.text();
      
      // Remove markdown se houver
      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0];
      }

      const parsed = JSON.parse(response);

      // Converte coordenadas normalizadas (0-1000) para proporções (0-1)
      const boxes: BoundingBox2D[] = parsed.map((box: any) => {
        const [ymin, xmin, ymax, xmax] = box.box_2d;
        return {
          x: xmin / 1000,
          y: ymin / 1000,
          width: (xmax - xmin) / 1000,
          height: (ymax - ymin) / 1000,
          label: box.label,
        };
      });

      console.log(`✅ Detectados ${boxes.length} objetos: ${boxes.map(b => b.label).join(', ')}`);
      
      return boxes;
    } catch (error) {
      console.error('❌ Erro ao detectar objetos 2D:', error);
      return [];
    }
  }

  /**
   * Detecta pontos específicos em objetos
   */
  async detectPoints(
    targetItems: string,
    maxItems: number = 20,
    enableThinking: boolean = false
  ): Promise<Point[]> {
    try {
      console.log(`📍 Detectando pontos em "${targetItems}"...`);
      
      const screenshot = await executorService.screenshot();
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);

      const prompt = `Return the locations of ${targetItems}. Output a json list where each entry contains the point location in "point" and a text label in "label".`;

      const generationConfig: any = {
        temperature: 0.4,
        responseMimeType: 'application/json',
      };

      if (!enableThinking) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const result = await this.roboticsModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig
      });

      let response = result.response.text();
      
      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0];
      }

      const parsed = JSON.parse(response);

      const points: Point[] = parsed.map((point: any) => {
        return {
          x: point.point[1] / 1000,
          y: point.point[0] / 1000,
          label: point.label,
        };
      });

      console.log(`✅ Detectados ${points.length} pontos`);
      
      return points;
    } catch (error) {
      console.error('❌ Erro ao detectar pontos:', error);
      return [];
    }
  }

  /**
   * Detecta objetos com máscaras de segmentação
   */
  async detectSegmentationMasks(
    targetItems: string,
    maxItems: number = 20,
    enableThinking: boolean = false
  ): Promise<SegmentationMask[]> {
    try {
      console.log(`🎨 Detectando máscaras de segmentação para "${targetItems}"...`);
      
      const screenshot = await executorService.screenshot();
      const imageBase64 = await this.readImageAsBase64(screenshot.filename);

      const prompt = `Segment ${targetItems}. Output a json list where each entry contains the 2D bounding box in "box_2d", a text label in "label", and a segmentation mask in "mask".`;

      const generationConfig: any = {
        temperature: 0.4,
        responseMimeType: 'application/json',
      };

      if (!enableThinking) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const result = await this.roboticsModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig
      });

      let response = result.response.text();
      
      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0];
      }

      const parsed = JSON.parse(response);

      const masks: SegmentationMask[] = parsed.map((box: any) => {
        const [ymin, xmin, ymax, xmax] = box.box_2d;
        return {
          x: xmin / 1000,
          y: ymin / 1000,
          width: (xmax - xmin) / 1000,
          height: (ymax - ymin) / 1000,
          label: box.label,
          imageData: box.mask,
        };
      });

      console.log(`✅ Detectadas ${masks.length} máscaras de segmentação`);
      
      return masks;
    } catch (error) {
      console.error('❌ Erro ao detectar máscaras:', error);
      return [];
    }
  }

  /**
   * Encontra e clica em um objeto específico
   */
  async findAndClick(
    targetItem: string,
    detectType: DetectType = '2D bounding boxes',
    enableThinking: boolean = false
  ): Promise<{
    success: boolean;
    found: boolean;
    clicked?: { x: number; y: number };
    label?: string;
  }> {
    try {
      console.log(`🎯 Procurando e clicando em "${targetItem}"...`);

      let found = false;
      let clickX = 0;
      let clickY = 0;
      let label = '';

      if (detectType === '2D bounding boxes') {
        const boxes = await this.detect2DBoundingBoxes(targetItem, 5, enableThinking);
        
        if (boxes.length > 0) {
          const box = boxes[0];
          found = true;
          label = box.label;
          
          // Clica no centro do bounding box
          clickX = box.x + box.width / 2;
          clickY = box.y + box.height / 2;
        }
      } else if (detectType === 'Points') {
        const points = await this.detectPoints(targetItem, 5, enableThinking);
        
        if (points.length > 0) {
          const point = points[0];
          found = true;
          label = point.label;
          clickX = point.x;
          clickY = point.y;
        }
      }

      if (!found) {
        console.log(`❌ "${targetItem}" não encontrado`);
        return { success: false, found: false };
      }

      // Obtém dimensões da tela
      const screenInfo = await executorService.getScreenInfo();
      const screenWidth = screenInfo.screen.width;
      const screenHeight = screenInfo.screen.height;

      // Converte coordenadas proporcionais para pixels
      const pixelX = Math.round(clickX * screenWidth);
      const pixelY = Math.round(clickY * screenHeight);

      console.log(`🖱️  Clicando em (${pixelX}, ${pixelY}) - ${label}`);

      // Clica
      await executorService.click('left', pixelX, pixelY);

      return {
        success: true,
        found: true,
        clicked: { x: pixelX, y: pixelY },
        label
      };
    } catch (error) {
      console.error('❌ Erro ao encontrar e clicar:', error);
      return { success: false, found: false };
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

export const roboticsVisionService = new RoboticsVisionService();
