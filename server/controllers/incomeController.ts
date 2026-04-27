import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { IncomeModel } from '../models/Income.js';
import { FundModel } from '../models/Fund.js';
import { BalanceHistoryModel } from '../models/BalanceHistory.js';
import { AuthRequest } from '../middleware/auth.js';

const createIncomeSchema = z.object({
  fund_id: z.number().positive('Fund is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().default(''),
  date: z.string().min(1, 'Date is required'),
  source: z.string().min(1, 'Source is required')
});

const updateIncomeSchema = z.object({
  fund_id: z.number().positive().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required').optional(),
  source: z.string().min(1, 'Source is required').optional()
});

export const createIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createIncomeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { fund_id, amount, description, date, source } = parsed.data;
  const userId = req.user!.userId;

  // Verify fund belongs to user
  const fund = FundModel.findById(fund_id);
  if (!fund || fund.user_id !== userId) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  const balanceBefore = fund.balance;

  // Create income
  const income = IncomeModel.create(userId, fund_id, amount, description, date, source);

  // Update fund balance
  FundModel.updateBalance(fund_id, userId, amount);

  // Record balance history
  BalanceHistoryModel.create(
    userId, fund_id, 'income', amount,
    balanceBefore, balanceBefore + amount,
    income.id, 'income', description || source
  );

  res.status(201).json({
    message: 'Income created successfully',
    income,
    fund_balance: balanceBefore + amount
  });
});

export const getIncomes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { startDate, endDate, fund_id } = req.query;

  let incomes;
  if (startDate && endDate) {
    incomes = IncomeModel.findByUserIdAndDateRange(
      userId,
      startDate as string,
      endDate as string
    );
  } else {
    incomes = IncomeModel.findByUserId(userId);
  }

  // Filter by fund if specified
  if (fund_id) {
    incomes = incomes.filter(i => i.fund_id === parseInt(fund_id as string));
  }

  res.json({
    incomes,
    count: incomes.length
  });
});

export const getIncomeById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const incomeId = parseInt(idParam, 10);

  if (isNaN(incomeId)) {
    res.status(400).json({ error: 'Invalid income ID' });
    return;
  }

  const income = IncomeModel.findById(incomeId);

  if (!income) {
    res.status(404).json({ error: 'Income not found' });
    return;
  }

  if (income.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json({ income });
});

export const updateIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const incomeId = parseInt(idParam, 10);

  if (isNaN(incomeId)) {
    res.status(400).json({ error: 'Invalid income ID' });
    return;
  }

  const existingIncome = IncomeModel.findById(incomeId);
  if (!existingIncome) {
    res.status(404).json({ error: 'Income not found' });
    return;
  }

  if (existingIncome.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const parsed = updateIncomeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { fund_id, amount, description, date, source } = parsed.data;
  const updatedIncome = IncomeModel.update(
    incomeId,
    userId,
    fund_id ?? existingIncome.fund_id,
    amount ?? existingIncome.amount,
    description ?? existingIncome.description,
    date ?? existingIncome.date,
    source ?? existingIncome.source
  );

  res.json({
    message: 'Income updated successfully',
    income: updatedIncome
  });
});

export const deleteIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const incomeId = parseInt(idParam, 10);

  if (isNaN(incomeId)) {
    res.status(400).json({ error: 'Invalid income ID' });
    return;
  }

  const existingIncome = IncomeModel.findById(incomeId);
  if (!existingIncome) {
    res.status(404).json({ error: 'Income not found' });
    return;
  }

  if (existingIncome.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Reverse the balance change
  FundModel.updateBalance(existingIncome.fund_id, userId, -existingIncome.amount);

  const deleted = IncomeModel.delete(incomeId, userId);

  if (deleted) {
    res.json({ message: 'Income deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});