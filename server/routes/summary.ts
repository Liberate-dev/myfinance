import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMonthlySummary, getTopCategories, getRecentTransactions } from '../controllers/summaryController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/summary - monthly summary with totals
router.get('/', getMonthlySummary);

// GET /api/summary/categories - top spending categories breakdown
router.get('/categories', getTopCategories);

// GET /api/summary/transactions - recent transactions
router.get('/transactions', getRecentTransactions);

export default router;
