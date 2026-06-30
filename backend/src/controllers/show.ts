import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';

export const getTheatresAndShowsByMovie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { movieId, cityId, date } = req.query;

    if (!movieId || !cityId || !date) {
      return next(new AppError('movieId, cityId, and date query parameters are required', 400));
    }

    const queryDate = new Date(String(date));
    if (isNaN(queryDate.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }

    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch theatres in this city that have screens hosting shows for this movie on this date
    const theatres = await prisma.theatre.findMany({
      where: {
        cityId: String(cityId),
        screens: {
          some: {
            shows: {
              some: {
                movieId: String(movieId),
                startTime: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
      include: {
        screens: {
          where: {
            shows: {
              some: {
                movieId: String(movieId),
                startTime: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
          include: {
            shows: {
              where: {
                movieId: String(movieId),
                startTime: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { theatres },
    });
  } catch (error) {
    next(error);
  }
};

export const getShowSeats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { showId } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        movie: {
          select: { title: true, rating: true, language: true, duration: true },
        },
        screen: {
          include: {
            theatre: {
              select: { name: true, address: true },
            },
          },
        },
      },
    });

    if (!show) {
      return next(new AppError('Show not found', 404));
    }

    // Fetch all show seats
    const showSeats = await prisma.showSeat.findMany({
      where: { showId },
      include: {
        seat: true,
      },
      orderBy: [
        { seat: { rowName: 'asc' } },
        { seat: { seatNumber: 'asc' } },
      ],
    });

    // Check for expired locked seats and reset them
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const expiredSeats = showSeats.filter(
      (ss) => ss.status === 'LOCKED' && ss.lockedAt && ss.lockedAt < tenMinutesAgo
    );

    if (expiredSeats.length > 0) {
      const expiredIds = expiredSeats.map((ss) => ss.id);
      
      await prisma.showSeat.updateMany({
        where: { id: { in: expiredIds } },
        data: {
          status: 'AVAILABLE',
          lockedAt: null,
          lockedByUserId: null,
          bookingId: null,
        },
      });

      // Refetch seats if there were changes
      const updatedShowSeats = await prisma.showSeat.findMany({
        where: { showId },
        include: {
          seat: true,
        },
        orderBy: [
          { seat: { rowName: 'asc' } },
          { seat: { seatNumber: 'asc' } },
        ],
      });

      return res.status(200).json({
        status: 'success',
        data: {
          show,
          seats: updatedShowSeats,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        show,
        seats: showSeats,
      },
    });
  } catch (error) {
    next(error);
  }
};
