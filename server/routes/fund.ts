import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createFund,
  getFunds,
  getFundById,
  updateFund,
  deleteFund
} from '../controllers/fundController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createFund);
router.get('/', getFunds);
router.get('/:id', getFundById);
router.put('/:id', updateFund);
router.delete('/:id', deleteFund);

export default router;
