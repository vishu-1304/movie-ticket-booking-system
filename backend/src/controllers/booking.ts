import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { SeatStatus, PaymentStatus, BookingStatus } from '@prisma/client';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'dummy_stripe_key';
const isMockPayment = process.env.MOCK_PAYMENT === 'true' || stripeSecret === 'dummy_stripe_key';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-04-10' as any,
});

export const lockSeats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    const userId = req.user.id;
    const { showId, seatIds } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Show and Pricing
      const show = await tx.show.findUnique({
        where: { id: showId },
      });

      if (!show) {
        throw new AppError('Show not found', 404);
      }

      // 2. Fetch selected show seats and details
      const showSeats = await tx.showSeat.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
        include: { seat: true },
      });

      if (showSeats.length !== seatIds.length) {
        throw new AppError('One or more selected seats are invalid', 400);
      }

      // 3. Verify availability (considering expiration of locks)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      for (const showSeat of showSeats) {
        const isLocked = showSeat.status === SeatStatus.LOCKED && showSeat.lockedAt && showSeat.lockedAt >= tenMinutesAgo;
        const isBooked = showSeat.status === SeatStatus.BOOKED;

        if (isBooked || isLocked) {
          throw new AppError(`Seat ${showSeat.seat.rowName}-${showSeat.seat.seatNumber} is no longer available`, 400);
        }
      }

      // 4. Calculate pricing
      let totalAmount = 0;
      for (const showSeat of showSeats) {
        const type = showSeat.seat.type;
        if (type === 'VIP') totalAmount += Number(show.priceVip);
        else if (type === 'PREMIUM') totalAmount += Number(show.pricePremium);
        else totalAmount += Number(show.priceNormal);
      }

      // 5. Create Booking
      const bookingNumber = 'BK-' + Math.floor(100000 + Math.random() * 900000) + '-' + Date.now().toString().slice(-4);
      const booking = await tx.booking.create({
        data: {
          userId,
          showId,
          bookingNumber,
          totalAmount,
          paymentStatus: PaymentStatus.PENDING,
          bookingStatus: BookingStatus.PENDING,
        },
      });

      // 6. Update seats to LOCKED status
      await tx.showSeat.updateMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
        data: {
          status: SeatStatus.LOCKED,
          lockedByUserId: userId,
          lockedAt: new Date(),
          bookingId: booking.id,
        },
      });

      return booking;
    });

    res.status(201).json({
      status: 'success',
      message: 'Seats locked successfully for 10 minutes',
      data: {
        booking: result,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: req.user.id },
      include: {
        show: {
          include: { movie: true },
        },
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.bookingStatus !== BookingStatus.PENDING) {
      return next(new AppError('This booking is already processed', 400));
    }

    if (isMockPayment) {
      // Return simulated client secret
      const mockSecret = `mock_secret_booking_${booking.id}`;
      
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentId: mockSecret },
      });

      return res.status(200).json({
        status: 'success',
        data: {
          clientSecret: mockSecret,
          isMock: true,
          amount: booking.totalAmount,
        },
      });
    }

    // Stripe Flow
    const amountInCents = Math.round(Number(booking.totalAmount) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'inr',
      metadata: {
        bookingId: booking.id,
        userId: req.user.id,
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentId: paymentIntent.id },
    });

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        isMock: false,
        amount: booking.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmMockPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: req.user.id },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Process confirmation
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      await tx.showSeat.updateMany({
        where: { bookingId },
        data: {
          status: SeatStatus.BOOKED,
          lockedAt: null,
          lockedByUserId: null,
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Booking confirmed successfully (Simulated Payment)',
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theatre: true },
            },
          },
        },
        showSeats: {
          include: { seat: true },
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

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // In development without webhook secret, extract directly
      event = req.body;
    }
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata.bookingId;

    if (bookingId) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              bookingStatus: BookingStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PAID,
              paymentId: paymentIntent.id,
            },
          });

          await tx.showSeat.updateMany({
            where: { bookingId },
            data: {
              status: SeatStatus.BOOKED,
              lockedAt: null,
              lockedByUserId: null,
            },
          });
        });
        console.log(`Booking ${bookingId} confirmed via Stripe webhook.`);
      } catch (err) {
        console.error(`Error updating booking via webhook:`, err);
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata.bookingId;

    if (bookingId) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              bookingStatus: BookingStatus.CANCELLED,
              paymentStatus: PaymentStatus.FAILED,
            },
          });

          // Free seats
          await tx.showSeat.updateMany({
            where: { bookingId },
            data: {
              status: SeatStatus.AVAILABLE,
              lockedAt: null,
              lockedByUserId: null,
              bookingId: null,
            },
          });
        });
        console.log(`Booking ${bookingId} cancelled via Stripe webhook.`);
      } catch (err) {
        console.error(`Error cancelling booking via webhook:`, err);
      }
    }
  }

  res.json({ received: true });
};
