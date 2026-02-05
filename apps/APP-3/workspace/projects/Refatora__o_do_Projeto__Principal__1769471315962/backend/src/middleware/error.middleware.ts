
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[SYSTEM_ERROR] ${err.message}`);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Protocol Failed',
      details: err.errors
    });
  }

  // Ocultar stack trace em produção
  res.status(500).json({
    error: 'Internal System Error. Incident logged.',
    code: 'TITAN_ERR_500'
  });
};
