import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phoneNumber: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createMovieSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    duration: z.number().int().positive('Duration must be a positive integer'),
    language: z.string().min(1, 'Language is required'),
    genre: z.string().min(1, 'Genre is required'),
    director: z.string().min(1, 'Director is required'),
    cast: z.string().min(1, 'Cast is required'),
    posterUrl: z.string().url('Invalid poster URL'),
    trailerUrl: z.string().url('Invalid trailer URL').optional().nullable(),
    releaseDate: z.string().datetime('Invalid release date format'),
    rating: z.string().min(1, 'Rating is required'),
    isActive: z.boolean().optional(),
  }),
});

export const createShowSchema = z.object({
  body: z.object({
    movieId: z.string().uuid('Invalid movie ID'),
    screenId: z.string().uuid('Invalid screen ID'),
    startTime: z.string().datetime('Invalid start time format'),
    endTime: z.string().datetime('Invalid end time format'),
    date: z.string().datetime('Invalid date format'),
    priceNormal: z.number().positive('Price must be positive'),
    pricePremium: z.number().positive('Price must be positive'),
    priceVip: z.number().positive('Price must be positive'),
  }),
});

export const lockSeatsSchema = z.object({
  body: z.object({
    showId: z.string().uuid('Invalid show ID'),
    seatIds: z.array(z.string().uuid('Invalid seat ID')).min(1, 'At least one seat must be selected'),
  }),
});

export const createPaymentIntentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID'),
  }),
});
