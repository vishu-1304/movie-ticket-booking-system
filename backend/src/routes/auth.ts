import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../utils/validationSchemas';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
