
import { Router } from 'express';
import { listAssets, getAssetDetails, triggerLockdown, getManifests } from '../controllers/asset.controller';
import { authenticateProtocol } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de ativos requerem autenticação
router.use(authenticateProtocol);

router.get('/', listAssets);
router.get('/:id', getAssetDetails);
router.post('/:id/lockdown', triggerLockdown);
router.get('/:id/manifest', getManifests);

export default router;
