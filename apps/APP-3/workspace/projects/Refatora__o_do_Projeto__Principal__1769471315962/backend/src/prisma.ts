
import { PrismaClient } from '@prisma/client';

// Singleton Pattern para conexão de banco de dados
// Garante que não exaurimos o pool de conexões em ambiente serverless ou containerizado.
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;
