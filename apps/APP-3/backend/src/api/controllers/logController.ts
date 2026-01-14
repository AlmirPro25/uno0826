
import { Request, Response, NextFunction } from 'express';
import InteractionLog from '../models/InteractionLog';

// POST /api/logs
export const createLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logData = { ...req.body, userId: req.user!.id };
    const newLog = await (InteractionLog as any).create(logData);
    res.status(201).json(newLog);
  } catch (error) {
    next(error);
  }
};