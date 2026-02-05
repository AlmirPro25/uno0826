
import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const totalAssets = await prisma.asset.count();
    const criticalAssets = await prisma.asset.count({
      where: { threatLevel: { in: ['HIGH', 'CRITICAL'] } }
    });

    let globalThreat = 'LOW';
    if (criticalAssets > 0) globalThreat = 'ELEVATED';
    if (criticalAssets > 2) globalThreat = 'CRITICAL';

    res.json({
      threat_level: globalThreat,
      active_assets: totalAssets,
      system_integrity: 100.0,
      server_time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "SYSTEM_FAILURE" });
  }
};
