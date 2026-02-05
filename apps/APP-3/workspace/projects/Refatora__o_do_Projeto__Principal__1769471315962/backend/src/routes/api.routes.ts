
import { Router } from 'express';
import { loginController } from '../controllers/auth.controller';
import { getFleet, getAssetDetails } from '../controllers/asset.controller';
import { requestBooking } from '../controllers/booking.controller';
import { authenticateVIP } from '../middleware/auth.middleware';

const router = Router();

// Public Routes (Command Center Read-Only)
router.post('/auth/login', loginController);
router.get('/assets', getFleet);
router.get('/assets/:id', getAssetDetails);

// Protected Routes (High Clearance)
router.post('/bookings', authenticateVIP, requestBooking);

export default router;
