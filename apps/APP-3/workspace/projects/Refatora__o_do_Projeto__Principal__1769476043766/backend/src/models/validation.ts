
import { z } from 'zod';

// Zod schemas for strict input validation (Bio-Safety Protocols)

export const ModulateCommandSchema = z.object({
  target_system: z.enum([
    'OXYGEN_GENERATOR', 
    'PRESSURE_VALVE', 
    'THERMAL_REGULATOR', 
    'SHIELD_HARMONICS'
  ]),
  value: z.number().min(0).max(1000000), // Safety clamp
  authorization_hash: z.string().min(8)
});

export const AuthLoginSchema = z.object({
  access_code: z.string().min(1)
});

export type ModulateCommand = z.infer<typeof ModulateCommandSchema>;
