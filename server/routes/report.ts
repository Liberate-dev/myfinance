import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMonthlyReport, getYearlyReport } from '../controllers/reportController.js';

const router = Router();

router.use(authMiddleware);

router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);

export default router;
