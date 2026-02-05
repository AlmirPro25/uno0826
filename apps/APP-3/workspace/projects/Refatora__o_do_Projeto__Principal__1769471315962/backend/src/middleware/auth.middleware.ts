
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'TITAN_SUPER_SECRET_KEY_V1';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateVIP = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Access Denied: No credentials provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Access Denied: Invalid Security Clearance.' });
  }
};
