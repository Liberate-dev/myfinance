import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { ExpenseModel } from '../models/Expense.js';
import { FundModel } from '../models/Fund.js';
import { BalanceHistoryModel } from '../models/BalanceHistory.js';
import { AuthRequest } from '../middleware/auth.js';

const createExpenseSchema = z.object({
  fund_id: z.number().positive('Fund is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().default(''),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required')
});

const updateExpenseSchema = z.object({
  fund_id: z.number().positive().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required').optional(),
  category: z.string().min(1, 'Category is required').optional()
});

export const createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { fund_id, amount, description, date, category } = parsed.data;
  const userId = req.user!.userId;

  // Verify fund belongs to user
  const fund = FundModel.findById(fund_id);
  if (!fund || fund.user_id !== userId) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  // Check sufficient balance
  if (fund.balance < amount) {
    res.status(400).json({ error: 'Insufficient balance in fund' });
    return;
  }

  const balanceBefore = fund.balance;

  // Create expense
  const expense = ExpenseModel.create(userId, fund_id, amount, description, date, category);

  // Update fund balance
  FundModel.updateBalance(fund_id, userId, -amount);

  // Record balance history
  BalanceHistoryModel.create(
    userId, fund_id, 'expense', amount,
    balanceBefore, balanceBefore - amount,
    expense.id, 'expense', description || category
  );

  res.status(201).json({
    message: 'Expense created successfully',
    expense,
    fund_balance: balanceBefore - amount
  });
});

export const getExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { startDate, endDate, fund_id } = req.query;

  let expenses;
  if (startDate && endDate) {
    expenses = ExpenseModel.findByUserIdAndDateRange(
      userId,
      startDate as string,
      endDate as string
    );
  } else {
    expenses = ExpenseModel.findByUserId(userId);
  }

  // Filter by fund if specified
  if (fund_id) {
    expenses = expenses.filter(e => e.fund_id === parseInt(fund_id as string));
  }

  res.json({
    expenses,
    count: expenses.length
  });
});

export const getExpenseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const expenseId = parseInt(idParam, 10);

  if (isNaN(expenseId)) {
    res.status(400).json({ error: 'Invalid expense ID' });
    return;
  }

  const expense = ExpenseModel.findById(expenseId);

  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  if (expense.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json({ expense });
});

export const updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const expenseId = parseInt(idParam, 10);

  if (isNaN(expenseId)) {
    res.status(400).json({ error: 'Invalid expense ID' });
    return;
  }

  const existingExpense = ExpenseModel.findById(expenseId);
  if (!existingExpense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  if (existingExpense.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const parsed = updateExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { fund_id, amount, description, date, category } = parsed.data;
  const updatedExpense = ExpenseModel.update(
    expenseId,
    userId,
    fund_id ?? existingExpense.fund_id,
    amount ?? existingExpense.amount,
    description ?? existingExpense.description,
    date ?? existingExpense.date,
    category ?? existingExpense.category
  );

  res.json({
    message: 'Expense updated successfully',
    expense: updatedExpense
  });
});

export const deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const expenseId = parseInt(idParam, 10);

  if (isNaN(expenseId)) {
    res.status(400).json({ error: 'Invalid expense ID' });
    return;
  }

  const existingExpense = ExpenseModel.findById(expenseId);
  if (!existingExpense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  if (existingExpense.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Reverse the balance change
  FundModel.updateBalance(existingExpense.fund_id, userId, existingExpense.amount);

  const deleted = ExpenseModel.delete(expenseId, userId);

  if (deleted) {
    res.json({ message: 'Expense deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});