
import { prisma } from '../database/prisma';

export interface CreateMessageOptions {
  contactId: string;
  fromMe: boolean;
  body: string;
  isOperator?: boolean;  // 🆕 TRUE = Human operator, FALSE = AI
  mediaType?: string;    // TEXT, IMAGE, AUDIO, VIDEO
  intent?: string;       // Cognitive intent
  emotion?: string;      // Detected emotion
}

export class MessageRepository {
  async create(contactId: string, fromMe: boolean, body: string, isOperator: boolean = false) {
    // 🆕 Analyze message metadata
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
    const hasEmoji = emojiRegex.test(body);
    const tokenCount = Math.ceil(body.length / 4); // Rough token estimate

    return prisma.message.create({
      data: {
        contactId,
        fromMe,
        body,
        isOperator,
        wordCount,
        hasEmoji,
        tokenCount,
        mediaType: 'TEXT',
        timestamp: new Date()
      }
    });
  }

  // 🆕 Create with full options
  async createWithMetadata(options: CreateMessageOptions) {
    const { body } = options;
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
    const hasEmoji = emojiRegex.test(body);
    const tokenCount = Math.ceil(body.length / 4);

    return prisma.message.create({
      data: {
        contactId: options.contactId,
        fromMe: options.fromMe,
        body: options.body,
        isOperator: options.isOperator ?? false,
        wordCount,
        hasEmoji,
        tokenCount,
        mediaType: options.mediaType ?? 'TEXT',
        intent: options.intent,
        emotion: options.emotion,
        timestamp: new Date()
      }
    });
  }

  async getHistory(contactId: string, limit: number = 100) {
    const messages = await prisma.message.findMany({
      where: { contactId },
      take: limit,
      orderBy: { timestamp: 'desc' } // Get LATEST messages
    });
    return messages.reverse(); // Return in chronological order
  }

  // 🆕 Get operator-only messages for style extraction
  async getOperatorMessages(limit: number = 200) {
    return prisma.message.findMany({
      where: {
        fromMe: true,
        isOperator: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // 🆕 Get messages in date range
  async getMessagesInRange(startDate: Date, endDate: Date) {
    return prisma.message.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { contact: true },
      orderBy: { timestamp: 'asc' }
    });
  }
}

