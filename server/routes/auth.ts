import { Router } from 'express';
import { register, login, changePassword, clearUserData } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authMiddleware, changePassword);
router.delete('/clear-data', authMiddleware, clearUserData);

export default router;
