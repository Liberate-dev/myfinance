import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { exportCSV, exportAllData } from '../controllers/exportController.js';

const router = Router();

router.use(authMiddleware);

router.get('/csv', exportCSV);
router.get('/all', exportAllData);

export default router;