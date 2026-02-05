
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().default('file:./sentinel.db'),
  JWT_SECRET: z.string().default('SENTINEL_PRIME_SECRET_KEY_ALPHA_ONE'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPERATOR_KEY: z.string().default('COMMANDER_X'),
  OPERATOR_SECRET: z.string().default('SENTINEL_PROTOCOL_INIT')
});

export const env = envSchema.parse(process.env);
