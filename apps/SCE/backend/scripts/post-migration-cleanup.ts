/**
 * ================================================================================
 * SCRIPT DE LIMPEZA PÓS-MIGRAÇÃO
 * ================================================================================
 * 
 * Este script deve ser executado APÓS a migração de usuários para o Kernel.
 * 
 * O que ele faz:
 * 1. Verifica se todos os usuários têm kernelUserId
 * 2. Remove passwordHash de todos os usuários migrados
 * 3. Gera relatório de limpeza
 * 
 * IMPORTANTE: Execute migrate-users-to-kernel.ts ANTES deste script!
 * 
 * Uso:
 *   npx tsx scripts/post-migration-cleanup.ts --dry-run
 *   npx tsx scripts/post-migration-cleanup.ts
 * 
 * ================================================================================
 */

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

interface CleanupResult {
  totalUsers: number;
  migratedUsers: number;
  notMigratedUsers: number;
  passwordsCleared: number;
  errors: string[];
}

async function verifyMigration(): Promise<{ ready: boolean; notMigrated: string[] }> {
  const usersWithoutKernel = await prisma.user.findMany({
    where: {
      kernelUserId: null,
      passwordHash: { not: '' },
    },
    select: { email: true },
  });

  return {
    ready: usersWithoutKernel.length === 0,
    notMigrated: usersWithoutKernel.map(u => u.email),
  };
}

async function clearPasswords(): Promise<number> {
  if (DRY_RUN) {
    const count = await prisma.user.count({
      where: {
        kernelUserId: { not: null },
        passwordHash: { not: '' },
      },
    });
    return count;
  }

  const result = await prisma.user.updateMany({
    where: {
      kernelUserId: { not: null },
      passwordHash: { not: '' },
    },
    data: {
      passwordHash: '', // Limpa o hash — auth é via Kernel agora
    },
  });

  return result.count;
}

async function cleanup(): Promise<CleanupResult> {
  console.log('================================================================================');
  console.log('LIMPEZA PÓS-MIGRAÇÃO: SCE → Kernel Identity');
  console.log('================================================================================');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (simulação)' : 'PRODUÇÃO'}`);
  console.log('');

  const result: CleanupResult = {
    totalUsers: 0,
    migratedUsers: 0,
    notMigratedUsers: 0,
    passwordsCleared: 0,
    errors: [],
  };

  // Contar usuários
  result.totalUsers = await prisma.user.count();
  result.migratedUsers = await prisma.user.count({
    where: { kernelUserId: { not: null } },
  });
  result.notMigratedUsers = result.totalUsers - result.migratedUsers;

  console.log(`📊 Estatísticas:`);
  console.log(`   Total de usuários:    ${result.totalUsers}`);
  console.log(`   Migrados (com kernelUserId): ${result.migratedUsers}`);
  console.log(`   Não migrados:         ${result.notMigratedUsers}`);
  console.log('');

  // Verificar se migração está completa
  const verification = await verifyMigration();

  if (!verification.ready && !FORCE) {
    console.log('❌ MIGRAÇÃO INCOMPLETA!');
    console.log('   Os seguintes usuários ainda não foram migrados:');
    verification.notMigrated.forEach(email => console.log(`   - ${email}`));
    console.log('');
    console.log('   Execute migrate-users-to-kernel.ts primeiro.');
    console.log('   Ou use --force para limpar mesmo assim (não recomendado).');
    result.errors.push('Migração incompleta');
    return result;
  }

  if (!verification.ready && FORCE) {
    console.log('⚠️  FORÇANDO limpeza com usuários não migrados!');
    console.log('   Usuários não migrados perderão acesso:');
    verification.notMigrated.forEach(email => console.log(`   - ${email}`));
    console.log('');
  }

  // Limpar senhas
  console.log('🧹 Limpando passwordHash dos usuários migrados...');
  result.passwordsCleared = await clearPasswords();
  console.log(`   ${DRY_RUN ? 'Seriam limpos' : 'Limpos'}: ${result.passwordsCleared} usuários`);

  return result;
}

function printReport(result: CleanupResult): void {
  console.log('\n================================================================================');
  console.log('RELATÓRIO DE LIMPEZA');
  console.log('================================================================================');
  console.log(`Total de usuários:       ${result.totalUsers}`);
  console.log(`Migrados para Kernel:    ${result.migratedUsers}`);
  console.log(`Não migrados:            ${result.notMigratedUsers}`);
  console.log(`Senhas limpas:           ${result.passwordsCleared}`);

  if (result.errors.length > 0) {
    console.log('\nErros:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }

  if (DRY_RUN) {
    console.log('\n⚠️  Modo DRY-RUN — nenhuma alteração foi feita.');
    console.log('   Execute sem --dry-run para aplicar as mudanças.');
  } else if (result.errors.length === 0) {
    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('\n📋 PRÓXIMOS PASSOS MANUAIS:');
    console.log('   1. Deletar auth.service.ts');
    console.log('   2. Remover bcrypt do package.json');
    console.log('   3. Atualizar Prisma schema (remover passwordHash)');
    console.log('   4. Executar: npx prisma migrate dev --name remove-password-hash');
  }

  console.log('================================================================================');
}

// Executar
cleanup()
  .then(result => {
    printReport(result);
    process.exit(result.errors.length > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
