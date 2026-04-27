import { Router } from 'express';
import { createTransfer, getTransfers, deleteTransfer } from '../controllers/transferController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createTransfer);
router.get('/', getTransfers);
router.delete('/:id', deleteTransfer);

export default router;
