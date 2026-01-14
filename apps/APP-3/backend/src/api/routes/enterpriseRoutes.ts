/**
 * ============================================
 * ENTERPRISE ROUTES - Rotas Blindadas
 * ============================================
 * 
 * Todas as rotas com rate limiting e proteção
 * Nível: Tech Lead Itaú
 */

import { Router } from 'express';
import { rateLimitMiddleware } from '../middleware/enterpriseMiddleware';
import { protect } from '../middleware/authMiddlewareEnterprise';
import * as authController from '../controllers/authControllerEnterprise';
import * as projectController from '../controllers/projectControllerEnterprise';

const router = Router();

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    },
    requestId: req.requestId
  });
});

// ============================================
// AUTH ROUTES (Rate limited para proteção)
// ============================================
router.post(
  '/auth/register',
  rateLimitMiddleware('auth'),
  authController.register
);

router.post(
  '/auth/login',
  rateLimitMiddleware('auth'),
  authController.login
);

router.post(
  '/auth/refresh',
  rateLimitMiddleware('default'),
  authController.refreshToken
);

router.get(
  '/auth/profile',
  rateLimitMiddleware('default'),
  protect,
  authController.getProfile
);

// ============================================
// PROJECT ROUTES (Protegidas + Rate limited)
// ============================================
router.post(
  '/projects',
  rateLimitMiddleware('default'),
  protect,
  projectController.createProject
);

router.get(
  '/projects',
  rateLimitMiddleware('default'),
  protect,
  projectController.listProjects
);

router.get(
  '/projects/:id',
  rateLimitMiddleware('default'),
  protect,
  projectController.getProject
);

router.put(
  '/projects/:id',
  rateLimitMiddleware('default'),
  protect,
  projectController.updateProject
);

router.delete(
  '/projects/:id',
  rateLimitMiddleware('sensitive'),
  protect,
  projectController.deleteProject
);

export default router;
