import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { SeatType, SeatStatus } from '@prisma/client';

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Total Revenue
    const bookingsPaid = await prisma.booking.findMany({
      where: { paymentStatus: 'PAID' },
      select: { totalAmount: true },
    });
    const totalRevenue = bookingsPaid.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    // 2. Total Tickets Sold (Booked seats)
    const totalTicketsSold = await prisma.showSeat.count({
      where: { status: 'BOOKED' },
    });

    // 3. Total Active Movies & Shows
    const totalMovies = await prisma.movie.count({ where: { isActive: true } });
    const totalUpcomingShows = await prisma.show.count({
      where: { startTime: { gte: new Date() } },
    });

    // 4. Occupancy Rate
    const totalSeats = await prisma.showSeat.count();
    const occupancyRate = totalSeats > 0 ? (totalTicketsSold / totalSeats) * 100 : 0;

    // 5. Sales by Movie
    const movies = await prisma.movie.findMany({
      include: {
        shows: {
          include: {
            showSeats: {
              where: { status: 'BOOKED' },
            },
          },
        },
      },
    });

    const movieSales = movies.map((m) => {
      let ticketsCount = 0;
      m.shows.forEach((s) => {
        ticketsCount += s.showSeats.length;
      });
      return {
        id: m.id,
        title: m.title,
        ticketsSold: ticketsCount,
      };
    });

    // 6. Recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        show: {
          include: {
            movie: { select: { title: true } },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        analytics: {
          totalRevenue,
          totalTicketsSold,
          totalMovies,
          totalUpcomingShows,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          movieSales,
          recentBookings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Movie Management ---
export const createMovie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, duration, language, genre, director, cast, posterUrl, trailerUrl, releaseDate, rating, isActive } = req.body;
    
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        duration: Number(duration),
        language,
        genre,
        director,
        cast,
        posterUrl,
        trailerUrl,
        releaseDate: new Date(releaseDate),
        rating,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ status: 'success', data: { movie } });
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.releaseDate) data.releaseDate = new Date(data.releaseDate);
    if (data.duration) data.duration = Number(data.duration);

    const movie = await prisma.movie.update({
      where: { id },
      data,
    });

    res.status(200).json({ status: 'success', data: { movie } });
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.movie.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Movie deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Theatre Management ---
export const createTheatre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, cityId } = req.body;
    const theatre = await prisma.theatre.create({
      data: { name, address, cityId },
    });
    res.status(201).json({ status: 'success', data: { theatre } });
  } catch (error) {
    next(error);
  }
};

export const updateTheatre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const theatre = await prisma.theatre.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json({ status: 'success', data: { theatre } });
  } catch (error) {
    next(error);
  }
};

export const deleteTheatre = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.theatre.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Theatre deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Screen Management ---
export const createScreen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, theatreId, rows, seatsPerRow } = req.body;

    const screen = await prisma.screen.create({
      data: { name, theatreId },
    });

    // Auto-generate physical seats for screen
    const defaultRows = rows || ['A', 'B', 'C', 'D', 'E'];
    const defaultCols = seatsPerRow || 10;
    const seatsData = [];

    for (const r of defaultRows) {
      let seatType: SeatType = SeatType.NORMAL;
      if (r === 'D') seatType = SeatType.PREMIUM;
      if (r === 'E') seatType = SeatType.VIP;

      for (let c = 1; c <= defaultCols; c++) {
        seatsData.push({
          screenId: screen.id,
          rowName: r,
          seatNumber: c,
          type: seatType,
        });
      }
    }

    await prisma.seat.createMany({ data: seatsData });

    res.status(201).json({
      status: 'success',
      data: {
        screen,
        seatsCount: seatsData.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteScreen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.screen.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Screen deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Show Scheduling ---
export const createShow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { movieId, screenId, startTime, endTime, date, priceNormal, pricePremium, priceVip } = req.body;

    const show = await prisma.show.create({
      data: {
        movieId,
        screenId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        date: new Date(date),
        priceNormal,
        pricePremium,
        priceVip,
      },
    });

    // Generate ShowSeats from screen physical configuration
    const screenSeats = await prisma.seat.findMany({ where: { screenId } });
    const showSeatsData = screenSeats.map((seat) => ({
      showId: show.id,
      seatId: seat.id,
      status: SeatStatus.AVAILABLE,
    }));

    await prisma.showSeat.createMany({ data: showSeatsData });

    res.status(201).json({
      status: 'success',
      data: { show, seatsCreated: showSeatsData.length },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.show.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Show deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        show: {
          include: {
            movie: { select: { title: true } },
            screen: {
              include: { theatre: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};
