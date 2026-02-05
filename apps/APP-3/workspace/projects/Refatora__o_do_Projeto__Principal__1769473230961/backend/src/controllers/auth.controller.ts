
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginSchema } from '../models/validation';

export const login = async (req: Request, res: Response) => {
  try {
    const credentials = LoginSchema.parse(req.body);
    const result = await AuthService.executeLogin(credentials);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: "ACCESS_DENIED" });
    } else {
      res.status(400).json({ error: "BAD_REQUEST", details: error });
    }
  }
};
