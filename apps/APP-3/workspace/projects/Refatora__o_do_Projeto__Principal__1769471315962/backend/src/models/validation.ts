
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const BookingRequestSchema = z.object({
  assetId: z.string().uuid(),
  passengerName: z.string().min(2),
  vipCode: z.string().optional(),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  departureTime: z.string().datetime()
});

export const AssetUpdateSchema = z.object({
  status: z.enum(['IDLE', 'IN_FLIGHT', 'MAINTENANCE', 'DECOMMISSIONED']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  heading: z.number().optional(),
  altitude: z.number().optional()
});
