import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createBudget,
  getBudgets,
  getBudgetVsActual,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/vs-actual', getBudgetVsActual);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
