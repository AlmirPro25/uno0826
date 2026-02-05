
import { prisma } from '../prisma';

export class AssetService {
  
  static async getAllAssets() {
    return prisma.asset.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { logs: true }
        }
      }
    });
  }

  static async getAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        manifests: true
      }
    });
  }

  static async initiateLockdown(id: string) {
    // TRANSAÇÃO ATÔMICA
    // 1. Bloqueia o ativo
    // 2. Gera log de segurança CRÍTICO
    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: {
          status: 'LOCKED_DOWN',
          isLocked: true,
          threatLevel: 'CRITICAL'
        }
      });

      await tx.securityLog.create({
        data: {
          assetId: id,
          level: 'CRITICAL',
          message: `REMOTE LOCKDOWN INITIATED BY COMMAND. PROTOCOL 0X99.`
        }
      });

      return asset;
    });
  }

  static async getAssetManifest(id: string) {
    const manifests = await prisma.manifest.findMany({
      where: { assetId: id }
    });
    
    // Decriptação simulada
    return manifests.map(m => ({
      ...m,
      content: `[DECRYPTED] ${m.content}`
    }));
  }
}
