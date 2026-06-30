import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import cityRouter from './routes/city';
import movieRouter from './routes/movie';
import showRouter from './routes/show';
import bookingRouter from './routes/booking';
import adminRouter from './routes/admin';
import { stripeWebhook } from './controllers/booking';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS settings
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Stripe Webhook needs the RAW request body to verify signatures.
// So we register it before using express.json() parser middleware.
app.post('/api/bookings/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// General parsers
app.use(express.json());
app.use(cookieParser());

// Base health route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Movie Booking API is running' });
});

// App routing
app.use('/api/auth', authRouter);
app.use('/api/cities', cityRouter);
app.use('/api/movies', movieRouter);
app.use('/api/shows', showRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);

// Centralized error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
