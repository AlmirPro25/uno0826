
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'CYDONIA-OMEGA-PROTOCOL-KEY-2084';

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyClearance = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'ACCESS DENIED', 
      message: 'Missing Neural Link Credentials' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      error: 'INVALID TOKEN', 
      message: 'Security Clearance Revoked' 
    });
  }
};
