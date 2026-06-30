import { Router } from 'express';
import { getTheatresAndShowsByMovie, getShowSeats } from '../controllers/show';

const router = Router();

router.get('/', getTheatresAndShowsByMovie);
router.get('/:showId/seats', getShowSeats);

export default router;
