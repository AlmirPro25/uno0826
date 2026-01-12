/**
 * ================================================================================
 * SCRIPT SIMPLIFICADO: Vincular usuário local ao Kernel
 * ================================================================================
 * 
 * Este script é para ambiente de desenvolvimento/staging.
 * Atualiza diretamente o banco SQLite do SCE com o kernelUserId.
 * 
 * Uso:
 *   npx tsx scripts/link-local-user.ts <email> <kernelUserId>
 *   npx tsx scripts/link-local-user.ts admin@sce.local abc-123-def-456
 * 
 * Ou sem argumentos para modo interativo (lista usuários e pede input):
 *   npx tsx scripts/link-local-user.ts
 * 
 * ================================================================================
 */

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  console.log('================================================================================');
  console.log('VINCULAR USUÁRIO LOCAL AO KERNEL');
  console.log('================================================================================\n');

  // Listar usuários que precisam de vínculo
  const usersWithoutLink = await prisma.user.findMany({
    where: { kernelUserId: null },
    select: { id: true, email: true, role: true, createdAt: true }
  });

  if (usersWithoutLink.length === 0) {
    console.log('✅ Todos os usuários já estão vinculados ao Kernel!');
    return;
  }

  console.log('Usuários SEM kernelUserId:');
  usersWithoutLink.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (role: ${u.role}, criado: ${u.createdAt.toISOString().split('T')[0]})`);
  });
  console.log('');

  // Se argumentos foram passados, usar eles
  if (args.length >= 2) {
    const [email, kernelUserId] = args;
    await linkUser(email, kernelUserId);
    return;
  }

  // Modo interativo
  console.log('Para vincular um usuário, rode:');
  console.log('  npx tsx scripts/link-local-user.ts <email> <kernelUserId>\n');
  console.log('Exemplo:');
  console.log('  npx tsx scripts/link-local-user.ts admin@sce.local 550e8400-e29b-41d4-a716-446655440000\n');
  console.log('Para obter o kernelUserId:');
  console.log('  1. Faça login no Kernel com o mesmo email');
  console.log('  2. O user_id está no JWT (decodifique em jwt.io)');
  console.log('  3. Ou busque no banco do Kernel: SELECT id FROM users WHERE email = "admin@sce.local"');
}

async function linkUser(email: string, kernelUserId: string) {
  console.log(`Vinculando ${email} → ${kernelUserId}...`);

  // Validar UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(kernelUserId)) {
    console.error('❌ kernelUserId inválido. Deve ser um UUID.');
    console.error('   Formato esperado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    process.exit(1);
  }

  // Buscar usuário
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  if (user.kernelUserId) {
    console.log(`⚠️  Usuário já vinculado: ${user.kernelUserId}`);
    console.log('   Use --force para sobrescrever (não implementado por segurança)');
    return;
  }

  // Atualizar
  await prisma.user.update({
    where: { email },
    data: { kernelUserId }
  });

  console.log('✅ Usuário vinculado com sucesso!');
  console.log(`   ${email} → ${kernelUserId}`);
  console.log('\nAgora o usuário pode logar via Kernel e acessar seus projetos no SCE.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
