
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticateProtocol = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      error: "ACCESS_DENIED", 
      message: "No tactical clearance token provided." 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      error: "INTEGRITY_FAILURE", 
      message: "Token invalidated or expired." 
    });
  }
};
