
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

export const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  console.error(err.stack);
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};