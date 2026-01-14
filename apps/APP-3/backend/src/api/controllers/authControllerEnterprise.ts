/**
 * ============================================
 * AUTH CONTROLLER - Enterprise Grade
 * ============================================
 * 
 * Handlers HTTP com tratamento completo
 * Nível: Tech Lead Itaú
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../../core/services/AuthService';

/**
 * POST /api/auth/register
 * Registro de novo usuário
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.register(email, password, {
      ip: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      requestId: req.requestId
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login com proteção contra brute force
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password, {
      ip: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      requestId: req.requestId
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Renova access token usando refresh token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        },
        requestId: req.requestId
      });
      return;
    }

    const result = await authService.refreshToken(refreshToken, {
      ip: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      requestId: req.requestId
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/profile
 * Retorna perfil do usuário autenticado
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        },
        requestId: req.requestId
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        createdAt: req.user.createdAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};
