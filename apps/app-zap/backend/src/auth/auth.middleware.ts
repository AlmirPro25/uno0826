import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LogRepository } from '../repositories/log.repository';
import { WebSocketEvent } from '../models/types'; // Import to use type

const logRepo = new LogRepository();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const details = 'Missing or malformed Authorization header';
        await logRepo.create('WARN', 'AUTH_DENIED', details);
        return res.status(401).json({ message: details });
    }

    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);

    if (!payload) {
        const details = 'Invalid or expired token';
        await logRepo.create('WARN', 'AUTH_DENIED', details);
        return res.status(403).json({ message: details });
    }

    req.userId = payload.userId; // Attach user ID to request for further use
    next();
};
