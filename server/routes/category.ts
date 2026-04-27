import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getCategories,
  getCategoriesByType,
  getUserCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

const router = Router();

// Public routes - categories are available for dropdown menus
router.get('/', getCategories);
router.get('/type/:type', getCategoriesByType);

// User-specific routes (authenticated)
router.use(authMiddleware);
router.get('/user', getUserCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
