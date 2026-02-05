import { Router } from 'express';
import { FactoryController } from '../controllers/FactoryController';

const router = Router();

// Rota POST /api/factory/generate
router.post('/generate', FactoryController.genterateApp);

export default router;
