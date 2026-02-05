import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().default('file:./ghost.db'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  // Auth Config
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'), // CRITICAL for production
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('adminpass'), // CHANGE THIS IN PROD!
  // CORS
  FRONTEND_URL: z.string().default('http://localhost:8080'), // For specific CORS origin
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
