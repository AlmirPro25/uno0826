import { Router } from 'express';
import multer from 'multer';
import { captureService } from '../services/captureService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload de imagem
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    
    const { sessionId, messageId, context } = req.body;
    
    const result = await captureService.saveCapture(
      req.file.buffer,
      sessionId ? Number(sessionId) : undefined,
      messageId ? Number(messageId) : undefined,
      context
    );
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar captura
router.get('/:captureId', (req, res) => {
  try {
    const { captureId } = req.params;
    const includeFull = req.query.full === 'true';
    
    const capture = captureService.getCapture(Number(captureId), includeFull);
    
    if (!capture) {
      return res.status(404).json({ error: 'Captura não encontrada' });
    }
    
    res.json(capture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar capturas por sessão
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const captures = captureService.getCapturesBySession(Number(sessionId));
    res.json(captures);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar por tags
router.post('/search', (req, res) => {
  try {
    const { tags } = req.body;
    const captures = captureService.searchCapturesByTags(tags);
    res.json(captures);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar captura
router.delete('/:captureId', (req, res) => {
  try {
    const { captureId } = req.params;
    captureService.deleteCapture(Number(captureId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
