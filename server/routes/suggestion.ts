import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSuggestions } from '../controllers/suggestionController.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/suggestions - returns array of suggestions based on user data
router.get('/', getSuggestions);

export default router;
