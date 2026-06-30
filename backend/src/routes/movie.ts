import { Router } from 'express';
import { getMovies, getMovieById, incrementInterested } from '../controllers/movie';

const router = Router();

router.get('/', getMovies);
router.get('/:id', getMovieById);
router.post('/:id/interested', incrementInterested);

export default router;
