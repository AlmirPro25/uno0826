/**
 * 🤖 Rotas de Visão Robótica
 * API para detecção avançada de objetos usando Gemini Robotics
 */

import express from 'express';
import { roboticsVisionService } from '../services/roboticsVisionService.js';

const router = express.Router();

/**
 * POST /api/robotics/detect-2d
 * Detecta objetos com bounding boxes 2D
 */
router.post('/detect-2d', async (req, res) => {
  try {
    const { targetItems, maxItems = 20, enableThinking = false } = req.body;

    if (!targetItems) {
      return res.status(400).json({ error: 'targetItems é obrigatório' });
    }

    const boxes = await roboticsVisionService.detect2DBoundingBoxes(
      targetItems,
      maxItems,
      enableThinking
    );

    res.json({
      success: true,
      count: boxes.length,
      boxes
    });
  } catch (error: any) {
    console.error('Erro ao detectar objetos 2D:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/robotics/detect-points
 * Detecta pontos específicos em objetos
 */
router.post('/detect-points', async (req, res) => {
  try {
    const { targetItems, maxItems = 20, enableThinking = false } = req.body;

    if (!targetItems) {
      return res.status(400).json({ error: 'targetItems é obrigatório' });
    }

    const points = await roboticsVisionService.detectPoints(
      targetItems,
      maxItems,
      enableThinking
    );

    res.json({
      success: true,
      count: points.length,
      points
    });
  } catch (error: any) {
    console.error('Erro ao detectar pontos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/robotics/detect-masks
 * Detecta objetos com máscaras de segmentação
 */
router.post('/detect-masks', async (req, res) => {
  try {
    const { targetItems, maxItems = 20, enableThinking = false } = req.body;

    if (!targetItems) {
      return res.status(400).json({ error: 'targetItems é obrigatório' });
    }

    const masks = await roboticsVisionService.detectSegmentationMasks(
      targetItems,
      maxItems,
      enableThinking
    );

    res.json({
      success: true,
      count: masks.length,
      masks
    });
  } catch (error: any) {
    console.error('Erro ao detectar máscaras:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/robotics/find-and-click
 * Encontra um objeto e clica nele
 */
router.post('/find-and-click', async (req, res) => {
  try {
    const { 
      targetItem, 
      detectType = '2D bounding boxes',
      enableThinking = false 
    } = req.body;

    if (!targetItem) {
      return res.status(400).json({ error: 'targetItem é obrigatório' });
    }

    const result = await roboticsVisionService.findAndClick(
      targetItem,
      detectType,
      enableThinking
    );

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao encontrar e clicar:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
