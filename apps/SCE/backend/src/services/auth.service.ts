
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { kernel } from '../lib/kernel-client.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sce-master-secret';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export class AuthService {
  /**
   * Registra novo usuário no SCE + cria App isolado no Kernel
   */
  async register(data: z.infer<typeof registerSchema>) {
    // 1. Verificar se email já existe
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email já cadastrado.');

    // 2. Criar hash da senha
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 3. Criar usuário no SCE
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'USER'
      }
    });

    // 4. Tentar criar identidade e App no Kernel (opcional - não bloqueia cadastro)
    try {
      // Criar identidade no Kernel
      const kernelUser = await kernel.createIdentity(data.email, data.name, data.password);
      
      if (kernelUser) {
        // Login no Kernel para pegar token
        const loginRes = await fetch(`${process.env.KERNEL_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: data.email, password: data.password })
        });
        
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          
          // Criar App no Kernel para este usuário
          const kernelApp = await kernel.createApp(loginData.token, `SCE-User-${user.id.slice(0, 8)}`);
          
          if (kernelApp) {
            // Salvar credenciais do Kernel no usuário
            await prisma.user.update({
              where: { id: user.id },
              data: {
                kernelUserId: kernelUser.id,
                kernelAppId: kernelApp.id,
                kernelAppKey: kernelApp.api_key,
                kernelAppSecret: kernelApp.api_secret
              }
            });
            console.log(`✅ [KERNEL] App criado para user ${user.id}: ${kernelApp.id}`);
          }
        }
      }
    } catch (error) {
      // Não bloqueia cadastro se Kernel falhar
      console.warn(`⚠️ [KERNEL] Falha ao criar App para user ${user.id}:`, error);
    }

    // 5. Gerar tokens
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
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        kernelAppId: user.kernelAppId // Incluir App ID do Kernel
      } 
    };
  }

  /**
   * Provisiona App no Kernel para usuário existente (migração)
   */
  async provisionKernelApp(userId: string, name: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');
    if (user.kernelAppId) throw new Error('Usuário já tem App no Kernel');

    // Criar identidade no Kernel
    const kernelUser = await kernel.createIdentity(user.email, name, password);
    if (!kernelUser) throw new Error('Falha ao criar identidade no Kernel');

    // Login para pegar token
    const loginRes = await fetch(`${process.env.KERNEL_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.email, password })
    });
    
    if (!loginRes.ok) throw new Error('Falha ao autenticar no Kernel');
    const loginData = await loginRes.json();

    // Criar App
    const kernelApp = await kernel.createApp(loginData.token, `SCE-User-${user.id.slice(0, 8)}`);
    if (!kernelApp) throw new Error('Falha ao criar App no Kernel');

    // Salvar credenciais
    await prisma.user.update({
      where: { id: userId },
      data: {
        kernelUserId: kernelUser.id,
        kernelAppId: kernelApp.id,
        kernelAppKey: kernelApp.api_key,
        kernelAppSecret: kernelApp.api_secret
      }
    });

    return { kernelAppId: kernelApp.id };
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
