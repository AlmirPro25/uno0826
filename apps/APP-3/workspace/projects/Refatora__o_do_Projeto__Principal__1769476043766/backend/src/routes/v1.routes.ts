
import { Router } from 'express';
import { getTelemetry } from '../controllers/telemetry.controller';
import { modulateSystem, triggerFailSafe } from '../controllers/command.controller';
import { getAuditLogs, linkNeuralInterface } from '../controllers/system.controller';
import { verifyClearance } from '../middleware/auth.middleware';

const router = Router();

// Public / Sensor Routes
router.get('/telemetry', getTelemetry);

// Authentication
router.post('/auth/link', linkNeuralInterface);

// Protected Executive Routes
router.post('/modulate', verifyClearance, modulateSystem);
router.post('/emergency/fail-safe', verifyClearance, triggerFailSafe);
router.get('/logs/audit', verifyClearance, getAuditLogs);

export default router;
