import { Router } from 'express';
import { createLog } from '../controllers/logController';
import { validateLogCreation } from '../validators/logValidators';
import { handleValidationErrors } from '../middleware/validationMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', validateLogCreation, handleValidationErrors, createLog);

export default router;
