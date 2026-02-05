
import { Request, Response, NextFunction } from 'express';
import { login } from '../services/auth.service';
import { LoginSchema } from '../models/validation';

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
