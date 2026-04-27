import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome
} from '../controllers/incomeController.js';

const router = Router();

// All income routes require authentication
router.use(authMiddleware);

router.post('/', createIncome);
router.get('/', getIncomes);
router.get('/:id', getIncomeById);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;