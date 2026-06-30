import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

// Helper to set HTTP-only cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user: newUser },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid email or password', 400));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 400));
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, tokenId });

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return next(new AppError('Refresh token not found', 401));
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const savedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!savedToken || savedToken.revoked || savedToken.expiresAt < new Date()) {
      // If token is compromised or expired, revoke all tokens for this user for security
      if (savedToken) {
        await prisma.refreshToken.updateMany({
          where: { userId: savedToken.userId },
          data: { revoked: true },
        });
      }
      res.clearCookie('refreshToken');
      return next(new AppError('Refresh token revoked or expired. Please re-login.', 401));
    }

    // Revoke old refresh token (Token rotation)
    await prisma.refreshToken.delete({ where: { id: payload.tokenId } });

    // Generate new pair
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newTokenId = uuidv4();
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role, tokenId: newTokenId });

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        id: newTokenId,
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await prisma.refreshToken.delete({ where: { id: payload.tokenId } }).catch(() => {});
      } catch (err) {
        // Token might already be invalid, proceed to clear cookie
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
