
import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { environment } from '../../config/environment';

const generateToken = (id: string) => {
  return jwt.sign({ id }, environment.JWT_SECRET as string, {
    expiresIn: '1d',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const userExists = await (User as any).findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // The password will be hashed by the 'beforeCreate' hook in the model
    const user = await (User as any).create({ email, password });

    res.status(201).json({
      id: user.id,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await (User as any).findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      id: user.id,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Google credential token is required.' });
    }

    try {
        // --- IMPORTANT ---
        // In a real-world production app, you MUST verify the token using Google's official library
        // (e.g., `google-auth-library` for Node.js) to ensure it's authentic and not tampered with.
        // For this simulated environment, we will only decode the token and check its audience.
        const decodedToken: any = jwt.decode(credential);

        if (!decodedToken || !decodedToken.email) {
            return res.status(401).json({ message: 'Invalid Google token.' });
        }
        
        // Basic security check: ensure the token was intended for our application.
        if (decodedToken.aud !== environment.GOOGLE_CLIENT_ID) {
            console.warn(`Token audience mismatch. Expected: ${environment.GOOGLE_CLIENT_ID}, Got: ${decodedToken.aud}`);
            return res.status(401).json({ message: 'Token audience mismatch.' });
        }

        const { email } = decodedToken;

        let user = await (User as any).findOne({ where: { email } });

        if (!user) {
            // User does not exist, create a new one.
            // Generate a secure, random password since one isn't provided by Google.
            // The user will never use this password directly.
            const randomPassword = crypto.randomBytes(20).toString('hex');
            
            user = await (User as any).create({
                email,
                password: randomPassword, // The hook will hash this
            });
        }
        
        // At this point, 'user' is either the existing or newly created user.
        // Generate our app's own JWT for session management.
        res.json({
            id: user.id,
            email: user.email,
            token: generateToken(user.id),
        });

    } catch (error) {
        next(error);
    }
};


export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    // The user object is attached by the 'protect' middleware
    if (req.user) {
        res.json({
            id: req.user.id,
            email: req.user.email,
            createdAt: req.user.createdAt,
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
};