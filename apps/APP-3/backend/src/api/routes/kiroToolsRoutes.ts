// backend/src/api/routes/kiroToolsRoutes.ts
// 🚀 KIRO TOOLS ROUTES - Rotas das ferramentas de agente de código

import { Router, Request, Response, NextFunction } from 'express';
import {
  grepSearch,
  readMultipleFiles,
  strReplace,
  listDirectoryRecursive,
  fileAppend,
  fileDelete,
  fileSearch,
  getDiagnostics
} from '../controllers/kiroToolsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Middleware de autenticação flexível para desenvolvimento
const devAuth = (req: Request, res: Response, next: NextFunction) => {
  // Em desenvolvimento, permite acesso sem token
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  // Em produção, usa autenticação normal
  return protect(req, res, next);
};

router.use(devAuth);

// 🔍 POST /api/kiro/search - Busca texto em arquivos (grep)
router.post('/search', grepSearch);

// 📚 POST /api/kiro/read-multiple - Lê múltiplos arquivos
router.post('/read-multiple', readMultipleFiles);

// 🔄 POST /api/kiro/replace - Substitui texto em arquivo
router.post('/replace', strReplace);

// 📁 GET /api/kiro/list-recursive - Lista diretório com profundidade
router.get('/list-recursive', listDirectoryRecursive);

// ➕ POST /api/kiro/append - Adiciona conteúdo ao final do arquivo
router.post('/append', fileAppend);

// 🗑️ DELETE /api/kiro/delete - Deleta arquivo
router.delete('/delete', fileDelete);

// 🔎 GET /api/kiro/file-search - Busca arquivos por nome
router.get('/file-search', fileSearch);

// 📊 POST /api/kiro/diagnostics - Obtém diagnósticos de código
router.post('/diagnostics', getDiagnostics);

export default router;
