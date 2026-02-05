import { Request, Response } from 'express';
import { whatsappService } from '../server'; // Access singleton
import { LogRepository } from '../repositories/log.repository';
import { WAState } from 'whatsapp-web.js'; // Import WAState for better typing

const logRepo = new LogRepository();

export class SystemController {
  static async getStatus(req: Request, res: Response) {
    try {
      const status = await whatsappService.getClientStatus();
      res.json(status);
    } catch (e) {
      console.error('Error retrieving WhatsApp client status:', e);
      // More robust error handling: differentiate between client not initialized vs. other errors
      res.status(500).json({ status: WAState.UNLAUNCHED, message: 'Failed to retrieve client status or client not initialized.' });
    }
  }

  // NEW: Get system logs
  static async getLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await logRepo.getRecentLogs(limit);
      res.json(logs);
    } catch (e) {
      console.error('Error retrieving system logs:', e);
      res.status(500).json({ message: 'Failed to retrieve logs' });
    }
  }

  // NEW: Health check endpoint
  static async getHealth(req: Request, res: Response) {
    try {
      const uptime = process.uptime(); // Node.js process uptime in seconds
      const whatsappStatus = await whatsappService.getClientStatus();

      res.json({
        status: 'OK',
        uptime: Math.floor(uptime), // in seconds
        whatsapp_status: whatsappStatus.status,
        message: 'Ghost Protocol services are operational'
      });
    } catch (e) {
      console.error('Error during health check:', e);
      res.status(500).json({
        status: 'DEGRADED',
        message: 'Backend operational, but WhatsApp client status could not be retrieved.',
        error: (e as Error).message
      });
    }
  }
}
