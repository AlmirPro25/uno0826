/**
 * ================================================================================
 * ⚠️  DEPRECATED — AUTH SERVICE
 * ================================================================================
 * 
 * Este serviço está DEPRECATED e será removido após a migração completa.
 * 
 * REGRA: SCE não autentica ninguém. Apenas confia no Kernel Identity.
 * 
 * O que ainda funciona:
 * - provisionKernelApp() — para migrar usuários existentes
 * 
 * O que foi REMOVIDO:
 * - login() — use /api/v1/identity/login no Kernel
 * - register() — use /api/v1/identity/register no Kernel
 * - setupInitialAdmin() — admins são criados no Kernel
 * 
 * Data de deprecação: 11/01/2026
 * Remoção prevista: Após migração de todos os usuários
 * 
 * ================================================================================
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { kernel } from '../lib/kernel-client.js';

const prisma = new PrismaClient();

// Schemas mantidos apenas para compatibilidade de tipos
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
   * @deprecated Use Kernel Identity: POST /api/v1/identity/register
   */
  async register(_data: z.infer<typeof registerSchema>): Promise<never> {
    throw new Error(
      'DEPRECATED: Registro local desativado. Use o Kernel Identity: POST /api/v1/identity/register'
    );
  }

  /**
   * @deprecated Use Kernel Identity: POST /api/v1/identity/login
   */
  async login(_data: z.infer<typeof loginSchema>): Promise<never> {
    throw new Error(
      'DEPRECATED: Login local desativado. Use o Kernel Identity: POST /api/v1/identity/login'
    );
  }

  /**
   * Provisiona App no Kernel para usuário existente (MIGRAÇÃO)
   * 
   * Este método será removido após a migração completa.
   * Ele existe apenas para permitir que usuários antigos do SCE
   * criem sua identidade no Kernel.
   * 
   * NOTA: Requer que o Prisma schema tenha os campos:
   * - kernelUserId
   * - kernelAppId  
   * - kernelAppKey
   * - kernelAppSecret
   */
  async provisionKernelApp(userId: string, name: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');
    
    // Verificar se já tem App no Kernel (campo pode não existir no schema antigo)
    const userAny = user as Record<string, unknown>;
    if (userAny.kernelAppId) throw new Error('Usuário já tem App no Kernel');

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
    const loginData = await loginRes.json() as { token: string };

    // Criar App
    const kernelApp = await kernel.createApp(loginData.token, `SCE-User-${user.id.slice(0, 8)}`);
    if (!kernelApp) throw new Error('Falha ao criar App no Kernel');

    // Salvar credenciais (usando any para compatibilidade com schema antigo)
    await prisma.user.update({
      where: { id: userId },
      data: {
        kernelUserId: kernelUser.id,
        kernelAppId: kernelApp.id,
        kernelAppKey: kernelApp.api_key,
        kernelAppSecret: kernelApp.api_secret
      } as Record<string, unknown>
    });

    return { kernelAppId: kernelApp.id };
  }

  /**
   * @deprecated Admins são criados no Kernel, não localmente
   */
  async setupInitialAdmin(): Promise<void> {
    console.warn('⚠️ [DEPRECATED] setupInitialAdmin() não faz mais nada. Crie admins no Kernel.');
  }
}
