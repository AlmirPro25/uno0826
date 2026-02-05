
import { Request, Response } from 'express';
import { ContactRepository } from '../repositories/contact.repository';
import { MessageRepository } from '../repositories/message.repository';
import { z } from 'zod';
import { getWhatsAppService } from '../services/whatsapp.service';

const contactRepo = new ContactRepository();
const messageRepo = new MessageRepository();

export class ContactController {

  static async list(req: Request, res: Response) {
    const contacts = await contactRepo.getAll();
    res.json({ contacts });
  }

  static async getHistory(req: Request, res: Response) {
    const { phone } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await messageRepo.getHistory(phone, limit);
    res.json({ messages: history });
  }

  static async control(req: Request, res: Response) {
    const { phone } = req.params;
    const schema = z.object({
      action: z.enum(['PAUSE', 'RESUME'])
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const isPaused = result.data.action === 'PAUSE';
    const updated = await contactRepo.setPauseStatus(phone, isPaused);

    res.json(updated);
  }

  static async injectDirective(req: Request, res: Response) {
    const { phone } = req.params;
    const schema = z.object({
      instruction: z.string().min(3),
      urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const updated = await contactRepo.updateDirective(phone, result.data.instruction);
    res.json(updated);
  }

  static async sendMessage(req: Request, res: Response) {
    const { phone } = req.params;
    const schema = z.object({
      message: z.string().min(1)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const { message } = result.data;

    try {
      const whatsapp = getWhatsAppService();
      await whatsapp.sendMessage(phone, message);

      // Note: The message_create event in WhatsAppService will handle saving to DB

      res.json({ success: true, message: 'Message sent' });
    } catch (error) {
      console.error('Failed to send message:', error);
      res.status(500).json({ error: (error as Error).message || 'Failed to send message' });
    }
  }
}
