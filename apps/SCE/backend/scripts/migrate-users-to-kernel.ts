/**
 * ================================================================================
 * SCRIPT DE MIGRAÇÃO: SCE Users → Kernel Identity
 * ================================================================================
 * 
 * Este script migra usuários locais do SCE para o Kernel Identity.
 * 
 * REGRA: Após migração, SCE não autentica ninguém. Apenas confia no Kernel.
 * 
 * Fluxo:
 * 1. Busca usuários SCE com passwordHash mas sem kernelUserId
 * 2. Para cada usuário:
 *    a. Tenta criar no Kernel (ou busca se já existe pelo email)
 *    b. Cria AppMembership no Kernel para o SCE
 *    c. Atualiza kernelUserId no SCE
 * 3. Marca migração como completa
 * 
 * IMPORTANTE: Este script é IDEMPOTENTE — pode rodar múltiplas vezes sem duplicar.
 * 
 * Pré-requisitos:
 *   1. npx prisma generate (para atualizar o client)
 *   2. KERNEL_ADMIN_TOKEN configurado (token de admin do Kernel)
 * 
 * Uso:
 *   npx tsx scripts/migrate-users-to-kernel.ts
 *   npx tsx scripts/migrate-users-to-kernel.ts --dry-run
 * 
 * ================================================================================
 */

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração
const KERNEL_URL = process.env.PROSTQS_URL || 'https://uno0826.onrender.com';
const SCE_APP_ID = process.env.PROSTQS_APP_ID || '011c6e88-9556-43ff-ad4e-27e20a5f5ea5';
const ADMIN_TOKEN = process.env.KERNEL_ADMIN_TOKEN; // Token de admin do Kernel para criar usuários

const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Busca ou cria usuário no Kernel
 */
async function findOrCreateKernelUser(email: string, name: string): Promise<string | null> {
  // Primeiro, tenta buscar pelo email
  try {
    const searchResponse = await fetch(`${KERNEL_URL}/api/v1/admin/users/search?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      if (data.user) {
        console.log(`  ✓ Usuário já existe no Kernel: ${email} (${data.user.id})`);
        return data.user.id;
      }
    }
  } catch (err) {
    // Endpoint pode não existir, continuar para criar
  }

  // Se não existe, criar
  // NOTA: Não temos a senha original (só o hash), então criamos com senha temporária
  // O usuário precisará fazer "esqueci minha senha" ou já ter conta no Kernel
  try {
    const createResponse = await fetch(`${KERNEL_URL}/api/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        email,
        name: name || email.split('@')[0],
        // Senha temporária — usuário precisará resetar
        password: `MIGRATED_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        origin_app_id: SCE_APP_ID,
        require_password_reset: true, // Flag para forçar reset
      }),
    });

    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log(`  ✓ Usuário criado no Kernel: ${email} (${data.user_id})`);
      return data.user_id;
    }

    // Se falhou com 409 (já existe), tentar buscar novamente
    if (createResponse.status === 409) {
      const errorData = await createResponse.json();
      if (errorData.user_id) {
        console.log(`  ✓ Usuário já existia: ${email} (${errorData.user_id})`);
        return errorData.user_id;
      }
    }

    const errorData = await createResponse.json();
    console.error(`  ✗ Erro ao criar usuário: ${errorData.error || createResponse.statusText}`);
    return null;
  } catch (err: any) {
    console.error(`  ✗ Erro de rede ao criar usuário: ${err.message}`);
    return null;
  }
}

/**
 * Cria membership no Kernel para o SCE
 */
async function createKernelMembership(kernelUserId: string): Promise<boolean> {
  try {
    const response = await fetch(`${KERNEL_URL}/api/v1/admin/memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        user_id: kernelUserId,
        app_id: SCE_APP_ID,
        role: 'user',
        status: 'active',
      }),
    });

    if (response.ok) {
      console.log(`  ✓ Membership criada no Kernel`);
      return true;
    }

    // 409 = já existe, ok
    if (response.status === 409) {
      console.log(`  ✓ Membership já existia`);
      return true;
    }

    const errorData = await response.json();
    console.error(`  ✗ Erro ao criar membership: ${errorData.error || response.statusText}`);
    return false;
  } catch (err: any) {
    console.error(`  ✗ Erro de rede ao criar membership: ${err.message}`);
    return false;
  }
}

/**
 * Migra um usuário
 */
async function migrateUser(user: { id: string; email: string; role: string }): Promise<boolean> {
  console.log(`\n→ Migrando: ${user.email}`);

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Seria migrado para o Kernel`);
    return true;
  }

  // 1. Criar/buscar no Kernel
  const kernelUserId = await findOrCreateKernelUser(user.email, user.email.split('@')[0]);
  if (!kernelUserId) {
    return false;
  }

  // 2. Criar membership
  const membershipOk = await createKernelMembership(kernelUserId);
  if (!membershipOk) {
    return false;
  }

  // 3. Atualizar SCE
  await prisma.user.update({
    where: { id: user.id },
    data: { kernelUserId },
  });
  console.log(`  ✓ SCE atualizado com kernelUserId`);

  return true;
}

/**
 * Executa migração
 */
async function migrate(): Promise<MigrationResult> {
  console.log('================================================================================');
  console.log('MIGRAÇÃO: SCE Users → Kernel Identity');
  console.log('================================================================================');
  console.log(`Kernel URL: ${KERNEL_URL}`);
  console.log(`SCE App ID: ${SCE_APP_ID}`);
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (simulação)' : 'PRODUÇÃO'}`);
  console.log('');

  if (!ADMIN_TOKEN && !DRY_RUN) {
    console.error('❌ KERNEL_ADMIN_TOKEN não configurado!');
    console.error('   Configure a variável de ambiente e tente novamente.');
    process.exit(1);
  }

  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Buscar usuários que precisam migrar
  const usersToMigrate = await prisma.user.findMany({
    where: {
      kernelUserId: null,
      passwordHash: { not: '' }, // Tem auth local
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  result.total = usersToMigrate.length;

  if (usersToMigrate.length === 0) {
    console.log('✅ Nenhum usuário para migrar!');
    console.log('   Todos os usuários já têm kernelUserId ou não têm auth local.');
    return result;
  }

  console.log(`📋 Encontrados ${usersToMigrate.length} usuários para migrar:`);
  usersToMigrate.forEach(u => console.log(`   - ${u.email}`));

  // Migrar cada usuário
  for (const user of usersToMigrate) {
    try {
      const success = await migrateUser(user);
      if (success) {
        result.migrated++;
      } else {
        result.failed++;
        result.errors.push({ email: user.email, error: 'Falha na migração' });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ email: user.email, error: err.message });
      console.error(`  ✗ Erro inesperado: ${err.message}`);
    }
  }

  return result;
}

/**
 * Relatório final
 */
function printReport(result: MigrationResult): void {
  console.log('\n================================================================================');
  console.log('RELATÓRIO DE MIGRAÇÃO');
  console.log('================================================================================');
  console.log(`Total de usuários:    ${result.total}`);
  console.log(`Migrados com sucesso: ${result.migrated}`);
  console.log(`Pulados:              ${result.skipped}`);
  console.log(`Falhas:               ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('\nErros:');
    result.errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n⚠️  Modo DRY-RUN — nenhuma alteração foi feita.');
    console.log('   Execute sem --dry-run para aplicar as mudanças.');
  }

  console.log('================================================================================');
}

// Executar
migrate()
  .then(result => {
    printReport(result);
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
