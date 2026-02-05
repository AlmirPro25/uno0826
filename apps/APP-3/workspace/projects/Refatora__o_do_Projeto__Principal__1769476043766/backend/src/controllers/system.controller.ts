
import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';
import { logger, Severity, Origin } from '../utils/logger';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.systemLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'MEMORY CORRUPTION' });
  }
};

// Internal Auth Generator for the Architect
export const linkNeuralInterface = async (req: Request, res: Response) => {
  const { access_code } = req.body;
  
  // Hardcoded check for simulation purposes (in production, check against DB hash)
  if (access_code === 'CYDONIA-2084') {
    const token = jwt.sign({ role: 'OVERSEER' }, process.env.JWT_SECRET || 'CYDONIA-OMEGA-PROTOCOL-KEY-2084', { expiresIn: '12h' });
    
    await logger.log(Severity.INFO, Origin.SYSTEM, 'Executive Login Verified');
    return res.json({ token, type: 'Bearer' });
  }
  
  res.status(401).json({ error: 'BIOMETRIC MISMATCH' });
};
