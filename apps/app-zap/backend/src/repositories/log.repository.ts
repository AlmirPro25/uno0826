import { prisma } from '../database/prisma';
import { SystemLog } from '@prisma/client';

export class LogRepository {
  async create(level: SystemLog['level'], event: string, details: string, contactId?: string) {
    return prisma.systemLog.create({
      data: {
        level,
        event,
        details,
        contactId
      }
    });
  }

  // NEW: Method to get recent logs
  async getRecentLogs(limit: number = 50) {
    return prisma.systemLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
}
