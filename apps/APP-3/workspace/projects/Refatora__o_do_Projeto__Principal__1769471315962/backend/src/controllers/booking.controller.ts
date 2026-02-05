
import { Request, Response, NextFunction } from 'express';
import { createBooking } from '../services/booking.service';
import { BookingRequestSchema } from '../models/validation';

export const requestBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validação Zod
    const data = BookingRequestSchema.parse(req.body);
    
    const booking = await createBooking(data);
    
    res.status(201).json({
      message: 'Mission Confirmed',
      boardingPass: booking
    });
  } catch (error: any) {
    // Tratamento específico para regras de negócio vs erro de sistema
    if (error.message.includes('conflict') || error.message.includes('unavailable')) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};
