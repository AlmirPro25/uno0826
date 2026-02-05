import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export class AuthService {
    private static readonly JWT_SECRET = env.JWT_SECRET;
    private static readonly TOKEN_EXPIRATION = '1d'; // 1 day

    static generateToken(userId: string): string {
        return jwt.sign({ userId }, AuthService.JWT_SECRET, { expiresIn: AuthService.TOKEN_EXPIRATION });
    }

    static verifyToken(token: string): { userId: string, iat: number, exp: number } | null {
        try {
            return jwt.verify(token, AuthService.JWT_SECRET) as { userId: string, iat: number, exp: number };
        } catch (error) {
            return null;
        }
    }

    static validateUser(username: string, password_hash: string): boolean {
        // In a real application, you would hash the password and compare it with a stored hash from a database.
        // For this example, we use direct comparison with environment variables.
        // Ensure you change ADMIN_USERNAME and ADMIN_PASSWORD in .env.example and your production environment.
        return username === env.ADMIN_USERNAME && password_hash === env.ADMIN_PASSWORD;
    }
}
