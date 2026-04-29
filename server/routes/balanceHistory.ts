import { Router } from 'express';
import { getBalanceHistory, getFundBalanceHistory } from '../controllers/balanceHistoryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getBalanceHistory);
router.get('/:fundId', getFundBalanceHistory);

export default router;
