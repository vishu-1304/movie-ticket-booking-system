import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const getCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: { cities },
    });
  } catch (error) {
    next(error);
  }
};
