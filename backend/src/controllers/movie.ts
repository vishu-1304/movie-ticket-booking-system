import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';

export const getMovies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityId, search, genre, status } = req.query;

    const now = new Date();
    const whereClause: any = {
      isActive: true,
    };

    if (search) {
      whereClause.title = {
        contains: String(search),
        mode: 'insensitive',
      };
    }

    if (genre) {
      whereClause.genre = {
        contains: String(genre),
        mode: 'insensitive',
      };
    }

    if (status === 'upcoming') {
      // Upcoming movies are released in the future
      whereClause.releaseDate = {
        gt: now,
      };
    } else {
      // Showing movies are already released (or default)
      whereClause.releaseDate = {
        lte: now,
      };

      if (cityId && cityId !== 'undefined' && cityId !== 'null' && cityId !== '') {
        // Filter movies that have shows scheduled in the screens of theatres of the selected city
        whereClause.shows = {
          some: {
            screen: {
              theatre: {
                cityId: String(cityId),
              },
            },
          },
        };
      }
    }

    const movies = await prisma.movie.findMany({
      where: whereClause,
      orderBy: { releaseDate: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { movies },
    });
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return next(new AppError('Movie not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { movie },
    });
  } catch (error) {
    next(error);
  }
};

export const incrementInterested = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        interested: {
          increment: 1,
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { movie },
    });
  } catch (error) {
    next(error);
  }
};
