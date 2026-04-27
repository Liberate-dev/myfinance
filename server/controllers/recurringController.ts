import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import { z } from 'zod';
import { RecurringTransactionModel, type RecurringFrequency } from '../models/RecurringTransaction.js';
import { FundModel } from '../models/Fund.js';
import { IncomeModel } from '../models/Income.js';
import { ExpenseModel } from '../models/Expense.js';
import { BalanceHistoryModel } from '../models/BalanceHistory.js';
import { AuthRequest } from '../middleware/auth.js';

const createRecurringSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  fund_id: z.number().positive('Fund is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable()
});

const updateRecurringSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  fund_id: z.number().positive().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  end_date: z.string().optional().nullable()
});

export const createRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createRecurringSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { type, amount, description, category, fund_id, frequency, start_date, end_date } = parsed.data;
  const userId = req.user!.userId;

  // Verify fund belongs to user
  const fund = FundModel.findById(fund_id);
  if (!fund || fund.user_id !== userId) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  const recurring = RecurringTransactionModel.create(
    userId, type, amount, description, category, fund_id,
    frequency as RecurringFrequency, start_date, end_date
  );

  res.status(201).json({
    message: 'Recurring transaction created',
    recurring
  });
});

export const getRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const recurring = RecurringTransactionModel.findByUserId(userId);

  res.json({
    recurring,
    count: recurring.length
  });
});

export const updateRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const recurringId = parseInt(idParam, 10);

  if (isNaN(recurringId)) {
    res.status(400).json({ error: 'Invalid recurring ID' });
    return;
  }

  const existing = RecurringTransactionModel.findById(recurringId);
  if (!existing || existing.user_id !== userId) {
    res.status(404).json({ error: 'Recurring transaction not found' });
    return;
  }

  const parsed = updateRecurringSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  // For simplicity, we'll just toggle active status through separate endpoint
  // Full update would require recreating the record
  res.json({
    message: 'Update not implemented - use toggle endpoint',
    recurring: existing
  });
});

export const toggleRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const recurringId = parseInt(idParam, 10);

  if (isNaN(recurringId)) {
    res.status(400).json({ error: 'Invalid recurring ID' });
    return;
  }

  const existing = RecurringTransactionModel.findById(recurringId);
  if (!existing || existing.user_id !== userId) {
    res.status(404).json({ error: 'Recurring transaction not found' });
    return;
  }

  const newStatus = !existing.is_active;
  RecurringTransactionModel.toggleActive(recurringId, userId, newStatus);

  res.json({
    message: `Recurring transaction ${newStatus ? 'activated' : 'paused'}`,
    is_active: newStatus
  });
});

export const deleteRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const recurringId = parseInt(idParam, 10);

  if (isNaN(recurringId)) {
    res.status(400).json({ error: 'Invalid recurring ID' });
    return;
  }

  const deleted = RecurringTransactionModel.delete(recurringId, userId);

  if (deleted) {
    res.json({ message: 'Recurring transaction deleted' });
  } else {
    res.status(404).json({ error: 'Recurring transaction not found' });
  }
});

// Process due recurring transactions (called by cron or on app start)
export const processRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dueTransactions = RecurringTransactionModel.findDue();
  const processed: { id: number; type: string; amount: number; fund_id: number }[] = [];

  for (const recurring of dueTransactions) {
    // Check fund balance for expenses
    if (recurring.type === 'expense') {
      const fund = FundModel.findById(recurring.fund_id);
      if (!fund || fund.balance < recurring.amount) {
        continue; // Skip if insufficient balance
      }
    }

    const fund = FundModel.findById(recurring.fund_id)!;
    const balanceBefore = fund.balance;

    if (recurring.type === 'income') {
      // Create income
      const income = IncomeModel.create(
        recurring.user_id, recurring.fund_id, recurring.amount,
        recurring.description, new Date().toISOString(), recurring.category
      );

      // Update fund balance
      FundModel.updateBalance(recurring.fund_id, recurring.user_id, recurring.amount);

      // Record history
      BalanceHistoryModel.create(
        recurring.user_id, recurring.fund_id, 'income', recurring.amount,
        balanceBefore, balanceBefore + recurring.amount,
        income.id, 'income', recurring.description
      );
    } else {
      // Create expense
      const expense = ExpenseModel.create(
        recurring.user_id, recurring.fund_id, recurring.amount,
        recurring.description, new Date().toISOString(), recurring.category
      );

      // Update fund balance
      FundModel.updateBalance(recurring.fund_id, recurring.user_id, -recurring.amount);

      // Record history
      BalanceHistoryModel.create(
        recurring.user_id, recurring.fund_id, 'expense', recurring.amount,
        balanceBefore, balanceBefore - recurring.amount,
        expense.id, 'expense', recurring.description
      );
    }

    // Update next run date
    const nextRun = RecurringTransactionModel.calculateNextRun(recurring.next_run, recurring.frequency);
    RecurringTransactionModel.updateLastRun(recurring.id, nextRun);

    processed.push({
      id: recurring.id,
      type: recurring.type,
      amount: recurring.amount,
      fund_id: recurring.fund_id
    });
  }

  res.json({
    message: `Processed ${processed.length} recurring transactions`,
    processed
  });
});
