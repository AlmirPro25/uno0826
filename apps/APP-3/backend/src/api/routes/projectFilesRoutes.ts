/**
 * ============================================
 * PROJECT FILES ROUTES
 * ============================================
 * 
 * Rotas para gerenciar projetos no HD local
 * Funciona sem autenticação em modo dev
 */

import { Router } from 'express';
import {
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    installProject,
    openProjectFolder
} from '../controllers/projectFilesController';

const router = Router();

// Listar todos os projetos
router.get('/', listProjects);

// Obter projeto específico
router.get('/:id', getProject);

// Criar novo projeto
router.post('/', createProject);

// Atualizar projeto
router.put('/:id', updateProject);

// Deletar projeto
router.delete('/:id', deleteProject);

// Instalar projeto como app
router.post('/:id/install', installProject);

// Abrir pasta no explorador
router.post('/:id/open', openProjectFolder);

export default router;
