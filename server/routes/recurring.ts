import { Router } from 'express';
import { createRecurring, getRecurring, updateRecurring, toggleRecurring, deleteRecurring, processRecurring } from '../controllers/recurringController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createRecurring);
router.get('/', getRecurring);
router.put('/:id', updateRecurring);
router.patch('/:id/toggle', toggleRecurring);
router.delete('/:id', deleteRecurring);
router.post('/process', processRecurring); // For cron/scheduled execution

export default router;
