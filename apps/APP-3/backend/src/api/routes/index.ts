import { Router } from 'express';
import authRoutes from './authRoutes';
import projectFilesRoutes from './projectFilesRoutes'; // Nova rota de projetos no HD
import logRoutes from './logRoutes';
import imageRoutes from './imageRoutes';
import advancedTerminalRoutes from './advancedTerminalRoutes'; // Terminal avançado
import researchRoutes from './researchRoutes';
import kiroToolsRoutes from './kiroToolsRoutes';
import factoryRoutes from './factoryRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth', authRoutes);
router.use('/projects', projectFilesRoutes); // Projetos salvos no HD (sem auth em dev)
router.use('/logs', logRoutes);
router.use('/images', imageRoutes);
router.use('/terminal', advancedTerminalRoutes);
router.use('/research', researchRoutes);
router.use('/kiro', kiroToolsRoutes);
router.use('/factory', factoryRoutes);

export default router;
