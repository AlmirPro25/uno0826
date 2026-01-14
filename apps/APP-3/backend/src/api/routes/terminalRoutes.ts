// backend/src/api/routes/terminalRoutes.ts
// 🔧 Rotas de Terminal

import { Router, Request, Response, NextFunction } from 'express';
import {
  executeCommand,
  writeFiles,
  readFile,
  listFiles,
  healthCheck
} from '../controllers/terminalController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Middleware de autenticação com bypass para desenvolvimento
const devAuth = (req: Request, res: Response, next: NextFunction) => {
  // Em desenvolvimento, permite acesso sem token
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  // Em produção, usa autenticação normal
  return protect(req, res, next);
};

// Todas as rotas de terminal usam devAuth
router.use(devAuth);

// POST /api/terminal/execute - Executa comando
router.post('/execute', executeCommand);

// POST /api/terminal/write-files - Escreve arquivos no disco
router.post('/write-files', writeFiles);

// GET /api/terminal/read-file - Lê arquivo do disco
router.get('/read-file', readFile);

// GET /api/terminal/list-files - Lista arquivos do diretório
router.get('/list-files', listFiles);

// GET /api/terminal/health - Health check
router.get('/health', healthCheck);

export default router;
