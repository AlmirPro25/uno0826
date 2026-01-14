/**
 * ============================================
 * 🚀 ADVANCED TERMINAL ROUTES
 * ============================================
 * 
 * Rotas avançadas para o terminal profissional
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  executeCommandAdvanced,
  startBackgroundProcess,
  stopBackgroundProcess,
  getProcessOutput,
  listBackgroundProcesses
} from '../controllers/advancedTerminalController';
import {
  executeCommand,
  writeFiles,
  readFile,
  listFiles,
  healthCheck
} from '../controllers/terminalController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Middleware de autenticação flexível
const devAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return protect(req, res, next);
};

router.use(devAuth);

// ============================================
// EXECUÇÃO DE COMANDOS
// ============================================

// POST /api/terminal/execute - Executa comando (compatível com versão anterior)
router.post('/execute', executeCommandAdvanced);

// ============================================
// GERENCIAMENTO DE PROCESSOS
// ============================================

// POST /api/terminal/start-process - Inicia processo em background
router.post('/start-process', startBackgroundProcess);

// POST /api/terminal/stop-process - Para processo
router.post('/stop-process', stopBackgroundProcess);

// GET /api/terminal/process-output - Output de processo
router.get('/process-output', getProcessOutput);

// GET /api/terminal/processes - Lista processos
router.get('/processes', listBackgroundProcesses);

// ============================================
// OPERAÇÕES DE ARQUIVO (mantidas)
// ============================================

// POST /api/terminal/write-files - Escreve arquivos
router.post('/write-files', writeFiles);

// GET /api/terminal/read-file - Lê arquivo
router.get('/read-file', readFile);

// GET /api/terminal/list-files - Lista arquivos
router.get('/list-files', listFiles);

// GET /api/terminal/health - Health check
router.get('/health', healthCheck);

export default router;
