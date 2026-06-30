import { Router } from 'express';
import { lockSeats, createPaymentIntent, confirmMockPayment, getBookingHistory } from '../controllers/booking';
import { validate } from '../middlewares/validate';
import { lockSeatsSchema, createPaymentIntentSchema } from '../utils/validationSchemas';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/lock-seats', authenticate, validate(lockSeatsSchema), lockSeats);
router.post('/create-payment', authenticate, validate(createPaymentIntentSchema), createPaymentIntent);
router.post('/confirm-mock', authenticate, confirmMockPayment);
router.get('/history', authenticate, getBookingHistory);

export default router;
