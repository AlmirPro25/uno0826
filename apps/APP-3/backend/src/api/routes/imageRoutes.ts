import { Router } from 'express';
import { 
  processHtmlAndGenerateImages, 
  serveGeneratedImage, 
  generatePlaceholder,
  cleanupOldImages 
} from '../controllers/imageController';

const router = Router();

/**
 * POST /api/images/process
 * Processa HTML e gera imagens automaticamente
 */
router.post('/process', processHtmlAndGenerateImages);

/**
 * GET /api/images/generated/:filename
 * Serve imagens geradas
 */
router.get('/generated/:filename', serveGeneratedImage);

/**
 * GET /api/images/placeholder
 * Gera placeholder dinâmico
 */
router.get('/placeholder', generatePlaceholder);

/**
 * DELETE /api/images/cleanup
 * Remove imagens antigas (24h+)
 */
router.delete('/cleanup', cleanupOldImages);

export default router;