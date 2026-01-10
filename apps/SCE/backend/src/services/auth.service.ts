
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sce-master-secret';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class AuthService {
  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user) throw new Error('Credenciais inválidas.');

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) throw new Error('Credenciais inválidas.');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { 
      token, 
      refreshToken, 
      user: { id: user.id, email: user.email, role: user.role } 
    };
  }

  async setupInitialAdmin() {
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123456', 12);
      await prisma.user.create({
        data: {
          email: 'admin@sce.local',
          passwordHash,
          role: 'ADMIN'
        }
      });
      console.log('🛡️ ADMIN INICIAL CRIADO: admin@sce.local / admin123456');
    }
  }
}
