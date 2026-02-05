import { prisma } from '../database/prisma';
import { Contact } from '@prisma/client';

// Define status locally as types since SQLite schema uses String
type DirectiveStatusType = 'IDLE' | 'EXECUTING' | 'COMPLETED';


export class ContactRepository {
  async upsert(id: string, data: Partial<Contact>) {
    return prisma.contact.upsert({
      where: { id },
      update: {
        ...data,
        lastInteraction: new Date()
      },
      create: {
        id,
        name: data.name,
        pushName: data.pushName,
        profilePicUrl: data.profilePicUrl,
        avgResponseTime: 60, // Default average response time
        isPaused: false, // Default to not paused
        directiveStatus: 'IDLE', // Default directive status
        ...data
      },
    });
  }

  async findById(id: string) {
    return prisma.contact.findUnique({ where: { id } });
  }

  async getAll() {
    return prisma.contact.findMany({
      orderBy: { lastInteraction: 'desc' }
    });
  }

  async updateDirective(id: string, directive: string) {
    return prisma.contact.update({
      where: { id },
      data: {
        activeDirective: directive,
        directiveStatus: 'EXECUTING'
      }
    });
  }

  async setPauseStatus(id: string, isPaused: boolean) {
    return prisma.contact.update({
      where: { id },
      data: { isPaused }
    });
  }

  // NEW: Method to update just the directive status
  async updateDirectiveStatus(id: string, status: string) {
    return prisma.contact.update({
      where: { id },
      data: { directiveStatus: status }
    });
  }

  // NEW: Generic update method
  async update(id: string, data: Partial<Contact>) {
    return prisma.contact.update({
      where: { id },
      data
    });
  }
}
