
import { PrismaClient } from '@prisma/client';

// CYDONIA ARCHITECT: SINGLETON PATTERN FOR PERSISTENCE LAYER
// Prevents connection pool exhaustion during high-frequency telemetry writes.

const prisma = new PrismaClient({
  log: ['error', 'warn'], // Optimize logs for production
});

export default prisma;
