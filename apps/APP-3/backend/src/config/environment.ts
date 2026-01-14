import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the root of the backend directory if it exists
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'a-very-secret-and-secure-key-for-dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
};