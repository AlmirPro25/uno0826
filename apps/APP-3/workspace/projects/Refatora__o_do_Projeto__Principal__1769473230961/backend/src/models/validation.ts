
import { z } from 'zod';

// PROTOCOLOS DE VALIDAÇÃO DE ENTRADA

export const LoginSchema = z.object({
  username: z.string().min(1, "IDENTIFIER_REQUIRED"),
  password: z.string().min(1, "ACCESS_CODE_REQUIRED")
});

export const LockdownSchema = z.object({
  assetId: z.string().uuid("INVALID_ASSET_TARGET_VECTOR")
});

export const ManifestQuerySchema = z.object({
  clearanceLevel: z.string().optional()
});

export type LoginInput = z.infer<typeof LoginSchema>;
