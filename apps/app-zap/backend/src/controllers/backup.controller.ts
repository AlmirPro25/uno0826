/**
 * 💾 BACKUP CONTROLLER
 * Endpoints para backup e restore do sistema.
 */

import { Router, Request, Response } from 'express';
import { BackupService } from '../services/backup.service';

const router = Router();
const backupService = new BackupService();

/**
 * GET /backup/list
 * Lista todos os backups disponíveis
 */
router.get('/list', async (req: Request, res: Response) => {
    try {
        const backups = backupService.listBackups();
        const stats = backupService.getStats();

        res.json({
            success: true,
            stats,
            backups
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /backup/create
 * Cria um novo backup
 */
router.post('/create', async (req: Request, res: Response) => {
    try {
        const result = await backupService.createBackup();

        res.json({
            success: result.success,
            backup: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /backup/restore/:filename
 * Restaura um backup
 */
router.post('/restore/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const result = await backupService.restoreBackup(filename);

        res.json({
            success: result.success,
            restored: result.restored,
            error: result.error
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * DELETE /backup/:filename
 * Deleta um backup específico
 */
router.delete('/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const deleted = backupService.deleteBackup(filename);

        res.json({
            success: deleted,
            filename
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * POST /backup/export/contact/:contactId
 * Exporta conversas de um contato
 */
router.post('/export/contact/:contactId', async (req: Request, res: Response) => {
    try {
        const { contactId } = req.params;
        const filename = await backupService.exportContactConversation(contactId);

        res.json({
            success: true,
            filename
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /backup/config
 * Obtém configuração de backup
 */
router.get('/config', async (req: Request, res: Response) => {
    try {
        const config = backupService.getConfig();

        res.json({
            success: true,
            config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * PUT /backup/config
 * Atualiza configuração de backup
 */
router.put('/config', async (req: Request, res: Response) => {
    try {
        const config = req.body;
        backupService.configure(config);

        res.json({
            success: true,
            config: backupService.getConfig()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

/**
 * GET /backup/stats
 * Estatísticas do sistema de backup
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = backupService.getStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});

export default router;
