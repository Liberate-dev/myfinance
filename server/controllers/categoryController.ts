import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { CategoryModel } from '../models/Category.js';
import { AuthRequest } from '../middleware/auth.js';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['income', 'expense']),
  icon: z.string().default('📦')
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').optional(),
  icon: z.string().optional()
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = CategoryModel.findAll();

  res.json({
    categories,
    count: categories.length
  });
});

export const getCategoriesByType = asyncHandler(async (req: Request, res: Response) => {
  const type = req.params.type as 'income' | 'expense';

  if (type !== 'income' && type !== 'expense') {
    res.status(400).json({ error: 'Type must be "income" or "expense"' });
    return;
  }

  const categories = CategoryModel.findByType(type);

  res.json({
    categories,
    count: categories.length
  });
});

export const getUserCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const categories = CategoryModel.findByUserId(userId);

  res.json({
    categories,
    count: categories.length
  });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { name, type, icon } = parsed.data;

  // Check if name already exists for this user
  if (CategoryModel.nameExists(name, type, userId)) {
    res.status(400).json({ error: 'Category with this name already exists' });
    return;
  }

  const category = CategoryModel.create(name, type, icon, false, userId);

  res.status(201).json({
    message: 'Category created successfully',
    category
  });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const categoryId = parseInt(idParam, 10);

  if (isNaN(categoryId)) {
    res.status(400).json({ error: 'Invalid category ID' });
    return;
  }

  const existingCategory = CategoryModel.findById(categoryId);
  if (!existingCategory) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  // Only allow updating custom categories
  if (existingCategory.is_default) {
    res.status(403).json({ error: 'Cannot modify default categories' });
    return;
  }

  // Ensure user owns this category
  if (existingCategory.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { name, icon } = parsed.data;
  const updatedCategory = CategoryModel.update(
    categoryId,
    name ?? existingCategory.name,
    icon ?? existingCategory.icon
  );

  res.json({
    message: 'Category updated successfully',
    category: updatedCategory
  });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const categoryId = parseInt(idParam, 10);

  if (isNaN(categoryId)) {
    res.status(400).json({ error: 'Invalid category ID' });
    return;
  }

  const existingCategory = CategoryModel.findById(categoryId);
  if (!existingCategory) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  // Only allow deleting custom categories
  if (existingCategory.is_default) {
    res.status(403).json({ error: 'Cannot delete default categories' });
    return;
  }

  // Ensure user owns this category
  if (existingCategory.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const deleted = CategoryModel.delete(categoryId, userId);

  if (deleted) {
    res.json({ message: 'Category deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
