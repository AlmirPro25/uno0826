import { Router } from 'express';
import { register, login, getProfile, googleLogin } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../validators/authValidators';
import { handleValidationErrors } from '../middleware/validationMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', validateRegistration, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/google', googleLogin); // New route for Google Sign-In
router.get('/profile', protect, getProfile);

export default router;