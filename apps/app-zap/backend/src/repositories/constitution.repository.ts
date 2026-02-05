import { prisma } from '../database/prisma';
import { Constitution } from '@prisma/client';

export class ConstitutionRepository {

    async getActiveConstitution(): Promise<Constitution | null> {
        return prisma.constitution.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' } // Get the most recent active one
        });
    }

    async create(data: any): Promise<Constitution> {
        return prisma.constitution.create({
            data: {
                ...data,
            }
        });
    }
}
