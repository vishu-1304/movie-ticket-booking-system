import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';
import prisma from '../config/db';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided. Unauthorized.', 401));
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Verify if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return next(new AppError('User session not found or invalid.', 401));
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    return next(new AppError('Token is invalid or has expired.', 401));
  }
};

export const requireRole = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Please authenticate.', 401));
    }

    if (req.user.role !== role) {
      return next(new AppError('Forbidden. Insufficient permissions.', 403));
    }

    next();
  };
};
