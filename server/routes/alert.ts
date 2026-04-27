import { Router } from 'express';
import { createAlert, getAlerts, updateAlert, deleteAlert, checkAlerts } from '../controllers/alertController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createAlert);
router.get('/', getAlerts);
router.get('/check', checkAlerts);
router.put('/:id', updateAlert);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);

export default router;
