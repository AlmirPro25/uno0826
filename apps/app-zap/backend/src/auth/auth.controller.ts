import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { LogRepository } from '../repositories/log.repository';

const loginSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const logRepo = new LogRepository();

export class AuthController {
    static async login(req: Request, res: Response) {
        const parseResult = loginSchema.safeParse(req.body);

        if (!parseResult.success) {
            await logRepo.create('WARN', 'AUTH_LOGIN_FAILED_VALIDATION', JSON.stringify(parseResult.error.flatten()));
            return res.status(400).json({ message: 'Invalid credentials format', errors: parseResult.error.flatten() });
        }

        const { username, password } = parseResult.data;

        if (AuthService.validateUser(username, password)) {
            const token = AuthService.generateToken(username);
            await logRepo.create('INFO', 'AUTH_SUCCESS', `User ${username} logged in successfully.`);
            return res.json({ token });
        } else {
            await logRepo.create('WARN', 'AUTH_FAILED', `Attempted login for ${username} failed with invalid credentials.`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }
    }
}
