import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { BudgetModel, BudgetVsActual } from '../models/Budget.js';
import { AuthRequest } from '../middleware/auth.js';

const createBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive')
});

const updateBudgetSchema = z.object({
  amount: z.number().positive('Amount must be positive')
});

export const createBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { category, amount } = parsed.data;
  const userId = req.user!.userId;

  // Check if budget already exists for this category
  const existing = BudgetModel.findByUserIdAndCategory(userId, category);
  if (existing) {
    res.status(400).json({ error: 'Budget already exists for this category. Use update instead.' });
    return;
  }

  const budget = BudgetModel.create(userId, category, amount);

  res.status(201).json({
    message: 'Budget created successfully',
    budget
  });
});

export const getBudgets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const budgets = BudgetModel.findByUserId(userId);

  res.json({
    budgets,
    count: budgets.length
  });
});

export const getBudgetVsActual = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();
  const year = parseInt(req.query.year as string) || now.getFullYear();
  const month = parseInt(req.query.month as string) || now.getMonth() + 1;

  if (month < 1 || month > 12) {
    res.status(400).json({ error: 'Invalid month' });
    return;
  }

  const budgetVsActual = BudgetModel.getBudgetVsActual(userId, year, month);

  res.json({
    year,
    month,
    budgets: budgetVsActual,
    totalBudget: budgetVsActual.reduce((sum, b) => sum + b.budget.amount, 0),
    totalSpent: budgetVsActual.reduce((sum, b) => sum + b.spent, 0),
    totalRemaining: budgetVsActual.reduce((sum, b) => sum + b.remaining, 0)
  });
});

export const updateBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const budgetId = parseInt(idParam, 10);

  if (isNaN(budgetId)) {
    res.status(400).json({ error: 'Invalid budget ID' });
    return;
  }

  const existingBudget = BudgetModel.findById(budgetId);
  if (!existingBudget) {
    res.status(404).json({ error: 'Budget not found' });
    return;
  }

  if (existingBudget.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const parsed = updateBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { amount } = parsed.data;
  const updatedBudget = BudgetModel.update(budgetId, userId, amount);

  res.json({
    message: 'Budget updated successfully',
    budget: updatedBudget
  });
});

export const deleteBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const budgetId = parseInt(idParam, 10);

  if (isNaN(budgetId)) {
    res.status(400).json({ error: 'Invalid budget ID' });
    return;
  }

  const existingBudget = BudgetModel.findById(budgetId);
  if (!existingBudget) {
    res.status(404).json({ error: 'Budget not found' });
    return;
  }

  if (existingBudget.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const deleted = BudgetModel.delete(budgetId, userId);

  if (deleted) {
    res.json({ message: 'Budget deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});
