import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getDashboardAnalytics,
  createMovie,
  updateMovie,
  deleteMovie,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  createScreen,
  deleteScreen,
  createShow,
  deleteShow,
  getBookings,
} from '../controllers/admin';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createMovieSchema, createShowSchema } from '../utils/validationSchemas';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireRole(Role.ADMIN));

router.get('/dashboard', getDashboardAnalytics);

// Movie endpoints
router.post('/movies', validate(createMovieSchema), createMovie);
router.put('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);

// Theatre endpoints
router.post('/theatres', createTheatre);
router.put('/theatres/:id', updateTheatre);
router.delete('/theatres/:id', deleteTheatre);

// Screen endpoints
router.post('/screens', createScreen);
router.delete('/screens/:id', deleteScreen);

// Show endpoints
router.post('/shows', validate(createShowSchema), createShow);
router.delete('/shows/:id', deleteShow);

// Bookings audit log
router.get('/bookings', getBookings);

export default router;
